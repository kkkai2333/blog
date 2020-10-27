---
title: Semaphore 源码分析
date: 2020-10-27
categories:
- juc
tags:
- 信号量
sidebar: auto
publish: true
---

**信号量.**

## 源码分析

Semaphore 信号量，可以用来实现，控制同一时间，资源可被访问的线程数量，一般可用于流量的控制。

先明确几个名词，在本文中，

加锁 == 申请许可

释放锁 == 交还许可

下面直接看源码。

### Sync

Semaphore中定义了一个内部类Sync，Sync继承了AQS类，通过对同步属性的加减和判断来实现申请/交还许可的操作。

```java
abstract static class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 1192457210091910933L;
		// 初始化AQS的同步属性state，默认初始化permits重锁。
    Sync(int permits) {
        setState(permits);
    }
		// 获取当前剩余的许可数量
    final int getPermits() {
        return getState();
    }
		/**
		 * 非公平锁申请acquires个许可，
		 * 和FairSync#tryAcquireShared()方法的区别就是，不会判断等待队列中是否有线程排队，而是直接申请许可。
		 * 1. 先得到当前的许可数量，available；
  	 * 2. 然后用当前的许可数量减去要申请的许可数量，得到remaining，remaining = available-acquires，
  	 * 2.1. 如果remaining < 0，说明许可不够，那就返回remaining（是负数），申请许可失败；
  	 * 2.2. 如果remaining > 0，说明许可够，那就把同步属性state的值更新为remaining，原子更新；
  	 * 2.2.1. 如果更新失败，就自旋，重新执行上述操作；
  	 * 2.2.2. 如果更新成功，就返回remaining（是0或正数），申请许可成功。
		 */
    final int nonfairTryAcquireShared(int acquires) {
        for (;;) {
          	// 先得到当前的许可数量
            int available = getState();
          	// 然后用当前的许可数量减去要申请的许可数量
            int remaining = available - acquires;
          	/**
          	 * 1. 如果remaining < 0，说明许可不够，那就返回remaining（是负数），申请许可失败；
  	 				 * 2. 如果remaining > 0，说明许可够，那就把同步属性state的值更新为remaining，原子更新；
  	 				 * 2.1. 如果更新失败，就自旋，重新执行上述操作；
  	 				 * 2.2. 如果更新成功，就返回remaining（是0或正数），申请许可成功。
		 				 */
            if (remaining < 0 ||
                compareAndSetState(available, remaining))
                return remaining;
        }
    }
		// 交还releases个许可
    protected final boolean tryReleaseShared(int releases) {
        for (;;) {
          	// 先得到当前的许可数量
            int current = getState();
          	// 然后用当前的许可数量加上要交还的许可数量
            int next = current + releases;
          	// 如果next < current，说明交还了负数个许可，就抛出错误
            if (next < current，说明交还了负数个许可，就抛出错误) // overflow
                throw new Error("Maximum permit count exceeded");
          	// 否则，就将state的值更新为next（新的许可数量），
            if (compareAndSetState(current, next))
              	// 更新成功后返回true
                return true;
        }
    }
		// 减少许可的数量
    final void reducePermits(int reductions) {
        for (;;) {
          	// 先得到当前的许可数量
            int current = getState();
          	// 然后用当前的许可数量减去要减少的许可数量
            int next = current - reductions;
          	// 如果next < current，说明申请了负数个许可，就抛出错误
            if (next > current) // underflow
                throw new Error("Permit count underflow");
          	// 否则，就将state的值更新为next（新的许可数量）
            if (compareAndSetState(current, next))
              	// 更新成功后返回
                return;
        }
    }
		// 获取并返回当前可用的许可数量
    final int drainPermits() {
        for (;;) {
            int current = getState();
          	/**
          	 * 1. 如果当前许可数量为0，那就直接返回0；
          	 * 2. 如果当前许可数量大于0，那就把state的值更新为0（原子操作），然后返回当前的许可数量。
          	 */
            if (current == 0 || compareAndSetState(current, 0))
                return current;
        }
    }
}
```

### FairSync

公平锁实现。

```java
static final class FairSync extends Sync {
    private static final long serialVersionUID = 2014338818796000944L;
  	// 初始化公平锁，调用Sync的构造方法，传入默认的许可数量
    FairSync(int permits) {
      super(permits);
    }
  	/** 
  	 * 公平锁获取许可，下面总结一下方法的逻辑，
  	 * 1. 首先判断当前等待队列中是否有线程排队，如果有，直接返回-1，加锁失败；
  	 * 2. 如果没有线程排队，那就尝试获取许可；
  	 * 2.1. 先得到当前的许可数量：available；
  	 * 2.2. 然后用当前的许可数量减去要申请的许可数量，得到remaining，remaining = available-acquires，
  	 * 3.1. 如果remaining < 0，说明许可不够，那就返回remaining（是负数）,申请许可失败；
  	 * 3.2. 如果remaining > 0，说明许可够，那就把同步属性state的值更新为remaining，原子更新；
  	 * 3.2.1. 如果更新失败，就自旋，重新执行上述操作；
  	 * 3.2.2. 如果更新成功，就返回remaining（是0或正数），申请许可成功。
  	 */
    protected int tryAcquireShared(int acquires) {
      for (;;) {
        // 首先判断当前等待队列中是否有线程排队，如果有，直接返回-1，申请许可失败
        if (hasQueuedPredecessors())
          return -1;
        // 先得到当前的许可数量
        int available = getState();
        // 然后用现有的许可数量减去要申请的许可数量
        int remaining = available - acquires;
        /**
         * 1. 如果remaining < 0，说明许可不够，那就返回remaining（是负数）,申请许可失败；
  	 		 * 2. 如果remaining > 0，说明许可够，那就把同步属性state的值更新为remaining，原子更新；
  	 		 * 2.1. 如果更新失败，就自旋，重新执行上述操作；
  	 		 * 2.2. 如果更新成功，就返回remaining（是0或正数），申请许可成功。
         */
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
          return remaining;
        }
    }
}
```

### NonfairSync

非公平锁实现。

```java
static final class NonfairSync extends Sync {
    private static final long serialVersionUID = -2694183684443567898L;
		// 初始化非公平锁，调用Sync的构造方法，传入默认的许可数量
    NonfairSync(int permits) {
        super(permits);
    }
		// 直接调用父类Sync的非公平获取锁的方法
    protected int tryAcquireShared(int acquires) {
        return nonfairTryAcquireShared(acquires);
    }
}
```

### Semaphore

最后，看一下Semaphore自身提供的方法。

```java
// 构造方法，初始化拥有permits个许可的信号量，默认初始化为非公平锁
public Semaphore(int permits) {
    sync = new NonfairSync(permits);
}
// 构造方法，初始化拥有permits个许可的信号量，fair == true时，初始化为公平锁
public Semaphore(int permits, boolean fair) {
    sync = fair ? new FairSync(permits) : new NonfairSync(permits);
}
// 申请1个许可，申请不到会进入等待队列排队，可响应中断
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
// 申请1个许可，申请不到会进入等待队列排队，不响应中断
public void acquireUninterruptibly() {
    sync.acquireShared(1);
}
// 申请1个许可，申请不到直接返回false
public boolean tryAcquire() {
    return sync.nonfairTryAcquireShared(1) >= 0;
}
/**
 * 申请1个许可，带有超时时间
 * 当线程
 * 1. 获取到许可后，返回true；
 * 2. 超时后都会返回false；
 * 3. 被中断后会抛出InterruptedException异常
 */
public boolean tryAcquire(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireSharedNanos(1, unit.toNanos(timeout));
}
// 交还1个许可
public void release() {
    sync.releaseShared(1);
}
// 申请permits个许可，申请不到会进入等待队列排队，可响应中断
public void acquire(int permits) throws InterruptedException {
    if (permits < 0) throw new IllegalArgumentException();
    sync.acquireSharedInterruptibly(permits);
}
// 申请permits个许可，申请不到会进入等待队列排队，不响应中断
public void acquireUninterruptibly(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    sync.acquireShared(permits);
}
// 申请permits个许可，申请不到直接返回false
public boolean tryAcquire(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    return sync.nonfairTryAcquireShared(permits) >= 0;
}
/**
 * 申请permits个许可，带有超时时间
 * 当线程
 * 1. 获取到许可后，返回true；
 * 2. 超时后都会返回false；
 * 3. 被中断后会抛出InterruptedException异常
 */
public boolean tryAcquire(int permits, long timeout, TimeUnit unit)
    throws InterruptedException {
    if (permits < 0) throw new IllegalArgumentException();
    return sync.tryAcquireSharedNanos(permits, unit.toNanos(timeout));
}
// 交还permits个许可
public void release(int permits) {
    if (permits < 0) throw new IllegalArgumentException();
    sync.releaseShared(permits);
}
// 返回当前可用的许可数量
public int availablePermits() {
    return sync.getPermits();
}
// 获取并返回当前可用的许可数量
public int drainPermits() {
    return sync.drainPermits();
}
// 减少reduction个许可
protected void reducePermits(int reduction) {
    if (reduction < 0) throw new IllegalArgumentException();
    sync.reducePermits(reduction);
}
// 返回当前是不是公平锁
public boolean isFair() {
    return sync instanceof FairSync;
}
// 返回当前有没有线程在排队
public final boolean hasQueuedThreads() {
    return sync.hasQueuedThreads();
}
// 返回当前等待队列的长度
public final int getQueueLength() {
    return sync.getQueueLength();
}
// 返回当前所有排队的线程集合
protected Collection<Thread> getQueuedThreads() {
    return sync.getQueuedThreads();
}
```

## 总结

1. Semaphore 信号量其实就是一把锁，只不过它是在acquire时释放锁，在release时加锁；
2. 当同步属性state == 0时，线程再去申请许可，就会失败，失败后就会进入等待队列阻塞；
3. 信号量初始化的时候可以选择公平锁或非公平锁；
4. 每个线程都需要拿到许可后再执行；
5. 但是请注意，线程不是一定要拿到许可后才能释放许可，可以直接调用release()方法释放许可，**而这个操作会导致许可的数量增加**；
6. 适用于限流操作，例如令牌桶算法。
