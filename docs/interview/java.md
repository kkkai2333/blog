# Java 篇

首先，看一下Java的知识图谱。

![java](../java/java/java.jpg)

## 基础

1. Object有哪些方法？
   1. native 方法有：getClass()、hashCode()、clone()、notify()、notifyAll()、wait(long)
   2. Java 方法有：equals()、toString()、wait()、wait(long, int)、finalize()
2. java 中操作字符串都有哪些类？它们之间有什么区别？ 
3. String str="i"与 String str=new String("i")一样吗？ 
4. 如何将字符串反转？ 
5. == 和 equals 的区别是什么？
6. 为什么重写 equals() 方法就必须重写 hashCode() 方法？
7. 两个对象的 hashCode() 相同，则 equals() 也一定为 true，对吗？ 
8. final 在 java 中有什么作用？ static 呢？
9. final、finally 和 finalize 的区别？
10. 能不能讲一下 int 的拆箱和装箱？
11. 抽象类和接口有什么区别？
12. 普通类和抽象类有哪些区别？ 
13. 抽象类一定要有抽象方法吗？
14. 抽象类能使用 final 修饰吗？ 
15. java 中 IO 流分为几种？为什么有了字节流还要有字符流？
    1. 字节流和字符流
    2. 输入流和输出流
16. 代理了解吗？什么是静态代理？什么是动态代理？动态代理有几种实现方式？

## 集合

1. Java中有哪些集合？
2. Collection 和 Collections 有什么区别？ 
3. List、Set、Map 之间的区别是什么？ 
4. HashMap 和 Hashtable 有什么区别？ 
5. 如何决定使用 HashMap 还是 TreeMap？ 
6. Java 中的 TreeMap 是采用什么树实现的？ 
7. 说一下 HashMap 的实现原理？ 扩容机制了解吗？为什么说它不是线程安全的？如果要线程安全应该用什么？
8. 说一下 ConcurrentHashMap 的实现原理？
9. 说一下 HashSet 的实现原理？它和 HashMap 有什么区别？它是如何检查重复的？
10. ArrayList 和 LinkedList 的区别是什么？ 
12. ArrayList 和 Vector 的区别是什么？ 
13. Array 和 ArrayList 有何区别？ 
13. 如何实现数组和 List 之间的转换？ 
14. 在 Queue 中 poll() 和 remove() 有什么区别？ 
15. 哪些集合类是线程安全的？ 
16. 迭代器 Iterator 是什么？怎么使用？有什么特点？ 
17. Iterator 和 ListIterator 有什么区别？ 
18. Java 中 LinkedHashMap 和 PriorityQueue 的区别是什么？ 

## 多线程

1. 用过线程池吗？为什么要用线程池？几个参数是怎么设置的？拒绝策略是什么？为什么不建议使用Executors工厂类？
2. 线程有几种状态？
3.  Runnable 和 Callable 的区别？
4. FutureTask 是什么？
5. Thread 的 run() 和 start() 方法有什么区别？
6. 为什么我们 start() 方法时会执行 run() 方法？为什么不能直接调用 run() 方法？ 
7. [ThreadLocal](../java/thread-local.md) 有用过吗？他是如何实现同一个线程共享变量的？子线程能拿到父线程设置的值吗？如果我想拿到该怎么做？
8. Java中有哪几种锁？
   1. synchronized中有偏向锁、轻量级锁、重量级锁，同时它也是一个可重入锁；
   2. ReentrantLock可重入锁；
   3. ReentrantReadWriteLock读写锁；
   4. ReentrantLock和ReentrantReadWriteLock默认都是非公平锁，可通过构造方法初始化公平锁；
   5. Condition条件锁，目前可使用的只有AbstractQueuedSynchronizer.ConditionObject这一个实现；
   6. 自旋锁，自旋锁只是一个概念，它不是一个具体的类或者接口，ReentrantLock和ReentrantReadWriteLock中都有自旋锁的代码实现；
9. 说一下 [ReentrantLock](../java/ReentrantLock.md) 的实现原理
10. 说一下 [ReentrantReadWriteLock](../java/ReentrantReadWriteLock.md) 的实现原理
11. [Semaphore](../java/Semaphore.md) 有用过吗？用在什么场景？它的底层原理是什么？
    1. 可用在限流操作上，例如令牌桶算法。
12. [CyclicBarrier](../java/CyclicBarrier.md) 和 [CountdownLatch](../java/CountdownLatch.md) 有什么区别？ 
    1. CountDownLatch只能使用一次；CyclicBarrier可以循环使用；
    2. CountDownLatch的含义是，所有线程都会等待某一个或几个条件满足后，才能执行；
    3. CyclicBarrier的含义是，前几个线程必须要等待最后一个线程到了之后，才能执行；
    4. CountDownLatch是通过内部继承了AQS类的Sync类来实现的，其实现逻辑是：
       1. 初始化count参数，实际上就是初始化count重锁，也就是把count赋值给AQS的同步属性state；
       2. await()方法实际上是调用了AQS类的加锁方法，当state != 0时，永远返回加锁失败，这样所有线程就会进入等待队列等待；
       3. countDown()方法每调用一次，就会释放一重锁；
       4. 当state == 0时，变成无锁状态，等待队列中的线程就会被唤醒，开始执行。
    5. CyclicBarrier内部维护了一个ReentrantLock的lock对象和一个Condition的trip对象，其实现逻辑是：
       1. 初始化的parties参数，指定每次屏障执行需要几个参与者；
       2. 初始化的barrierAction参数，可指定一个Runnable对象，该任务会在屏障执行时首先调用；
       3. await()方法会先调用lock加锁，然后判断当前已经有几个参与者在等待，
          1. 如果发现参与者还不够，就调用Condition的await()方法让线程进入条件队列等待；
          2. 如果发现参与者已经够了，就调用Condition的signalAll()方法唤醒所有线程，让其执行。
13. synchronized 了解吗？在方法上、代码块内、静态变量上加 synchronized 有什么区别？底层是怎么实现的？jdk 1.6之后做了哪些锁优化？
14. synchronized 和 Lock 有什么区别？Lock 接口相比于 synchronized，优势是什么？
15. 使用 synchronized 如何实现单缓冲区的生产者消费者模型？
16. volatile 了解吗？它线程安全吗？为什么不安全？为什么不能保证原子性？它是如何保证可见性、有序性的？
17. 什么是CAS？什么是ABA问题？
18. 什么是原子操作，Java中的原子操作是什么？ 
19. Java中如何阻塞一个线程？
20. Java中如何唤醒一个阻塞的线程？ 
21. 在java中 wait() 和 sleep() 方法的不同？ 
22. 为什么 wait() 方法和 notify()/notifyAll() 方法要在同步块中被调用？
23. 现在有T1、T2、T3三个线程，你怎样保证T2在T1执行完后执行，T3在T2执行完后执行？ 
24. 用Java实现一个阻塞队列？
25. 你需要实现一个高效的缓存，它允许多个用户读，但只允许一个用户写，以此来保持它的完整性，你会怎样去实现它？ 
26. 为什么会发生死锁，你能制造一个死锁吗？
27. 什么是竞争条件？你怎样发现和解决竞争？ 
28. 什么是不可变对象，它对写并发应用有什么帮助？ 
29. 你在多线程环境中遇到的问题是什么？你是怎么解决它的？ 

## 其他

1. 线程与进程的区别？
2. 你了解守护线程吗？它和非守护线程有什么区别？
3. 什么是多线程中的上下文切换？
4. 死锁与活锁的区别，死锁与饥饿的区别？
5. 在Java中什么是线程调度？
6. Java中用到的线程调度算法是什么？
   1. 抢占式调度策略
   2. 时间片轮转调度算法
7. 在线程中你怎么处理不可捕捉异常？
8. jdk 8的新特性有哪些？