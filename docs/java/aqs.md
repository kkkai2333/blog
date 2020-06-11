# AbstractQueuedSynchronizer

**AQS类时JUC并发包下最核心的类，么得之一。**

## 问题

## 源码分析

**由于AQS是抽象类，他只是封装了加锁的核心方法，并不是真正的加锁类，所以查看本文，最好结合[ReentrantLock](./ReentrantLock.md)和[ReentrantReadWriteLock](./ReentrantReadWriteLock.md)两篇文章来分析。**

先看下AQS类的类图。

![AQS](./java/aqs.png)

AQS类继承了AbstractOwnableSynchronizer类，而AbstractOwnableSynchronizer类比较简单，只维护了一个exclusiveOwnerThread变量，保存当前持有独占锁的线程，并提供了set/get方法。

```java
public abstract class AbstractOwnableSynchronizer
    implements java.io.Serializable {

    /** Use serial ID even though all fields transient. */
    private static final long serialVersionUID = 3737899427754241961L;

    /**
     * Empty constructor for use by subclasses.
     */
    protected AbstractOwnableSynchronizer() { }

    /**
     * The current owner of exclusive mode synchronization.
     */
    // 保存当前独占锁的线程
    private transient Thread exclusiveOwnerThread;

    // 设置当前持有独占锁的线程
    protected final void setExclusiveOwnerThread(Thread thread) {
        exclusiveOwnerThread = thread;
    }
    // 获取当前持有独占锁的线程
    protected final Thread getExclusiveOwnerThread() {
        return exclusiveOwnerThread;
    }
}
```

下面，就开始分析AQS类的具体实现逻辑。

首先，AQS中的定义了一个内部类Node，AQS的等待队列和条件队列都是通过Node实现的。

### Node

```java
/**
 * <pre>
 *      +------+  prev +-----+       +-----+
 * head |      | <---- |     | <---- |     |  tail
 *      +------+       +-----+       +-----+
 * </pre>
 */
static final class Node {
  /** Marker to indicate a node is waiting in shared mode */
  // 标志当前是共享锁模式
  static final Node SHARED = new Node();
  /** Marker to indicate a node is waiting in exclusive mode */
  // 标志当前是独占锁模式
  static final Node EXCLUSIVE = null;
  /** waitStatus value to indicate thread has cancelled */
  // 表明这个node的线程已经被取消了
  static final int CANCELLED =  1;
  /** waitStatus value to indicate successor's thread needs unparking */
  // 表明这个node的下一个节点的线程等待被唤醒
  static final int SIGNAL    = -1;
  /** waitStatus value to indicate thread is waiting on condition */
  // 表明这个node的线程在等待条件
  static final int CONDITION = -2;
  /**
   * waitStatus value to indicate the next acquireShared should
   * unconditionally propagate
   */
  // 表明这个node的下一个申请共享锁的线程应该无条件传播
  static final int PROPAGATE = -3;
	// 等待状态，可能表示本node的线程等待状态，也可能表示下个node的线程等待状态
  volatile int waitStatus;
	// 上一个节点
  volatile Node prev;
	// 下一个节点
  volatile Node next;
	// 当前node持有的线程
  volatile Thread thread;
	// 下一个等待者，感觉貌似是用来区分独占锁和共享锁
  Node nextWaiter;
	// 判断当前节点的线程是不是在等待获取共享锁
  final boolean isShared() {
    return nextWaiter == SHARED;
  }
	// 获取当前节点的前一个node
  final Node predecessor() throws NullPointerException {
    Node p = prev;
    if (p == null)
      throw new NullPointerException();
    else
      return p;
  }
	// 
  Node() {    // Used to establish initial head or SHARED marker
  }
	// 创建一个Node，目前mode有两种，1. null: 独占模式 2. new Node(): 共享模式
  Node(Thread thread, Node mode) {     // Used by addWaiter
    this.nextWaiter = mode;
    this.thread = thread;
  }
	// 创建一个Node，供ConditionObject类调用，
  // 从这里也可以看出，Condition不支持共享模式，因为它创建的节点mode == null，默认就是独占模式
  Node(Thread thread, int waitStatus) { // Used by Condition
    this.waitStatus = waitStatus;
    this.thread = thread;
  }
}
```

然后，看一下AbstractQueuedSynchronizer自身的主要方法。

### AbstractQueuedSynchronizer

首先，AQS类中定义了一个Unsafe的静态常量，并提供了一些原子更新的方法。

#### cas

默认提供了一组cas原子更新的方法。

```java
private static final Unsafe unsafe = Unsafe.getUnsafe();
// state 偏移量
private static final long stateOffset;
// head节点 偏移量
private static final long headOffset;
// tail节点 偏移量
private static final long tailOffset;
// Node ws属性 偏移量
private static final long waitStatusOffset;
// Node next属性 偏移量
private static final long nextOffset;
// 静态代码块中，分别初始化了当前类的几个字段的偏移量。
static {
  try {
    stateOffset = unsafe.objectFieldOffset
      (AbstractQueuedSynchronizer.class.getDeclaredField("state"));
    headOffset = unsafe.objectFieldOffset
      (AbstractQueuedSynchronizer.class.getDeclaredField("head"));
    tailOffset = unsafe.objectFieldOffset
      (AbstractQueuedSynchronizer.class.getDeclaredField("tail"));
    waitStatusOffset = unsafe.objectFieldOffset
      (Node.class.getDeclaredField("waitStatus"));
    nextOffset = unsafe.objectFieldOffset
      (Node.class.getDeclaredField("next"));

  } catch (Exception ex) { throw new Error(ex); }
}
// 原子更新头结点
private final boolean compareAndSetHead(Node update) {
  return unsafe.compareAndSwapObject(this, headOffset, null, update);
}
// 原子更新尾结点
private final boolean compareAndSetTail(Node expect, Node update) {
  return unsafe.compareAndSwapObject(this, tailOffset, expect, update);
}
// 原子更新节点的waitStatus属性
private static final boolean compareAndSetWaitStatus(Node node,
                                                     int expect,
                                                     int update) {
  return unsafe.compareAndSwapInt(node, waitStatusOffset,
                                  expect, update);
}
// 原子更新节点的next属性
private static final boolean compareAndSetNext(Node node,
                                               Node expect,
                                               Node update) {
  return unsafe.compareAndSwapObject(node, nextOffset, expect, update);
}
// 上面几个原子更新的方法只能被aqs类本身调用，下面这个原子更新state的方法可以被子类调用。
// 原子更新同步状态属性state的值
protected final boolean compareAndSetState(int expect, int update) {
  // See below for intrinsics setup to support this
  return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```

#### setHead

设置等待队列的头结点。

```java
// 从这个方法可以看到，其实头结点，只是一个空的node，
// 那就说明，真正在等锁的第一个线程，应该是保存在head的下一个节点
private void setHead(Node node) {
    head = node;
    node.thread = null;
    node.prev = null;
}
```

#### setHeadAndPropagate

```java
private void setHeadAndPropagate(Node node, int propagate) {
  	// 拿到当前的头结点
    Node h = head; // Record old head for check below
  	// 将node设置为新的头结点
    setHead(node);
    /*
        * Try to signal next queued node if:
        *   Propagation was indicated by caller,
        *     or was recorded (as h.waitStatus either before
        *     or after setHead) by a previous operation
        *     (note: this uses sign-check of waitStatus because
        *      PROPAGATE status may transition to SIGNAL.)
        * and
        *   The next node is waiting in shared mode,
        *     or we don't know, because it appears null
        *
        * The conservatism in both of these checks may cause
        * unnecessary wake-ups, but only when there are multiple
        * racing acquires/releases, so most need signals now or soon
        * anyway.
        */
  	/**
  	 * 这里仔细分析一下if中的判断条件，如果
  	 * 1. propagate大于0，或者，
  	 * 2. 头结点为null，或者，
  	 * 3. 头结点不为空，并且头结点的ws属性小于0，或者，
  	 * 4. 头结点为null，或者，
  	 * 5. 头结点不为空，并且头结点的ws属性小于0；
  	 * 时，找到node的下一个节点s，如果，
  	 * 1. 后继节点s为空，或者，
  	 * 2. 后继节点s不为空，并且s等待加的是共享锁，
  	 * 则，调用doReleaseShared()方法
  	 * 
  	 * ？问题5，没看懂这段代码的意思 - TODO
  	 *
  	 */
    if (propagate > 0 || h == null || h.waitStatus < 0 ||
        (h = head) == null || h.waitStatus < 0) {
        Node s = node.next;
        if (s == null || s.isShared())
            doReleaseShared();
    }
}
/**
 * 总结一下doReleaseShared()方法的逻辑，如下，
 * 1. 拿到头结点，赋值给h；
 * 2. 如果头结点不为空，并且头结点不等于尾节点，（说明此时有线程在排队），
 * 3. 那么就拿到头结点的ws属性，如果ws == -1，那就先把ws更新为0（原子操作），然后调用unparkSuccessor()方法唤醒头结点的后继节点；
 * 4. 当头结点的ws == 0时，再把ws更新为-3（原子操作）；
 * 5. 最后判断，如果h还是原本的头结点，那就跳出循环，否则，再次进行1234操作
 * 
 * ？问题6，没看懂这段代码的意思 - TODO
 */
private void doReleaseShared() {
    /*
     * Ensure that a release propagates, even if there are other
     * in-progress acquires/releases.  This proceeds in the usual
     * way of trying to unparkSuccessor of head if it needs
     * signal. But if it does not, status is set to PROPAGATE to
     * ensure that upon release, propagation continues.
     * Additionally, we must loop in case a new node is added
     * while we are doing this. Also, unlike other uses of
     * unparkSuccessor, we need to know if CAS to reset status
     * fails, if so rechecking.
     */
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            if (ws == Node.SIGNAL) {
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // loop to recheck cases
                unparkSuccessor(h);
            }
            else if (ws == 0 &&
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)                   // loop if head changed
            break;
    }
}
```

#### addWaiter

向等待队列中添加节点，如果队列还没有初始化，那就调用enq()方法初始化队列。

```java
// 线程入队方法
private Node addWaiter(Node mode) {
    // 创建一个持有当前线程的node，
    Node node = new Node(Thread.currentThread(), mode);
    // Try the fast path of enq; backup to full enq on failure
    // 首先尝试快速添加node，尾插
    // 拿到尾结点
    Node pred = tail;
    if (pred != null) {
        // 如果尾结点不为空，则把当前节点的pred设置为原本的tail
        node.prev = pred;
        // 然后cas更新尾结点
        if (compareAndSetTail(pred, node)) {
            // 如果cas更新尾结点成功，则把原来的tail节点的next指向当前node（也就是现在的tail节点）
            pred.next = node;
            // 返回刚创建的node节点
            return node;
        }
    }
    // 代码执行到这里，有两种情况，
    // 1. tail为空，说明队列还没有初始化
    // 2. tail不为空，但是快速添加node失败了
    // 那么就需要进入enq()方法，在死循环中保证可以让队列初始化，或节点添加成功
    enq(node);
    // 返回刚创建的node节点
    return node;
}
private Node enq(final Node node) {
    for (;;) {
        // 获取尾结点
        Node t = tail;
        // 如果尾结点为空，代表需要初始化队列
        if (t == null) { // Must initialize
            // cas更新头结点，设置一个空的Node节点
            if (compareAndSetHead(new Node()))
                // 然后再把tail也指向head
                tail = head;
        } else {
            // tail节点不为空，就把当前node的prev指向tail节点
            node.prev = t;
            // 然后cas更新尾结点
            if (compareAndSetTail(t, node)) {
                // 更新成功后，把原来的tail节点的next指向当前node（也就是现在的tail节点）
                t.next = node;
                // 然后返回原来的tail尾结点
                return t;
            }
        }
    }
}
```

#### hasQueuedPredecessors

判断当前是不是有线程在排队等待获取锁，如果是，返回true。

```java
// 这个方法简单明确而严谨，吹一波
// 判断当前是不是有线程在排队等待获取锁
public final boolean hasQueuedPredecessors() {
    // The correctness of this depends on head being initialized
    // before tail and on head.next being accurate if the current
    // thread is first in queue.
    // 拿到尾节点
    Node t = tail; // Read fields in reverse initialization order
    // 拿到头结点
  	Node h = head;
    Node s;
  	/**
     * 对下面这个与运算进行分析
     * 如果
     * 1. 头结点不等于尾节点，并且，（说明等待队列一定初始化了，并且现在可能有线程在排队）
     * 2.1. 头结点的next节点等于空，或者
     * 2.2. 头结点的next节点不等于空，但是next节点持有的线程不是当前线程
     * 那么就返回true，代表现在有线程在排队
     */
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

#### apparentlyFirstQueuedIsExclusive

判断第一个排队的线程是不是在等待获取独占锁，如果是，则返回true。

```java
// 判断第一个排队的线程是不是在等待获取独占锁
final boolean apparentlyFirstQueuedIsExclusive() {
    Node h, s;
    /**
     * 对下面这个与运算进行分析
     * 如果
     * 1. 头结点不为空，并且，
     * 2. 头结点的next节点不为空，并且，
     * 3. next节点不是要加共享锁，并且，
     * 4. next节点持有一个线程
     * 那么就返回true，代表第一个排队的线程在等待获取独占锁
     */
    return (h = head) != null &&
        (s = h.next)  != null &&
        !s.isShared()         &&
        s.thread != null;
}
```

#### acquire

独占锁加锁，不响应中断。

```java
public final void acquire(int arg) {
    // tryAcquire()是抽象方法，交给子类实现
    // 如果调用tryAcquire()返回false，说明加锁失败，那么，接下来，
    // 调用addWaiter()方法把线程入队，
    // 调用acquireQueued()方法，阻塞线程
    if (!tryAcquire(arg) &&
        // 这里调用addWaiter()传入的是Node.EXCLUSIVE，代表当前入队的是一个需要申请独占锁的线程
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        // 当acquireQueued()方法返回true的时候，说明该线程被中断了
        // 但是由于acquire()方法不会响应中断，
        // 所以这里又调用了一次Thread.currentThread().interrupt()方法，重置了当前线程的中断状态，
        // 也就是说，线程被中断的这个事情，当前方法内部处理了（处理方式就是不处理）
        // 相当于，线程没有被中断
        selfInterrupt();
}
// selfInterrupt()比较简单，就是让当前线程再中断一次
/**
 * interrupt是一个boolean状态值，中断一次为true，中断两次就又变成false了
 */
static void selfInterrupt() {
    Thread.currentThread().interrupt();
}

/** 
 * 这里总结一下acquireQueued()方法的逻辑，
 * 1. 判断当前节点的上一个节点是不是头结点，如果是，则再去尝试加锁
 * 2. 第一次调用shouldParkAfterFailedAcquire方法，更新当前节点的上一个节点的属性ws，设置为-1，然后返回false
 * 3. 再执行一次操作1
 * 4. 第二次调用shouldParkAfterFailedAcquire方法，判断当前节点的上一个节点的属性ws是否等于-1，如果是，返回true
 * 5. 调用parkAndCheckInterrupt()方法，调用park()方法，阻塞当前线程
 * 6. 线程被unPark()方法唤醒后，设置中断状态
 * 7. 再次执行操作1
 * 8. 加锁成功，返回线程的中断状态
 */
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        // 定义一个变量，保存线程的中断状态
        boolean interrupted = false;
        // 死循环，
        for (;;) {
            // 获取当前node的上一个节点
            final Node p = node.predecessor();
            //如果上一个是头结点，那就再去尝试加锁（当前线程内心OS：我还想在挣扎一下）
            if (p == head && tryAcquire(arg)) {
                // 如果这里加锁成功了，那就把当前节点设置为头结点
                setHead(node);
                p.next = null; // help GC
                failed = false;
                // 加锁成功后，返回当前线程的中断状态
                return interrupted;
            }
            // 如果当前node的上一个节点不是头结点，那就调用shouldParkAfterFailedAcquire()方法
            // 请注意，这里调用方法时，传入了当前node和它的上一个node
            // 在下面，分析了shouldParkAfterFailedAcquire()方法之后，可以发现，
            // 第一次调用，一定返回false，那么if判断就不满足，就会再次执行上面的代码块
            // 第二次调用，一定返回true，那么就会执行if的第二个判断，也就是parkAndCheckInterrupt()方法
            if (shouldParkAfterFailedAcquire(p, node) &&
                // 那么当前线程就会在parkAndCheckInterrupt()方法中park，然后就阻塞了
                // 然后，当线程被unPark唤醒后，parkAndCheckInterrupt()方法会返回该线程是否被中断
                parkAndCheckInterrupt())
                // 也就是说，当线程被唤醒后，发现它被中断了，那么parkAndCheckInterrupt()就会返回true，
                // 然后就会进入if代码块，也就会把interrupted设置为true
                interrupted = true;
        }
    } finally {
        // 正常情况下，当前方法返回时一定是加锁成功，那么failed一定等于false，cancelAcquire()方法不执行
        if (failed)
            cancelAcquire(node);
    }
}
```

#### acqireInterruptibly

独占锁加锁，可响应中断。

```java
public final void acquireInterruptibly(int arg)
        throws InterruptedException {
    // 首先判断一次，当前线程是不是被中断了，如果是，直接抛出InterruptedException
    if (Thread.interrupted())
        throw new InterruptedException();
    // 和acquire方法一样，也是先调用tryAcquire()方法
    // 如果调用tryAcquire()返回false，说明加锁失败，那么，接下来，
    // 就要调用doAcquireInterruptibly()方法
    if (!tryAcquire(arg))
        doAcquireInterruptibly(arg);
}
/**
 * 其实doAcquireInterruptibly()方法和acquireQueued()方法很像
 * 唯一的区别，是在线程被unPark唤醒后，如果线程被中断了，
 * 1. 会抛出InterruptedException异常
 * 2. 取消当前线程的排队等锁操作	
 */
private void doAcquireInterruptibly(int arg)
    throws InterruptedException {
    // 首先，调用addWaiter()方法，将当前线程入队，并标记为等待独占锁
    final Node node = addWaiter(Node.EXCLUSIVE);
    // 下面的方法，和acquireQueued()方法的逻辑基本一样
    boolean failed = true;
    try {
        for (;;) {
            // 获取当前node的上一个节点
            final Node p = node.predecessor();
            //如果上一个是头结点，那就再去尝试加锁（当前线程内心OS：我还想在挣扎一下）
            if (p == head && tryAcquire(arg)) {
                // 如果这里加锁成功了，那就把当前节点设置为头结点
                setHead(node);
                p.next = null; // help GC
                failed = false;
                // 加锁成功，直接返回，方法结束
                return;
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                // 唯一的区别，在这里，
                /**
                 * 首先，如果进入了if代码块，代表当前线程被中断了
                 * 1. 可以先回头看下acquire()方法和acquireQueued()方法的分析，因为调用
                 * acquire()方法是不响应中断的，所以它在方法内部把中断状态给重置了
                 * 2. 然后看下当前方法，在这里，
                 * 直接抛出了一个InterruptedException异常
                 * 那么，循环就结束了，方法就会执行到finally代码块，
                 * 由于当前线程在被唤醒后，没有再次加锁，所以failed一定等于true，
                 * 那么，在finally代码块中，就会调用cancelAcquire()方法，
                 * 取消当前线程的排队获取独占锁的这个操作
                 */
                throw new InterruptedException();
        }
    } finally {
        // 如果加锁成功，failed == false，cancelAcquire()方法不执行
        // 如果线程被中断，failed == true，执行cancelAcquire()方法，取消当前线程的排队状态
        if (failed)
            cancelAcquire(node);
    }
}
```

#### tryAcquireNanos

带超时时间的acquire()方法，一般是被子类带超时时间的tryLock()方法调用；

1. 调用tryAcquire加锁失败后，会进入等待队列；
2. 超时后返回false，加锁失败；
3. 可响应中断。

```java
public final boolean tryAcquireNanos(int arg, long nanosTimeout)
    throws InterruptedException {
    // 如果加锁前线程被中断了，直接抛出异常
    if (Thread.interrupted())
        throw new InterruptedException();
    // 短路与，
    // 如果调用tryAcquire()加锁成功，直接返回true
    // 如果加锁失败，那就调用doAcquireNanos()方法入队等待加锁（有超时）
    return tryAcquire(arg) ||
        doAcquireNanos(arg, nanosTimeout);
}
// 带有超时判断的入队、park操作
private boolean doAcquireNanos(int arg, long nanosTimeout)
        throws InterruptedException {
    // 如果超时时间小于0，直接返回false，加锁失败
    if (nanosTimeout <= 0L)
        return false;
    // 否则，计算到什么时间会超时
    final long deadline = System.nanoTime() + nanosTimeout;
    // 把当前线程入队，等待的是独占锁
    final Node node = addWaiter(Node.EXCLUSIVE);
    boolean failed = true;
    try {
        for (;;) {
            // 这里的if判断和acquireQueued()方法中的判断一样，就不分析了
            final Node p = node.predecessor();
            if (p == head && tryAcquire(arg)) {
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return true;
            }
            // 这里判断一下是不是已经到超时时间了，
            // 如果到了，加锁失败，直接返回false，
            nanosTimeout = deadline - System.nanoTime();
            if (nanosTimeout <= 0L)
                return false;
            /**
             * 这里的if判断和acquireQueued()方法中的判断也差不多，
             * 1. 第一次调用shouldParkAfterFailedAcquire()方法，更新node.pred的ws属性为-1，然后返回false
             * 2. 第二次调用shouldParkAfterFailedAcquire()方法，判断node.pred的ws属性等于-1，返回true，代表node节点准备好阻塞了
             * 下面说一下差异，
             * 1. 这里有一个spinForTimeoutThreshold阈值的常量，默认为1000L，也就是说，当距离超时已经不足1000ns了，那就别park了，直接在这里自旋就好了
             * 2. 如果距离超时大于1000ns，那就调用LockSupport.parkNanos()方法阻塞当前线程
             */
            if (shouldParkAfterFailedAcquire(p, node) &&
                nanosTimeout > spinForTimeoutThreshold)
                // 当前线程会阻塞在这里，直到park超时或被unpark唤醒
                LockSupport.parkNanos(this, nanosTimeout);
            // 这里判断一下当前线程是否被中断，如果有，则抛出InterruptedException异常
            if (Thread.interrupted())
                throw new InterruptedException();
        }
    } finally {
        // 如果加锁成功，failed == false，cancelAcquire()方法不执行
        // 如果超时或线程被中断，failed == true，执行cancelAcquire()方法，取消当前线程的排队状态
        if (failed)
            cancelAcquire(node);
    }
}
```

#### acquireShared

共享锁加锁，不响应中断。

```java
public final void acquireShared(int arg) {
    // tryAcquireShared()方法，加锁成功返回1，加锁失败返回-1
    if (tryAcquireShared(arg) < 0)
        // 如果加锁失败，就调用doAcquireShared()方法
        doAcquireShared(arg);
}

private void doAcquireShared(int arg) {
    // 将当前线程入队，等待的是共享锁
    final Node node = addWaiter(Node.SHARED);
    // 是否失败
    boolean failed = true;
    try {
        // 是否被中断
        boolean interrupted = false;
        for (;;) {
            // 拿到当前节点的前置节点p
            final Node p = node.predecessor();
            // 如果p是头结点，
            if (p == head) {
              	// 那这里就再次加锁
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    // 如果加锁成功，那就调用setHeadAndPropagate()方法设置头结点和传播状态
                    setHeadAndPropagate(node, r);
                  	// 在setHeadAndPropagate()方法中，已经把node设置为了头结点，所以p已经不是头结点了，这里将p.next置空，实际上就是释放掉了其他节点持有的p的引用，所以p就可以在下一次GC的时候被回收了
                    p.next = null; // help GC
                    // 如果线程被中断了，就调用selfInterrupt()方法内部消耗掉这次中断
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    // 代码执行结束，返回
                    return;
                }
            }
            // 下面的代码和acquireQueued()方法中的if判断基本一致，就不详细分析了
            // 代码执行到这里，就要去阻塞线程了
          	// shouldParkAfterFailedAcquire()和parkAndCheckInterrupt()方法可向下查看具体分析
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
              	// 如果线程被中断了，标记为true
                interrupted = true;
        }
    } finally {
      	// 本方法如果是正常返回，肯定加锁成功，所以failed一定为false
        if (failed)
            cancelAcquire(node);
    }
}
```

#### acquireSharedInterruptibly

共享锁加锁，可响应中断。

```java
public final void acquireSharedInterruptibly(int arg)
    throws InterruptedException {
  	// 首先判断一次，当前线程是不是被中断了，如果是，直接抛出InterruptedException
    if (Thread.interrupted())
        throw new InterruptedException();
  	// 和acquireShared()方法一样，也是先调用tryAcquireShared()方法
    // 如果调用tryAcquireShared()返回-1，说明加锁失败，那么，接下来，
    // 就要调用doAcquireSharedInterruptibly()方法
    if (tryAcquireShared(arg) < 0)
        doAcquireSharedInterruptibly(arg);
}

private void doAcquireSharedInterruptibly(int arg)
    throws InterruptedException {
  	// 将当前线程入队，等待的是共享锁
    final Node node = addWaiter(Node.SHARED);
  	// 是否失败
    boolean failed = true;
    try {
      	// 这一部分的逻辑，和acquireShared()方法一样，就不讲了
        for (;;) {
          	// 拿到当前节点的前置节点p
            final Node p = node.predecessor();
          	// 如果p是头结点，
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
            }
          	// 下面的代码和doAcquireInterruptibly()方法中的if判断基本一致
            // 代码执行到这里，就要去阻塞线程了
            if (shouldParkAfterFailedAcquire(p, node) &&
                // 线程会在这里阻塞，一旦线程被唤醒，就会返回线程的中断状态
                parkAndCheckInterrupt())
                // 如果线程被中断，那么这里就直接抛出InterruptedException异常
                throw new InterruptedException();
        }
    } finally {
      	// 如果加锁成功，failed == false，cancelAcquire()方法不执行
        // 如果线程被中断，failed == true，执行cancelAcquire()方法，取消当前线程的排队状态
        if (failed)
            cancelAcquire(node);
    }
}
```

#### tryAcquireSharedNanos

带超时时间的acquireShared()方法，一般是被子类带超时时间的tryLock()方法调用；

1. 调用tryAcquireShared加锁失败后，会进入等待队列；
2. 超时后返回false，加锁失败；
3. 可响应中断。

```java
public final boolean tryAcquireSharedNanos(int arg, long nanosTimeout)
    throws InterruptedException {
    // 如果加锁前线程被中断了，直接抛出异常
    if (Thread.interrupted())
        throw new InterruptedException();
    // 短路与，
    // tryAcquireShared()方法，加锁成功返回1，加锁失败返回-1
    // 如果调用tryAcquireShared()加锁成功，直接返回true
    // 如果加锁失败，那就调用doAcquireSharedNanos()方法入队等待加锁（有超时）
    return tryAcquireShared(arg) >= 0 ||
        doAcquireSharedNanos(arg, nanosTimeout);
}
// 带有超时判断的入队、park操作
private boolean doAcquireSharedNanos(int arg, long nanosTimeout)
        throws InterruptedException {
    // 如果超时时间小于0，直接返回false，加锁失败
    if (nanosTimeout <= 0L)
        return false;
    // 否则，计算到什么时间会超时
    final long deadline = System.nanoTime() + nanosTimeout;
    // 把当前线程入队，等待的是共享锁
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        for (;;) {
            // 这里的if判断和doAcquireShared()方法中的判断一样，就不分析了
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    failed = false;
                    return true;
                }
            }
            // 下面的三个if判断和doAcquireNanos()方法中对应位置的if判断一致，就不详细分析了
            // 这里判断一下是不是已经到超时时间了，
            // 如果到了，加锁失败，直接返回false，
            nanosTimeout = deadline - System.nanoTime();
            if (nanosTimeout <= 0L)
                return false;
            // 设置node.pred的ws=-1，
            if (shouldParkAfterFailedAcquire(p, node) &&
                // 和阈值比较一下，如果小于spinForTimeoutThreshold，那就别park了，直接自旋
                nanosTimeout > spinForTimeoutThreshold)
                // 线程会在这里阻塞，直到超时或者被唤醒
                LockSupport.parkNanos(this, nanosTimeout);
            // 这里判断一下当前线程是否被中断，如果有，则抛出InterruptedException异常
            if (Thread.interrupted())
                throw new InterruptedException();
        }
    } finally {
        // 如果加锁成功，failed == false，cancelAcquire()方法不执行
        // 如果超时或线程被中断，failed == true，执行cancelAcquire()方法，取消当前线程的排队状态
        if (failed)
            cancelAcquire(node);
    }
}
```

#### shouldParkAfterFailedAcquire

在获取锁失败后，会调用此方法，

1. 第一次调用，将当前node的pred节点的ws设置为-1，返回false；
2. 第二次调用，判断当前node的pred节点的ws为-1，代表当前节点准备好被park了，直接返回true；
3. 可能还会有一些其他操作，比如，当发现pred节点的ws > 1时，说明pred节点持有的线程不会再去加锁了，那就向前遍历等待队列，直到找到ws<=0的节点n，然后把n设置为当前node的pred节点。

```java
// 这里总结一下shouldParkAfterFailedAcquire()方法
// 关键一点，当前线程是否被park的状态，是保存在当前节点的上一个节点的ws属性中的
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    // 获取当前节点的前一个node的waitStatus状态
    int ws = pred.waitStatus;
    // 第一次调用此方法时，ws一定为0
    // 第二次调用此方法时，ws就等于-1了，因为第一次调用时，已经更新了ws的值
    if (ws == Node.SIGNAL)
        // 那么这里就返回true，代表当前线程可以被park了
        return true;
    if (ws > 0) {
        // 如果ws > 0，那就说明上一个节点的等待状态已经被取消了
        // 这里会循环清除ws == 1的node
        do {
            node.prev = pred = pred.prev;
        } while (pred.waitStatus > 0);
        pred.next = node;
    } else {
        /*
         * waitStatus must be 0 or PROPAGATE.  Indicate that we
         * need a signal, but don't park yet.  Caller will need to
         * retry to make sure it cannot acquire before parking.
         */
        // 第一次调用此方法时，ws 只会等于0或者-3（PROPAGATE）
        // 所以代码一定会执行到这里，然后调用cas方法，更新pred节点的ws，将其设置为-1
        compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
    }
    // 然后返回false
    return false;
}
```

#### parkAndCheckInterrupt

1. 调用LockSupport.park()阻塞当前线程；
2. 当线程被唤醒后，返回当前线程的中断状态。

```java
// 线程会在parkAndCheckInterrupt()方法中阻塞，直到被unPark()唤醒
private final boolean parkAndCheckInterrupt() {
    // park当前线程
    LockSupport.park(this);
    // 当线程被唤醒后，返回当前线程的中断状态（是否被中断了）
    return Thread.interrupted();
}
```

#### cancelAcquire

取消该节点的排队等锁操作。

```java
/**
 * 这里描述下当前方法的逻辑，
 * 1. 取消node节点对线程的引用
 * 2. 将node的ws属性设置为CANCELLED取消状态
 * 3. 如果当前node的next节点，处于等待被唤醒的状态，那么就把当前node的pred的next指向当前node的next节点
 * 4. 还做了一下额外动作，就是从当前节点，向前遍历，清除所有ws > 0的节点
 * --- 这个方法还有点没分析透
 */
private void cancelAcquire(Node node) {
    // 如果节点为null，直接忽略，代码执行结束
    if (node == null)
        return;
	// 首先，把当前节点持有的线程引用释放掉
    node.thread = null;
    // Skip cancelled predecessors
    // 接着，从当前节点向前遍历，直到找到第一个ws <= 0的节点，把它设置为当前节点的pred
    // 这一步的意思是，清除当前node前边所有已经取消的节点
    Node pred = node.prev;
    while (pred.waitStatus > 0)
        node.prev = pred = pred.prev;
    // 这里定义了一个predNext，到现在为止，其实就是node节点，但是下面可能会有变化
    Node predNext = pred.next;
    // 把当前node的ws设置为取消状态
    node.waitStatus = Node.CANCELLED;
    
    // If we are the tail, remove ourselves.
    // 如果当前node是tail尾结点，那就直接把node.pred设置为新的尾结点即可，cas更新
    if (node == tail && compareAndSetTail(node, pred)) {
        compareAndSetNext(pred, predNext, null);
    } else {
        // If successor needs signal, try to set pred's next-link
        // so it will get one. Otherwise wake it up to propagate.
        int ws;
        /**
         * 分析一下if语句
         * 1. 如果pred不是头结点，并且，
         * 2.1. pred的ws属性为-1，即pred的next节点处于待唤醒状态，或者
         * 2.2. pred的ws属性为0或-3，那么就把pred节点的ws属性设置为-1，并且pred持有的线程不为空
         */
        if (pred != head &&
            ((ws = pred.waitStatus) == Node.SIGNAL ||
                (ws <= 0 && compareAndSetWaitStatus(pred, ws, Node.SIGNAL))) &&
            pred.thread != null) {
            // 找到当前node的next节点
            Node next = node.next;
            // 如果next节点不为空，并且next节点的ws属性 <= 0（代表next节点还是在等锁状态），
            if (next != null && next.waitStatus <= 0)
                // 那就直接把next节点设置为pred节点的next，cas更新
                compareAndSetNext(pred, predNext, next);
        } else {
            /**
             * ？问题4，这里还不太清楚为什么要唤醒后继结点 - TODO
             */
            unparkSuccessor(node);
        }
	    // 把node的next指向自己，相当于是循环链表，然后又没有外部对象持有node的引用，
        // 在GC的时候，node节点就会被回收啦
        node.next = node; // help GC
    }
}
```

#### release

独占锁释放。

```java

public final boolean release(int arg) {
    // tryRelease()是抽象方法，交给子类实现
    // tryRelease()返回true，代表持有独占锁的线程已经把它持有的独占锁全部释放了
    if (tryRelease(arg)) {
        // 那么，下面就需要唤醒等待队列的第一个等待线程
        Node h = head;
        // 如果头结点不为空，并且头结点的waitStatus不为0，代表第一个等待线程需要被唤醒
        if (h != null && h.waitStatus != 0)
            // 所以这里调用unparkSuccessor()方法取唤醒第一个等待线程
            unparkSuccessor(h);
        // 返回true，说明释放独占锁成功
        return true;
    }
    // 返回false，说明本次释放独占锁成功（当前线程可能获取了多次独占锁）
    return false;
}
```

#### releaseShared

共享锁释放。

```java
public final boolean releaseShared(int arg) {
    // tryReleaseShared()是抽象方法，交给子类实现
    // tryReleaseShared()返回true，代表持有共享锁的线程已经把它持有的共享锁全部释放了
    if (tryReleaseShared(arg)) {
        // 进入if代码块，代表需要唤醒后续排队的线程，调用doReleaseShared()方法
        doReleaseShared();
        // 返回true，说明释放共享锁成功
        return true;
    }
    // 返回false，说明本次释放共享锁成功（当前线程可能获取了多次共享锁）
    return false;
}

private void doReleaseShared() {
    // 死循环，为了确保：只要等待队列还有线程在等锁，那就必须唤醒第一个等锁的线程
    for (;;) {
        // 找到头结点head
        Node h = head;
        // 如果head不为空，代表等待队列已经初始化过了
        // 如果head不等于tail尾结点，代表等待队列中可能有线程在排序等锁
        if (h != null && h != tail) {
            // 拿到头结点的ws属性，表示的是头结点的next节点持有的线程的阻塞状态
            int ws = h.waitStatus;
            // 如果ws == -1，代表head的next节点正在阻塞，那就准备唤醒它
            if (ws == Node.SIGNAL) {
                // 在唤醒next节点的线程之前，先把head节点的ws状态更改为0，如果更改失败，就循环再次尝试更新，cas操作
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // loop to recheck cases
                // cas更新head节点的ws属性成功后，调用unparkSuccessor()方法唤醒第一个排队的线程
                unparkSuccessor(h);
            }
            // 如果判断到ws == 0，那说明可能有其他线程也执行到了本方法，并且早一步把ws修改了
            // 那这里就去更新头结点的ws属性，修改为-3，cas操作
            // ？ 问题2，这里为什么要改成-3？ - TODO
            else if (ws == 0 &&
                        !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        // 代码执行到这里，如果h == head，说明头结点没有变化，那就结束循环就好了
        // ? 问题3 - TODO
        if (h == head)                   // loop if head changed
            break;
    }
}
```

#### unparkSuccessor

唤醒等待队列中的第一个阻塞的线程。

```java
private void unparkSuccessor(Node node) {
    
    // 拿到当前节点的ws属性值，表示的是node的next节点的线程状态（是否需要唤醒）
    int ws = node.waitStatus;
    // 如果ws小于0，代表它可能等于-1（SIGNAL），-3(PROPAGATE)，那就说明next节点持有的线程可能是要等待被唤醒的，所以这里就预先把ws属性值设置为0，回到node的初始状态
    if (ws < 0)
        // 那就把node的ws属性值更新为0，cas原子操作
        compareAndSetWaitStatus(node, ws, 0);

    // 拿到node的next节点
    Node s = node.next;
    // 如果s的ws属性大于0，代表s这个node持有的线程，已经取消了等锁（我不玩了，你们谁爱玩谁玩）
    if (s == null || s.waitStatus > 0) {
        // 那就把s置空，然后从tail尾结点向前遍历等待队列一直到node节点，找到第一个ws < 0的节点（说明这个节点需要被唤醒），那么就把这个节点的引用赋值给s
        s = null;
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    // 代码到这里有两种情况
    // 1. 上面的for循环到结束，也没有找到ws <= 0的node，那就说明等待队列中没有需要唤醒的线程，方法执行结束
    // 2. 如果s不为空，代表找到ws <= 0的node，那就直接调用LockSupport.unpark()方法唤醒这个node持有的线程，方法执行结束
    if (s != null)
        LockSupport.unpark(s.thread);
}
```

上面分析的方法就是aqs类中，添加独占锁和共享锁的核心方法了，下面就列举一些其他方法，基本上都是返回一些状态值，下面直接看源码。

```java
// 返回有没有线程在排队等锁
public final boolean hasQueuedThreads() {
    return head != tail;
}
// 返回有没有竞争，因为aqs类的等待队列是在第一次出现竞争时初始化的，所以知道head不为空，就说明有竞争
public final boolean hasContended() {
    return head != null;
}
// 返回第一个排队的线程
public final Thread getFirstQueuedThread() {
    // handle only fast path, else relay
  	// 当头结点 == 尾节点时，说明没有线程排队
    return (head == tail) ? null : fullGetFirstQueuedThread();
}
private Thread fullGetFirstQueuedThread() {
  	// 一般情况下，头结点的后继节点就是第一个排队的线程，但是因为当前方法并没有加锁，所以在并发情况下，可能由于其他线程修改了头结点或者头结点的后继节点已经拿到锁出队了，导致head不对或者head.next.thread == null
    // 所以为了执行效率，这里直接先获取头结点的next节点判断了两次，如果符合条件，就直接返回s.thread
    Node h, s;
    Thread st;
    if (((h = head) != null && (s = h.next) != null &&
            s.prev == head && (st = s.thread) != null) ||
        ((h = head) != null && (s = h.next) != null &&
            s.prev == head && (st = s.thread) != null))
        return st;
		// 如果上面的if循环不符合条件，那代码执行到这里，
  	// 就会从尾节点循环向前遍历，直到玄幻结束后，返回第一个排队线程
    Node t = tail;
    Thread firstThread = null;
    while (t != null && t != head) {
        Thread tt = t.thread;
        if (tt != null)
            firstThread = tt;
        t = t.prev;
    }
    return firstThread;
}
// 判断传入的线程是否在排队
public final boolean isQueued(Thread thread) {
    if (thread == null)
        throw new NullPointerException();
    for (Node p = tail; p != null; p = p.prev)
        if (p.thread == thread)
            return true;
    return false;
}
// 返回所有正在排队的线程集合
public final Collection<Thread> getQueuedThreads() {
    ArrayList<Thread> list = new ArrayList<Thread>();
    for (Node p = tail; p != null; p = p.prev) {
        Thread t = p.thread;
        if (t != null)
            list.add(t);
    }
    return list;
}
// 返回所有正在排队等待获取独占锁的线程集合
public final Collection<Thread> getExclusiveQueuedThreads() {
    ArrayList<Thread> list = new ArrayList<Thread>();
    for (Node p = tail; p != null; p = p.prev) {
        if (!p.isShared()) {
            Thread t = p.thread;
            if (t != null)
                list.add(t);
        }
    }
    return list;
}
// 返回所有正在排队等待获取共享锁的线程集合
public final Collection<Thread> getSharedQueuedThreads() {
    ArrayList<Thread> list = new ArrayList<Thread>();
    for (Node p = tail; p != null; p = p.prev) {
        if (p.isShared()) {
            Thread t = p.thread;
            if (t != null)
                list.add(t);
        }
    }
    return list;
}
```

最后，看一下AQS类中的条件锁的实现逻辑。

### ConditionObject

**条件锁，Condition的实现类。**

```java
public class ConditionObject implements Condition, java.io.Serializable {
  private static final long serialVersionUID = 1173984872572414699L;
  /** First node of condition queue. */
  // 条件队列的头结点
  private transient Node firstWaiter;
  /** Last node of condition queue. */
  // 条件队列的尾结点
  private transient Node lastWaiter;
  // 构造方法
  public ConditionObject() { }

  // Internal methods
  // 
  private Node addConditionWaiter() {
    Node t = lastWaiter;
    // If lastWaiter is cancelled, clean out.
    if (t != null && t.waitStatus != Node.CONDITION) {
      unlinkCancelledWaiters();
      t = lastWaiter;
    }
    Node node = new Node(Thread.currentThread(), Node.CONDITION);
    if (t == null)
      firstWaiter = node;
    else
      t.nextWaiter = node;
    lastWaiter = node;
    return node;
  }
  // 
  private void doSignal(Node first) {
    do {
      if ( (firstWaiter = first.nextWaiter) == null)
        lastWaiter = null;
      first.nextWaiter = null;
    } while (!transferForSignal(first) &&
             (first = firstWaiter) != null);
  }
  // 
  private void doSignalAll(Node first) {
    lastWaiter = firstWaiter = null;
    do {
      Node next = first.nextWaiter;
      first.nextWaiter = null;
      transferForSignal(first);
      first = next;
    } while (first != null);
  }
  // 
  private void unlinkCancelledWaiters() {
    Node t = firstWaiter;
    Node trail = null;
    while (t != null) {
      Node next = t.nextWaiter;
      if (t.waitStatus != Node.CONDITION) {
        t.nextWaiter = null;
        if (trail == null)
          firstWaiter = next;
        else
          trail.nextWaiter = next;
        if (next == null)
          lastWaiter = trail;
      }
      else
        trail = t;
      t = next;
    }
  }

  // public methods
  // 
  public final void signal() {
    if (!isHeldExclusively())
      throw new IllegalMonitorStateException();
    Node first = firstWaiter;
    if (first != null)
      doSignal(first);
  }
  // 
  public final void signalAll() {
    if (!isHeldExclusively())
      throw new IllegalMonitorStateException();
    Node first = firstWaiter;
    if (first != null)
      doSignalAll(first);
  }
  // 
  public final void awaitUninterruptibly() {
    Node node = addConditionWaiter();
    int savedState = fullyRelease(node);
    boolean interrupted = false;
    while (!isOnSyncQueue(node)) {
      LockSupport.park(this);
      if (Thread.interrupted())
        interrupted = true;
    }
    if (acquireQueued(node, savedState) || interrupted)
      selfInterrupt();
  }

  /** Mode meaning to reinterrupt on exit from wait */
  private static final int REINTERRUPT =  1;
  /** Mode meaning to throw InterruptedException on exit from wait */
  private static final int THROW_IE    = -1;
  // 
  private int checkInterruptWhileWaiting(Node node) {
    return Thread.interrupted() ?
      (transferAfterCancelledWait(node) ? THROW_IE : REINTERRUPT) :
    0;
  }
  // 
  private void reportInterruptAfterWait(int interruptMode)
    throws InterruptedException {
    if (interruptMode == THROW_IE)
      throw new InterruptedException();
    else if (interruptMode == REINTERRUPT)
      selfInterrupt();
  }
  // 
  public final void await() throws InterruptedException {
    if (Thread.interrupted())
      throw new InterruptedException();
    Node node = addConditionWaiter();
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
      LockSupport.park(this);
      if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
        break;
    }
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
      interruptMode = REINTERRUPT;
    if (node.nextWaiter != null) // clean up if cancelled
      unlinkCancelledWaiters();
    if (interruptMode != 0)
      reportInterruptAfterWait(interruptMode);
  }
  // 
  public final long awaitNanos(long nanosTimeout)
    throws InterruptedException {
    if (Thread.interrupted())
      throw new InterruptedException();
    Node node = addConditionWaiter();
    int savedState = fullyRelease(node);
    final long deadline = System.nanoTime() + nanosTimeout;
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
      if (nanosTimeout <= 0L) {
        transferAfterCancelledWait(node);
        break;
      }
      if (nanosTimeout >= spinForTimeoutThreshold)
        LockSupport.parkNanos(this, nanosTimeout);
      if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
        break;
      nanosTimeout = deadline - System.nanoTime();
    }
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
      interruptMode = REINTERRUPT;
    if (node.nextWaiter != null)
      unlinkCancelledWaiters();
    if (interruptMode != 0)
      reportInterruptAfterWait(interruptMode);
    return deadline - System.nanoTime();
  }
  // 
  public final boolean awaitUntil(Date deadline)
    throws InterruptedException {
    long abstime = deadline.getTime();
    if (Thread.interrupted())
      throw new InterruptedException();
    Node node = addConditionWaiter();
    int savedState = fullyRelease(node);
    boolean timedout = false;
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
      if (System.currentTimeMillis() > abstime) {
        timedout = transferAfterCancelledWait(node);
        break;
      }
      LockSupport.parkUntil(this, abstime);
      if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
        break;
    }
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
      interruptMode = REINTERRUPT;
    if (node.nextWaiter != null)
      unlinkCancelledWaiters();
    if (interruptMode != 0)
      reportInterruptAfterWait(interruptMode);
    return !timedout;
  }
  // 
  public final boolean await(long time, TimeUnit unit)
    throws InterruptedException {
    long nanosTimeout = unit.toNanos(time);
    if (Thread.interrupted())
      throw new InterruptedException();
    Node node = addConditionWaiter();
    int savedState = fullyRelease(node);
    final long deadline = System.nanoTime() + nanosTimeout;
    boolean timedout = false;
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
      if (nanosTimeout <= 0L) {
        timedout = transferAfterCancelledWait(node);
        break;
      }
      if (nanosTimeout >= spinForTimeoutThreshold)
        LockSupport.parkNanos(this, nanosTimeout);
      if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
        break;
      nanosTimeout = deadline - System.nanoTime();
    }
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
      interruptMode = REINTERRUPT;
    if (node.nextWaiter != null)
      unlinkCancelledWaiters();
    if (interruptMode != 0)
      reportInterruptAfterWait(interruptMode);
    return !timedout;
  }
  //  support for instrumentation
  // 
  final boolean isOwnedBy(AbstractQueuedSynchronizer sync) {
    return sync == AbstractQueuedSynchronizer.this;
  }
  // 
  protected final boolean hasWaiters() {
    if (!isHeldExclusively())
      throw new IllegalMonitorStateException();
    for (Node w = firstWaiter; w != null; w = w.nextWaiter) {
      if (w.waitStatus == Node.CONDITION)
        return true;
    }
    return false;
  }
  // 
  protected final int getWaitQueueLength() {
    if (!isHeldExclusively())
      throw new IllegalMonitorStateException();
    int n = 0;
    for (Node w = firstWaiter; w != null; w = w.nextWaiter) {
      if (w.waitStatus == Node.CONDITION)
        ++n;
    }
    return n;
  }
  // 
  protected final Collection<Thread> getWaitingThreads() {
    if (!isHeldExclusively())
      throw new IllegalMonitorStateException();
    ArrayList<Thread> list = new ArrayList<Thread>();
    for (Node w = firstWaiter; w != null; w = w.nextWaiter) {
      if (w.waitStatus == Node.CONDITION) {
        Thread t = w.thread;
        if (t != null)
          list.add(t);
      }
    }
    return list;
  }

```

同样，在AQS类中，也提供了一些获取条件锁状态的方法，下面直接看源码。

```java
// 
final int fullyRelease(Node node) {
    boolean failed = true;
    try {
        int savedState = getState();
        if (release(savedState)) {
            failed = false;
            return savedState;
        } else {
            throw new IllegalMonitorStateException();
        }
    } finally {
        if (failed)
            node.waitStatus = Node.CANCELLED;
    }
}
// 
final boolean isOnSyncQueue(Node node) {
    if (node.waitStatus == Node.CONDITION || node.prev == null)
        return false;
    if (node.next != null) // If has successor, it must be on queue
        return true;
    /*
        * node.prev can be non-null, but not yet on queue because
        * the CAS to place it on queue can fail. So we have to
        * traverse from tail to make sure it actually made it.  It
        * will always be near the tail in calls to this method, and
        * unless the CAS failed (which is unlikely), it will be
        * there, so we hardly ever traverse much.
        */
    return findNodeFromTail(node);
}
// 
private boolean findNodeFromTail(Node node) {
    Node t = tail;
    for (;;) {
        if (t == node)
            return true;
        if (t == null)
            return false;
        t = t.prev;
    }
}
// 
final boolean transferForSignal(Node node) {
    /*
        * If cannot change waitStatus, the node has been cancelled.
        */
    if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
        return false;

    /*
        * Splice onto queue and try to set waitStatus of predecessor to
        * indicate that thread is (probably) waiting. If cancelled or
        * attempt to set waitStatus fails, wake up to resync (in which
        * case the waitStatus can be transiently and harmlessly wrong).
        */
    Node p = enq(node);
    int ws = p.waitStatus;
    if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
        LockSupport.unpark(node.thread);
    return true;
}
// 
final boolean transferAfterCancelledWait(Node node) {
    if (compareAndSetWaitStatus(node, Node.CONDITION, 0)) {
        enq(node);
        return true;
    }
    /*
        * If we lost out to a signal(), then we can't proceed
        * until it finishes its enq().  Cancelling during an
        * incomplete transfer is both rare and transient, so just
        * spin.
        */
    while (!isOnSyncQueue(node))
        Thread.yield();
    return false;
}
// 
public final boolean owns(ConditionObject condition) {
    return condition.isOwnedBy(this);
}
// 
public final boolean hasWaiters(ConditionObject condition) {
    if (!owns(condition))
        throw new IllegalArgumentException("Not owner");
    return condition.hasWaiters();
}
//
public final int getWaitQueueLength(ConditionObject condition) {
    if (!owns(condition))
        throw new IllegalArgumentException("Not owner");
    return condition.getWaitQueueLength();
}
// 
public final Collection<Thread> getWaitingThreads(ConditionObject condition) {
    if (!owns(condition))
        throw new IllegalArgumentException("Not owner");
    return condition.getWaitingThreads();
}
```

OK，到这里，就已经把AQS类的源码分析完成了。

## 总结

1. AQS类是JUC并发包下的核心类，大部分加锁逻辑都是由它来实现的；
2. 代码中使用了模板方法模式，将加锁的主要流程放在AQS类中处理，将是否加锁成功的判断交由子类实现；
3. Condition条件锁现在也只有AQS类中的ConditionObject这一个可用的实现类；
