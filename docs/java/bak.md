## 多线程

1. 启动线程的方式有哪些？
2. run()和start()的区别？
3. sleep()和wait()的区别？
   1. sleep()是Thread类的静态方法，wait()是Object超类的实例方法；
   2. wait()必须要在sync方法/代码块内被调用，而且需要被notify、notifyAll唤醒；
   3. sleep()会让当前线程进入等待状态，但是不会释放监视器锁，而且超时后自动唤醒；
   4. wait()会让当前线程进入等待状态，并且会释放监视器锁，无论是超时或者被notify、notifyAll方法唤醒后，都需要重新获取监视器锁；
4. interrupt()、interrupted()、isInterrupted()有什么区别
   1. 首先要明确一点，线程中断是一个状态值，只有true和false，也就是说，中断一次是true，再中断一次就变成了false；
   2. interrupt()是中断线程的方法，调用一次，线程中断状态变为true，再调用一次，线程中断状态就会变为false；
   3. interrupted()会返回线程的中断状态并且重置线程的中断状态；也就是说，如果线程被中断了，调用interrupted()方法会返回true，并且把线程的中断状态设置为false；
   4. isInterrupted()只会返回线程的中断状态，并不会重置线程的状态状态；也就是说，如果线程被中断了，调用isInterrupted()方法会返回true。
5. join()
   1. 调用join方法，实际上还是调用了wait方法，让当前线程进入等待状态；
   2. 
   3. 
6. yield()
   1. 让当前线程让出CPU执行权，但是，并不代表其他线程就能得到执行权，如果两个线程优先级一样，可能当前线程刚让出执行权，紧接着又获取到了执行权；
   2. 所以，yield方法只是一个建议，有点类似于，当前线程快执行完了，或者已经执行完了，那就可以调用yield方法建议CPU可以调度其他线程了。

## 关键字

### static

### final

### transient

被transient修饰的属性不会被序列化。

### [volatile](./volatile.md)

## 其他

### [jdk 中的排序算法](./jdk-sort.md)

### JNI(Java native interface，Java本地接口)
