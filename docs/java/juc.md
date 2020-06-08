# JUC 并发编程包

**Doug Lea 🐂🍺！**

## 问题

### 什么是CAS

### 什么是ABA问题

## 源码分析

### UnSafe

### LockSupport

### Lock

### [AbstractQueuedSynchronizer](./aqs.md)

### Condition

**条件锁**

```java
public interface Condition {
		// 进入无限等待，直到被唤醒或者被中断，可响应中断
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

Condition有两个默认的实现类，分别是AbstractQueuedSynchronizer和AbstractQueuedLongSynchronizer中的ConditionObject类。

但AbstractQueuedLongSynchronizer暂时还没有继承类，所以目前可使用的默认的条件锁，只有AbstractQueuedSynchronizer中的ConditionObject。

更具体的分析，请查看AQS文章的[ConditionObject](./aqs.md#ConditionObject)部分。

### [ReentrantLock](./ReentrantLock.md)

### ReadWriteLock

**读写锁**

```java
public interface ReadWriteLock {
    // 返回一个读锁
    Lock readLock();
  	// 返回一个写锁
    Lock writeLock();
}
```

**ReadWriteLock接口比较简单，只定义了两个Lock方法，分别返回读锁和写锁。**

它有两个默认的实现类，分别是ReentrantReadWriteLock和StampedLock.ReadWriteLockView，会有单独的文章进行分析。

#### [ReentrantReadWriteLock](./ReentrantReadWriteLock.md)

#### [StampedLock](./StampedLock.md)

### [Atomic*](./atomic.md)

### CountDownLatch（线程计数器）

### CyclicBarrier（栅栏机制）

### CountDownLatch和CyclicBarrier的区别，从源码级别看

### Semaphore（信号量）

## 总结

