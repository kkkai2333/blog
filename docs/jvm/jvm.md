---
title: 基础
date: 2020-10-27
categories:
- jvm
tags:
- java
- jvm
sidebar: false
publish: true
---

## JVM 内存区域

**注, 方法区是JVM规范所定义的, 元空间是jdk 1.8之后的 Hotspot 对方法区的实现.**

### 线程私有

#### 虚拟机栈

Java方法的执行都是在虚拟机栈中进行的.

#### 本地方法栈

本地方法栈是为了执行Java中的native方法.

#### 程序计数器

程序计数器是线程私有的, 它保存了线程执行到哪一行的字节码的编号.

### 线程共享

#### 方法区

存放class元数据和常量池.

#### 堆

运行时数据区.

##### TLAB

全称是Thread Local Allocation Buffer, 栈上分配, 默认启用, 它的意思是, 在Eden空间, 会为每一个线程分配一块内存, 这样线程就可以优先在TLAB上进行分配, 大内存对象还是需要在堆上分配.

**TLAB很复杂, 我这里只是稍微提一下这个概念**.

## 如何判断对象死亡

### 引用计数算法

引用计数算法的概念相对简单, 对象每多一个指向它的变量, 引用计数+1; 每少一个指向它的变量, 引用计数-1.

它的问题在于, 没有办法处理对象循环引用的情况.

### 可达性分析算法

现代虚拟机基本都采用的这种算法来判断对象是否存活, 它的原理是, 通过一组叫GC Root的对象出发, 引出他们指向的下一个节点, 然后再以下一个节点为起点, 引出再下一个节点, 以此类推, 知道遍历完所有节点, 那只要是不在引用链上的对象, 都是可以被回收的. 这样, 就解决了循环引用的问题.

#### GC Root

那有哪些对象可以作为GC Root呢? 下面简单列举下,

* 虚拟机栈(栈帧中的本地变量表)中引用的对象
* 本地方法栈中JNI(即native)引用的对象
* 方法区中类静态变量引用的对象
* 常量池中常量引用的对象
* Class Loader
* CodeCache(存放的是Java热点代码的JIT编译结果)

## 了解哪些 GC 算法

### 标记-清除算法

标记清除的原理很简单, 大概可分为两步,

1. 通过可达性分析标记出需要回收的对象,
2. 回收这些对象.

标记清除的问题在于, 会造成大量的内存碎片.

### 标记-整理算法

标记整理的原理算是对标记清除的完善, 大概可分为三步,

1. 通过可达性分析标记出需要回收的对象,
2. 将所有存活对象都往一段移动,紧邻排列,
3. 清理另一端的区域, 完成回收操作.

标记整理虽然解决了标记清除算法的内存碎片问题, 但是缺点也很明显, 就是每次GC都需要频繁移动存活的对象, 效率比较低.

### 标记-复制算法

标记复制的原理大概可分为以下几步,

1. 首先, 将内存区域分为两块, A和B, 每次只用其中一块分配对象,
2. 通过可达性分析标记出区域A中的存活对象,
3. 把上述存活对象移动到B区域, 紧邻排列,
4. 回收整个A区域.

标记复制算法同样解决了标记清除算法的内存碎片问题, 但是缺点也很明显, 首先, 区域被分成了两块, 每次分配对象只用其中一块, 导致可分配对象的空间变小; 其次, 它同样需要复制存活对象到另一个区域, 效率比较低.

### 三种算法简要对比

|              | mark-sweep         | mark-compact     | mark-copy(copying)                    |
| ------------ | ------------------ | ---------------- | ------------------------------------- |
| 速度         | 中等               | 最慢             | 最快                                  |
| 空间开销     | 少（但会堆积碎片） | 少（不堆积碎片） | 通常需要活对象的2倍大小（不堆积碎片） |
| 是否移动对象 | 否                 | 是               | 是                                    |

### 分代回收算法(策略)

分代回收算法, 实际上是整合了以上算法, 综合了上述算法的优点, 并且最大限度的避免了上述算法的缺点, 所以是现代虚拟机(jdk11以前)的首选算法, 与其说它是算法, 不如称它是一种策略.

首先, 我们考虑下, 为什么要分代回收呢? 根据一些专业研究表明, JVM中的对象, 实际上是朝生夕死的, 也就是说, 大部分对象, 经过一次Minor GC就会被回收掉了.

所以, 分代回收算法将堆空间分成了新生代和老年代, 默认比例是1 : 2; 然后又将新生代分为了Eden区, From Survivor区(S0), To Survivor区(S1), 默认比例是8 : 1 : 1. 

一般, 把新生代的GC叫做Young GC(或者Minor GC), 把老年代的GC叫做Full GC(或者Major GC).

#### 新生代

简单说下对象在新生代的分配和GC过程,

1. 首先, 对象会先在Eden区进行分配, 
2. 当Eden区快满时, 会触发Minor GC, 由于上文提到过, Minor GC会把大部分对象回收, 所以只有很少一部分对象会存活, 此时, 将存活对象移到S0区, 并且对象的年龄+1, 然后清空Eden区以释放空间,
3. 当下一次触发Minor GC时, 会把Eden区和S0区的存活对象移动到S1区, 同时年龄+1, 然后同时清空Eden区和S0区,
4. 当再一次触发Minor GC时, 会再把Eden区和S1区的存活对象移动带S0区, 同时年龄+1, 然后同时清空Eden区和S1区,
5. 也就是说, 每次发生Minor GC之后, S0区和S1区会角色互换, 这样也可以看出, 在新生代, 采用的是**标记复制算法**,
6. 因为在每次Minor GC发生后, 只会剩下很少的存活对象(这也是Eden : S0 : S1的区域默认是8 : 1 : 1的原因), S0区和S1区比较小, 这也最大限度的降低了复制算法造成的对象拷贝带来的开销.

#### 对象何时晋升老年代

* 当对象的年龄达到了设定的晋升阈值(默认是15, 同时, 因为对象头中的保存的age只占4bit, 所以最大也是15), 则会从S0或者S1区晋升老年代,
* 大对象会直接在老年代进行分配,
* 当S0区或者S1区相同年龄的对象大小之和大于S0或者S1区的一半时, 所有大于该年龄的对象都会晋升老年代.

#### 空间分配担保机制

在发生Minor GC之前, 虚拟机会首先检查老年代最大可用的连续空间是否大于新生代所有对象的总空间, 如果大于, 那么Minor GC会直接执行; 如果不大于, 那么虚拟机会查看HandlePromotionFailure设置值是否允许担保失败, 如果允许, 那么虚拟机会检查老年代最大可用的连续空间是否大于历次晋升到老年代的对象的平均大小, 如果大于, 则进行Minor GC, 如果不大于, 则可能进行一次Full GC.

#### 老年代

如果老年代满了, 则会触发Full GC(这里的说法不太严谨, 在最后的总结中, 会对几种GC名称进行说明), 它会同时回收新生代和老年代(即对整个堆空间进行GC),

一般, Full GC会导致工作线程停顿时间较长(因为它会回收整个堆中的不可用对象), 如果此时server收到很多请求, 可能会导致拒绝服务, 所以, 我们要尽量减少Full GC的出现,

所以, 到这里, 我们也可以大概明白, 为什么要将新生代和老年代的比例设置为1 : 2, 为什么要将新生代分为Eden, S0, S1, 为什么要有对象年龄的设定, 归根结底, 都是为了让对象尽量少的进入老年代, 这样, 也就能降低Full GC发生的次数,

另外, 需要特别说明的是, 由于老年代的对象都是存活的时间比较长, 或者内存占用比较大, 如果采用复制算法会造成很大的开销并且会降低空间的使用率, 所以, 在老年代, 使用的是**标记整理算法**(CMS采用的是标记清除算法).

**关于老年代的垃圾回收过程, 可参考下文对CMS 垃圾收集器的详情分析.**

#### Stop The World

STW就是说, 在GC(Minor GC或者Full GC)期间, 只有垃圾回收线程在执行, 其他工作线程都被挂起.

#### Safe Point

由于Full GC(Minor GC也会影响, 但比较轻微)会影响性能, 所以虚拟机需要在一个合适的时间点发起GC, 这个时间点就被称为Safe Point.

一般来说, 当线程在这个时间点的状态是可以确定的, 那么就可以使JVM开始安全的GC, Safe Point主要包括以下几个特定位置,

* 循环的末尾,
* 方法返回前,
* 调用方法的call之后,
* 抛出异常的位置.

#### ~~永久代~~

指的是内存永久保留的区域, 主要存放Class和Meta(元数据)的信息, Class在加载的时候被放入这个区域, 由于GC不会对永久代进行回收, 这就导致, 如果Class过多, 会导致永久代膨胀, 进而抛出OOM异常. 

#### 元空间

在jdk 1.8之后, 永久代已经被废除了, 取而代之的是元空间, 元空间的本质和永久代差不多, 只不过元空间不在虚拟机中, 而是使用了本地内存, 所以, 默认情况下, 元空间仅受本地内存的大小限制. 

### 基于region的回收策略

**参考下文对G1 垃圾收集器的执行原理.**

## 了解哪些垃圾收集器

Java虚拟机规范并没有规定垃圾收集器应该如何实现, 所以, 不同版本的虚拟机提供的垃圾收集器可能有所区别, 并且会提供参数让用户选择不同的收集器配合使用, 目前主要有以下几种垃圾收集器.

![garbage-collector](./img/garbage-collector.jpeg)

图中的收集器, 如果有连线连接, 代表可以配合使用.

### 新生代

#### Serial 收集器

**单线程, 复制算法.**

Serial 收集器工作在新生代, 它是单线程的收集器, 单线程就意味着它只会使用一个CPU或一个收集线程来完成垃圾回收. 并且, 它在收集过程中, 会暂停其他工作线程, 直至垃圾收集结束. 也就是说在GC期间, 应用不可用.

在Client模式下, Serial单线程模式无需与其他线程进行交互, 减少了开销, 能专心进行GC; 另外, 在桌面应用场景下, 分配给虚拟机的内存不会太大, 几十兆或者一二百兆的内存回收, STW的时间基本在100毫秒左右, 只要不是频繁发生, 这点停顿是可以接收的.

所以, Serial收集器是Client模式下新生代的默认收集器.

#### ParNew 收集器

**多线程, 复制算法, Serial的升级版.**

ParNew 收集器, 其实就是Serial的多线程版本, 它主要工作在Server模式下, 多线程让垃圾回收的更快, 也就减少了STW的时间, 也就提升了应用的响应速度, 还有一个原因是, ParNew是除了Serial收集器之外, 唯一可以与CMS收集器配合使用的,

ParNew 收集器通过多线程收集, 减少了STW的时间, 所以更适合一些与用户进行交互的场景, 因为, 停顿时间越短, 用户体验越好.

所以, ParNew 收集器一般是Server模式下新生代的默认收集器.

##### 可配置参数

| 参数                      | 作用                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `-XX:+UseConcMarkSweepGC` | 可指定老年代使用CMS收集器, 而新生代就会默认选用ParNew 收集器 |
| `-XX:+UseParNewGC`        | 可强制使用ParNew 收集器作为新生代收集器                      |
| `-XX:ParallelGCThreads=n` | 可指定垃圾收集器的线程数量, 默认和CPU核心数一致              |

#### Parallel Scavenge 收集器

**多线程, 复制算法.**

Parallel Scavenge 收集器, 也是基于复制算法实现的多线程收集器, 它和ParNew的区别是关注点不同, Parallel Scavenge的目标是达到一个可控制的吞吐量(吞吐量=运行用户代码时间/(运行用户代码时间+垃圾回收时间)), 所以更适合一些后台计算等不需要太多与用户交互的任务,

Parallel Scavenge 收集器提供了两个参数来精确的控制吞吐量, 分别是控制最大垃圾收集时间的`-XX:MaxGCPauseMillis`参数, 以及直接控制吞吐量的`-XX:GCTimeRatio`(默认99%)参数,

并且, Parallel Scavenge 收集器还可以通过指定`-XX:UseAdaptiveSizePolicy`开启堆的自适应策略, 一旦开启之后, 就无须手动指定新生代大小, Eden, S0, S1的比例等, 只需要设置好基本的堆大小(-Xmx设置最大堆), 以及最大垃圾收集时间与吞吐量大小, 虚拟机就会根据当前系统运行情况收集监控信息, 动态调整这些参数以尽可能地达到我们设定的最大垃圾收集时间或吞吐量大小这两个指标, 这也是它与ParNew收集器的一个重要区别.

##### Parallel Scavenge 垃圾收集器的工作原理

~~懒得写了.~~

##### 可配置参数

| 参数                         | 作用                 |
| ---------------------------- | -------------------- |
| `-XX:MaxGCPauseMillis=n`     | 指定最大垃圾收集时间 |
| `-XX:GCTimeRatio=n`          | 指定吞吐量           |
| `-XX:+UseAdaptiveSizePolicy` | 开启堆的自适应策略   |

### 老年代

#### Serial Old 收集器

**单线程, 标记整理算法.**

Serial Old 收集器是工作于老年代的单线程收集器, 它主要在给Client模式下的虚拟机使用,

在Server模式下, 它有两个作用, 一个是在jdk 1.5及之前, 配合Parallel Scavenge收集器使用, 另一个是作为CMS收集器的备选方案, 当CMS收集器发生Concurrent Mode Failure时使用(后面会讲).

#### Parallel Old 收集器

**多线程, 标记整理算法.**

Parallel Old 收集器是Parallel Scavenge 收集器的老年代版本, 基于整理算法实现的多线程收集器, 只能配合Parallel Scavenge收集器使用, 二者联合, 真正实现了**吞吐量优先**的目标.

##### 可配置参数

| 参数                    | 作用                                        |
| ----------------------- | ------------------------------------------- |
| `-XX:+UseParallelOldGC` | 指定使用Parallel Old 收集器作为老年代收集器 |

**注: 到目前为止, 上述提到的垃圾收集器, 在整个GC期间都是STW的.**

#### CMS 收集器

**多线程, 标记清除算法.**

Concurrent Mark Sweep, 顾名思义, 它是一款并发的, 基于清除算法实现的收集器, 并且, **CMS只会收集老年代**,

CMS的目标是**最小的停顿时间**, 所以它的应用场景就和ParNew 收集器较为类似, 都适合一些与用户交互比较多的场景, 因为停顿越少, 用户体验越好(而默认情况下, CMS就是搭配ParNew使用的).

##### CMS垃圾收集器的工作原理

1. **初始标记(STW)**, 初始标记阶段需要STW, 在该阶段会进行可达性分析, 标记所有能和GC Root**直接关联**的对象, 一般来说, 耗时较短,

2. **并发标记**, 并发标记阶段是和用户线程并发执行的, 在第一个阶段被暂停的线程重新启动, 该阶段进行GC Root Tracing, 直到标记完所以可达对象,

3. **并发预清理**, 此节点标记从新生代晋升的对象, 新分配到老年代的对象, 并发阶段被修改了的对象, 并且, 这个阶段还会扫描新生代,

   那为什么CMS不回收新生代还要扫描新生代呢? 答案很简单, 由于CMS只回收老年代, 那对于老年代来说, 新生代的对象就是不可收集的集合, 那一旦有新生代的对象持有老年代对象的引用, 那这个老年代的对象就肯定不能回收的.

   那再思考个问题, 如果全量的扫描新生代和老年代的所有对象, 会不会很慢? 

   如果没有特殊处理, 肯定会很慢, 但是我们都知道, 新生代的对象一般都是朝生夕死的, 所以, 如果能在新生代先进行一次Minor GC, 再去扫描, 就会很快, 所以, 在预清理之后, CMS会判断是否要进入**可中断并发预清理**,

4. **可中断并发预清理**, 可中断并发预清理的目的, 就是希望能在进入重新标记之前触发一次Minor GC, 这样可以尽量缩短重新标记阶段的停顿时长,
  
   1. CMS提供了两个参数, `-XX:CMSScheduleRemarkEdenSizeThreshold`(Eden区大小阈值配置, 默认2M)和`-XX:CMSScheduleRemarkEdenPenetration`(Eden区使用率阈值配置, 默认50%), ~~当Eden区的使用空间小于配置或者Eden区的使用率小于配置时, 才会进入可中断的并发预清理, 否则, 直接进入重新标记阶段(这里还有些疑问?)~~,
   2. 当然, 可中断并发预清理也不会一直执行, CMS也提供了两个参数, `-XX:CMSMaxAbortablePrecleanLoops`(执行次数, 默认0)和`-XX:CMSMaxAbortablePrecleanTime`(执行时间, 默认5s), 这两个条件只要满足一个, 就会退出,
   
5. **重新标记(STW)**, 重新标记阶段会STW,
  
   1. 可以配置`-XX:ParallelCMSThreads`(默认是(CPU+3)/4)参数启用并发收集,
   2. 注意, 在当前阶段会再一次从GC Root出发, 进行可达性分析, 标记存活对象, 这个阶段将会扫描GC Root , 新生代的对象, cart 被标记为dirty的老年代对象, 
   3. 所以, 如果预清理的工作完成的不好或者新生代对象比较多, 都会导致重新标记阶段停顿较长, 那么, CMS也提供了`-XX:+CMSScavengeBeforeRemark`参数, 即在进入重新标记阶段之前, 强行启动一次Minor GC, 但是这个参数要谨慎使用.
   
6. **并发清理**, 与用户线程并发执行, 清理所有垃圾对象,

7. **重置**, 重置CMS回收器的状态, 准备进入下一个并发回收的周期.

##### 优点

1. **停顿时间比较短**,

##### 不足

1. **抢占CPU资源**, 因为CMS是并发收集的, 那么在GC过程中, 不可避免的就会与用户线程抢占CPU, 这可能会导致用户线程的执行效率下降, CMS默认启用的回收线程是(CPU+3)/4个,
2. **浮动垃圾**, 由于CMS在最终的清理阶段是和用户线程并发执行的, 那么在这个阶段新产生的垃圾就只能等到下一次GC时清理. 这里还有个问题是, 到底要在什么时候启动CMS GC? 因为垃圾回收阶段, 用户线程还在运行, 所以必须留有足够的空间给用户线程, 不然, 一旦老年代的内存空间不够分配对象的话(会产生 Concurrent  Mode Failure错误), 就会退化为备选方案, 使用Serial Old 收集器进行一次Full GC. CMS提供了`-XX:CMSInitiatingOccupancyFraction`参数, 可以指定当老年代的使用空间百分比达到多少时, 启动CMS GC, **这个参数一定要结合系统的运行情况去设置, 不然, 设置的高了就会增加Full GC的风险, 设置的低了, 就会导致频繁的CMS GC**,
3. **内存碎片**, 由于CMS使用的是标记清除算法, 那么不可避免的就会造成内存碎片, 那么, 一旦出现明明老年代的空间大小足够但是却分配失败的问题, 就会导致出现Full GC. CMS提供了`-XX:+UseCMSCompactAtFullCollection`参数, 在顶不住要进行Full GC时开启内存碎片整理, 同时, 也提供了`-XX:CMSFullGCsBeforeCompaction`参数, 即指定每隔多少次不压缩的Full GC之后, 再执行一次带压缩锁的Full GC,
4. 优化jvm参数配置有些复杂.

##### 可配置参数

| 参数                                                | 作用                                                         |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `-XX:+UseConcMarkSweepGC`                           | 指定老年代使用CMS 收集器, 同时, 新生代会默认选用ParNew 收集器 |
| `-XX:ParallelCMSThreads=n`                          | CMS GC工作时的并行线程数, 默认为(CPU核心数+3)/4              |
| `-XX:CMSInitiatingOccupancyFraction=n`              | 默认92, 指定CMS在老年代内存占用率达到多少时开始GC            |
| `-XX:+UseCMSInitiatingOccupancyOnly`                | 指定CMS只使用设定的回收阈值, 如果不配置该参数的话, CMS只会在第一次GC时使用设定阈值, 之后会自动调整 |
| `-XX:+UseCMSCompactAtFullCollection`                | 指定在进行Full GC时进行内存压缩                              |
| `-XX:CMSFullGCsBeforeCompaction=n`                  | 默认0, 指定每隔n次不压缩的Full GC之后, 执行一次带压缩的Full GC |
| `-XX:+CMSParallelInitialMarkEnabled`                | 开启初始标记阶段的并行执行, 默认开启                         |
| `-XX:CMSScheduleRemarkEdenSizeThreshold=n`          | 默认2M, 当Eden区的使用空间大于配置值时, 不会开启可中断的预清理操作 |
| `-XX:CMSScheduleRemarkEdenPenetration=n`            | 默认50%, 当Eden区的使用率大于等于配置值时, 不会开启可中断的预清理操作 |
| `-XX:CMSMaxAbortablePrecleanLoops=n`                | 默认0, 那么当可中断预清理执行了n次之后, 会退出该阶段         |
| `-XX:CMSMaxAbortablePrecleanTime=n`                 | 默认5s, 当可中断预清理的执行时间超过了这个值后, 会退出该阶段 |
| `-XX:+CMSScavengeBeforeRemark`                      | 开启这个参数, 会在进入重标记阶段之前强制触发一次young gc     |
| `-XX:+ExplicitGCInvokesConcurrent`                  | 开启这个参数, System.gc()不会触发STW的Full GC, 而是触发一次并发的GC周期 |
| `-XX:+ExplicitGCInvokesConcurrentAndUnloadsClasses` | 和上一个参数差不多, 只不过多了一个卸载class的功能            |

### 基于region的垃圾收集器

#### region

简述下region的概念, 上文中提到的几种垃圾收集器和下面要讲到的G1, 都是基于分代回收的, 区别是,

1. CMS 等收集器, 是将整个堆连续分成了新生代(Eden, S0, S1), 老年代, ~~永久代(如果有的话)~~, 如下图所示,

   ![heap-structure](./img/heap-structure.png)

2. G1 收集器, 是将整个堆分成了多个region, 每个region都可以是Eden, Survivor, Old, Humongous区(分配大对象的region, 属于Old), 所以, 不同的Eden区可能是不连续的, 如下图所示,

   ![g1-heap-structure](./img/g1-heap-structure.png)

#### G1(jdk 9)收集器

G1 收集器虽然同样基于分代回收的策略, 但是它和CMS 等收集器不同, 它是同时在新生代和老年代使用.

##### G1垃圾收集器的工作原理

G1提供了两种GC模式,

1. 一种是Young GC, 回收新生代的region空间,
2. 一种是Mixed GC, 回收新生代的region空间和部分老年代的region空间,
3. 一旦Mixed GC跟不上对象分配的速度, 导致没有空的region来完成Mixed GC之后, 就会退化为Serial Old 收集器(Full GC)来对整堆进行一次回收.

从全局看, G1的执行应该分为两部分,

* 全局并发标记(global concurrent marking)
* 拷贝存活对象(evacuation)

全局并发标记(global concurrent marking)是基于SATB形式的并发标记, 它具体分为以下几个步骤,

1. **初始标记(initial marking)**, STW, 扫描GC Root, 标记所有可从GC Root**直接到达**的对象, G1使用外部的bitmap来记录Mark信息, 而不使用对象头的Mark Word中的mark bit, 并且, 初始标记阶段借用了young gc的暂停, 因此它没有额外的暂停,
2. **并发标记(concurrent marking)**, 并发阶段, 从初始阶段标记过的对象出发, 遍历整个堆的对象, 并标记可达对象, 直到扫描结束, 在这个过程中, 还会扫描SATB write barrier所记录下的引用,
3. **重新标记(final marking, 在实现中也叫remarking)**, STW, 在完成并发标记后, 每个Java线程还会有一些SATB write barrier所记录下的引用尚未处理, 这个阶段就是处理这些引用的, 并且, 还会进行弱引用处理,
4. **并发清除(cleanup)**, STW, 清点和重置标记状态, 这个阶段会标记bitmap中统计的每个region里被标记存活的对象有多少, 如果发现某个region中没有活对象了, 则会将其整体回收到可分配的region列表,

拷贝存活对象(evacuation)阶段是全暂停(STW)的, 它负责把一部分region里边的活对象copy到空的region中, 然后回收原本的空间, Evacuation阶段可以自由选择多个region来独立收集, 这些region就构成了收集集合(Collection Set, 简称CSet), 是通过per region Remembered set(简称RSet)实现的, 这也是基于region的垃圾收集器的特征,

在选定CSet之后, evacuation就跟Parallel Scavenge收集器有点类似了, 通过并行copying算法, 把CSet集合中的每个region的活对象copy到新的region中, 整个过程是STW的,

1. Young GC, 选定所有新生代的region进行GC, 所以可以通过控制新生代的region个数来控制young gc的开销,
2. Mixed GC, 选定所有的新生代的region和部分在global concurrent marking阶段统计得出的收益最高的若干老年代的region, 在用户指定的开销范围目标内尽可能选择收益高的region进行GC,
3. 这就就能看到, 新生代的region一定是在CSet中的, 所以G1没有维护从新生代region出发的引用涉及到的RSet的更新.

分代式G1的工作流程就是在young gc和mixed gc之间视情况来切换, 背后定期会做全局并发标记(global concurrent marking), 而初始标记(initial marking)一般都是搭在young gc时做的, 当全局并发标记正在工作时, G1不会选择做mixed GC, 反之如果有mixed GC正在进行中, G1也不会启动initial marking.

注意, G1 GC下的System.gc()默认还是Full GC, 即会导致STW, 可以通过指定`-XX:+ExplicitGCInvokesConcurrent`来启用并发的GC来执行System.gc(), **此时System.gc()的作用是, 强制开启一次全局并发标记(global concurrent marking)**.

到目前为止, 可以看到, G1 收集器只有全局并发标记(global concurrent marking)阶段是并发的, 其他三个阶段都是会STW的, 那为什么还说G1是低延迟的GC实现呢?

重点就在于, G1虽然mark了整个堆, 但是并不会回收整个堆的垃圾对象, 而是会选择收益最高的region进行收集, 所以, 每次evacuation阶段的STW就是可控的了, 而且, 可以通过`-XX:MaxGCPauseMillis`命令来设置目标预期(但是请不要设置的太低, 不然G1跟不上目标就会导致大量的垃圾堆积).

##### 优点

1. G1通过将内存分成多个region的形式, 尽量避免了内存碎片的问题,
2. 可以通过设置预期停顿时间来控制GC停顿时间(尽量不要设置太低), 尽量避免了单次GC停顿时间长的问题,
3. G1在回收内存后, 会同时做合并空闲内存的操作,
4. G1可以在新生代, 老年代使用,
5. 在服务器CPU多核, 内存比较大的应用下, 推荐使用G1.

##### 不足

1. G1占用的内存会更大一些, 因为需要额外的空间存储CSet, Rset, cart table等信息,
2. 单个region的很难指定, 太小会导致分配大对象是很难找到连续空间, 太大又可能会导致空间的浪费.

##### 可配置参数

| 参数                                   | 作用                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| `-XX:+UseG1GC`                         | 指定使用G1 收集器                                            |
| `-XX:MaxGCPauseMillis`                 | 指定G1收集过程的目标停顿时间, 默认值是200ms, 不过这不是硬性条件, 而是一个期望值 |
| `-XX:InitiatingHeapOccupancyPercent=n` | 默认45, 指定当Java堆的占用率达到参数值时, 开始并发标记阶段   |
| `-XX:G1HeapRegionSize`                 | 指定一个Region的大小, 取值范围从1M到32M, 且是2的指数, 如果不设定,那么G1会根据Heap大小自动决定 |


### 低延时垃圾收集器

#### ZGC(jdk 11)收集器

ZGC 是jdk 11中推出的一款低延时垃圾收集器, 它的目标包括,

* 停顿时间不超过10ms,
* 停顿时间不会随着堆的大小或活跃对象的大小而增加,
* 支持8MB~4TB级别的堆(未来可能支持16TB).

从设计目标, 我们可以看出, ZGC适用于大内存低延迟服务的内存管理及回收.

##### ZGC 垃圾收集器的工作原理

~~比较复杂, 还没看明白, 所以暂时简单写几个点.~~

1. ZGC也和G1类似, 是基于复制算法实现的, 不过ZGC对该算法做了改进, 这使得它在标记, 转移, 重定位阶段几乎都是并发的, 这也是它可以实现停顿小于10ms的主要原因,
2. ZGC通过着色指针和读屏障技术，解决了转移过程中准确访问对象的问题，实现了真正的并发转移,
   1. 着色指针, 一种将信息存储到指针的技术,
   2. 读屏障, 就是在用户线程读取堆中对象之前会优先执行一段代码.

ZGC大致分为以下几个阶段, 

1. 初始标记, STW,
2. 并发标记/对象重定位,
3. 再标记, STW,
4. 并发转移准备,
5. 初始转移, STW,
6. 并发转移.

##### 优点

目前最理想的垃圾收集器(~~如果能用的话~~).

##### 不足

1. 由于ZGC在GC过程中, 基本上是并发的, 所有它调优的主要目的就是, 如何保证在GC完成之前, 新对象不会将堆占满,
2. 最低支持版本为jdk11, 更低版本jdk无法使用.

##### 可配置参数

| 参数                            | 作用                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `-XX:+UseZGC`                   | 使用ZGC                                                      |
| `-XX:ZCollectionInterval`       | ZGC发生的最小时间间隔                                        |
| `-XX:ZAllocationSpikeTolerance` | ZGC触发自适应算法的修正系数, 数值越大, 越早的触发ZGC, 默认2  |
| `-XX:+ZProactive`               | 是否启用主动回收, 默认开启                                   |
| `-XX:ConcGCThreads`             | 并发回收垃圾的线程, 调大后GC变快, 但会占用程序运行时的CPU资源, 吞吐会受到影响, 默认是总核数的12.5%, 8核CPU默认是1 |

##### ZGC重要配置参数(参考, 美团技术团队)

```java
// 堆的最大, 最小内存
-Xms10G -Xmx10G
// 设置CodeCache的大小, JIT编译的代码都放在CodeCache中, 一般服务64m或128m就已经足够
-XX:ReservedCodeCacheSize=256m -XX:InitialCodeCacheSize=256m
// 启用ZGC
-XX:+UnlockExperimentalVMOptions -XX:+UseZGC
// 并发回收垃圾的线程, 默认是总核数的12.5%, 8核CPU默认是1. 调大后GC变快, 但会占用程序运行时的CPU资源, 吞吐会受到影响
-XX:ConcGCThreads=2 
// STW阶段使用线程数, 默认是总核数的60%
-XX:ParallelGCThreads=6
// ZGC发生的最小时间间隔, 单位秒
-XX:ZCollectionInterval=120
// ZGC触发自适应算法的修正系数, 默认2, 数值越大, 越早的触发ZGC
-XX:ZAllocationSpikeTolerance=5
// 是否启用主动回收, 默认开启, 这里的配置表示关闭
-XX:+UnlockDiagnosticVMOptions -XX:-ZProactive
```

## 总结

### GC 名词解释

#### Young GC(Minior GC)

这个没啥疑问, 对新生代区域的GC.

#### Major GC

除CMS, G1 收集器之外的其他几种收集器, 在执行Major GC时, 会同时清理新生代和老年代, 所以这个时候, Major GC就等价于Full GC.

#### Old GC

只回收老年代, 不会回收新生代, 只有CMS的concurrent collection是这个模式.

#### Mixed GC

回收整个新生代和部分老年代, 只有G1有这个模式.

#### Full GC

Full GC就是全堆回收, 回收新生代, 老年代, ~~永久代(如果有的话)~~, 元空间,

那对于CMS 收集器来说, 一旦Old GC之后也无法分配对象, 就会退化为备选方案, 使用Serial Old 收集器进行Full GC.

#### 三色扫描

GC时, 会将对象分为三类, 即所谓的black对象, grey对象, white对象,

1. black对象指的是, 自身已经被标记到, 并且其引用的所有对象都已经被标记的对象,
2. grey对象指的是, 自身已经被标记到, 但是其所有引用对象还没有被标记完成的对象,
3. white对象指的是, 还没有被标记到的对象.

#### Remembered Set

一般简称RSet, 是一个抽象概念.

#### cart table

cart table实际上就是RSet的一种实现方式, 如果要对应下面的术语, 那一般的card table实现是记录的当前区域指向其他区域的一个记录, 所以应该算是一种Point out的形式.

CMS将老年代分成了大小为512byte的块, card table的每一个元素就对应着一个块, 当并发标记时, 如果某个对象的引用发生了变化, 就会将该块标记成dirty card, 这样, 在并发预清理阶段, 就会重新扫描dirty card, 然后将该区域内对象引用的对象标记成可达的.

##### Point into

G1和CMS类似, 它也有一个覆盖整个heap的RSet, 区别在于它为每个region都记录了一个RSet, 那这个RSet实际上是记录的其他region到当前region的card, 所以这是一种Point into的RSet.

##### Point out

而且, G1还维护了一个Point out的RSet, 这个RSet记录的是指向当前region的那些region的指针的的card位置, 所以, G1实际上是在Point out的card table之上又维护了一层结构构成了Point into的card table, 也就类似说, G1的card table是一个hash table, key是别的region的起始位置, value是当前region的card table的index.

#### write barrier

写屏障.

由于在并发标记阶段, GC线程和用户线程是同时执行的, 所以很有可能出现对象的引用发生变化的情况, 那么一般有两种处理方式, 读屏障和写屏障, 一般考虑到Java对象都是读多写少的, 所以CMS和G1都是采用的写屏障, 目前只有ZGC采用的读屏障,

而且G1和CMS又有些不同, 因为G1实际上使用了两种写屏障, 写前屏障(pre write barrier)和写后屏障(post-write barrier), 而CMS实际上只使用了写后屏障(post-write barrier).

#### logging write barrier

写屏障日志, G1 收集器使用.

上面有提到, G1实际上使用了两种写屏障, 那如果都在用户线程中去处理的话, 不可避免的就会影响用户线程的速度, 所以G1将一些原本应该在屏障里执行的动作写到一个队列里, 通过其他的线程异步执行, 这个队列的概念其实就是logging write barrier,

比如说, 以SATB write barrier为例, 每个Java线程有一个独立的, 定长的SATBMarkQueue, 用户线程在barrier里只把old value压入该队列中. 一个队列满了之后, 它就会被加到全局的SATB队列集合SATBMarkQueueSet里等待处理, 然后给对应的Java线程换一个新的, 干净的队列继续执行下去,

然后, 在并发标记(concurrent marker)阶段会定期检查全局SATB队列集合的大小, 当全局集合中队列数量超过一定阈值后, concurrent marker就会处理集合里的所有队列, 把队列里记录的每个oop都标记上, 并将其引用字段压到标记栈(marking stack)上等后面做进一步标记.

#### STAB

snapshot at the beginning, G1 收集器特有的东西, 即在开始GC时, G1会为当前堆中的存活对象做一个快照, 然后将GC过程中新分配的对象也当成是存活的.

#### ~~Incremental update(增量更新)~~

没记错的话, 这个应该是CMS 收集器已经废弃的东西.

### GC调优策略

我认为, GC调优的目的, 就是降低Full GC发生的频率, 因为young gc的停顿时间实际上是相对比较短的, 那同时, 也可以增大内存来降低young gc的次数,

当然, 针对不同的垃圾收集器, 也会有相应的调优参数.

#### 常用命令

```java
// 统计内存分配速率, GC耗时, GC次数
jstat -gc <pid> <统计间隔时间>  <统计次数>

// 命令行输出类名、类数量数量，类占用内存大小，
// 按照类占用内存大小降序排列
jmap -histo <pid>

// 生成堆内存转储快照，在当前目录下导出dump.hrpof的二进制文件，
// 可以用eclipse的MAT图形化工具分析
jmap -dump:live,format=b,file=dump.hprof <pid>

// 查看正在运行的java应用的扩展参数, 包括java system属性和jvm命令行参数
jinfo <pid>
```

#### 常用配置参数

| 参数                                                         | 作用                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `-Xmx, -Xms, -Xmn`                                           | 堆空间的最大值, 最小值; 新生代的大小                         |
| `-Xss`                                                       | 线程栈的大小, 默认是1M                                       |
| `-XX:SurvivorRatio=n`                                        | 新生代中Eden和Survivor的比例, 默认是8                        |
| `-XX:MaxTenuringThreshold=n`                                 | 对象从新生代晋升到老年代的年龄阈值, 默认是15, 一般使用默认值即可 |
| `-XX:+UseCompressedOops`                                     | 开启指针压缩, 默认开启                                       |
| `-XX:-UseCompressedOops`                                     | 关闭指针压缩                                                 |
| `-XX:+DisableExplicitGC`                                     | 忽略显式调用的System.gc()命令                                |
| `-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:+PrintGCTimeStamps` | 打印GC日志                                                   |

#### 常用分析工具

* jdk自带的监控分析工具Visual VM,
* GC 日志分析: GCViewer, gceasy,
* GC 参数检查和优化: http://xxfox.perfma.com/.

### 结束语

1. 没有最合适的收集器, 只有与业务最匹配的收集器, 不过, 一般情况下, 
   1. 如果考虑吞吐量优先, 可使用Parallel Scavenge+Parallel Old的组合,
   2. 如果考虑低停顿时间, 可使用ParNew+CMS的组合,
   3. G1 解决了 CMS 的一些问题, 如果追求最短停顿时间, 并且也不想让吞吐量降低很多, 可以考虑使用,
2. 同样, 也没有最合适的调优参数, 所以的收集器配置参数都得结合实际的系统进行调整, 一句话, 乱调优不如不调优,
3. 现在大型的分布式系统基本都是高并发的, 那为了提升用户的体验, 低延时的垃圾处理器应该是未来,
4. 本文实际上是较为浅显的讲述了一下关于JVM的基础内容, 基本上没有深入, 因为有很多内容, 其实现是比较复杂的, 比如说CMS, G1, ZGC更细节的实现原理, 比如不同收集器对于RSet, cart table的实现, 写屏障, 读屏障, TLAB(栈上分配)等等,
5. 不过, 作为一篇简单了解JVM的文章还是勉强可以的.

## 参考

* Java 虚拟机规范(Java SE 8)
* 深入理解 Java 虚拟机
* [几种垃圾收集器](https://mp.weixin.qq.com/s/_AKQs-xXDHlk84HbwKUzOw)
* [详解 CMS 垃圾回收机制](https://www.cnblogs.com/littleLord/p/5380624.html)
* [深入理解 G1 垃圾收集器](http://ifeve.com/深入理解g1垃圾收集器)
* [Java Hotspot G1 GC 的一些关键技术](https://tech.meituan.com/2016/09/23/g1.html)
* [新一代垃圾回收器 ZGC 的探索与实践](https://tech.meituan.com/2020/08/06/new-zgc-practice-in-meituan.html)
* [并发垃圾收集器 CMS 为什么没有采用标记-整理算法来实现?]( https://hllvm-group.iteye.com/group/topic/38223#post-248757 )
* [HotSpot VM 请教G1算法的原理](https://hllvm-group.iteye.com/group/topic/44381)
* [Major GC和Full GC的区别是什么? 触发条件呢?](https://www.zhihu.com/question/41922036/answer/93079526)
* [Getting Started with the G1 Garbage Collector](https://www.oracle.com/webfolder/technetwork/tutorials/obe/java/G1GettingStarted/index.html)
* [Java 的 GC 为什么要分代](https://www.zhihu.com/question/53613423/answer/135743258)

## 附录

### CMS GC 日志分析

```java
// 可以看到,首先执行了两次young gc, 原因是内存分配失败, gc后新生代从279397K降到了34336K, 整个堆区已用空间从279397K降到了266804K, 耗时很短, 每次都是100ms左右
0.240: [GC (Allocation Failure) 0.240: [ParNew: 279397K->34336K(314560K), 0.1043962 secs] 279397K->266804K(1013632K), 0.1044371 secs] [Times: user=0.12 sys=0.44, real=0.11 secs] 
0.378: [GC (Allocation Failure) 0.378: [ParNew: 313162K->34066K(314560K), 0.1220106 secs] 545630K->545523K(1013632K), 0.1220397 secs] [Times: user=0.14 sys=0.61, real=0.12 secs] 

// 1. 初始标记阶段, STW, 这个阶段会标记从GC Root可以直连的对象, 可以看到, 整个老年代有699072K, 在其达到511456K时, 触发了CMS,
0.500: [GC (CMS Initial Mark) [1 CMS-initial-mark: 511456K(699072K)] 546547K(1013632K), 0.0004818 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
  
// 2.1. 并发标记阶段开始, 并发执行, 上一阶段被暂停的线程都开始运行, 接下来, GC线程会从上一阶段被标记的对象出发, 然后标记所有可达的对象,
0.501: [CMS-concurrent-mark-start]
// 2.2. 并发标记结束, CPU耗时3ms
0.503: [CMS-concurrent-mark: 0.003/0.003 secs] [Times: user=0.00 sys=0.01, real=0.00 secs] 
  
// 3.1. 预清理阶段开始, 并发执行, 这一阶段会查找在上一阶段执行过程中, 从新生代晋升或者新分配或者被更新的对象, 并发的扫描这些对象, 这一阶段的目的主要是为了降低重标记阶段STW的耗时,
0.503: [CMS-concurrent-preclean-start]
// 3.2. 预清理阶段结束, CPU耗时1ms
0.504: [CMS-concurrent-preclean: 0.001/0.001 secs] [Times: user=0.01 sys=0.00, real=0.01 secs] 
  
// 4. 可中断预清理阶段开始
0.504: [CMS-concurrent-abortable-preclean-start]
// 这里, 我们可以猜测, 是因为可中断预清理判断到条件满足, 可以执行一次young gc, 所以这里才又发生了一次young gc, 但是可以看到, 新生代从312954K到312954K完全没有回收空间, 这说明,可能是老年代空间不足, 所以下面直接触发了一次full gc
0.534: [GC (Allocation Failure) 0.534: [ParNew: 312954K->312954K(314560K), 0.0000247 secs]0.534: [CMS0.534: [CMS-concurrent-abortable-preclean: 0.001/0.030 secs] [Times: user=0.03 sys=0.00, real=0.02 secs] 
// 可以看到, 这里的错误是concurrent mode failure, 应该是因为内存碎片导致的, 那这里就会启用CMS的备选方案, 即使用Serial Old收集器, 这也就导致发生了Full GC, STW, 老年代从511456K增加到了698843K(之所以不降反升, 是因为我的测试用例里没有释放对象的引用, 所以老年代一定是持续增长的), 耗时100ms+, 
 (concurrent mode failure): 511456K->698843K(699072K), 0.1978149 secs] 824411K->823778K(1013632K), [Metaspace: 3094K->3094K(1056768K)], 0.1979056 secs] [Times: user=0.14 sys=0.05, real=0.20 secs] 
// 又一次初始标记开始
2.735: [GC (CMS Initial Mark) [1 CMS-initial-mark: 698843K(699072K)] 942051K(1013632K), 0.0005477 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
// 并发标记阶段开始
2.736: [CMS-concurrent-mark-start]
// 并发标记耗时3ms
2.738: [CMS-concurrent-mark: 0.003/0.003 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
// 预清理阶段开始
2.738: [CMS-concurrent-preclean-start]
// 预清理阶段耗时2ms
2.741: [CMS-concurrent-preclean: 0.002/0.002 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
// 可中断预清理阶段开始
2.741: [CMS-concurrent-abortable-preclean-start]
// 可中断预清理阶段耗时小于1ms
2.741: [CMS-concurrent-abortable-preclean: 0.000/0.000 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
  
// 5. 重标记阶段, STW, 多线程执行, 这里会从根及其被引用的对象开始, 重新扫描堆中残留的被更新的对象, remark一共耗时1ms
2.741: [GC (CMS Final Remark) [YG occupancy: 243207 K (314560 K)]2.741: [Rescan (parallel) , 0.0005761 secs]2.742: [weak refs processing, 0.0000109 secs]2.742: [class unloading, 0.0003480 secs]2.742: [scrub symbol table, 0.0005884 secs]2.743: [scrub string table, 0.0002238 secs][1 CMS-remark: 698843K(699072K)] 942051K(1013632K), 0.0018009 secs] [Times: user=0.01 sys=0.00, real=0.00 secs] 
  
// 6.1. 并发清理阶段, 并发执行, 这一阶段就会清理无用对象,
2.743: [CMS-concurrent-sweep-start]
// 6.2. 并发清理阶段结束, 耗时小于1ms
2.743: [CMS-concurrent-sweep: 0.000/0.000 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
  
// 7.1. 并发重置阶段开始, 并发执行, 在本阶段, 会重新初始化CMS内部数据结构, 以备下一轮GC使用,
2.743: [CMS-concurrent-reset-start]
// 7.2. 并发重置阶段结束, 耗时1ms
2.744: [CMS-concurrent-reset: 0.001/0.001 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
  
// 到这里, 一次完整的CMS gc就执行结束了
Heap
 par new generation   total 314560K, used 248800K [0x0000000780000000, 0x0000000795550000, 0x0000000795550000)
  eden space 279616K,  88% used [0x0000000780000000, 0x000000078f2f8140, 0x0000000791110000)
  from space 34944K,   0% used [0x0000000791110000, 0x0000000791110000, 0x0000000793330000)
  to   space 34944K,   0% used [0x0000000793330000, 0x0000000793330000, 0x0000000795550000)
 concurrent mark-sweep generation total 699072K, used 698840K [0x0000000795550000, 0x00000007c0000000, 0x00000007c0000000)
 Metaspace       used 3613K, capacity 4540K, committed 4864K, reserved 1056768K
  class space    used 399K, capacity 428K, committed 512K, reserved 1048576K
```

### ~~G1 GC日志分析~~

