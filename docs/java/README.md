# Java 专题

## 源码理解

### CyclicBarrier（栅栏机制）

### CountDownLatch（线程计数器）

### CyclicBarrier和CountDownLatch的区别，从源码级别看

### Semaphore（信号量）

### Atomic*

### CAS

#### 什么是CAS

#### 什么是ABA问题

### UnSafe

### 优先级队列的底层原理

## 线程池的实现

### Executor

### ExecuteService

### ThreadPoolExecutor

**七个参数**

### Executors（工厂类）

### 线程有几种状态

**六种状态**

```java
public enum State {
        /**
         * Thread state for a thread which has not yet started.
         */
        NEW,

        /**
         * Thread state for a runnable thread.  A thread in the runnable
         * state is executing in the Java virtual machine but it may
         * be waiting for other resources from the operating system
         * such as processor.
         */
        RUNNABLE,

        /**
         * Thread state for a thread blocked waiting for a monitor lock.
         * A thread in the blocked state is waiting for a monitor lock
         * to enter a synchronized block/method or
         * reenter a synchronized block/method after calling
         * {@link Object#wait() Object.wait}.
         */
        BLOCKED,

        /**
         * Thread state for a waiting thread.
         * A thread is in the waiting state due to calling one of the
         * following methods:
         * <ul>
         *   <li>{@link Object#wait() Object.wait} with no timeout</li>
         *   <li>{@link #join() Thread.join} with no timeout</li>
         *   <li>{@link LockSupport#park() LockSupport.park}</li>
         * </ul>
         *
         * <p>A thread in the waiting state is waiting for another thread to
         * perform a particular action.
         *
         * For example, a thread that has called <tt>Object.wait()</tt>
         * on an object is waiting for another thread to call
         * <tt>Object.notify()</tt> or <tt>Object.notifyAll()</tt> on
         * that object. A thread that has called <tt>Thread.join()</tt>
         * is waiting for a specified thread to terminate.
         */
        WAITING,

        /**
         * Thread state for a waiting thread with a specified waiting time.
         * A thread is in the timed waiting state due to calling one of
         * the following methods with a specified positive waiting time:
         * <ul>
         *   <li>{@link #sleep Thread.sleep}</li>
         *   <li>{@link Object#wait(long) Object.wait} with timeout</li>
         *   <li>{@link #join(long) Thread.join} with timeout</li>
         *   <li>{@link LockSupport#parkNanos LockSupport.parkNanos}</li>
         *   <li>{@link LockSupport#parkUntil LockSupport.parkUntil}</li>
         * </ul>
         */
        TIMED_WAITING,

        /**
         * Thread state for a terminated thread.
         * The thread has completed execution.
         */
        TERMINATED;
    }
```

### 下面几种方法的区别

### run()和start()区别

#### sleep()

#### yield()

#### interrupt()

#### join()

### 线程池参数设定，为什么这么设定，作用

## 集合

### 链表的层次变量

## 代理

### 静态代理

### 动态代理（理解原理）

* Java Proxy
* CGLIB

## Java 锁

### 为什么会发生死锁，如何制造一个死锁

## 关键字理解

### static

### final

### synchronized

#### 底层实现

#### jdk 6之后的锁优化

* 偏向锁 -> 轻量级锁 -> 重量级锁
* 锁粗化
* 锁消除

#### 和ReentrantLock的区别

#### 使用synchronized实现单缓冲区的生产者消费者模型

### volatile

#### 指令重排

#### 内存屏障

#### 总线风暴

* 可见性
* 有序性
* 为什么不能保证原子性

## JMM（Java 内存模型）

### 三大特性

* 可见性
* 有序性
* 原子性

### as-if-serial

### happens-before

### mesi - CPU缓存一致性协议

## 其他

### Object类有哪些方法

#### native 方法

* getClass()
* hashCode()
* clone()
* notify()
* notifyAll()
* wait(long)

#### Java 方法

* equals()
* toString()
* wait()
* wait(long, int)
* finalize()

#### 接口的默认方法

### HashMap 和 HashSet 的区别？HashSet 是如何检查重复的

查看源码可以发现，HashSet内部其实是维护了一个HashMap的对象，HashSet的value作为key到了HashMap中。

### JNI(Java native interface，Java本地接口)

