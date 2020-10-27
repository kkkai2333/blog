# ReentrantReadWriteLock

**可重入读写锁**

## 源码分析

**ReentrantReadWriteLock比ReentrantLock要复杂的多的多，建议先看一下[ReentrantLock](./ReentrantLock.md)的分析，做好心里准备吧。**

先明确几个名词，在本文中，

1. 读锁 == 共享锁
2. 写锁 == 独占锁
3. 重入次数 == 加锁次数

首先，ReentrantReadWriteLock和ReentrantLock一样，分别定义了Sync、FairSync、NoFairSync三个内部类，下面直接看源码进行分析。

### Sync

和ReentrantLock.Sync一样，ReentrantReadWriteLock的Sync类也继承[AQS](./aqs.md)类。

```java
// 首先要明确，Sync通过把父类的state属性拆分，高16位表示读锁的count，低16位表示写锁的count
abstract static class Sync extends AbstractQueuedSynchronizer {
    private static final long serialVersionUID = 6317671515068378041L;
  	// 共享锁移位的值，16位
    static final int SHARED_SHIFT   = 16;
    // 共享锁单元，
    // 共享锁每重入一次，则需要将state+SHARED_UNIT，
    // 共享锁每释放一次，则需要将state-SHARED_UNIT，
    /** 举例，
     * 当state=0时，二进制表示为：00000000 00000000 00000000 00000000
     * 如果此时要加一个读锁，是不是要把二进制的第16位变成1，也就是：00000000 00000001 00000000 00000000
     * 那如何让00000000 00000000 00000000 00000000 -> 00000000 00000001 00000000 00000000
     * 是不是只要进行下面的操作就可以了。
     * 00000000 00000000 00000000 00000000 + 00000000 00000001 00000000 00000000
     * 而 (1 << 16) == 00000000 00000001 00000000 00000000
     * 仔细品品。
     */
    static final int SHARED_UNIT    = (1 << SHARED_SHIFT);
    // 两种锁的最大可重入次数，也就是2^16-1
    static final int MAX_COUNT      = (1 << SHARED_SHIFT) - 1;
    // 独占锁的掩码，其实就是定义了一个高16位全都为0，低16位全为1的int变量。
    // 下面计算独占锁的重入次数时，通过与运算，得到state的低16位的值
    // 00000000 00000000 11111111 11111111
    static final int EXCLUSIVE_MASK = (1 << SHARED_SHIFT) - 1;
    /** Returns the number of shared holds represented in count  */
    // 将c无符号右移16位，高位补0，得到state的高16位的值，也就是读锁的重入次数
    static int sharedCount(int c)    { return c >>> SHARED_SHIFT; }
    /** Returns the number of exclusive holds represented in count  */
    // 将c和上面定义的独占锁掩码进行与运算，得到state的低16位的值，也就是写锁的重入次数
    static int exclusiveCount(int c) { return c & EXCLUSIVE_MASK; }
    // sync内部类，定义了一个count计数器来保存每个线程自己持有的读锁的重入次数
    static final class HoldCounter {
        int count = 0;
        // Use id, not reference, to avoid garbage retention
        final long tid = getThreadId(Thread.currentThread());
    }
    // 继承了ThreadLocal，代表是线程间独立的
    static final class ThreadLocalHoldCounter
        extends ThreadLocal<HoldCounter> {
        public HoldCounter initialValue() {
            return new HoldCounter();
        }
    }
    // 保存当前线程持有的读锁的重入次数
    private transient ThreadLocalHoldCounter readHolds;
    // 
    private transient HoldCounter cachedHoldCounter;
    // 第一个加读锁的线程
    private transient Thread firstReader = null;
    // 第一个加读锁的线程的重入次数
    private transient int firstReaderHoldCount;
    // 默认构造方法，初始化了线程间独立的readHolds变量
    Sync() {
        readHolds = new ThreadLocalHoldCounter();
        setState(getState()); // ensures visibility of readHolds
    }
    // 加读锁时要不要阻塞，交给子类实现
    abstract boolean readerShouldBlock();
    // 加写锁时要不要阻塞，交给子类实现
    abstract boolean writerShouldBlock();
    // 独占锁释放
    protected final boolean tryRelease(int releases) {
      	// 如果当前线程不是持有写锁的线程，那么直接抛出异常
        if (!isHeldExclusively())
            throw new IllegalMonitorStateException();
      	// 到这里，可以知道，的确是当前线程持有写锁
      	// 然后，将当前的同步属性state的值-releases，一般情况下，releases=1
        int nextc = getState() - releases;
      	// 这里做了一次判断，如果发现nextc的低16位的值为0，那就说明当前写锁全部释放了
        boolean free = exclusiveCount(nextc) == 0;
        if (free)
          	// 就需要把当前持有独占锁的变量设置为null
            setExclusiveOwnerThread(null);
      	// 将nextc的值赋值给同步属性state
        setState(nextc);
        // 这里又两种情况
      	// 1. 返回true，写锁全部释放，当前已经没有写锁了
      	// 2. 返回false，本次写锁释放成功，但是当前线程还持有额外的写锁。注：因为写锁是可重入锁
        return free;
    }
    // 独占锁加锁
    protected final boolean tryAcquire(int acquires) {
        /*
         * Walkthrough:
         * 1. If read count nonzero or write count nonzero
         *    and owner is a different thread, fail.
         * 2. If count would saturate, fail. (This can only
         *    happen if count is already nonzero.)
         * 3. Otherwise, this thread is eligible for lock if
         *    it is either a reentrant acquire or
         *    queue policy allows it. If so, update state
         *    and set owner.
         */
        /*
         * tryAcquire方法的执行逻辑如下，
         * 1. 如果是下面两种情况，则，加锁失败；
         * 1.1. 读锁数量不为0，读写互斥，返回false
         * 1.2. 写锁数量不为0，但并不是当前线程持有写锁，写写互斥，返回false
         * 2. 如果判断写锁数量已经达到上限，则，加锁失败；
         * 3. 如果是下面两种情况，则，加写锁；
         * 3.1. 当前先是重入获取写锁，代表线程已经持有了写锁，那就直接修改同步属性state的值
         * 3.2. 当前线程加写锁不需要阻塞，那就调用cas方法更新同步属性state的值
         * 3.2.1. 如果当前线程加写锁需要阻塞，返回false
         * 3.2.2. 如果cas加锁失败，返回false
         * 3.2.3. 如果cas加锁成功，则设置当前线程为持有独占锁的线程
         */
        // 得到当前线程
        Thread current = Thread.currentThread();
        // 获取当前同步属性state的值
        int c = getState();
        // 获取当前的写锁的数量
        int w = exclusiveCount(c);
        // 如果c != 0，代表当前有线程持有锁
        if (c != 0) {
            // (Note: if c != 0 and w == 0 then shared count != 0)
            // 这里对应两种情况
            // 1. 写锁数量为0，代表有线程持有读锁，读写互斥，加锁失败，返回false
            // 2. 写锁数量不为0，代表有线程持有写锁，那么，
            // 2.1. 如果当前线程不是持有写锁的线程，写写互斥，加锁失败，返回false
            // 2.2. 如果当前线程是持有写锁的线程，代码继续向下执行
            if (w == 0 || current != getExclusiveOwnerThread())
                return false;
            // 如果w+exclusiveCount(acquires)大于最大写锁数量，则抛出一个错误
            if (w + exclusiveCount(acquires) > MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
            // Reentrant acquire
            // 由于当前线程已经持有了写锁，写锁是独占锁，
            // 所以调用setState()方法不会冲突，这里就直接更新了同步属性state的值
            setState(c + acquires);
            // 加锁成功，返回true
            return true;
        }
        // 代码执行到这里，代表c == 0，即现在是无锁状态，那么，
        // 如果，1. 当前加写锁需要阻塞；2. cas更新同步属性state失败，加锁失败，返回false
        if (writerShouldBlock() ||
            !compareAndSetState(c, c + acquires))
            return false;
        // 代码执行到这里，代表加锁成功，那么就把当前线程设置为持有独占锁的线程
        setExclusiveOwnerThread(current);
        // 加锁成功，返回true
        return true;
    }
    // 共享锁释放
    protected final boolean tryReleaseShared(int unused) {
      	// 拿到当前线程
        Thread current = Thread.currentThread();
        if (firstReader == current) {
          	// 如果当前线程是第一个加读锁的线程
          	// 1. 当前线程只持有一个读锁了，那就把firstReader置空
          	// 2. 否则，firstReaderHoldCount--，代表释放了1次读锁
            // assert firstReaderHoldCount > 0;
            if (firstReaderHoldCount == 1)
                firstReader = null;
            else
                firstReaderHoldCount--;
        } else {
          	// 如果当前线程不是第一个加读锁的线程
          	// 1. 从threadLocal中拿到当前线程持有的读锁重入计数器，如果拿不到就初始化一个
          	// 		1.1. 这里需要注意，正常情况下，rh肯定不为空，因为在申请加锁的时候已经初始化过了
          	// 		1.2. 如果rh=null，说明现在调用者的代码有问题，在没有加过读锁的情况下去释放读锁
            HoldCounter rh = cachedHoldCounter;
            if (rh == null || rh.tid != getThreadId(current))
                rh = readHolds.get();
            int count = rh.count;
            if (count <= 1) {
              	// count <= 1，代表当前线程至多持有一个读锁，也可能没有，即count == 0
              	// 移除当前线程持有的threadLocal的引用
                readHolds.remove();
              	// 如果count == 0，那就得抛出异常了，因为这不是正常的加解锁。
                if (count <= 0)
                    throw unmatchedUnlockException();
            }
          	// 然后count-1
            --rh.count;
        }
      	// 代码执行到这里，代表当前线程肯定已经释放了一次读锁，所以AQS类的同步属性state的高16位需要-1
        for (;;) {
          	// 外层是个死循环，代表这里更新同步属性state必须成功
            int c = getState();
          	// 将state - SHARED_UNIT赋值给nextc，
          	// 然后一直循环调用compareAndSetState()方法去更新同步属性state，直到更新成功
            int nextc = c - SHARED_UNIT;
            if (compareAndSetState(c, nextc))
                // Releasing the read lock has no effect on readers,
                // but it may allow waiting writers to proceed if
                // both read and write locks are now free.
              	// 更新state成功后，代码执行到这里，为什么是判断nextc == 0呢，仔细思考下
              	// 由于读写互斥，而当前方法又是释放读锁的方法，这说明，
              	// 1. 现在没有线程持有写锁，即state的低16位 == 0，那么，
              	// 		1.1. 如果nextc == 0，返回true，代表当前读写锁全部释放了，已经没有无锁了
              	// 		1.2. 如果nextc != 0，返回false，代表只是本次读锁释放成功了
              	// 2. 当前线程持有写锁，state的低16位 != 0，那么，
              	// 		2.1. nextc != 0，返回false，代表只是本次读锁释放成功了
                return nextc == 0;
        }
    }
    // 定义了一个默认的异常，当有线程去释放读锁，但是它又没持有读锁，会抛出
    private IllegalMonitorStateException unmatchedUnlockException() {
        return new IllegalMonitorStateException(
            "attempt to unlock read lock, not locked by current thread");
    }
    // 共享锁加锁
    protected final int tryAcquireShared(int unused) {
        /*
         * Walkthrough:
         * 1. If write lock held by another thread, fail.
         * 2. Otherwise, this thread is eligible for
         *    lock wrt state, so ask if it should block
         *    because of queue policy. If not, try
         *    to grant by CASing state and updating count.
         *    Note that step does not check for reentrant
         *    acquires, which is postponed to full version
         *    to avoid having to check hold count in
         *    the more typical non-reentrant case.
         * 3. If step 2 fails either because thread
         *    apparently not eligible or CAS fails or count
         *    saturated, chain to version with full retry loop.
         */
        /**
         * tryAcquireShared方法的执行逻辑如下，
         * 1. 如果有其他线程持有写锁，则加锁失败，返回-1
         * 2.1. 判断当前线程加读锁是否需要阻塞
         * 2.2. 读锁数量还没有达到上限
         * 2.3. 调用cas方法更新同步属性state的值，尝试加读锁
         * 2.4. 如果加锁成功，把当前线程对应的HoldCounter对象的count+1
         * 3. 如果第二步失败，则调用带有循环的全力加锁方法fullTryAcquireShared()
         */
        // 拿到当前线程
        Thread current = Thread.currentThread();
        // 获取同步属性state的值
        int c = getState();
        // 判断，如果当前有线程持有写锁，并且不是当前线程，则加锁失败，返回-1
        if (exclusiveCount(c) != 0 &&
            getExclusiveOwnerThread() != current)
            return -1;
        // 获取当前读锁的重入次数
        int r = sharedCount(c);
        // 如果，1. 加读锁不需要阻塞；2. 读锁的个数没超过上限；3. cas更新同步属性state的值成功，则
        // 进入if代码块
        if (!readerShouldBlock() &&
            r < MAX_COUNT &&
            compareAndSetState(c, c + SHARED_UNIT)) {
            // 加锁成功后，
            if (r == 0) {
                // 如果原本的读锁的数量是0
                // 代表当前线程是第一个加读锁的线程，那就把这个线程赋值给firstReader，
                // 然后给firstReaderHoldCount赋值1
                firstReader = current;
                firstReaderHoldCount = 1;
            } else if (firstReader == current) {
                // 当前线程是第一个加读锁的线程，现在是该线程又加了一个读锁，直接firstReaderHoldCount+1
                firstReaderHoldCount++;
            } else {
                 // 当前线程不是第一个加读锁的线程，那么就把该线程对应的HoldCounter对象（如果没有，就初始化一个）的属性count+1
                HoldCounter rh = cachedHoldCounter;
                if (rh == null || rh.tid != getThreadId(current))
                    // 如果rh还等于空，或者cached这个HoldCounter对象不是当前线程的HoldCounter，
                    // 那就从threadLocal获取属于当前线程的HoldCounter对象
                    cachedHoldCounter = rh = readHolds.get();
                else if (rh.count == 0)
                    readHolds.set(rh);
                rh.count++;
            }
            // 加锁成功，返回1
            return 1;
        }
        // 代码执行到这里，还没有加锁成功，大概率是因为，
        // 1. 判断到当前线程加读锁需要阻塞
        // 2. cas更新同步属性state的值失败
        // 3. 读锁已经达到上限
        // 那么就调用fullTryAcquireShared()方法，准备全力尝试添加读锁，加锁成功返回1，加锁失败返回-1
        return fullTryAcquireShared(current);
    }
    // 全力尝试添加读锁
    final int fullTryAcquireShared(Thread current) {
        /*
         * This code is in part redundant with that in
         * tryAcquireShared but is simpler overall by not
         * complicating tryAcquireShared with interactions between
         * retries and lazily reading hold counts.
         */
        // 这个方法和tryAcquireShared()差不多，相当于是死循环版本的tryAcquireShared()
        HoldCounter rh = null;
        for (;;) {
            // 获取当前同步属性的state的值
            int c = getState();
            // 判断当前是否有线程持有写锁
            if (exclusiveCount(c) != 0) {
                // 如果当前有线程持有写锁，判断持有写锁的线程是不是当前线程
                if (getExclusiveOwnerThread() != current)
                    // 如果不是，返回-1，方法执行结束
                    return -1;
                // ？问题1 - 这里没理解
                // 否则，当前线程会持有一个写锁，在这里阻塞会导致死锁
                // else we hold the exclusive lock; blocking here
                // would cause deadlock.
            } else if (readerShouldBlock()) {
                // 代码执行到这里，代表当前没有写锁，然后读锁需要阻塞
                // Make sure we're not acquiring read lock reentrantly
                if (firstReader == current) {
                    // assert firstReaderHoldCount > 0;
                } else {
                    // 如果当前线程不是第一个加读锁的线程，那么就判断下当前线程持有的HoldCounter对象的count的值
                    if (rh == null) {
                        rh = cachedHoldCounter;
                        if (rh == null || rh.tid != getThreadId(current)) {
                            // 如果rh还等于空，或者cached这个HoldCounter对象不是当前线程的HoldCounter，
                            // 那就从threadLocal获取属于当前线程的HoldCounter对象
                            rh = readHolds.get();
                            if (rh.count == 0)
                                readHolds.remove();
                        }
                    }
                    // 如果当前线程对应的HoldCounter对象的count == 0，则返回-1
                    if (rh.count == 0)
                        return -1;
                }
            }
            // 如果读锁的重入次数达到最大值，抛出错误
            if (sharedCount(c) == MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
            // 调用AQS类的compareAndSetState()方法，更新同步属性state的值，尝试加读锁
            // 这里有一个细节，
            // 可以看到，最外层的是一个死循环，那就代表说，
            // 如果，1. 一直没有写锁；2. 当前加读锁不需要阻塞；3. 读锁数量没有达到上限
            // 则会一直在循环中调用cas方法更新state添加读锁，直到加锁成功（所以此方法名称为：全力添加读锁）
            if (compareAndSetState(c, c + SHARED_UNIT)) {
                // 加锁成功后，如果原本的读锁的数量是0
                if (sharedCount(c) == 0) {
                    // 代表当前线程是第一个加读锁的线程，那就把这个线程赋值给firstReader，
                    // 然后给firstReaderHoldCount赋值1
                    firstReader = current;
                    firstReaderHoldCount = 1;
                } else if (firstReader == current) {
                    // 当前线程是第一个加读锁的线程，现在是该线程又加了一个读锁，直接firstReaderHoldCount+1
                    firstReaderHoldCount++;
                } else {
                    // 当前线程不是第一个加读锁的线程，那么就把该线程对应的HoldCounter对象（如果没有，就初始化一个）的属性count+1
                    if (rh == null)
                        rh = cachedHoldCounter;
                    if (rh == null || rh.tid != getThreadId(current))
                        // 如果rh还等于空，或者cached这个HoldCounter对象不是当前线程的HoldCounter，
                        // 那就从threadLocal获取属于当前线程的HoldCounter对象
                        rh = readHolds.get();
                    else if (rh.count == 0)
                        readHolds.set(rh);
                    rh.count++;
                    cachedHoldCounter = rh; // cache for release
                }
                // 加锁成功，返回1
                return 1;
            }
        }
    }
    // 尝试加写锁，如果加锁失败，则返回false，不阻塞
    final boolean tryWriteLock() {
        // 拿到当前线程
        Thread current = Thread.currentThread();
        // 拿到当前同步属性state的值
        int c = getState();
        // 当c != 0时，代表有线程持有锁
        if (c != 0) {
            // 根据获取当前写锁的加锁次数
            int w = exclusiveCount(c);
            // 这里分为两种情况
            // 1. w == 0，代表当前有线程持有读锁，读写互斥，加锁失败，直接返回false；
            // 2. w != 0，代表当前有线程持有写锁，也说明当前只有写锁，因为读写互斥，然后进一步判断，发现当前线程并不是是持有写锁的线程，加锁失败，直接返回false。
            if (w == 0 || current != getExclusiveOwnerThread())
                return false;
            // 代码执行到这里，说明当前只有写锁，并且是当前线程持有写锁
            // 那就判断w的值，如果已经等于可重入的最大值，就不能再加锁了，所以需要抛出一个错误
            if (w == MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
        }
      	// 代码执行到这里，说明当前没有线程持有锁，那么直接调用AQS类的cas方法，原子更新state的值，尝试添加写锁
        if (!compareAndSetState(c, c + 1))
            // 如果加锁失败，返回false
            return false;
        // 代码执行到这里，代表当前线程添加写锁成功，那就把这个线程设置为当前持有独占锁的线程
        setExclusiveOwnerThread(current);
        // 最后，加锁成功，返回true
        return true;
    }
    // 尝试加读锁，如果加锁失败，则返回false，不阻塞
    final boolean tryReadLock() {
        // 拿到当前线程
        Thread current = Thread.currentThread();
        for (;;) {
            // 拿到当前同步属性state的值
            int c = getState();
            // 这里分两种情况
          	// 1. 判断现在是否有线程持有写锁，
            //		1.1. 如果没有，代码向下执行
            // 2. 如果有，进一步判断，持有写锁的线程是不是当前线程，
          	//		2.1. 如果是，代码向下执行
          	//		2.1. 如果不是，代表有其他线程持有写锁，读写互斥，加锁失败，直接返回false
            if (exclusiveCount(c) != 0 &&
                getExclusiveOwnerThread() != current)
                return false;
          	// 拿到当前读锁的加锁次数
            int r = sharedCount(c);
          	// 如果读锁的加锁次数已经达到最大值，直接抛出错误
            if (r == MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
          	// 代码执行到这里，代表现在可以添加读锁，
          	// 于是直接调用AQS类的cas方法，原子更新state的值，尝试添加读锁。
          	// 至于，为什么是用c + SHARED_UNIT来更新state，请参考上文对SHARED_UNIT常量的分析。
            // 而且这里还有一个细节，
          	// 可以看到，代码的最外层是一个死循环，也就是说，如果上面代码的判断一直都不满足，
          	// 当前方法会一直循环，然后一直调用compareAndSetState方法，保证加读锁成功
            if (compareAndSetState(c, c + SHARED_UNIT)) {
                // 加读锁成功后，有一些额外的操作
                // 如果r == 0，代表当前线程是第一个添加读锁的线程
                if (r == 0) {
                  	// 那就把这个线程保存一下
                    firstReader = current;
                  	// 并且把firstReaderHoldCount+1
                    firstReaderHoldCount = 1;
                } else if (firstReader == current) {
                  	// 如果r != 0，代表已经有读锁了，那就判断一下当前线程是不是第一个加读锁的线程，
                  	// 如果是，那就代表现在是第一个加读锁的线程又加了一次读锁，
                  	// 就直接把firstReaderHoldCount+1
                    firstReaderHoldCount++;
                } else {
                    // 如果上面条件都不满足，那就代表当前是一个（非首个加读锁的）线程尝试加读锁
                    // 那就直接获取当前线程持有的HoldCounter的对象，获取不到就初始化一个
                  	// 然后把其中的计数器count+1
                    HoldCounter rh = cachedHoldCounter;
                    if (rh == null || rh.tid != getThreadId(current))
                        cachedHoldCounter = rh = readHolds.get();
                    else if (rh.count == 0)
                        readHolds.set(rh);
                    rh.count++;
                }
                // 最后，加读锁成功，返回true
                return true;
            }
        }
    }
    // 判断当前线程是不是持有独占锁的线程
    protected final boolean isHeldExclusively() {
        // While we must in general read state before owner,
        // we don't need to do so to check if current thread is owner
        return getExclusiveOwnerThread() == Thread.currentThread();
    }
    // Methods relayed to outer class
    // 返回一个条件锁对象
    final ConditionObject newCondition() {
        return new ConditionObject();
    }
    // 返回当前持有独占锁的线程
    final Thread getOwner() {
        // Must read state before owner to ensure memory consistency
        return ((exclusiveCount(getState()) == 0) ?
                null :
                getExclusiveOwnerThread());
    }
    // 返回当前读锁的重入次数
    final int getReadLockCount() {
        return sharedCount(getState());
    }
    // 返回当前有没有线程持有独占锁
    final boolean isWriteLocked() {
        return exclusiveCount(getState()) != 0;
    }
    // 返回当前持有独占锁的重入次数
    final int getWriteHoldCount() {
        return isHeldExclusively() ? exclusiveCount(getState()) : 0;
    }
    // 返回当前线程持有的读锁的重入次数
    final int getReadHoldCount() {
        if (getReadLockCount() == 0)
            return 0;

        Thread current = Thread.currentThread();
        if (firstReader == current)
            return firstReaderHoldCount;

        HoldCounter rh = cachedHoldCounter;
        if (rh != null && rh.tid == getThreadId(current))
            return rh.count;

        int count = readHolds.get().count;
        if (count == 0) readHolds.remove();
        return count;
    }
    // 定义了一个反序列化时会调用的方法，将当前对象设置为无锁状态
    private void readObject(java.io.ObjectInputStream s)
        throws java.io.IOException, ClassNotFoundException {
        s.defaultReadObject();
        readHolds = new ThreadLocalHoldCounter();
        setState(0); // reset to unlocked state
    }
    // 返回当前读锁和写锁一共的重入次数，也就是AQS类的同步属性state的值
    final int getCount() { return getState(); }
}
```

### FairSync

```java
// 公平锁子类
static final class FairSync extends Sync {
    private static final long serialVersionUID = -2274990926593161451L;
    // 公平锁的判断比较简单，读锁、写锁是否需要阻塞，都调用了AQS类的hasQueuedPredecessors()方法
    // hasQueuedPredecessors()方法的详细分析请查看AQS类分析的那篇文章
    final boolean writerShouldBlock() {
      return hasQueuedPredecessors();
    }
    final boolean readerShouldBlock() {
      return hasQueuedPredecessors();
    }
}
```

### NoFairSync

```java
// 非公平锁子类
static final class NonfairSync extends Sync {
    private static final long serialVersionUID = -8159625535654395037L;
    // 非公平锁的写锁，不需要阻塞
    final boolean writerShouldBlock() {
      return false; // writers can always barge
    }
    // 非公平锁的读锁是否要阻塞，是调用了AQS类的apparentlyFirstQueuedIsExclusive()方法进行判断的，
  	// apparentlyFirstQueuedIsExclusive()方法的详细分析请查看AQS类分析的那篇文章
  	/**  
		 * apparentlyFirstQueuedIsExclusive()方法的大致意思是：
     * 如果，1. 等待队列的第一个等待线程不为空；2.这个等待线程要加是独占锁，那就返回true，代表需要阻塞。
     * 
     * 这个方法，实际上是为了避免写锁线程一直等待拿不到锁；场景如下，
     * 假设当前第一个排队的线程是等待写锁，然后来了一个读锁，
     * 那么即便是初始化的非公平的读写锁，这个读锁也必须去排队，而不能直接抢锁。
     */
    final boolean readerShouldBlock() {
      /* As a heuristic to avoid indefinite writer starvation,
               * block if the thread that momentarily appears to be head
               * of queue, if one exists, is a waiting writer.  This is
               * only a probabilistic effect since a new reader will not
               * block if there is a waiting writer behind other enabled
               * readers that have not yet drained from the queue.
               */
      return apparentlyFirstQueuedIsExclusive();
    }
}
```

然后，ReentrantReadWriteLock还定义了两个Lock接口的内部实现类，一个读锁，一个写锁，分别是ReadLock和WriteLock。这两个实现类都持有一个Sync的实例属性，下面直接看源码进行分析。

### ReadLock

```java
public static class ReadLock implements Lock, java.io.Serializable {
    private static final long serialVersionUID = -5992448646407690164L;
    // 内部持有一个Sync的属性变量
    private final Sync sync;
    // 初始化读锁
    protected ReadLock(ReentrantReadWriteLock lock) {
        sync = lock.sync;
    }
    // 尝试添加读锁，如果第一次加锁失败之后，会进入等待队列，不响应中断
    public void lock() {
        sync.acquireShared(1);
    }
    // 尝试添加读锁，如果第一次加锁失败之后，会进入等待队列，可响应中断
    public void lockInterruptibly() throws InterruptedException {
        sync.acquireSharedInterruptibly(1);
    }
    // 尝试添加读锁，如果第一次添加失败之后，直接返回false，不阻塞
    public boolean tryLock() {
        return sync.tryReadLock();
    }
    // 尝试添加读锁，如果第一次加锁失败之后，会进入等待队列，超时后会返回false，可响应中断
    public boolean tryLock(long timeout, TimeUnit unit)
            throws InterruptedException {
        return sync.tryAcquireSharedNanos(1, unit.toNanos(timeout));
    }
    // 释放读锁
    public void unlock() {
        // 调用sync的releaseShared()方法，独占锁释放
        sync.releaseShared(1);
    }
    // 读锁不支持条件锁，直接抛出异常
    public Condition newCondition() {
        throw new UnsupportedOperationException();
    }
    // 重写了toString方法，返回了当前读锁的重入次数
    public String toString() {
        int r = sync.getReadLockCount();
        return super.toString() +
            "[Read locks = " + r + "]";
    }
}
```

### WriteLock

```java
public static class WriteLock implements Lock, java.io.Serializable {
    private static final long serialVersionUID = -4992448646407690164L;
    private final Sync sync;
    // 初始化写锁
    protected WriteLock(ReentrantReadWriteLock lock) {
        sync = lock.sync;
    }
    // 添加写锁，如果第一次添加失败之后，会进入等待队列，不响应中断
    public void lock() {
        // 调用sync的release()方法，独占锁加锁
        sync.acquire(1);
    }
    // 添加写锁，如果第一次添加失败之后，会进入等待队列，可响应中断
    public void lockInterruptibly() throws InterruptedException {
        // 默认是调用了AQS类的acquireInterruptibly()方法
        // 关于acquireInterruptibly()方法的分析，请参考AQS类分析的文章
        sync.acquireInterruptibly(1);
    }
    // 尝试加写锁，如果第一次加锁失败，直接返回false，不阻塞
    public boolean tryLock( ) {
        // 调用sync的tryWriteLock()方法，尝试添加写锁
        return sync.tryWriteLock();
    }
    // 尝试加写锁，如果第一次加锁失败之后，会进入等待队列，超时后会返回false，可响应中断
    public boolean tryLock(long timeout, TimeUnit unit)
            throws InterruptedException {
        return sync.tryAcquireNanos(1, unit.toNanos(timeout));
    }
    // 释放写锁
    public void unlock() {
        // 调用sync的release()方法，独占锁释放
        sync.release(1);
    }
    // 写锁获取条件锁，直接调用sync的newCondition()方法，返回一个条件锁
    public Condition newCondition() {
        return sync.newCondition();
    }
    // 重写了toString方法，返回了当前持有读锁的线程名称
    public String toString() {
        Thread o = sync.getOwner();
        return super.toString() + ((o == null) ?
                                   "[Unlocked]" :
                                   "[Locked by thread " + o.getName() + "]");
    }
    // 返回当前线程是不是持有写锁
    public boolean isHeldByCurrentThread() {
        return sync.isHeldExclusively();
    }
    // 返回当前写锁的重入次数
    public int getHoldCount() {
        return sync.getWriteHoldCount();
    }
}
```

最后，再来看下ReentrantReadWriteLock自身提供的主要方法。

### ReentrantReadWriteLock

```java
public class ReentrantReadWriteLock
        implements ReadWriteLock, java.io.Serializable {
    private static final long serialVersionUID = -6992448646407690164L;
    /** Inner class providing readlock */
    // 读锁变量
    private final ReentrantReadWriteLock.ReadLock readerLock;
    /** Inner class providing writelock */
  	// 写锁变量
    private final ReentrantReadWriteLock.WriteLock writerLock;
    /** Performs all synchronization mechanics */
    final Sync sync;
    // 默认初始化为非公平锁
    public ReentrantReadWriteLock() {
        this(false);
    }
    // 可以传入true来初始化一个公平锁
    public ReentrantReadWriteLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
        readerLock = new ReadLock(this);
        writerLock = new WriteLock(this);
    }
    // ReadWriteLock接口的实现，返回一个写锁
    public ReentrantReadWriteLock.WriteLock writeLock() { return writerLock; }
    // ReadWriteLock接口的实现，返回一个读锁
    public ReentrantReadWriteLock.ReadLock  readLock()  { return readerLock; }

    // Instrumentation and status
    // 返回当前是不是公平锁
    public final boolean isFair() {
        return sync instanceof FairSync;
    }
    // 返回当前持有写锁的线程
    protected Thread getOwner() {
        return sync.getOwner();
    }
    // 返回当前读锁的重入次数
    public int getReadLockCount() {
        return sync.getReadLockCount();
    }
    // 返回当前是否有线程持有写锁
    public boolean isWriteLocked() {
        return sync.isWriteLocked();
    }
    // 返回是否是当前线程持有写锁
    public boolean isWriteLockedByCurrentThread() {
        return sync.isHeldExclusively();
    }
    // 返回当前写锁的重入次数
    public int getWriteHoldCount() {
        return sync.getWriteHoldCount();
    }
    // 返回当前线程持有的读锁的重入次数
    public int getReadHoldCount() {
        return sync.getReadHoldCount();
    }
    // 返回当前等待队列中要获取写锁的所有线程的集合
    protected Collection<Thread> getQueuedWriterThreads() {
        return sync.getExclusiveQueuedThreads();
    }
    // 返回当前等待队列中要获取读锁的所有线程的集合
    protected Collection<Thread> getQueuedReaderThreads() {
        return sync.getSharedQueuedThreads();
    }
    // 返回当前等待队列中是否有线程在等待获取锁
    public final boolean hasQueuedThreads() {
        return sync.hasQueuedThreads();
    }
    // 返回当前线程是否在等待队列中排队
    public final boolean hasQueuedThread(Thread thread) {
        return sync.isQueued(thread);
    }
    // 返回当前等待队列的长度
    public final int getQueueLength() {
        return sync.getQueueLength();
    }
    // 返回当前等待队列中的所有线程的集合
    protected Collection<Thread> getQueuedThreads() {
        return sync.getQueuedThreads();
    }
    // 返回condition的条件队列是否有线程在等待获取锁
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
    // 重写了toString方法，返回了读锁和写锁的数量
    public String toString() {
        int c = sync.getCount();
        int w = Sync.exclusiveCount(c);
        int r = Sync.sharedCount(c);

        return super.toString() +
            "[Write locks = " + w + ", Read locks = " + r + "]";
    }
    // 
    static final long getThreadId(Thread thread) {
        return UNSAFE.getLongVolatile(thread, TID_OFFSET);
    }
    // Unsafe mechanics
    // 定义了一个Unsafe的常量
    private static final sun.misc.Unsafe UNSAFE;
    // 定义了一个属性，保存当前线程的tid属性相对于线程对象的偏移量
    private static final long TID_OFFSET;
    static {
        try {
            UNSAFE = sun.misc.Unsafe.getUnsafe();
            Class<?> tk = Thread.class;
            TID_OFFSET = UNSAFE.objectFieldOffset
                (tk.getDeclaredField("tid"));
        } catch (Exception e) {
            throw new Error(e);
        }
    }
}
```

上文中有部分方法是在AQS类中实现的，这里做一下标注，可点击跳转，查看源码分析。

1. [AbstractQueuedSynchronizer#compareAndSetState](./aqs.md#compareAndSet)
2. [AbstractQueuedSynchronizer#hasQueuedPredecessors](./aqs.md#hasQueuedPredecessors)
3. [AbstractQueuedSynchronizer#apparentlyFirstQueuedIsExclusive](./aqs.md#apparentlyFirstQueuedIsExclusive)
4. [AbstractQueuedSynchronizer#acquire](./aqs.md#acquire)
5. [AbstractQueuedSynchronizer#acquireInterruptibly](./aqs.md#acquireInterruptibly)
6. [AbstractQueuedSynchronizer#acquireShared](./aqs.md#acquireShared)
7. [AbstractQueuedSynchronizer#acquireSharedInterruptibly](./aqs.md#acquireSharedInterruptibly)

## 总结

1. ReentrantReadWriteLock没有实现Lock，而是持有了两个Lock的实现类的实例属性，分别是ReentrantReadWriteLock.ReadLock和ReentrantReadWriteLock.WriteLock。
2. ReentrantReadWriteLock的读锁是共享锁，写锁是互斥锁。读读不互斥，读写互斥，写写互斥。
3. ReentrantReadWriteLock是可重入锁。
4. ReentrantReadWriteLock默认是非公平锁，可以在调用构造方法时传入true定义成公平锁。