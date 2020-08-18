# Executor

线程池也是并发编程中最常使用的技术之一，池化的目的，就是为了节约资源，提高效率，本文就简要分析下线程池的实现原理。

## 问题

1. 线程有几种状态？
2. 如何初始化一个线程池，几个参数的意义是什么？

## 源码分析

### Executor

Executor是一个接口，很简单，就定义了一个execute方法。

```java
// 提交任务到线程池执行
void execute(Runnable command);
```

### ExecuteService

ExecuteService也是一个接口，它继承了Executor，并扩展了一些方法，带返回类型的submit方法就是它提供的。

```java
// 关闭线程池，调用此方法后，线程池不再接收新任务，但是会把队列中的任务执行完再关闭
void shutdown();
// 立刻关闭线程池，调用此方法后，线程池会立刻关闭，并返回队列中还未执行的任务集合
List<Runnable> shutdownNow();
// 返回线程池是不是关闭状态，
boolean isShutdown();
// 返回线程池是不是终止状态，
boolean isTerminated();
// 可以调用此方法，监控线程池的终止
boolean awaitTermination(long timeout, TimeUnit unit)
        throws InterruptedException;
// 有返回值，提交一个callable任务到线程池
<T> Future<T> submit(Callable<T> task);
// 提交一个runnable任务到线程池，并附带一个泛型对象用来接收返回值
<T> Future<T> submit(Runnable task, T result);
// 提交一个runnable任务到线程池，实际上是获取不到任务的返回值的
Future<?> submit(Runnable task);

// 下面还提供了一些invoke方法，暂未分析
...
```

### AbstractExecutorService

AbstractExecutorService是一个抽象类，它实现了ExecuteService接口，并且实现了submit和invoke相关的方法。

```java
// 根据runnable和一个泛型对象初始化一个FutureTask实例，FutureTask继承了RunnableFuture接口，RunnableFuture接口同时继承了Runnable和Future接口
protected <T> RunnableFuture<T> newTaskFor(Runnable runnable, T value) {
    return new FutureTask<T>(runnable, value);
}
// 根据callable初始化一个FutureTask实例
protected <T> RunnableFuture<T> newTaskFor(Callable<T> callable) {
    return new FutureTask<T>(callable);
}
// 提交一个runnable任务到线程池，虽然该runnable也被包装成了FutureTask，但是调用FutureTask.get()是获取不到任务的返回值的
public Future<?> submit(Runnable task) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<Void> ftask = newTaskFor(task, null);
    execute(ftask);
    return ftask;
}
// 提交一个runnable任务和一个泛型对象到线程池，泛型对象是用来接收返回值的
public <T> Future<T> submit(Runnable task, T result) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<T> ftask = newTaskFor(task, result);
    execute(ftask);
    return ftask;
}
// 提交一个callable任务到线程池，可调用future.get()来获取返回值
public <T> Future<T> submit(Callable<T> task) {
    if (task == null) throw new NullPointerException();
    RunnableFuture<T> ftask = newTaskFor(task);
    execute(ftask);
    return ftask;
}
```

### ThreadPoolExecutor

一般来说，ThreadPoolExecutor是最常使用的线程池，下面就来分析一下源码。

#### 常量分析

```java
/** 
 * 重中之重，ThreadPoolExecutor用一个AtomicInteger的变量保存了两个属性，
 * workerCount（低29位），runState（高3位）
 */
private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
// COUNT_BITS=29，已知Integer.SIZE=32
private static final int COUNT_BITS = Integer.SIZE - 3;
// CAPACITY=536870911，可以看出来，很大，1 << COUNT_BITS等同于2^29-1
private static final int CAPACITY   = (1 << COUNT_BITS) - 1;

/**
 * 池的运行状态存储在高3位
 * 下面一一列出线程池的5种状态，每种状态的值依次递增，
 * 即RUNNING < SHUTDOWN < STOP < TIDYING < TERMINATED
 */

// 高3位为111，值是-536870912，代表可以接收任务并处理
private static final int RUNNING    = -1 << COUNT_BITS;
/**
 * 高3位为000，值为0，调用shutdown()会进入此状态，
 * 不再接收新任务，但是会将队列中的任务执行完
 */
private static final int SHUTDOWN   =  0 << COUNT_BITS;
/**
 * 计算结果为：
 * 1
 * 0000 0000 0000 0000 0000 0000 0000 0001
 * 1 << 29
 * 0010 0000 0000 0000 0000 0000 0000 0000
 * 高3位为001，值为536870912，调用shutdownNow()会进入此状态，
 * 不再接收新任务，不会执行队列中的任务，并且会中断当前执行中的任务
 */
private static final int STOP       =  1 << COUNT_BITS;
/**
 * 计算结果为：
 * 2
 * 0000 0000 0000 0000 0000 0000 0000 0010
 * 2 << 29
 * 0100 0000 0000 0000 0000 0000 0000 0000
 * 高3位为010，值为1073741824，当队列和池都是空的时候会进入此状态，
 * 所有的任务都被终止，线程数为0，池进入此状态后，会调用terminated()钩子方法
 */
private static final int TIDYING    =  2 << COUNT_BITS;
/**
 * 计算结果为：
 * 3
 * 0000 0000 0000 0000 0000 0000 0000 0011
 * 3 << 29
 * 0110 0000 0000 0000 0000 0000 0000 0000
 * 高3位为011，值为1610612736，terminated()钩子方法执行完会进入此状态，
 */
private static final int TERMINATED =  3 << COUNT_BITS;
```

#### 基础方法分析

下面提供了一些原子更新线程池状态值ctl的方法。

```java
// 下面是包装和拆包ctl的方法

// 获取当前池的运行状态
private static int runStateOf(int c)     { return c & ~CAPACITY; }
// 获取当前池中的线程数
private static int workerCountOf(int c)  { return c & CAPACITY; }
// 根据rs和wc获取一个ctl值
private static int ctlOf(int rs, int wc) { return rs | wc; }
// 当前的状态是不是小于s
private static boolean runStateLessThan(int c, int s) {
    return c < s;
}
// 当前的状态至少为s
private static boolean runStateAtLeast(int c, int s) {
    return c >= s;
}
// 判断当前线程池是不是运行状态
private static boolean isRunning(int c) {
    return c < SHUTDOWN;
}
// worker的数量加1，原子操作
private boolean compareAndIncrementWorkerCount(int expect) {
    return ctl.compareAndSet(expect, expect + 1);
}
// worker的数量减1，原子操作
private boolean compareAndDecrementWorkerCount(int expect) {
    return ctl.compareAndSet(expect, expect - 1);
}
// worker的数量减1，原子操作
private void decrementWorkerCount() {
    do {} while (! compareAndDecrementWorkerCount(ctl.get()));
}
```

#### 主要方法分析

##### execute

```java
public void execute(Runnable command) {
  if (command == null)
    throw new NullPointerException();
  /*
   * 总体来说，分为4步：
   * 1. 添加核心线程执行任务，
   * 2. 如果核心线程数达到上限，则将任务入队，
   * 3. 如果入队失败，则添加非核心线程执行任务，
   * 4. 如果非核心线程也达到上限，则执行拒绝策略。
   */
  int c = ctl.get();
  // 如果此时worker的数量小于核心线程数
  if (workerCountOf(c) < corePoolSize) {
    // 则调用addWorker方法添加worker，添加成功后直接返回
    if (addWorker(command, true))
      return;
    // 否则，再次获取当前线程池的ctl值
    c = ctl.get();
  }
  // 如果当前线程池是运行状态，并且worker的数量已经大于等于核心线程数，则将任务入队
  if (isRunning(c) && workQueue.offer(command)) {
    // 如果线程入队成功，重新获取当前的线程池的状态值
    int recheck = ctl.get();
    // 如果此时池的状态变成了非运行，则从队列中清除当前任务
    if (! isRunning(recheck) && remove(command))
      // 然后执行拒绝策略
      reject(command);
    // 这里重新检查下当前的worker的数量，如果为0，则添加一个worker
    // 为什么这么做？因为如果当前任务入队，但是没有worker了，就会出现明明有任务在队列，但是没有线程去执行的情况
    else if (workerCountOf(recheck) == 0)
      // 所以如果worker==0，就添加一个worker
      addWorker(null, false);
  }
  // 如果work数量达到了coreSize，并且任务入队失败（可能是队列满了），
  // 那就尝试再次添加worker（此时添加的worker是非核心的线程）
  else if (!addWorker(command, false))
    //如果此时添加失败，就代表任务入队失败，并且非核心线程也达到了上限，那就要执行拒绝策略了
    reject(command);
}
```

##### addWorker

```java
// 添加worker线程
private boolean addWorker(Runnable firstTask, boolean core) {
  retry:
  for (;;) {
    // 获取当前线程池的状态
    int c = ctl.get();
    // 获取当前线程池的运行状态
    int rs = runStateOf(c);
    // Check if queue empty only if necessary.
    /**
     * 如果线程池的状态是SHUTDOWN，并且队列不为空，并且firstTask为空（代表此时没有任务提交），
     * 返回false
     * （也就是说，你都要SHUTDOWN了，就别再添加空的worker线程了）
     */
    if (rs >= SHUTDOWN &&
        ! (rs == SHUTDOWN &&
           firstTask == null &&
           ! workQueue.isEmpty()))
      return false;
    // 走到这里，代表线程池是运行状态
    for (;;) {
      // 获取当前的已有的worker线程数
      int wc = workerCountOf(c);
      /** 
       * 如果worker线程数已经达到了CAPACITY最大值，
       * 或者worker线程数已经达到了corePoolSize（core=true）或者maximumPoolSize（core=false）时，
       * 返回false
       * （也就是说，您都要溢出来了，还加啥加）
       */
      if (wc >= CAPACITY ||
          wc >= (core ? corePoolSize : maximumPoolSize))
        return false;
      // 将当前worker线程数+1（cas原子操作），若成功，则跳出两层死循环，执行后序代码
      if (compareAndIncrementWorkerCount(c))
        break retry;
      
      // 走到这里，代表ctl+1失败，所以需要重新获取一下当前的ctl值
      c = ctl.get();  // Re-read ctl
      // 重新判断下当前线程池的运行状态，
      // 如果不等于rs（RUNNING），代表线程池可能关闭了，重新走一下上边的状态判断
      if (runStateOf(c) != rs)
        continue retry;
      // 如果状态没有变化，则继续内层循环，尝试进行ctl+1
    }
  }
  // 标识符，worker是否启动成功
  boolean workerStarted = false;
  // 标识符，worker是否添加成功
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
        // 拿到锁之后，再次检查下当前线程池的运行状态
        int rs = runStateOf(ctl.get());
        // 当rs运行状态为RUNNING时，
        // 或者，rs为SHUTDOWN，并且firstTask为空（此时没有任务提交）
        if (rs < SHUTDOWN ||
            (rs == SHUTDOWN && firstTask == null)) {
          /** 
           * 进入if代码块，说明线程池还没有关闭，那么就要判断下worker线程的状态
           * 新建的worker应该是NEW状态，如果这个worker线程已经是RUNNABLE状态了，说明有问题，就得抛出异常
           * isAlive方法是判断线程是不是启动而且还没有死亡
           */
          if (t.isAlive()) // precheck that t is startable
            throw new IllegalThreadStateException();
          // 如果一切OK，那就将新建的这个worker添加到集合中
          workers.add(w);
          // 获取集合的size，填充到largestPoolSize属性中
          int s = workers.size();
          if (s > largestPoolSize)
            largestPoolSize = s;
          // 更新added状态，worker添加成功
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
  // 最后，返回worker线程是否启动成功
  return workerStarted;
}
/**
 * 1. 从worker集合中清除该worker
 * 2. ctl的worker数量-1
 * 3. 
 */
private void addWorkerFailed(Worker w) {
  final ReentrantLock mainLock = this.mainLock;
  // 加锁
  mainLock.lock();
  try {
    // 如果worker不为空，那就从集合中清除这个worker
    if (w != null)
      workers.remove(w);
    // 然后把workerCount-1
    decrementWorkerCount();
    // 添加worker失败了，可能是出现了什么异常，那么就判断下现在要不要终止线程池
    tryTerminate();
  } finally {
    // 解锁
    mainLock.unlock();
  }
}
```

##### runWorker

```java
// runWorker方法是worker线程启动后真正要执行的方法，下文会分析Worker类的定义
final void runWorker(Worker w) {
  // 拿到当前线程，其实也就是worker持有的线程
  Thread wt = Thread.currentThread();
  // 拿到要执行的第一个任务，如果创建worker时没有传入，则为空
  Runnable task = w.firstTask;
  // 然后将firstTask置空
  w.firstTask = null;
  // Worker类继承了AQS类，这里调用unlock方法，其实是为了将state设置为0，并且把独占线程设置为空
  w.unlock(); // allow interrupts
  // 标识符，是否突然完成？
  boolean completedAbruptly = true;
  try {
    /**
     * 这里有两种情况
     * 1. worker第一次执行时，可能有一个初始任务，也就是firstTask不为空，那task就不为空，进入while代码块
     * 2. 如果worker不是第一次执行或者没有初始任务，那就调用getTask方法从队列中获取一个任务，进入while代码块
     * 如果没有任务要执行了，跳出while代码块
     */
    while (task != null || (task = getTask()) != null) {
      // worker加锁
      w.lock();
      /**
       * 这里会再次确认一下线程池的状态，分析一下这个if语句，
       * 条件1. !wt.isInterrupted()，如果worker持有的线程没有被中断，
       * 条件2.1. runStateAtLeast(ctl.get(), STOP)，如果线程池被关闭了，
       * 条件2.2. Thread.interrupted() && runStateAtLeast(ctl.get(), STOP)，如果线程被中断了，并且线程池关闭了。
       * 
       * 其实这里有点绕，就是为什么明明是||操作，但是条件2.2里还要再判断一次条件2.1，源码注释就在下面，然后，简单分析下：
       * 这里判断的目的，就是为了保证两件事：
       * 1. 如果线程池停止了，那就要保证每一个worker线程都被中断；（条件1+条件2.1）
       * 2. 如果线程池没有停止，那就要保证每一个worker线程都没有被中断；
       *
       * 下面就把所有可能出现的情况列举一下：
       * 1. 条件2.1判断时，线程池被关闭了，线程的中断状态时false，进入if代码块，中断线程，保证了上述事件1；
       * 2. 条件2.1判断时，线程池被关闭了，线程的中断状态时true，不会进入if代码块，保证了上述事件1；
       * 3. 条件2.1判断时，线程池没被关闭，条件2.2判断时，线程被中断了，线程池被关闭了，进入if代码块，中断线程，保证了上述事件1；
       * 4. 条件2.1判断时，线程池没被关闭，条件2.2判断时，线程被中断了，但是线程池没被关闭，不会进入if代码块，保证了上述事件2；
       * 
       * 这里还要强调一下，为什么在条件2.2里还要再判断一次条件2.1，
       * 是因为，如果在条件2.1判断返回false后，线程池被shutdownNow方法关闭了，那么就会直接将线程池设置为STOP并且中断所有worker线程；
       * 但是为了保证事件2，这里判断线程是否被中断，调用的是Thread.interrupted()，这个方法在返回了线程的中断状态后，会重置线程的中断状态（即将线程的中断状态设置为false），那么此时，条件1一定为true；
       * 所以，为了要恢复线程的中断状态，这里需要进入if代码块，重新中断一次线程。
       */
      // If pool is stopping, ensure thread is interrupted;
      // if not, ensure thread is not interrupted.  This
      // requires a recheck in second case to deal with
      // shutdownNow race while clearing interrupt
      if ((runStateAtLeast(ctl.get(), STOP) ||
           (Thread.interrupted() &&
            runStateAtLeast(ctl.get(), STOP))) &&
          !wt.isInterrupted())
        wt.interrupt();
      try {
        // 执行任务前调用，空方法，给子类重写的（扩展点1）
        beforeExecute(wt, task);
        // 定义一个异常，如果
        Throwable thrown = null;
        try {
          // 真正执行runnable任务的地方
          task.run();
        } catch (RuntimeException x) {
          thrown = x; throw x;
        } catch (Error x) {
          thrown = x; throw x;
        } catch (Throwable x) {
          thrown = x; throw new Error(x);
        } finally {
          // 执行任务后调用，空方法，给子类重写的（扩展点2）
          afterExecute(task, thrown);
        }
      } finally {
        // 将task置空
        task = null;
        // 已完成的task总数+1
        w.completedTasks++;
        // worker解锁
        w.unlock();
      }
    }
    // 将是否突然完成的标识符设置为false
    completedAbruptly = false;
  } finally {
    // 这里的completedAbruptly主要是判断当前worker是不是出异常了，只有当try代码块抛出异常时，completedAbruptly才不会被赋值，那么就代表workerCount没有被-1，就需要在processWorkerExit方法中做特殊处理
    processWorkerExit(w, completedAbruptly);
  }
}
```

##### getTask

```java
// get task，从线程池的队列中获取一个任务
private Runnable getTask() {
  // 是否超时，标识符
  boolean timedOut = false; // Did the last poll() time out?

  for (;;) {
    // 获取当前线程池的状态值
    int c = ctl.get();
    // 获取线程池的运行状态
    int rs = runStateOf(c);
    /**
     * 如果线程池已关闭，或者线程池处于SHUTDOWN状态并且队列为空
     */
    if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
      // 将worker的数量-1
      decrementWorkerCount();
      // 返回null
      return null;
    }
		// 获取线程池已创建的worker的数量
    int wc = workerCountOf(c);
    /**
     * 判断当前是否需要淘汰线程，
     * 如果1. 允许核心线程被淘汰（这里说明了，可以通过设置allowCoreThreadTimeOut属性，让核心线程在指定时间内没获取到任务也被停止），
     * 或者2. 当前线程数超过了核心线程（这里就说明了，如果非核心线程在指定时间内还没获取到任务，就会被停止），
     * 那timed=true。
     * allowCoreThreadTimeOut默认为false，并且构造方法中没有出来该参数，
     * 不过，可以通过调用java.util.concurrent.ThreadPoolExecutor#allowCoreThreadTimeOut方法进行设置
     */
    boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;
    /**
     * 这个if语句我们拆开来看，它是两个||语句的&&组合，那么就会有4种情况，
     * 1. 如果线程池已创建的线程数wc大于最大线程数maximumPoolSize，并且wc大于1，
     * 2. 如果线程池已创建的线程数wc大于最大线程数maximumPoolSize，并且队列为空，
     * 3. 如果允许核心线程超时（timed），并且判断到核心线程已超时（timedOut），并且wc大于1，
     * 4. 如果允许核心线程超时（timed），并且判断到核心线程已超时（timedOut），并且队列为空。
     * 其实，2，4两种情况很好理解，等待队列为空，当前没有要执行的任务了，那么就要关闭非核心线程，非核心线程关完了，就判断下核心线程时候可以关闭，如果可以，那就同样去关闭核心线程；
     * 但是，1，3又是什么意思呢？先看1，
     * 以上几种情况，都会将当前已启动的线程数-1，并且返回空
     */
    if ((wc > maximumPoolSize || (timed && timedOut))
        && (wc > 1 || workQueue.isEmpty())) {
      if (compareAndDecrementWorkerCount(c))
        return null;
      continue;
    }

    try {
      /** 
       * 这里就比较简单，从队列中获取一个任务，有两种情况，
       * 1. 如果核心线程允许被关闭，也就是上边的timed==true，
       *    那这里就调用可设置超时的poll方法从队列中获取任务，一旦超时了，还没有拿到任务，就将timedOut设置为true；
       * 2. 如果核心线程不允许被关闭，也就是上边的timed==false，
       *    那就调用阻塞的take方法从队列中获取任务，直到拿到了任务再返回。
       */
      Runnable r = timed ?
        workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS) :
      workQueue.take();
      // 如果拿到任务了，返回改任务，方法执行结束
      if (r != null)
        return r;
      // 如果没有拿到任务，那就肯定是超时了，那就把timedOut设置为true，因为take方法会一直阻塞，直到拿到任务，只有poll方法设置了超时
      timedOut = true;
    } catch (InterruptedException retry) {
      // 当线程被中断的时候，把timedOut设置为false
      timedOut = false;
    }
  }
}
```

##### processWorkerExit

```java
// processWorkerExit方法只有一个调用者，那就是runWorker方法
private void processWorkerExit(Worker w, boolean completedAbruptly) {
  // 如果completedAbruptly==true，说明在runWorker方法出现异常了，那就说明workerCount没有-1
  if (completedAbruptly) // If abrupt, then workerCount wasn't adjusted
    // 这里就需要将workerCount-1
    decrementWorkerCount();
	// 获取锁对象
  final ReentrantLock mainLock = this.mainLock;
  // 加锁
  mainLock.lock();
  try {
    // 把当前线程总共执行了多少个任务数量加到线程池的总任务数completedTaskCount上
    completedTaskCount += w.completedTasks;
    // 把当前worker线程从集合中移除
    workers.remove(w);
  } finally {
    // 解锁
    mainLock.unlock();
  }
	// 判断下现在要不要终止线程池
  tryTerminate();
	// 获取当前线程池的状态值
  int c = ctl.get();
  // 如果线程池还没有被关闭，可能是RUNNING，也可能是SHUTDOWN
  if (runStateLessThan(c, STOP)) {
    // 并且completedAbruptly==false，也就是说
    if (!completedAbruptly) {
      // 获取线程池最小的线程数，如果允许核心线程关闭，那么最小就为0，否则最小为corePoolSize
      int min = allowCoreThreadTimeOut ? 0 : corePoolSize;
      // 如果min==0，即极端情况下，线程池中可能一个线程都没有；
      // 但是此时任务队列还不为空，说明还有任务在等待执行，那么就给min赋值1
      if (min == 0 && ! workQueue.isEmpty())
        min = 1;
      // 如果目前线程池中的worker数量大于等于min，说明现在线程池里至少有一个在运行的worker线程，那就没问题，直接返回就OK
      if (workerCountOf(c) >= min)
        return; // replacement not needed
    }
    // 如果completedAbruptly==true，或者当前线程池中一个worker都没有了，这里就需要添加一个非核心线程
    addWorker(null, false);
  }
}
```

##### tryTerminate

```java
// 判断下是否要终止线程池
final void tryTerminate() {
  for (;;) {
    // 获取当前线程池的状态值
    int c = ctl.get();
    /**
     * 如果满足以下三种情况，直接返回
     * 1. 线程池正在运行（不能终止）；
     * 2. 线程池已经处于TIDYING（整理）或者TERMINATED（终止）状态（已经被终止了）；
     * 3. 线程池处于SHUTDOWN状态，但是队列中还有没执行完的任务（不能终止）。
     */
    if (isRunning(c) ||
        runStateAtLeast(c, TIDYING) ||
        (runStateOf(c) == SHUTDOWN && ! workQueue.isEmpty()))
      return;
    /**
     * 如果当前的worker数量还大于0，说明还有worker线程没有被停止，
     * 那么这里就调用interruptIdleWorkers方法去中断一个worker，那这个worker可以被停止。
     * ONLY_ONE==true，所以每次调用interruptIdleWorkers方法都只会中断一个线程，
     * 中断完，直接返回。
     */
    if (workerCountOf(c) != 0) { // Eligible to terminate
      interruptIdleWorkers(ONLY_ONE);
      return;
    }
		// 拿到锁
    final ReentrantLock mainLock = this.mainLock;
    // 加锁
    mainLock.lock();
    try {
      // 首先更新线程池的状态为TIDYING，说明此时线程池已经进入了收尾整理阶段
      if (ctl.compareAndSet(c, ctlOf(TIDYING, 0))) {
        try {
          // 线程池关闭时调用，空方法，给子类重写的（扩展点3）
          terminated();
        } finally {
          // 将线程池的状态更新为TERMINATED，此时，线程池就被关闭了
          ctl.set(ctlOf(TERMINATED, 0));
          /** 在线程池初始化的时候就会初始化termination条件锁，
           * 并且ExecuteServic提供了awaitTermination方法供外部调用，ThreadPoolExecutor实现了这个方法，
           * 在该方法中，所有await的线程都会进入条件队列等待被termination唤醒，
           * 所有，当线程池关闭后，这里就调用了signAll方法，唤醒所有等待当前线程池终止的XX线程。
           */
          termination.signalAll();
        }
        return;
      }
    } finally {
      // 解锁
      mainLock.unlock();
    }
    // else retry on failed CAS
  }
}
```

##### Worker

ThreadPoolExecutor中定义了一个Worker类，继承了AQS类，同时也实现了Runnable接口，Worker类的实现还是比较简单的。

那么它为什么要继承AQS类？

1. 为了保证在worker线程正在执行任务时，不会被其他操作影响；
2. 也可以通过worker是否处于加锁状态来判断该worker是否正在执行任务。

可以自行结合interruptIdleWorkers方法或getActiveCount方法进行分析。

```java
private final class Worker
  extends AbstractQueuedSynchronizer
  implements Runnable
{
  private static final long serialVersionUID = 6138294804551838833L;
  // 当前worker所持有的线程，从pool中获取的
  final Thread thread;
  // 需要执行的任务，可能为空
  Runnable firstTask;
  // 单个线程的任务计数器，记录执行了多少个任务
  volatile long completedTasks;
  // 构造方法
  Worker(Runnable firstTask) {
    setState(-1); // inhibit interrupts until runWorker
    this.firstTask = firstTask;
    // 从线程工厂中生成一个线程
    this.thread = getThreadFactory().newThread(this);
  }
	// 代理了外面的runWorker()方法
  public void run() {
    runWorker(this);
  }
	/**
	 * 下面是与锁相关的方法
	 * Worker启动后只有两种状态
	 * 1. state==0，无锁状态
	 * 2. state==1，加锁状态
	 */
	// 返回当前是不是有锁状态，即state != 0
  protected boolean isHeldExclusively() {
    return getState() != 0;
  }
	// 加锁，就是将state从0设置为1，设置成功返回true，失败返回false
  protected boolean tryAcquire(int unused) {
    if (compareAndSetState(0, 1)) {
      setExclusiveOwnerThread(Thread.currentThread());
      return true;
    }
    return false;
  }
	// 释放锁，就是将state设置为0
  protected boolean tryRelease(int unused) {
    setExclusiveOwnerThread(null);
    setState(0);
    return true;
  }
	// 加锁，就调用父类的acquire，然后acquire调用了tryAcquire
  public void lock()        { acquire(1); }
  // tryLock就直接调用tryAcquire
  public boolean tryLock()  { return tryAcquire(1); }
  // 释放锁，就调用父类的release，然后release调用了tryRelease
  public void unlock()      { release(1); }
  // 判断当前worker是不是加锁状态
  public boolean isLocked() { return isHeldExclusively(); }
	// 如果worker持有的线程已启动，那就给这个线程发送一个中断信号
  void interruptIfStarted() {
    Thread t;
    // state初始为-1，当state>=0时，说明worker启动了；worker持有的thread不为空；并且该线程没有被中断过
    if (getState() >= 0 && (t = thread) != null && !t.isInterrupted()) {
      try {
        // 那就给这个线程发送一个中断信号
        t.interrupt();
      } catch (SecurityException ignore) {
      }
    }
  }
}
```

#### 其他方法分析

```java
// 将线程池的状态修改为targetState，一般是更新为SHUTDOWN或STOP时调用，
// 更新为TIDYING或TERMINATED由tryTerminate方法处理
private void advanceRunState(int targetState) {
    for (;;) {
        int c = ctl.get();
        // 获取当前线程池的状态
        /**
         * 1. 如果当前状态大于target状态，那就不做操作，直接返回
         * 2. 否则，就更新线程池的状态为targetState
         */
        if (runStateAtLeast(c, targetState) ||
            ctl.compareAndSet(c, ctlOf(targetState, workerCountOf(c))))
            break;
    }
}
// 如果有安全管理器的话，就要验证下，方法调用者是否有权限关闭worker线程
private void checkShutdownAccess() {
    SecurityManager security = System.getSecurityManager();
    if (security != null) {
        security.checkPermission(shutdownPerm);
        final ReentrantLock mainLock = this.mainLock;
        mainLock.lock();
        try {
            for (Worker w : workers)
                security.checkAccess(w.thread);
        } finally {
            mainLock.unlock();
        }
    }
}
// 给所有已启动的线程发送中断信号
private void interruptWorkers() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        for (Worker w : workers)
            w.interruptIfStarted();
    } finally {
        mainLock.unlock();
    }
}
// 给空闲线程发送中断信号
private void interruptIdleWorkers(boolean onlyOne) {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        // 遍历当前所有worker
        for (Worker w : workers) {
            Thread t = w.thread;
            if (!t.isInterrupted() && w.tryLock()) {
                try {
                    t.interrupt();
                } catch (SecurityException ignore) {
                } finally {
                    w.unlock();
                }
            }
            // 如果onlyOne==true，那就是只给一个空闲线程发送完中断信号后就会返回
            if (onlyOne)
                break;
        }
    } finally {
        mainLock.unlock();
    }
}
// 给所有空闲线程发送中断信号
private void interruptIdleWorkers() {
    interruptIdleWorkers(false);
}
// 执行拒绝策略
final void reject(Runnable command) {
    handler.rejectedExecution(command, this);
}
// 将任务队列中的所有任务添加到集合中
private List<Runnable> drainQueue() {
    BlockingQueue<Runnable> q = workQueue;
    ArrayList<Runnable> taskList = new ArrayList<Runnable>();
    // 如果可以直接转化成list，那q就一定是空的
    q.drainTo(taskList);
    // 如果q != null，说明上面转化失败了，那就挨个从队列中清除，然后添加到集合中
    if (!q.isEmpty()) {
        for (Runnable r : q.toArray(new Runnable[0])) {
            if (q.remove(r))
                taskList.add(r);
        }
    }
    return taskList;
}
// 关闭线程池，将线程池的状态修改为SHUTDOWN，此时不允许再提交任务，但是会把现有的任务都执行完
public void shutdown() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();
      	// 将线程池状态设置为SHUTDOWN
        advanceRunState(SHUTDOWN);
      	// 给所有空闲线程发送中断信号
        interruptIdleWorkers();
      	// 当线程池即将关闭时调用，空方法，给子类重写的（扩展点4）
        onShutdown(); // hook for ScheduledThreadPoolExecutor
    } finally {
        mainLock.unlock();
    }
    tryTerminate();
}
// 立刻关闭线程池，将线程池的状态修改为STOP，此时不允许再提交任务，而且会将任务队列中的任务输出到集合中
public List<Runnable> shutdownNow() {
    List<Runnable> tasks;
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();
      	// 将线程池状态设置为STOP
        advanceRunState(STOP);
      	// 给所有已启动的线程发送中断信号
        interruptWorkers();
      	// 获取队列中所有还未执行的任务
        tasks = drainQueue();
    } finally {
        mainLock.unlock();
    }
    tryTerminate();
    return tasks;
}
// 判断线程池是不是停止了，只要不是运行状态，就返回true
public boolean isShutdown() {
    return ! isRunning(ctl.get());
}
// 判断线程池是不是处于终止中，只要线程池不是RUNNING，也不是TERMINATED，就返回true
public boolean isTerminating() {
    int c = ctl.get();
    return ! isRunning(c) && runStateLessThan(c, TERMINATED);
}
// 判断线程池是不是终止了
public boolean isTerminated() {
    return runStateAtLeast(ctl.get(), TERMINATED);
}
/**
 * 实现了ExecutorService接口的方法，提供给外部调用的方法，
 * 当其他线程调用了此方法，就会在限时内进入条件队列，
 * 如果当前线程池被终止了，其他线程就会被termination.signAll方法唤醒，返回true，否则，返回false
 */
public boolean awaitTermination(long timeout, TimeUnit unit)
    throws InterruptedException {
    long nanos = unit.toNanos(timeout);
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        for (;;) {
            if (runStateAtLeast(ctl.get(), TERMINATED))
                return true;
            if (nanos <= 0)
                return false;
            nanos = termination.awaitNanos(nanos);
        }
    } finally {
        mainLock.unlock();
    }
}
// 如果当前线程数小于核心线程数，那就启动一个核心线程
public boolean prestartCoreThread() {
    return workerCountOf(ctl.get()) < corePoolSize &&
        addWorker(null, true);
}
// 确保一定预启动一个线程，如果corePoolSize>0，那就预启动一个核心线程；如果corePoolSize==0，那么就预启动一个非核心线程
void ensurePrestart() {
    int wc = workerCountOf(ctl.get());
    if (wc < corePoolSize)
        addWorker(null, true);
    else if (wc == 0)
        addWorker(null, false);
}
// 预启动所有核心线程，并返回启动了几个
public int prestartAllCoreThreads() {
    int n = 0;
    while (addWorker(null, true))
        ++n;
    return n;
}
```

#### 可用于更新或监控的方法分析

ThreadPoolExecutor有个比较好的地方在于，所有的属性都可以被修改，这样也就给我们提供了监控，动态修改线程池属性的方式。

```java
// 构造方法
public ThreadPoolExecutor(int corePoolSize,
                            int maximumPoolSize,
                            long keepAliveTime,
                            TimeUnit unit,
                            BlockingQueue<Runnable> workQueue,
                            ThreadFactory threadFactory,
                            RejectedExecutionHandler handler) {
    if (corePoolSize < 0 ||
        maximumPoolSize <= 0 ||
        maximumPoolSize < corePoolSize ||
        keepAliveTime < 0)
        throw new IllegalArgumentException();
    if (workQueue == null || threadFactory == null || handler == null)
        throw new NullPointerException();
    this.acc = System.getSecurityManager() == null ?
            null :
            AccessController.getContext();
    this.corePoolSize = corePoolSize;
    this.maximumPoolSize = maximumPoolSize;
    this.workQueue = workQueue;
    this.keepAliveTime = unit.toNanos(keepAliveTime);
    this.threadFactory = threadFactory;
    this.handler = handler;
}
// 设置线程工厂
public void setThreadFactory(ThreadFactory threadFactory) {
    if (threadFactory == null)
        throw new NullPointerException();
    this.threadFactory = threadFactory;
}
// 返回现在的线程工厂
public ThreadFactory getThreadFactory() {
    return threadFactory;
}
// 设置拒绝策略
public void setRejectedExecutionHandler(RejectedExecutionHandler handler) {
    if (handler == null)
        throw new NullPointerException();
    this.handler = handler;
}
// 返回拒绝策略
public RejectedExecutionHandler getRejectedExecutionHandler() {
    return handler;
}
// 设置核心线程数
public void setCorePoolSize(int corePoolSize) {
    if (corePoolSize < 0)
        throw new IllegalArgumentException();
    // 计算刚设置的核心线程数和原本的值的差值
    int delta = corePoolSize - this.corePoolSize;
    this.corePoolSize = corePoolSize;
    // 如果当前已启动的线程数大于核心线程数，就给所有空闲的线程发送一个中断信号
    if (workerCountOf(ctl.get()) > corePoolSize)
        interruptIdleWorkers();
    else if (delta > 0) {
        // 这里的操作呢，其实也是想赶紧把所有的任务执行完。
        // 如果delta大于0，说明刚设置的核心线程数大于原本的值
        // 那就从差值delta和当前的队列长度中选一个比较小的值
        int k = Math.min(delta, workQueue.size());
        // 接下来会尽量启动k个核心线程
        while (k-- > 0 && addWorker(null, true)) {
            // 由于启动过程中，队列中的任务也是一直在被执行，所以，一旦队列空了，也就没有必要再加核心线程了
            if (workQueue.isEmpty())
                break;
        }
    }
}
// 获取当前核心线程数
public int getCorePoolSize() {
    return corePoolSize;
}
// 设置最大线程数
public void setMaximumPoolSize(int maximumPoolSize) {
    if (maximumPoolSize <= 0 || maximumPoolSize < corePoolSize)
        throw new IllegalArgumentException();
    this.maximumPoolSize = maximumPoolSize;
    // 如果当前已启动的线程数大于最大线程数，就给所有空闲的线程发送一个中断信号
    if (workerCountOf(ctl.get()) > maximumPoolSize)
        interruptIdleWorkers();
}
// 获取当前最大线程数
public int getMaximumPoolSize() {
    return maximumPoolSize;
}
// 重新设置线程的超时时间
public void setKeepAliveTime(long time, TimeUnit unit) {
    if (time < 0)
        throw new IllegalArgumentException();
    if (time == 0 && allowsCoreThreadTimeOut())
        throw new IllegalArgumentException("Core threads must have nonzero keep alive times");
    long keepAliveTime = unit.toNanos(time);
    long delta = keepAliveTime - this.keepAliveTime;
    this.keepAliveTime = keepAliveTime;
    // 这里呢，就是说，如果新的超时时间，比旧的超时时间短，那就给所有空闲的线程发送一个中断信号
    if (delta < 0)
        interruptIdleWorkers();
}
// 获取当前设置的线程超时时间
public long getKeepAliveTime(TimeUnit unit) {
    return unit.convert(keepAliveTime, TimeUnit.NANOSECONDS);
}
// 获取任务的等待队列
public BlockingQueue<Runnable> getQueue() {
    return workQueue;
}
// 获取现在正在执行中的worker的个数
public int getActiveCount() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        int n = 0;
        for (Worker w : workers)
            // worker被锁了，说明正在执行任务
            if (w.isLocked())
                ++n;
        return n;
    } finally {
        mainLock.unlock();
    }
}
// 返回是否允许核心线程超时
public boolean allowsCoreThreadTimeOut() {
    return allowCoreThreadTimeOut;
}
// 设置是否允许核心线程超时
public void allowCoreThreadTimeOut(boolean value) {
    if (value && keepAliveTime <= 0)
        throw new IllegalArgumentException("Core threads must have nonzero keep alive times");
    if (value != allowCoreThreadTimeOut) {
        allowCoreThreadTimeOut = value;
      	// 如果允许核心线程超时，那这里就给所有空闲的线程发送一个中断信号
        if (value)
            interruptIdleWorkers();
    }
}
```

### FutureTask

上面主要讲了execute方法提交任务的实现逻辑，submit方法提交任务的实现逻辑主要在FutureTask类中，

FutureTask实现了RunnableFuture接口，而RunnableFuture就是Runnable和Future的合体，

所以下面先简单看下Future接口定义了哪些方法。

##### Future

```java
// 取消任务，mayInterruptIfRunning==true时，会给执行任务的线程发送一个中断信号
boolean cancel(boolean mayInterruptIfRunning);
// 判断任务是否取消
boolean isCancelled();
// 判断任务是否执行完成
boolean isDone();
// 获取任务执行的结果
V get() throws InterruptedException, ExecutionException;
// 带有超时的返回结果，在指定时间内未得到结果，抛出TimeoutException异常
V get(long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
```

然后，再分析下FutureTask类的实现逻辑。

##### FutureTask

###### 常量分析

```java
/**
 * FutureTask类中定义了一组常量，用来表示当前任务的执行状态
 * 可能的状态转换有以下几种
 * NEW -> COMPLETING -> NORMAL
 * NEW -> COMPLETING -> EXCEPTIONAL
 * NEW -> CANCELLED
 * NEW -> INTERRUPTING -> INTERRUPTED
 */
// 新建
private static final int NEW          = 0;
// 完成中
private static final int COMPLETING   = 1;
// 正常
private static final int NORMAL       = 2;
// 异常
private static final int EXCEPTIONAL  = 3;
// 取消
private static final int CANCELLED    = 4;
// 中断中
private static final int INTERRUPTING = 5;
// 已中断
private static final int INTERRUPTED  = 6;
```

###### 主要方法分析

我按照大概的执行流程，将方法重新排序，下面依次分析。

```java
// 定义了一个简单的内部类，这个类主要维护了一个等待当前任务执行结束的线程队列
static final class WaitNode {
    volatile Thread thread;
    volatile WaitNode next;
    WaitNode() { thread = Thread.currentThread(); }
}
// 构造方法，传入一个Runnable和泛型result，通过调用Executors.callable()得到一个RunnableAdapter，RunnableAdapter实现了Callable，这里应用了适配器模式。
public FutureTask(Runnable runnable, V result) {
    this.callable = Executors.callable(runnable, result);
    this.state = NEW;       // ensure visibility of callable
}
// 构造方法，传入一个Callable，初始化FutureTask
public FutureTask(Callable<V> callable) {
    if (callable == null)
        throw new NullPointerException();
    this.callable = callable;
    this.state = NEW;       // ensure visibility of callable
}
// 核心方法，FutureTask实现了Runnable接口，所以，当任务提交到线程池之后，真正执行的方法就是这个run方法
public void run() {
    // 从上面的构造方法可以看出，当任务刚刚执行的时候，state一定是NEW，
    // 然后，这里会把当前线程赋值给FutureTask的runner属性，也就是执行该任务的线程
    if (state != NEW ||
        !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                        null, Thread.currentThread()))
        return;
    try {
        // 拿到要执行的callable
        Callable<V> c = callable;
        // 此时callable不为空，state == NEW，任务开始执行
        if (c != null && state == NEW) {
            // 定义result接收返回值
            V result;
            // 保存callable是执行成功还是失败的标识符
            boolean ran;
            try {
                // 调用call方法，得到返回值
                result = c.call();
                // 正常执行，ran = true
                ran = true;
            } catch (Throwable ex) {
                // 一旦出现异常，说明任务执行失败，把result置空，并调用setException方法将当前任务的执行状态设置为EXCEPTIONAL
                result = null;
                ran = false;
                setException(ex);
            }
            // 如果正常返回，则调用set方法设置result
            if (ran)
                set(result);
        }
    } finally {
        // runner must be non-null until state is settled to
        // prevent concurrent calls to run()
        // 最后，要把FutureTask持有的runner设置为空
        runner = null;
        // state must be re-read after nulling runner to prevent
        // leaked interrupts
        // 此处还要判断下任务的执行状态，如果大于等于INTERRUPTING，说明这个线程被中断了
        int s = state;
        if (s >= INTERRUPTING)
            // 那就调用handlePossibleCancellationInterrupt方法，将当前任务的执行状态设置为INTERRUPTED
            handlePossibleCancellationInterrupt(s);
    }
}
// runAndReset方法是给子类调用的，和run方法差不多，区别有三点
protected boolean runAndReset() {
    if (state != NEW ||
        !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                        null, Thread.currentThread()))
        return false;
    boolean ran = false;
    int s = state;
    try {
        Callable<V> c = callable;
        if (c != null && s == NEW) {
            try {
                // 1. 这里没有给result赋值，说明当前方法不会返回任务执行的结果
                c.call(); // don't set result
                ran = true;
            } catch (Throwable ex) {
                // 如果出现任务执行出错，一样需要把执行状态修改为EXCEPTIONAL
                setException(ex);
            }
            // 2. 这里没有调用set方法，说明在正常执行的情况下，FutureTask的state应该一直是NEW
        }
    } finally {
        // runner must be non-null until state is settled to
        // prevent concurrent calls to run()
        // 同样把执行线程置空
        runner = null;
        // state must be re-read after nulling runner to prevent
        // leaked interrupts
        s = state;
        // 判断是否被中断
        if (s >= INTERRUPTING)
            handlePossibleCancellationInterrupt(s);
    }
    // 3. 任务执行成功后，应该是返回true，一旦任务执行失败或者执行线程被中断，这里都会返回false
    return ran && s == NEW;
}
// 设置返回值
protected void set(V v) {
    // 先将当前task状态设置为COMPLETING
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        // 设置task执行结果
        outcome = v;
        // 将task状态设置为NORMAL，正常已完成
        UNSAFE.putOrderedInt(this, stateOffset, NORMAL); // final state
        // task正常执行完成，调用finishCompletion方法唤醒所有等待task执行结束的线程
        finishCompletion();
    }
}

protected void setException(Throwable t) {
    // 先将当前task状态设置为COMPLETING
    if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
        // 设置task执行结果
        outcome = t;
        // 将task状态设置为EXCEPTIONAL，异常
        UNSAFE.putOrderedInt(this, stateOffset, EXCEPTIONAL); // final state
        // task异常执行完成，调用finishCompletion方法唤醒所有等待task执行结束的线程
        finishCompletion();
    }
}
// 唤醒所有正在等待task完成的线程
private void finishCompletion() {
    // assert state > COMPLETING;
    // 当前方法一定是task执行状态大于COMPLETING才会被调用
    // 如果waiters不等于null，说明的确有线程在等待，那就开始循环线程的等待队列
    for (WaitNode q; (q = waiters) != null;) {
        // 首先把waiters属性置空
        if (UNSAFE.compareAndSwapObject(this, waitersOffset, q, null)) {
            // 死循环
            for (;;) {
                // 得到等待的线程
                Thread t = q.thread;
                // 如果线程不为空
                if (t != null) {
                   	// 先将node持有的thread属性释放掉
                    q.thread = null;
                    // 唤醒这个线程
                    LockSupport.unpark(t);
                }
                // 拿到当前node的下一个node
                WaitNode next = q.next;
                if (next == null)
                    break;
                // 释放掉上一个节点持有的当前节点的引用，加速gc
                q.next = null; // unlink to help gc
                q = next;
            }
            break;
        }
    }
	// 所以等待线程都被唤醒了之后调用，空方法，留给子类重写（扩展点5）
    done();
	// 将task的callable属性置空
    callable = null;        // to reduce footprint
}
// 如果当前的task的执行状态为INTERRUPTING，那就说明有线程在中断这个执行任务的线程，那就让当前线程调用yield方法让出cpu（这里要注意，让出cpu，不代表放弃抢占cpu，很有可能，当前线程刚让出cpu就立刻抢占了cpu），直到task的执行状态不为INTERRUPTING之后，执行结束，执行结束后，状态一定为INTERRUPTED。
private void handlePossibleCancellationInterrupt(int s) {
    // It is possible for our interrupter to stall before getting a
    // chance to interrupt us.  Let's spin-wait patiently.
    if (s == INTERRUPTING)
        while (state == INTERRUPTING)
            Thread.yield(); // wait out pending interrupt

    // assert state == INTERRUPTED;

    // We want to clear any interrupt we may have received from
    // cancel(true).  However, it is permissible to use interrupts
    // as an independent mechanism for a task to communicate with
    // its caller, and there is no way to clear only the
    // cancellation interrupt.
    //
    // Thread.interrupted();
}
/** 
 * 取消任务，有两种情况，
 * mayInterruptIfRunning==true时，表示需要中断线程，task的执行状态NEW->INTERRUPTING->INTERRUPTED
 * mayInterruptIfRunning==false时，将task的执行状态设置为CANCELLED即可。
 */
public boolean cancel(boolean mayInterruptIfRunning) {
    /**
     * 如果state != NEW，或者修改task状态失败后，返回false，代表任务取消失败。
     */
    if (!(state == NEW &&
            UNSAFE.compareAndSwapInt(this, stateOffset, NEW,
                mayInterruptIfRunning ? INTERRUPTING : CANCELLED)))
        return false;
    try {    // in case call to interrupt throws exception
        // 如果mayInterruptIfRunning==true，说明要中断线程
        if (mayInterruptIfRunning) {
            try {
                Thread t = runner;
                if (t != null)
                    // 中断执行task的线程
                    t.interrupt();
            } finally { // final state
                // 最后，将state更新为INTERRUPTED
                UNSAFE.putOrderedInt(this, stateOffset, INTERRUPTED);
            }
        }
    } finally {
        // task取消后，也要调用finishCompletion方法唤醒所有等待task执行结束的线程
        finishCompletion();
    }
    // 返回true，取消task成功
    return true;
}
// state >= CANCELLED，代表任务取消成功
public boolean isCancelled() {
    return state >= CANCELLED;
}
// 只要状态state != NEW，就说明这个task执行结束了
public boolean isDone() {
    return state != NEW;
}
/**
 * 请注意一点，调用get()方法的线程，一定是其他线程，即不是执行task的线程，
 * 那么，如果get()方法中，发现任务一直没有执行结束，这个其他线程就会进入等待队列，也就是保存到task的waiters属性
 */

// 获取任务的返回值
public V get() throws InterruptedException, ExecutionException {
    // 获取当前task的状态
    int s = state;
    // 如果小于等于COMPLETING，说明还没完成
    if (s <= COMPLETING)
        // 那就进入等待吧
        s = awaitDone(false, 0L);
    // 调用report方法得到任务执行的结果
    return report(s);
}
// 带有超时时间的获取任务的返回值
public V get(long timeout, TimeUnit unit)
    throws InterruptedException, ExecutionException, TimeoutException {
    if (unit == null)
        throw new NullPointerException();
    // 获取当前task的状态
    int s = state;
    /** 如果小于等于COMPLETING，说明还没完成，那就进入超时等待吧，
     * 一旦超时返回后，发现task的状态还是小于等于COMPLETING，就说明任务还没有返回，是超时了，那就抛出TimeoutException异常
     */
    if (s <= COMPLETING &&
        (s = awaitDone(true, unit.toNanos(timeout))) <= COMPLETING)
        throw new TimeoutException();
    // 调用report方法得到任务执行的结果
    return report(s);
}
// 获取任务结果
private V report(int s) throws ExecutionException {
    Object x = outcome;
    // 如果任务正常执行，那就返回任务执行的结果，也就是outcome
    if (s == NORMAL)
        return (V)x;
    // 如果任务的状态大于CANCELLED，说明被取消了，那就抛出一个CancellationException异常
    if (s >= CANCELLED，说明被取消了，那就抛出一个)
        throw new CancellationException();
    // 否则，任务的状态应该是EXCEPTIONAL，说明任务执行出现异常，那就抛出一个ExecutionException异常
    throw new ExecutionException((Throwable)x);
}

private int awaitDone(boolean timed, long nanos)
    throws InterruptedException {
    // 如果timed==true，说明当前设置了超时时间，那就计算一下到什么时候等待会超时，得到deadline
    final long deadline = timed ? System.nanoTime() + nanos : 0L;
    // 先声明一个等待node
    WaitNode q = null;
    // 当前线程是否要入队的标识符
    boolean queued = false;
    for (;;) {
        // 如果当前线程被中断了
        if (Thread.interrupted()) {
            // 那就从等待队列汇中移除这个线程
            removeWaiter(q);
            // 然后抛出InterruptedException异常
            throw new InterruptedException();
        }
	    // 再获取一下task的状态 
        int s = state;
        // 如果s大于COMPLETING，说明任务执行结束了，那就没必要等待了
        if (s > COMPLETING) {
            // 这里判断一下q是否初始化了，如果已经初始化了，那就把q的线程置空
            if (q != null)
                q.thread = null;
            // 直接返回
            return s;
        }
        else if (s == COMPLETING) // cannot time out yet
            // 如果s == COMPLETING，说明这个task可能要执行完成了，那就让当前线程yield一下，让出cpu，看看能不能让执行task的线程抢占到cpu，然后执行结束
            Thread.yield();
        else if (q == null)
            // 到这里，说明可能的确要准备等待了，那就把这个node初始化一下
            q = new WaitNode();
        else if (!queued)
            // 初始化的时候queued==false，所以一定有一次循环会进入这里，
            // 这里其实就是把waiters串起来，刚进来的这个等待线程放到等待队列的头部，然后原子更新waiters
            queued = UNSAFE.compareAndSwapObject(this, waitersOffset,
                                                    q.next = waiters, q);
        else if (timed) {
            // 如果当前线程是带有超时的等待，就先判断下是不是到超时时间了
            nanos = deadline - System.nanoTime();
            if (nanos <= 0L) {
                // 如果超时了，把当前线程出队，然后返回。
                removeWaiter(q);
                return state;
            }
            // 否则，就调用超时park进入等待
            LockSupport.parkNanos(this, nanos);
        }
        else
            // 再否则，就调用park进入无限等待，直到被唤醒
            LockSupport.park(this);
    }
}
// 从等待队列waiters中清除当前节点
private void removeWaiter(WaitNode node) {
    // 如果node不为空
    if (node != null) {
        // 先释放掉node持有的线程引用
        node.thread = null;
        retry:
        for (;;) {          // restart on removeWaiter race
            // 如果waiters不等于空，进入for循环
            for (WaitNode pred = null, q = waiters, s; q != null; q = s) {
                // 先保存下当前node的下一个node
                s = q.next;
                
                if (q.thread != null)
                    pred = q;
                else if (pred != null) {
                    pred.next = s;
                    if (pred.thread == null) // check for race
                        continue retry;
                }
                else if (!UNSAFE.compareAndSwapObject(this, waitersOffset,
                                                        q, s))
                    continue retry;
            }
            break;
        }
    }
}
```

至此，最基础的ExecuteService的实现，就学习完了。

其实，平常开发中，最常用到的也就是ThreadPoolExecutor这个线程池，分析完上面的内容，我们也可以对线程池有一个大概的了解了。

除此之外，jdk还提供了定时线程池，可用于提交一个延迟执行的任务或者定时执行的任务。

### ScheduledExecutorService

ScheduledExecutorService也继承了ExecutorService接口，并在它的基础上又扩充了一些方法，下面简单看下源码。

```java
// 提交一个runnable任务到线程池，并且在单位为unit的delay时间后，执行该任务
public ScheduledFuture<?> schedule(Runnable command,
                                       long delay, TimeUnit unit);
// 提交一个callable任务到线程池，并且在单位为unit的delay时间后，执行该任务
public <V> ScheduledFuture<V> schedule(Callable<V> callable,
                                           long delay, TimeUnit unit);
// 提交一个runnable任务到线程池，在initialDelay时间后执行第一次，此后每隔period时间，都会执行一次，一旦任务执行出现异常，就会停止，并抛出该异常
public ScheduledFuture<?> scheduleAtFixedRate(Runnable command,
                                                  long initialDelay,
                                                  long period,
                                                  TimeUnit unit);
// 提交一个runnable任务到线程池，在initialDelay时间后执行第一次，执行完成之后，等待delay时间，然后再执行第二次，一旦任务执行出现异常，就会停止，并抛出该异常
public ScheduledFuture<?> scheduleWithFixedDelay(Runnable comand,
                                                     long initialDelay,
                                                     long delay,
                                                     TimeUnit unit);
```

### ScheduledThreadPoolExecutor

ScheduledThreadPoolExecutor是ScheduledExecutorService的实现类，同时它也继承了ThreadPoolExecutor类，这说明，ScheduledThreadPoolExecutor应该是复用了一些ThreadPoolExecutor中的方法，下面就看下ScheduledThreadPoolExecutor的源码。

**coming soon.**

### ForkJoinPool

ForkJoinPool是在jdk 1.7引入的新的线程池，它采用了分而治之的思想，将一个大的任务拆成多个小任务，让我们可以获得并行执行的能力。

**coming soon.**

### Executors

最后，简单看下线程池工厂类，Executors中提供了5种创建线程池的方法，

但是一般不建议直接使用工厂类生成的ExecutorService，而是建议通过调用ThreadPoolExecutor的构造方法，手动创建线程池。

```java
// 创建一个固定大小的线程池，使用无界队列
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(nThreads, nThreads,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>());
}
// 创建一个只有一个worker线程的的线程池，使用无界队列
public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(1, 1,
                                0L, TimeUnit.MILLISECONDS,
                                new LinkedBlockingQueue<Runnable>()));
}
// 创建一个核心线程为0，最大线程为Integer.MAX_VALUE的线程池，使用同步队列，每次来一个任务都会初始化一个线程
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                    60L, TimeUnit.SECONDS,
                                    new SynchronousQueue<Runnable>());
}
// 创建一个核心线程为corePoolSize，最大线程为Integer.MAX_VALUE的定时线程池，使用延迟队列
public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
    return new ScheduledThreadPoolExecutor(corePoolSize);
}
// 1.8新增的线程池，ForkJoinPool
public static ExecutorService newWorkStealingPool(int parallelism) {
    return new ForkJoinPool
        (parallelism,
            ForkJoinPool.defaultForkJoinWorkerThreadFactory,
            null, true);
}
```

## 扩展

### 线程有几种状态

**六种状态**

```java
public enum State {
  /**
   * 新建状态，还未启动
   */
  NEW,
  /**
   * 运行状态，可能正在执行，但也有可能在等待一些其他系统资源，比如处理器资源
   */
  RUNNABLE,
  /**
   * 阻塞状态，等待监视器锁，在sync修饰的同步代码块或方法外阻塞，等待进入代码块
   */
  BLOCKED,
  /**
   * 等待状态，一般调用了以下方法后会进入此状态
   * 1. Object#wait() 
   * 2. Thread#join()
   * 3. LockSupport#park
   * wait和join都需要被notify或notifyAll唤醒，park需要被unpark唤醒
   */
  WAITING,
  /**
   * 超时等待状态，一般调用了以下方法后会进入此状态
   * 1. Thread.sleep()
   * 2. Object#wait(long) 
   * 3. Thread#join(long)
   * 4. LockSupport#parkNanos(long)
   * 5. LockSupport#parkUntil(long)
   */
  TIMED_WAITING,
  /**
   * 终止状态，线程执行完之后，会进入此状态
   */
  TERMINATED;
}
```

## 总结