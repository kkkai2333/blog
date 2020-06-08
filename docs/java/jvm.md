# 	JVM

## JVM 内存区域

**注，方法区是jvm规范所定义的，元空间是jdk 1.8之后的 Hotspot 对方法区的实现。**

* 程序计数器（线程私有）
* 虚拟机栈（线程私有）
* 本地方法栈（线程私有）
* 方法区
* 堆（运行时数据区）

## 如何判断对象死亡

### 引用计数算法

### 可达性分析算法

## 了解哪些 GC 算法

### 标记-清除算法

### 标记-整理算法

### 标记-复制算法

### 分代理论-复制算法

### 基于Region的算法

### 分代回收策略

#### 新生代

* Eden区
* Servivor区（又分为From和To）
* Minor GC的执行过程

#### 老年代

* Major GC的执行过程
* Full GC的执行过程

#### ~~永久代~~

指的是内存永久保留的区域，主要存放Class和Meta（元数据）的信息，Class在加载的时候被放入这个区域。由于GC不会对永久代进行回收，这就导致，如果Class过多，会导致永久代膨胀，进而抛出OOM异常。

在jdk 1.8之后，永久代已经被废除了，取而代之的是元空间，元空间的本质和永久代差不多，只不过元空间不在虚拟机中，而是使用了本地内存，所以，默认情况下，元空间仅受本地内存的大小限制。

### 基于region的回收策略

参考G1垃圾收集器的执行原理

## 有哪些垃圾收集器

### 新生代

#### Serial（单线程，复制算法）

#### ParNew（多线程，Serial的升级版）

#### Parallel Scavenge（多线程，复制算法）

### 老年代

#### Serial Old（单线程，标记整理算法）

#### Parallel Old（多线程，标记整理算法）

#### CMS（多线程，标记清除算法）

##### CMS垃圾收集器的工作原理

### 基于region的垃圾收集器

#### G1 (jdk 9)

##### G1垃圾收集器的工作原理

* 初始标记
* 并发标记
* 重新标记
* 并发清除

### 低延时垃圾收集器

#### ZGC (jdk 11)

## Java 类加载机制

### 执行过程

### 类加载器

### 双亲委派机制

### 如何打破双亲委派

### OSGI/SPI

## JVM如何优化

### 常用命令

#### java

##### 命令格式

```json
java [-option] -jar
```

##### option参数

```json
-server, to select the "server VM", is default

-D<name>=<value>, set a system property
```

##### 示例

```json
java -Dspring.profile.active=pro -jar xxx.jar
```

#### jps

##### 命令格式

```json

```

##### option参数

```json

```

##### 示例

```json

```

#### jcmd

##### 命令格式

```json

```

##### option参数

```json

```

##### 示例

```json

```

#### jstat

##### 命令格式

```json

```

##### option参数

```json

```

##### 示例

```json

```

#### jmap

##### 命令格式

```json

```

##### option参数

```json

```

##### 示例

```json

```

#### jstack

##### 命令格式

```json

```

##### option参数

```json

```

##### 示例

```json

```

#### jhat

##### 命令格式

```json

```

##### option参数

```json

```

##### 示例

```json

```

#### jinfo

##### 命令格式

```json

```

##### option参数

```json

```

##### 示例

```json

```

### jvm参数调优的详细过程，为什么这么设置，遇到过哪些gc场景，如何去分析gc日志

### 怎样排查CPU飙升，内存飙升，逃逸分析

### 列举出你常用的spring 应用启动时指定的jvm参数

```
-Xmx
-Xms
```

### 异常

OutOfMemoryError

StackOverflowError

## 参考

* Java 虚拟机规范 Java SE 8
* 深入理解Java虚拟机
* [从实际案例聊聊Java应用的GC优化](https://tech.meituan.com/2017/12/29/jvm-optimize.html)
* [详解cmd垃圾回收机制](https://www.cnblogs.com/littleLord/p/5380624.html)
* [jvm-command](http://www.ityouknow.com/jvm/2017/09/03/jvm-command.html)

