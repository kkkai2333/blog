---
title: ReentrantLock 源码分析
date: 2020-10-27
categories:
- juc
tags:
- 可重入锁
sidebar: auto
publish: true
---

**可重入锁.**

## 源码分析

首先，ReentrantLock定义了一个内部抽象类Sync，Sync继承了[AQS](./aqs.md)类。

ReentrantLock的方法基本都是包装了一下其内部的Sync类的实例属性提供的方法。

下面就来看下Sync类的定义。

### Sync

```java
// Sync的父类是AQS类
abstract static class Sync extends AbstractQueuedSynchronizer {
  private static final long serialVersionUID = -5179523762034025860L;

  // 定义了一个抽象方法，lock，以供子类实现
  abstract void lock();

  // 定义了一个非公平的tryAcquire方法
  final boolean nonfairTryAcquire(int acquires) {
    // 拿到当前的线程
    final Thread current = Thread.currentThread();
    // 获取当前锁的状态，getState()是父类定义的方法
    int c = getState();
    // 如果c==0，代表现在是无锁状态
    if (c == 0) {
      // 直接通过cas设置父类的state属性，
      // compareAndSetState()是父类提供的方法，用来设置其state属性
      if (compareAndSetState(0, acquires)) {
        //如果设置state成功，代表当前线程抢锁成功，就把当前线程设置为锁的独占线程
        // setExclusiveOwnerThread()是AQS类的父类提供的方法
        setExclusiveOwnerThread(current);
        // 返回true，代表得到锁
        return true;
      }
    }
    // 如果c != 0，代表当前已经有线程持有锁了，那就判断一下，当前线程是不是持有锁的独占线程
    else if (current == getExclusiveOwnerThread()) {
      // 如果就是当前线程持有锁，那就把state+acquires，一般来说，acquires=1
      int nextc = c + acquires;
      // 判断一下nextc的值，不能小于0
      if (nextc < 0) // overflow
        throw new Error("Maximum lock count exceeded");
      // 设置state的值
      // 这里其实就体现了ReentrantLock的可重入性，即，如果持有锁的线程又来加锁，那就把锁状态state+1，
      // 相对的，释放锁时，就要把state-1，直到state == 0
      setState(nextc);
      // 返回true，代表得到锁
      return true;
    }
    // 返回false，代表抢锁失败
    return false;
  }

  // 尝试释放锁
  protected final boolean tryRelease(int releases) {
    // 定义一个局部变量c，将父类的state-releases，releases一般为1
    int c = getState() - releases;
    // 判断当前线程是否为持有锁的线程
    // ？问题1 - 这里有点奇怪，为什么不先判断，再定义变量c
    if (Thread.currentThread() != getExclusiveOwnerThread())
      throw new IllegalMonitorStateException();
    // free
    boolean free = false;
    // 上文也提到过，ReentrantLock是可重入锁，通过父类的state来实现，那么，在释放锁的时候，只有c == 0时，才代表持有锁的线程已经把它加的锁都释放了
    if (c == 0) {
      free = true;
      // 把锁的独占线程设置为null
      setExclusiveOwnerThread(null);
    }
    // 将c设置到父类的state属性上
    setState(c);
    // 这里有两种情况：
    // 1，free=true，代表现在已经是无锁状态
    // 2，free=false，代表当前只release了n重锁（n=releases，一般为1）
    return free;
  }
  // 判断当前线程是不是持有锁的线程
  protected final boolean isHeldExclusively() {
    return getExclusiveOwnerThread() == Thread.currentThread();
  }
  // 定义了一个条件锁（下文会详细讲）
  final ConditionObject newCondition() {
    return new ConditionObject();
  }
  // Methods relayed from outer class
  // 返回当前持有锁的线程，如果现在是无锁状态，则返回null
  final Thread getOwner() {
    return getState() == 0 ? null : getExclusiveOwnerThread();
  }
  // 返回当前持有锁的线程的重入次数，如果现在是无锁状态，返回0
  final int getHoldCount() {
    return isHeldExclusively() ? getState() : 0;
  }
  // 返回当前是不是有锁状态
  final boolean isLocked() {
    return getState() != 0;
  }
  // 定义了一个反序列化时会调用方法，即如果是反序列化得到当前对象，需要设置为无锁状态
  private void readObject(java.io.ObjectInputStream s)
    throws java.io.IOException, ClassNotFoundException {
    s.defaultReadObject();
    setState(0); // reset to unlocked state
  }
}
```

然后，ReentrantLock还定义了两个Sync的继承类，分别是FairSync和NonfairSync，也就是常说的公平锁和非公平锁，那么，下面就看下这两个类的定义。

### FairSync

```java
// 公平锁
static final class FairSync extends Sync {
  private static final long serialVersionUID = -3000897897090466540L;
  // 公平锁的加锁实现比较简单
  final void lock() {
    // 直接调用AQS类的acquire方法
    acquire(1);
  }
  // tryAcquire的公平实现，可以和Sync#nonfairTryAcquire()方法对比下，基本一致
  protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
      // 唯一的不同在这里，公平锁的tryAcquire，会先调用AQS类的hasQueuedPredecessors()方法，去判断当前线程能不能去尝试加锁
      // 其实hasQueuedPredecessors()方法还挺复杂的，所以放到AQS类文章中进行分析，这里只需要知道这个方法的返回代表什么含义即可
      // true：不可以去尝试加锁 false：可以去尝试加锁
      if (!hasQueuedPredecessors() &&
          compareAndSetState(0, acquires)) {
        setExclusiveOwnerThread(current);
        return true;
      }
    }
    // 下面这个else和Sync#nonfairTryAcquire()方法一样
    else if (current == getExclusiveOwnerThread()) {
      int nextc = c + acquires;
      if (nextc < 0)
        throw new Error("Maximum lock count exceeded");
      setState(nextc);
      return true;
    }
    return false;
  }
}
```

### NonfairSync

```java
// 非公平锁
static final class NonfairSync extends Sync {
  private static final long serialVersionUID = 7316153563782823691L;

  // 非公平锁的加锁实现也比较简单
  final void lock() {
    // 首先，直接尝试去加锁，即调用AQS类的compareAndSetState()方法去设置state的值
    if (compareAndSetState(0, 1))
      // 如果加锁成功，就设置当前线程为持有锁的线程
      setExclusiveOwnerThread(Thread.currentThread());
    else
      // 否则，调用AQS类的acquire方法
      acquire(1);
  }
  // tryAcquire的非公平实现，其实就是调用了父类Sync的nonfairTryAcquire()方法
  protected final boolean tryAcquire(int acquires) {
    return nonfairTryAcquire(acquires);
  }
}
```

最后，就来看下ReentrantLock自己对外提供的方法吧，直接看代码。

### ReentrantLock

```java
// ReentrantLock的主体类定义
public class ReentrantLock implements Lock, java.io.Serializable {
    private static final long serialVersionUID = 7373984872572414699L;
    /** Synchronizer providing all implementation mechanics */
    // 定义了一个Sync的实例属性
    private final Sync sync;
    // 默认初始化一个非公平锁
    public ReentrantLock() {
        sync = new NonfairSync();
    }
		// 根据入参初始化，如果为true，则初始化一个公平锁
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }
		// lock方法，实际上就是调用了FairSync/NoFairLock的lock()方法
    public void lock() {
        sync.lock();
    }
		// 如果需要在线程被中断时抛出异常，则调用此方法
    public void lockInterruptibly() throws InterruptedException {
        // 默认是调用了AQS类的acquireInterruptibly()方法
        // 关于acquireInterruptibly()方法的分析，请参考AQS类分析的文章
        sync.acquireInterruptibly(1);
    }
		// 尝试加锁，tryLock和lock的区别是，tryLock不会阻塞，加锁成功返回true，加锁失败就会返回false
    public boolean tryLock() {
        // 方法内部就是调用了Sync的acquire的非公平锁实现
        return sync.nonfairTryAcquire(1);
    }
		// 带超时时间的tryLock，在指定时间内如果没有得到锁，则返回false
    // 而且，和tryLock()不一样的是，1. 可以响应中断；2. 在第一次没有抢到锁之后，会加入等待队列。
    public boolean tryLock(long timeout, TimeUnit unit)
            throws InterruptedException {
        // 方法内部就是调用了AQS类的tryAcquireNanos()方法
        return sync.tryAcquireNanos(1, unit.toNanos(timeout));
    }
		// 释放锁
    public void unlock() {
        // 方法内部就是调用了Sync的release()方法
        sync.release(1);
    }
		// 获取一个条件锁对象
    public Condition newCondition() {
        return sync.newCondition();
    }
		// 返回当前持有锁的线程的重入次数
    public int getHoldCount() {
        return sync.getHoldCount();
    }
		// 返回当前线程是否是持有锁的线程
    public boolean isHeldByCurrentThread() {
        return sync.isHeldExclusively();
    }
		// 返回当前是否是有锁状态
    public boolean isLocked() {
        return sync.isLocked();
    }
		// 返回当前是公平锁还是非公平锁
    public final boolean isFair() {
        return sync instanceof FairSync;
    }
		// 返回当前持有锁的线程
    protected Thread getOwner() {
        return sync.getOwner();
    }
		// 返回当前AQS类的等待队列中是否有线程
    public final boolean hasQueuedThreads() {
        return sync.hasQueuedThreads();
    }
		// 返回传入的线程是否在AQS类的等待队列中
    public final boolean hasQueuedThread(Thread thread) {
        return sync.isQueued(thread);
    }
		// 返回当前AQS类的等待队列的长度
    public final int getQueueLength() {
        return sync.getQueueLength();
    }
		// 返回当前AQS类的等待队列的所有线程的集合
    protected Collection<Thread> getQueuedThreads() {
        return sync.getQueuedThreads();
    }
		// 返回condition的条件队列是否有线程在等待
    public boolean hasWaiters(Condition condition) {
        if (condition == null)
            throw new NullPointerException();
        if (!(condition instanceof AbstractQueuedSynchronizer.ConditionObject))
            throw new IllegalArgumentException("not owner");
        return sync.hasWaiters((AbstractQueuedSynchronizer.ConditionObject)condition);
    }
		// 返回condition的条件队列的长度
    public int getWaitQueueLength(Condition condition) {
        if (condition == null)
            throw new NullPointerException();
        if (!(condition instanceof AbstractQueuedSynchronizer.ConditionObject))
            throw new IllegalArgumentException("not owner");
        return sync.getWaitQueueLength((AbstractQueuedSynchronizer.ConditionObject)condition);
    }
		// 返回condition的条件队列中的所有线程的集合
    protected Collection<Thread> getWaitingThreads(Condition condition) {
        if (condition == null)
            throw new NullPointerException();
        if (!(condition instanceof AbstractQueuedSynchronizer.ConditionObject))
            throw new IllegalArgumentException("not owner");
        return sync.getWaitingThreads((AbstractQueuedSynchronizer.ConditionObject)condition);
    }
		// 重写了toString方法，判断当前是否有锁，如果有锁，返回持有锁的线程的名称；如果无锁，返回Unlocked
    public String toString() {
        Thread o = sync.getOwner();
        return super.toString() + ((o == null) ?
                                   "[Unlocked]" :
                                   "[Locked by thread " + o.getName() + "]");
    }
}
```

上文中有部分方法是在AQS类中实现的，这里做一下标注，可点击跳转，查看源码分析。

1. [AbstractQueuedSynchronizer#compareAndSetState](./aqs.md#compareAndSet)
2. [AbstractQueuedSynchronizer#hasQueuedPredecessors](./aqs.md#hasQueuedPredecessors)
3. [AbstractQueuedSynchronizer#acquire](./aqs.md#acquire)
4. [AbstractQueuedSynchronizer#acquireInterruptibly](./aqs.md#acquireInterruptibly)

至此，ReentrantLock的源码就分析完了。

## 总结

1. ReentrantLock是独占锁。
2. ReentrantLock是可重入锁，每重入一次，其内部的sync对象的同步状态属性state+1。
3. ReentrantLock默认是非公平锁，可以在调用构造方法时传入true定义成公平锁。
4. ReentrantLock实现的公平锁和非公平锁的区别是，
   1. 公平锁在锁等待队列不为空时，会直接入队；
   2. 非公平锁会先尝试加锁一次，如果加锁失败，再入队。
5. ~~ReentrantLock的tryLock()方法，是调用的sync的非公平锁实现，也就是说，即便把ReentrantLock定义为公平锁，如果调用的是tryLock()方法，它也会直接去抢锁，抢锁失败后直接返回。（但是，仔细想想，本来也应该是这样，因为tryLock是不阻塞的，也就没有入队这一说了。）~~
6. ReentrantLock的tryLock(long timeout, TimeUnit unit)方法和默认的tryLock()方法不太一样，
   1. 可以响应中断；
   2. 在第一次没有抢到锁之后，会加入等待队列；
   3. 超时之后直接返回false。
7. ReentrantLock的lock()方法不能响应中断，如果需要响应中断的话，请使用lockInterruptibly()方法。
8. 如果想要使用AQS的条件队列，必须要先new一个AbstractQueuedSynchronizer.ConditionObject的对象。