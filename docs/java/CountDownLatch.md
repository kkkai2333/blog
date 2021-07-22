---
title: CountDownLatch 源码分析
date: 2020-10-27
categories:
- juc
tags:
- 倒计数器
sidebar: auto
publish: false
---

**倒计数器.**

## 源码分析

CountDownLatch 倒计数器，可以用来实现，让所有线程都等待某一个或几个条件满足后，再执行。

下面直接看源码。

### Sync

CountDownLatch 中定义了一个继承了 AbstractQueuedSynchronizer 的Sync类。

```java
private static final class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 4982264981922014374L;
	// 这里可以看到，传进来的count，实际上就是默认的加锁数，也就是说CountDownLatch的count属性，最终代表当前Sync加了几重锁
    Sync(int count) {
        setState(count);
    }
	// 返回当前锁的数量
    int getCount() {
        return getState();
    }
	// 加锁代码很简单，只要state不等于0，那就加锁失败，加锁失败后，线程就要进入队列等待了
    // 其实从这里也能看出来，为什么CountDownLatch初始化之后只能使用一次，
    /**
     * 当CountDownLatch调用countDown()方法 -> releaseShared()方法 -> tryReleaseShared()方法将锁释放完之后，state属性一定是0。
     * 那么，就算是新来了一个线程又调用了aWait()方法，在执行到tryAcquireShared()方法时，发现state == 0，那么就会返回加锁成功，那线程就不会阻塞，也就不会入队，也就没办法实现倒计数器的效果了。
     */
    protected int tryAcquireShared(int acquires) {
        return (getState() == 0) ? 1 : -1;
    }
	// 释放锁的代码也很简单，
    // 1. 当state == 0时，返回false
    // 2. 当state != 0时，state--，原子更新，然后再判断state是否等于0
    // 2.1. 若state == 0，返回false
    // 2.2. 若state ！= 0，返回true
    protected boolean tryReleaseShared(int releases) {
        // Decrement count; signal when transition to zero
        for (;;) {
            int c = getState();
            if (c == 0)
                return false;
            int nextc = c-1;
            if (compareAndSetState(c, nextc))
                return nextc == 0;
        }
    }
}
```

### CountDownLatch

然后简单看下CountDownLatch本身提供的方法。

```java
// 构造方法，传入的count实际上是作为Sync的属性
public CountDownLatch(int count) {
    if (count < 0) throw new IllegalArgumentException("count < 0");
    this.sync = new Sync(count);
}
/** await方法实际上是调用了AQS类的acquireSharedInterruptibly()方法（可响应中断的释放共享锁），
 * 然后acquireSharedInterruptibly()方法又调用了Sync的tryAcquireShared()方法判断是否加锁成功，
 * 又因为，当AQS类的state属性不为0时，一定加锁失败，那么线程一定会入队等待，
 * 所以就实现了多个线程等待一个唤醒条件的效果。
 */
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}
// 带有超时的await方法，和await()方法差不多，具体区别就是tryAcquireSharedNanos()方法中会判断是否超时，可查看AQS类分析的文章对该方法的分析。
public boolean await(long timeout, TimeUnit unit)
    throws InterruptedException {
    return sync.tryAcquireSharedNanos(1, unit.toNanos(timeout));
}
// 释放一次锁
public void countDown() {
    sync.releaseShared(1);
}
// 获取当前state的值，也就是当前还有几把锁，也就是倒计数器的值
public long getCount() {
    return sync.getCount();
}
```

## 总结

CountDownLatch还是比较简单的，

初始化的count参数，实际上作为锁的数量赋值给了AQS的state属性；

然后，

1. 当state != 0时，每次调用await()方法，都会加锁失败，线程就会直接入队阻塞；

2. 当state == 0时，每次调用await()方法，都会加锁成功，线程就不会阻塞，会继续执行；

最后，每次调用countDown()方法，都会释放一次锁，直到state == 0时，所有阻塞的线程就会被唤醒，继续执行；

这样也就实现了一次性倒计数器的效果。