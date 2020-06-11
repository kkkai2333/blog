# CyclicBarrier

**屏障/栅栏机制**

## 问题

## 源码分析

CyclicBarrier 栅栏机制，可以用来实现，等到一组线程都到了之后，再执行。

下面直接看源码。

```java
public class CyclicBarrier {
	// 静态内部类，只维护了一个broken的属性，
    // 当线程被中断或者异常执行时，会将broken设置为true
    private static class Generation {
        boolean broken = false;
    }
    /** The lock for guarding barrier entry */
    // 维护了一个ReentrantLock的lock对象
    private final ReentrantLock lock = new ReentrantLock();
    /** Condition to wait on until tripped */
    // 等待触发的条件，条件锁
    private final Condition trip = lock.newCondition();
    /** The number of parties */
    // 参与者
    private final int parties;
    /* The command to run when tripped */
    // 屏障触发时触发的命令，可为空
    private final Runnable barrierCommand;
    /** The current generation */
    // 当前这一代的执行状态，
    // 当线程被中断或者异常执行时，会将generation.broken设置为true
    private Generation generation = new Generation();
    // 还需要等待几个参与者，屏障才能触发执行
    // count会从parties到0，然后在新一轮重新设置为parties
    private int count;
    
    // 唤醒所有的等待线程，重置count数，开启新一代屏障，只有持有独占锁的线程才能执行
    // 其实也就是这个方法体现了CyclicBarrier是可以循环使用的，因为每一代结束后都会重置
    private void nextGeneration() {
        // signal completion of last generation
        // 唤醒所有等待条件的线程
        trip.signalAll();
        // set up next generation
        // 重置count，开启新一轮
        count = parties;
        // 重新new了一个Generation对象，代表上一轮已经结束了
        generation = new Generation();
    }
    // 设置当前的屏障已经被打破了，然后唤醒所有的线程，只有持有独占锁的线程才能执行
    // 下文中可以看到，唤醒的这些线程也不会再执行了
    private void breakBarrier() {
        // 标注当前这一代屏障已经被打破
        generation.broken = true;
        // 重置count
        count = parties;
        // 唤醒所有等待条件的线程
        trip.signalAll();
    }
    /**
     * Main barrier code, covering the various policies.
     * 屏障类的主要代码，下面分析其逻辑，
     * 1. 如果 count != 0，说明参与者还不够，那就调用Condition的await()方法让线程进入条件队列等待；
     * 2. 当 count == 0，说明参与者已经够了，那就调用Condition的signalAll()方法唤醒所有线程；
     * 3. dowait()方法可响应中断；
     * 4. 如果当前代屏障被打破，会抛出BrokenBarrierException异常；
     * 5. 如果传入了超时时间，该方法也可在超时后抛出TimeoutException异常。
     * 
     */
    private int dowait(boolean timed, long nanos)
        throws InterruptedException, BrokenBarrierException,
               TimeoutException {
        final ReentrantLock lock = this.lock;
        // 获取锁
        lock.lock();
        try {
            // 获取当前代
            final Generation g = generation;
            // 如果当前代已经被打破，那就抛出BrokenBarrierException异常
            if (g.broken)
                throw new BrokenBarrierException();
            // 如果当前线程被中断了，那就先调用breakBarrier()方法，
            // 1. 标注当前这一代已经被打破，2. 重置count，3. 唤醒所有已等待的线程
            // 4. 然后抛出InterruptedException异常
            if (Thread.interrupted()) {
                breakBarrier();
                throw new InterruptedException();
            }
            // --count，标志着已经有一个线程到屏障前等待了
            int index = --count;
            // 这里先判断index == 0，是因为，
            /**
             * 假设初始化的count == 3，那么，如果已经来了两个线程，两个线程都调用了await进入条件队列等待，此时count == 1；
             * 假设又来了一个线程，此时--count == 0，屏障前已经来了3个参与者了，可以直接唤醒其他等待的线程了
             */
            if (index == 0) {  // tripped
                // index == 0，满足触发条件，可以放开屏障了
                // 这里定义一个ranAction变量，主要是在finally代码块中使用，如果try代码块中出现未知异常，finally代码块可以将当前这一代屏障标注为被打破
                boolean ranAction = false;
                try {
                    // 如果barrierCommand不为空，那就限制性barrierCommand任务
                    final Runnable command = barrierCommand;
                    if (command != null)
                        command.run();
                    ranAction = true;
                    // 然后调用nextGeneration()方法，
                    // 1. 唤醒所有的等待线程，2. 重置count数，3. 开启新一代屏障
                    nextGeneration();
                    return 0;
                } finally {
                    // 如果ranAction == false，说明try代码块没有正常执行，
                    if (!ranAction)
                        // 那么就调用breakBarrier()方法将当前这一代屏障标注为被打破
                        breakBarrier();
                }
            }

            // loop until tripped, broken, interrupted, or timed out
            // 在死循环中，保证线程一定能进入条件队列，
            // 除非1. 当前这一代被打破；2. 线程被中断；3. 调用await()方法超时
            for (;;) {
                try {
                    // 判断有没有传入超时时间
                    if (!timed)
                        // 如果没有超时，那就直接调用await()方法
                        trip.await();
                    else if (nanos > 0L)
                        // 当超时时间大于0时，调用带有超时的await()方法入队
                        nanos = trip.awaitNanos(nanos);
                } catch (InterruptedException ie) {
                    // 这里捕获了线程被中断的异常，然后有两种情况
                    /**
                     * 1. 如果当前这一代屏障，还是线程进入代码块时的那一代屏障，那么
                     * 1.1. 如果该屏障还没有被打破，那就调用breakBarrier()打破该屏障后，抛出InterruptedException异常
                     * 1.2. 如果该屏障已经被打破，那就重置线程的中断状态，然后下面的代码会抛出BrokenBarrierException异常
                     * 2. 如果g != generation，说明当前这一代屏障，已经不是线程进入代码块时的那一代屏障了，那就重置线程的中断状态（已经开启新的一代了，老一代爱咋咋地，我不管了）
                     */
                    if (g == generation && ! g.broken) {
                        breakBarrier();
                        throw ie;
                    } else {
                        // We're about to finish waiting even if we had not
                        // been interrupted, so this interrupt is deemed to
                        // "belong" to subsequent execution.
                        // ？问题1，源码的注释没有太理解 - TODO
                        Thread.currentThread().interrupt();
                    }
                }
                // 如果当前这一代屏障被打破，那就抛出BrokenBarrierException异常
                if (g.broken)
                    throw new BrokenBarrierException();
                // 如果g != generation，说明开启新纪元了，老一代还没有await的线程也不用管了
                if (g != generation)
                    // 直接返回当前的index值
                    return index;
                // 如果配置了超时时间，那么，当时间小于0时，调用breakBarrier()打破该屏障后，抛出TimeoutException异常
                if (timed && nanos <= 0L) {
                    breakBarrier();
                    throw new TimeoutException();
                }
            }
        } finally {
            lock.unlock();
        }
    }
	// 构造函数，parties是参与者的数量，即屏障在等到几个参与者后执行，
    // barrierAction是屏障触发后首要执行的命令，可以为空
    public CyclicBarrier(int parties, Runnable barrierAction) {
        if (parties <= 0) throw new IllegalArgumentException();
        this.parties = parties;
        this.count = parties;
        this.barrierCommand = barrierAction;
    }
	// 构造函数，只传入parties，没有barrierAction
    public CyclicBarrier(int parties) {
        this(parties, null);
    }
	// 获取参与者的数量
    public int getParties() {
        return parties;
    }
	// await()方法，实际上就是调用了dowait()方法
    public int await() throws InterruptedException, BrokenBarrierException {
        try {
            return dowait(false, 0L);
        } catch (TimeoutException toe) {
            // 这里捕获了超时异常，但是实际上，直接调用await方法，是不会出现超时的
            throw new Error(toe); // cannot happen
        }
    }
	// 带有超时的await()方法，实际上就是调用了dowait()方法，并传入了超时时间
    public int await(long timeout, TimeUnit unit)
        throws InterruptedException,
               BrokenBarrierException,
               TimeoutException {
        return dowait(true, unit.toNanos(timeout));
    }
	// 加锁，返回当前屏障是否被打破
    public boolean isBroken() {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            return generation.broken;
        } finally {
            lock.unlock();
        }
    }
	// 加锁，重置当前屏障，重置分为两步，1. 打破当前这一代屏障；2. 开启新一代的屏障
    public void reset() {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            breakBarrier();   // break the current generation
            nextGeneration(); // start a new generation
        } finally {
            lock.unlock();
        }
    }
	// 加锁，返回当前已经有几个线程在屏障前等待了，也就是，
    // 正在等待的参与者 = parties（总共需要的参与者） - count（还没到的参与者）
    public int getNumberWaiting() {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            return parties - count;
        } finally {
            lock.unlock();
        }
    }
}
```

## 总结

CyclicBarrier也比较简单，

它内部维护了一个ReentrantLock的lock对象和一个Condition的trip对象，其主要原理是，在获取了lock锁之后，

1. 条件不满足时，调用Condition的await()方法让线程等待，

2. 条件满足时，调用Condition的signalAll()方法唤醒所有线程，让其执行。

初始化时必须传入parties值，即每次屏障执行需要几个参与者；可以选择性传入barrierAction，即在屏障执行时首先执行的任务。

每一代屏障执行后，都会重置count值，并开启新一代屏障，也就是说，屏障可以重复使用。