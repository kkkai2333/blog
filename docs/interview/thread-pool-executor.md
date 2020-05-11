# ThreadPoolExecutor

## 常量分析

```java
    // 重中之重，ThreadPoolExecutor用一个AtomicInteger的变量保存了两个属性，workerCount（低29位），runState（高3位）
    private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));

    // COUNT_BITS=29，已知Integer.SIZE=32
    private static final int COUNT_BITS = Integer.SIZE - 3;

    // CAPACITY=536870911，可以看出来，很大，1 << COUNT_BITS等同于2^29-1
    private static final int CAPACITY   = (1 << COUNT_BITS) - 1;

    // 池的运行状态存储在高3位
    // runState is stored in the high-order bits
    
    // 下面一一列出5种池的状态，每种状态的值依次递增，即RUNNING < SHUTDOWN < STOP < TIDYING < TERMINATED

    // 高3位为111，值是-536870912，代表可以接收任务并处理
    private static final int RUNNING    = -1 << COUNT_BITS;
    // 高3位为000，值为0，调用shutdown()会进入此状态，不再接收新任务，但是会将队列中的任务执行完
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    /**
      计算结果为：
        1
        0000 0000 0000 0000 0000 0000 0000 0001
        1 << 29
        0010 0000 0000 0000 0000 0000 0000 0000
     */
    // 高3位为001，值为536870912，调用shutdownNow()会进入此状态，不再接收新任务，不会执行队列中的任务，并且会中断当前执行中的任务
    private static final int STOP       =  1 << COUNT_BITS;
    /**
      计算结果为：
        2
        0000 0000 0000 0000 0000 0000 0000 0010
        2 << 29
        0100 0000 0000 0000 0000 0000 0000 0000
     */
    // 高3位为010，值为1073741824，当队列和池都是空的时候会进入此状态，所有的任务都被终止，线程数为0，池进入此状态后，会调用terminated()钩子方法
    private static final int TIDYING    =  2 << COUNT_BITS;
    /**
      计算结果为：
        3
        0000 0000 0000 0000 0000 0000 0000 0011
        3 << 29
        0110 0000 0000 0000 0000 0000 0000 0000
     */
    // 高3位为011，值为1610612736，terminated()钩子方法执行完会进入此状态
    private static final int TERMINATED =  3 << COUNT_BITS;

    // 包装和拆包ctl的方法
    // Packing and unpacking ctl
    // 获取当前池的运行状态
    private static int runStateOf(int c)     { return c & ~CAPACITY; }
    // 获取当前池中的线程数
    private static int workerCountOf(int c)  { return c & CAPACITY; }
    // 根据rs和wc获取一个ctl值
    private static int ctlOf(int rs, int wc) { return rs | wc; }
```

## java.util.concurrent.ThreadPoolExecutor#execute

```java
    public void execute(Runnable command) {
        if (command == null)
            throw new NullPointerException();
        /*
         * Proceed in 3 steps:
         *
         * 1. If fewer than corePoolSize threads are running, try to
         * start a new thread with the given command as its first
         * task.  The call to addWorker atomically checks runState and
         * workerCount, and so prevents false alarms that would add
         * threads when it shouldn't, by returning false.
         *
         * 2. If a task can be successfully queued, then we still need
         * to double-check whether we should have added a thread
         * (because existing ones died since last checking) or that
         * the pool shut down since entry into this method. So we
         * recheck state and if necessary roll back the enqueuing if
         * stopped, or start a new thread if there are none.
         *
         * 3. If we cannot queue task, then we try to add a new
         * thread.  If it fails, we know we are shut down or saturated
         * and so reject the task.
         */
        int c = ctl.get();
        // 如果此时worker的数量小于核心线程数，则添加worker
        if (workerCountOf(c) < corePoolSize) {
            if (addWorker(command, true))
                return;
            c = ctl.get();
        }
        // 如果worker的数量已经大于等于核心线程数，并且所有当前池是运行状态，则将任务入队
        if (isRunning(c) && workQueue.offer(command)) {
            // 如果线程入队成功，重新获取当前的池的控制的状态
            int recheck = ctl.get();
            // 如果此时池的状态变成了非运行，则从队列中清除当前任务
            if (! isRunning(recheck) && remove(command))
                // 执行拒绝策略
                reject(command);
            // 重新检查下当前的worker的数量，如果为0，则添加一个worker
            else if (workerCountOf(recheck) == 0)
                addWorker(null, false);
        }
        // 如果work数量达到了coreSize，并且队列也满了，那就尝试再次添加worker（此时添加的worker是非核心的线程）
        else if (!addWorker(command, false))
            //但是，如果此时添加失败，就代表队列满了，非核心线程也达到了上限了，那就要执行拒绝策略了
            reject(command);
    }
```

## java.util.concurrent.ThreadPoolExecutor#addWorker

```java
    private boolean addWorker(Runnable firstTask, boolean core) {
        retry:
        for (;;) {
            // 获取当前的池控制状态
            int c = ctl.get();
            // 获取当前池的运行状态
            int rs = runStateOf(c);

            // Check if queue empty only if necessary.
            // 如果池的状态不是运行中，
            // 并且当池的状态是SHUTDOWN时，当前worker的task为空，并且队列也是空，
            // 则返回false
            if (rs >= SHUTDOWN &&
                ! (rs == SHUTDOWN &&
                   firstTask == null &&
                   ! workQueue.isEmpty()))
                return false;

            // 走到这里，代表rs是正常的RUNNING
            for (;;) {
                // 获取当前的线程数
                int wc = workerCountOf(c);
                // 如果线程数已经达到了CAPACITY最大值，
                // 或者线程数已经达到了corePoolSize（core=true）或者maximumPoolSize（core=false）时
                // 则返回false
                if (wc >= CAPACITY ||
                    wc >= (core ? corePoolSize : maximumPoolSize))
                    return false;
                // 通过cas操作，将当前线程数+1
                // 若成功，则跳出两层死循环
                if (compareAndIncrementWorkerCount(c))
                    break retry;
                
                // 走到这里，代表ctl+1失败，所以需要重新获取一下当前的ctl值
                c = ctl.get();  // Re-read ctl
                // 重新获取下当前的池的运行状态，
                // 如果不等于rs（RUNNING），代表池可能关闭了，所以跳出两层循环，重新走一下上边的状态判断
                if (runStateOf(c) != rs)
                    continue retry;
                // 如果状态没有变化，则继续内层循环，尝试进行ctl+1
                // else CAS failed due to workerCount change; retry inner loop
            }
        }

        // worker是否启动成功
        boolean workerStarted = false;
        // worker是否添加成功
        boolean workerAdded = false;
        Worker w = null;
        try {
            // 创建一个worker实例
            w = new Worker(firstTask);
            // 获取该实例持有的线程，此时，线程t应该是NEW状态
            final Thread t = w.thread;
            if (t != null) {
                // 加锁
                final ReentrantLock mainLock = this.mainLock;
                mainLock.lock();
                try {
                    // Recheck while holding lock.
                    // Back out on ThreadFactory failure or if
                    // shut down before lock acquired.
                    // 拿到锁之后，再次检查下当前池的运行状态
                    int rs = runStateOf(ctl.get());

                    // 当rs运行状态为RUNNING时，
                    // 或者，rs为SHUTDOWN，并且firstTask为空，即没有任务要执行时
                    if (rs < SHUTDOWN ||
                        (rs == SHUTDOWN && firstTask == null)) {
                        // 此时，如果当前worker的线程是存活的（即启动后还没有死亡），则抛出异常
                        if (t.isAlive()) // precheck that t is startable
                            throw new IllegalThreadStateException();
                        // 否则，将当前worker添加到集合中
                        workers.add(w);
                        // 获取集合的size，填充到largestPoolSize属性中，然后，更新added状态，worker添加成功
                        int s = workers.size();
                        if (s > largestPoolSize)
                            largestPoolSize = s;
                        workerAdded = true;
                    }
                } finally {
                    // 解锁
                    mainLock.unlock();
                }
                // 当worker添加成功后，启动该worker的线程
                if (workerAdded) {
                    // 启动线程
                    t.start();
                    // 更新started状态，worker启动成功
                    workerStarted = true;
                }
            }
        } finally {
            // 如果worker启动失败，则需要将这个worker清除，即调用addWorkerFailed()方法
            if (! workerStarted)
                addWorkerFailed(w);
        }
        return workerStarted;
    }

    /**
     * Rolls back the worker thread creation.
     * - removes worker from workers, if present
     * - decrements worker count
     * - rechecks for termination, in case the existence of this
     *   worker was holding up termination
     */
    private void addWorkerFailed(Worker w) {
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            // 从集合中清除这个worker
            if (w != null)
                workers.remove(w);
            // workerCount -1
            decrementWorkerCount();
            // 尝试调用终止池的方法？这里为什么要终止？？？
            tryTerminate();
        } finally {
            mainLock.unlock();
        }
    }
```

## java.util.concurrent.ThreadPoolExecutor.Worker

ThreadPoolExecutor中定义了一个Worker类，继承了AQS类，实现了Runnable接口

```java
private final class Worker
        extends AbstractQueuedSynchronizer
        implements Runnable
    {
        /**
         * This class will never be serialized, but we provide a
         * serialVersionUID to suppress a javac warning.
         */
        private static final long serialVersionUID = 6138294804551838833L;

        /** Thread this worker is running in.  Null if factory fails. */
        // 当前worker所持有的线程，从pool中获取的
        final Thread thread;
        /** Initial task to run.  Possibly null. */
        // 需要执行的任务，可能为空
        Runnable firstTask;
        /** Per-thread task counter */
        // 单个线程的任务计数器，记录执行了多少个任务
        volatile long completedTasks;

        /**
         * Creates with given first task and thread from ThreadFactory.
         * @param firstTask the first task (null if none)
         */
        Worker(Runnable firstTask) {
            setState(-1); // inhibit interrupts until runWorker
            this.firstTask = firstTask;
            this.thread = getThreadFactory().newThread(this);
        }

        /** Delegates main run loop to outer runWorker  */
        public void run() {
            runWorker(this);
        }

        // Lock methods
        //
        // The value 0 represents the unlocked state.
        // The value 1 represents the locked state.

        protected boolean isHeldExclusively() {
            return getState() != 0;
        }

        protected boolean tryAcquire(int unused) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }

        protected boolean tryRelease(int unused) {
            setExclusiveOwnerThread(null);
            setState(0);
            return true;
        }

        public void lock()        { acquire(1); }
        public boolean tryLock()  { return tryAcquire(1); }
        public void unlock()      { release(1); }
        public boolean isLocked() { return isHeldExclusively(); }

        void interruptIfStarted() {
            Thread t;
            if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) {
                try {
                    t.interrupt();
                } catch (SecurityException ignore) {
                }
            }
        }
    }
```

