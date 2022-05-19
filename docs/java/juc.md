---
title: JUC 并发编程包
date: 2020-10-27
categories:
- java
tags:
- java
- juc
sidebar: auto
publish: false
---

**Doug Lea 🐂🍺！**

## 源码分析

### UnSafe

### LockSupport

1. LockSupport是一个线程阻塞工具类，可以阻塞或释放线程；
2. LockSupport提供了park()方法阻塞线程；unpark()方法释放线程；
3. LockSupport底层是通过UNsafe类实现的，即 park() 和 unpark() 原语方法，通过"许可"替代状态；
4. LockSupport不可重入，unpark()方法提供的许可只是一个状态值，不会累加，所以多次调用等同于单次调用；
5. unpark()方法可以先于park()方法调用，没有先后调用的时序问题；

```java
public class LockSupport {
  	// 构造方法私有，不能实例化
    private LockSupport() {} // Cannot be instantiated.
		// 记录当前线程被谁阻塞了，可以用于线程监控或分析工具来定位问题
    private static void setBlocker(Thread t, Object arg) {
        // Even though volatile, hotspot doesn't need a write barrier here.
        UNSAFE.putObject(t, parkBlockerOffset, arg);
    }
    // 唤醒指定的线程
    public static void unpark(Thread thread) {
        if (thread != null)
            UNSAFE.unpark(thread);
    }
    // 阻塞线程，直到被唤醒，同时提供了一个blocker对象赋值给线程对象parkBlockerOffset偏移量位置的属性
    public static void park(Object blocker) {
        Thread t = Thread.currentThread();
        setBlocker(t, blocker);
        UNSAFE.park(false, 0L);
        setBlocker(t, null);
    }
    // 阻塞线程nanos纳秒，直到得到许可或超时，同时提供了一个blocker对象赋值给线程对象parkBlockerOffset偏移量位置的属性
    public static void parkNanos(Object blocker, long nanos) {
        if (nanos > 0) {
            Thread t = Thread.currentThread();
            setBlocker(t, blocker);
            UNSAFE.park(false, nanos);
            setBlocker(t, null);
        }
    }
    // 阻塞线程，同时提供了一个blocker对象赋值给线程对象parkBlockerOffset偏移量位置的属性，直到得到许可或到了deadline时间，deadline是一个毫秒级的绝对时间，
    public static void parkUntil(Object blocker, long deadline) {
        Thread t = Thread.currentThread();
        setBlocker(t, blocker);
        UNSAFE.park(true, deadline);
        setBlocker(t, null);
    }
    // 获取让该线程被阻塞的对象
    public static Object getBlocker(Thread t) {
        if (t == null)
            throw new NullPointerException();
        return UNSAFE.getObjectVolatile(t, parkBlockerOffset);
    }
  	/**
  	 * park()方法有多个重载方法，但其本质都是调用UNSAFE.park()去阻塞线程，等待许可；
  	 * 调用park()方法后，可能会有两种情况，
  	 * 1. 在调用前已经调用过unpark()方法，那么调用park()就不会阻塞，线程会直接消费之前拿到的许可，并将该许可置为不可用；
  	 * 2. 在调用前没有调用过unpark()方法，那么调用park()就会阻塞，等待许可，线程状态为java.lang.Thread.State : WAITING parking；
  	 * 注：建议使用带blocker参数的park()方法
  	 */
    // 阻塞线程，直到得到许可
    public static void park() {
        UNSAFE.park(false, 0L);
    }
    // 阻塞线程nanos纳秒，直到得到许可或超时
    public static void parkNanos(long nanos) {
        if (nanos > 0)
            UNSAFE.park(false, nanos);
    }
    // 阻塞线程，直到得到许可或到了deadline时间，deadline是一个毫秒级的绝对时间
  	// LockSupport.parkUntil(System.currentTimeMillis() + 3000);
    public static void parkUntil(long deadline) {
        UNSAFE.park(true, deadline);
    }
    // 
    static final int nextSecondarySeed() {
        int r;
        Thread t = Thread.currentThread();
        if ((r = UNSAFE.getInt(t, SECONDARY)) != 0) {
            r ^= r << 13;   // xorshift
            r ^= r >>> 17;
            r ^= r << 5;
        }
        else if ((r = java.util.concurrent.ThreadLocalRandom.current().nextInt()) == 0)
            r = 1; // avoid zero
        UNSAFE.putInt(t, SECONDARY, r);
        return r;
    }

    // Hotspot implementation via intrinsics API
  	// LockSupport的park()和unpark()方法，都是调用了UNSAFE中的方法实现的
    private static final sun.misc.Unsafe UNSAFE;
  	// parkBlockerOffset属性保存的是，当前线程被谁阻塞了，可以用于线程监控或分析工具来定位问题
    private static final long parkBlockerOffset;
    private static final long SEED;
    private static final long PROBE;
    private static final long SECONDARY;
    static {
        try {
          	// 静态代码块中，初始化了UNsafe类的对象，然后获取了Thread类中几个属性的偏移量
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class<?> tk = Thread.class;
            parkBlockerOffset = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("parkBlocker"));
            SEED = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("threadLocalRandomSeed"));
            PROBE = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("threadLocalRandomProbe"));
            SECONDARY = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("threadLocalRandomSecondarySeed"));
        } catch (Exception ex) { throw new Error(ex); }
    }
}
```

### Lock

Lock就是一个接口，定义了一些加锁和解锁的方法。

```java
public interface Lock {
    // 加锁
    void lock();
    // 加锁，可响应中断
    void lockInterruptibly() throws InterruptedException;
    // 加锁，加锁失败直接返回false
    boolean tryLock();
    // 带有超时时间的加锁
    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;
    // 解锁
    void unlock();
    // 获取一个条件锁
    Condition newCondition();
}
```

### [AbstractQueuedSynchronizer](./aqs.md)

JUC包下最重要的类，它实现了大部分的加锁逻辑，并且提供了一些抽象方法供子类实现。

这个类使用了模板方法设计模式。

### Condition

**条件锁**

Condition有两个实现类，分别是AbstractQueuedSynchronizer和AbstractQueuedLongSynchronizer中的ConditionObject类。

但AbstractQueuedLongSynchronizer暂时还没有子类，所以目前可使用的默认的条件锁，只有AbstractQueuedSynchronizer中的ConditionObject。

更具体的分析，请查看AQS类分析文章的[ConditionObject](./aqs.md#ConditionObject)部分。

```java
public interface Condition {
		// 进入无限等待，直到被得到许可或者被中断，可响应中断
    void await() throws InterruptedException;
		// 进入等待，直到被唤醒，不响应中断
    void awaitUninterruptibly();
		// 进入等待，直到被唤醒或者被中断或者超时，nanosTimeout纳秒后，等待超时，可响应中断
    long awaitNanos(long nanosTimeout) throws InterruptedException;
		// 进入等待，直到被唤醒或者被中断或者超时，单位为unit的time后，等待超时，可响应中断
    boolean await(long time, TimeUnit unit) throws InterruptedException;
		// 进入等待，直到被唤醒或者被中断或者超时，直到deadline日期，等待超时，可响应中断
    boolean awaitUntil(Date deadline) throws InterruptedException;
		// 唤醒一个
    void signal();
		// 唤醒所有
    void signalAll();
}
```

### [ReentrantLock(可重入锁)](./ReentrantLock.md)

默认初始化为非公平锁，可调用构造方法初始化为公平锁；

### ReadWriteLock(读写锁)

ReadWriteLock接口比较简单，只定义了两个Lock方法，分别返回读锁和写锁。

它有两个默认的实现类，分别是ReentrantReadWriteLock和StampedLock.ReadWriteLockView，会有单独的文章进行分析。

```java
public interface ReadWriteLock {
    // 返回一个读锁
    Lock readLock();
  	// 返回一个写锁
    Lock writeLock();
}
```

### [ReentrantReadWriteLock(可重入读写锁)](./ReentrantReadWriteLock.md)

### [StampedLock](./StampedLock.md)

### [CountDownLatch(倒计数器)](./CountDownLatch.md)

### [CyclicBarrier(栅栏机制)](./CyclicBarrier.md)

### [Semaphore(信号量)](./Semaphore.md)

### [Atomic*](./atomic.md)

**原子操作类**

## 总结

JUC并发包是Java中非常重要的一个包，包下提供了大量可供多线程下使用的类。