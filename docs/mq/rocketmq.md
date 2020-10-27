---
title: RocketMQ 基础
date: 2020-10-27
categories:
- mq
tags:
- mq
- rocketmq
sidebar: auto
publish: false
---

## 概念

| 概念名词                 | 解释                                                         |
| ------------------------ | ------------------------------------------------------------ |
| Producer                 | 消息生产者, rocketmq支持多种发送方式,<br />同步发送, 异步发送, 单向发送, 顺序发送. |
| Consumer                 | 消息消费者, rocketmq提供了两种消费方式,<br />推模式(push), 拉模式(pull). |
| Topic                    | 主题, 表示一类消息的集合, 每个消息只能属于一个主题.          |
| Message Queue            | 消息队列, 一个主题会有多个消息队列, 默认情况下,<br />producer会轮流向每个消息队列发送消息,<br />consumer会根据负载均衡策略, 消费被分配到的那个message queue的消息. |
| Message                  | 消息, 传输信息的载体, 每个消息有一个唯一的message id,<br />并且可以指定带有业务标识含义的key. |
| Tag                      | 消息标签, 可以用来区分同一主题下不同类型的消息.              |
| Producer Group           | 同一类producer的集合.                                        |
| Consumer Group           | 同一类consumer的集合, 要求必须订阅相同的topic,<br />rocketmq支持两种消费模式, 集群消费(Clustering), 广播消费(Broadcasting),<br />需要注意的是, 在集群消费模式下,<br />如果consumer group下的consumer数量必须小于等于topic下message queue的数量, 否则, 超出的consumer是无法消费消息的. |
| Normal Ordered Message   | 普通顺序消息, 消费者通过同一个消费队列收到的消息是有序的, <br />但不同的消费队列收到的消息可能是无序的. |
| Strictly Ordered Message | 严格顺序消费, 消费者收到的所有消息都是有序的.                |

## 特性

| 支持的特性    | 解释                                                         |
| ------------- | ------------------------------------------------------------ |
| 顺序消息      | 顺序消息指的是, consumer消费消息时时, 可以按照发送的顺序进行消费, <br />rocketmq支持全局顺序消息和分区顺序消息,<br />全局顺序消息, 对于一个指定的topic, 严格按照FIFO的顺序进行消费, 性能不高,<br />分区顺序消息, 对于一个指定的topic, 所有消息根据sharding key进行区块分区, 同一个分区的消息严格按照FIFO的顺序进行消费, 性能较高. |
| 事务消息      | rocketmq提供了类似于2pc的分布式事务功能,<br />首先, 发送一个半事务消息到broker, 此时, 该消息还未投递到目标topic,<br />然后, 执行本地事务, 再根据本地事务的成功或失败向broker提交commit或者rollback,<br />最后, broker根据commit或者rollback来确认投递消息到topic或者删除该消息. |
| 定时消息      | 延迟队列, 即发送到broker的消息, 会在延迟特定时间后, 再投递给topic,<br />broker有messageDelayLevel的配置项, 默认有18个level, 可自定义,<br />发送消息时, 可通过设置msg.setDelayLevel(level)来指定延时时间. |
| 消息过滤      | 可以通过指定tag来进行消息过滤, 是在broker端实现的,<br />优点是减少了对于consumer无用消息的传输, 缺点是增加了broker的负担, 并且实现比较复杂. |
| 消息可靠性    | rocketmq支持同步刷盘和异步刷盘,<br />支持master-slave的同步复制和异步复制,<br />以此可提高消息的高可靠性. |
| 消息重试      | rocketmq为每个消费组都默认设置了一个topic名称为“%RETRY%+consumerGroup”的重试队列,<br />用于暂存consumer消费失败的消息,<br />并且会为重试队列设置多个重试级别, 重试次数越多, 级别越高, 重新投递的延时越大. |
| 消息重投      | producer发送消息时, 同步消息失败会重投, 异步消息失败有重试, oneway没有处理. |
| 回溯消费      | consumer已经消费过的消息, 可以重新消费,<br />rocketmq根据配置, 可保存一定时间内的消息, 并且支持按照时间进行回溯消费, 时间维度可以精确到毫秒. |
| 死信队列      | 当消息一直消费失败, 达到最大重试次数时,<br />rocketmq会将其发送到该消费者对应的特殊队列(Dead-letter Queue),<br />之后, 可以在console控制台对死信队列中的消息进行重发, 来再次消费. |
| At least Once | rocketmq可以保证每个消息至少投递一次,<br />consumer可以在pull消息到本地, 消费完成后, 再向服务器返回ack. |
| 流量控制      | 生产者流控, 因为broker处理能力达到瓶颈, 主要方式是拒绝send请求. <br />消费者流控, 因为消费能力达到瓶颈, 主要方式是降低拉取频率. |

## 架构设计

![基础架构图](./rocketmq/img/rocketmq_architecture.png)

由上图可知, RocketMQ的基础架构分为四个模块, 每个模块都可以进行分布式集群部署.

### NameServer

一个相当简单的Topic路由注册中心, 支持Broker的动态注册与发现. 主要包含以下两个功能,

1. Broker管理, 接受broker集群的注册信息, 还提供了心跳检测机制, 检查broker的存活状态.
2. 路由信息管理, 将broker的注册信息保存下来, 并作为路由信息提供给producer和consumer.

nameServer通常也是集群部署, 但是各实例之间不进行信息通信, broker会向每一个nameServer注册自己的路由信息, 所以每一个nameServer都保存有一份完整的路由信息, 这样做的好处, nameServer被设计的相当轻量化.

### BrokerServer

负责消息的存储, 投递和查询, 以及保证服务的高可用.

broker的支持的相关配置如下.

```yaml
# namesrv的地址，可以是多个，用分号隔开
namesrvAddr=127.0.0.1:9876;127.0.0.1:9877
# broker集群的名称
brokerClusterName = DefaultCluster
# 当前broker的名称，master和slave通过相同的broker名称来标识关联关系
brokerName = broker-a
# 一个master可以有多个slave，0表示master节点，大于0的值表示slave节点
brokerId = 0
# 与fileReservedTime参数配合，表示在几点执行删除动作，默认是凌晨4点
deleteWhen = 04
# 在磁盘上保存消息的时长，单位是h，默认48h后自动删除
fileReservedTime = 48
# 当前节点的角色，默认有3个角色，SYNC_MASTER、ASYNC_MASTER、SLAVE，
# sync和async的区别是：当消息到来时，是否需要将数据同步到slave之后再回复成功
brokerRole = ASYNC_MASTER
# 刷盘策略，默认有2个策略，SYNC_FLUSH、ASYNC_FLUSH，
# sync就是同步刷盘，即必须消息刷写到磁盘之后再回复成功，async就是异步刷盘，即消息写到操作系统的page_cache之后就可回复成功
flushDiskType = ASYNC_FLUSH
# broker监听的端口号，如果一台机器上启动了多个broker，则要将端口号设置为不同的，避免冲突
listenPort=10911
# 存储消息和一些配置信息的根目录
storePathRootDir=/xxx/env/rocketmq/store-a-m
```

### Producer

消息发布的角色, producer通过mq的负载均衡模块选择相应的broker集群队列进行消息投递, 投递支持快速失败并且低延迟.

### Consumer

消息消费的角色, 同时支持push(推模式)和pull(拉模式)对消息进行消费, 同时支持集群方式和广播方式消费消息.

### 消息存储

![结构图](./rocketmq/img/rocketmq_design_1.png)

rocketmq是将消息存储到磁盘上的.

#### 消息存储架构

从上面的结构图中可以看到, 消息的存储主要由以下三个文件构成.

##### CommitLog

消息主体及元数据主体, 存储从producer端写入的消息主体内容, 消息内容是不定长的. 单个文件大小默认为1G, 主要是顺序写入日志文件, 写满之后继续写下一个文件.

##### ConsumeQueue

消息消费队列(有点类似于kafka的分区概念, 但是并不一样), 引入的目的主要是为了提高消费消息的性能, 由于rocketmq是基于主题topic的订阅模式, 消息消费是对于主题来进行的, 如果直接遍历CommitLog, 根据topic检索消息, 效率太低, 所以consumer可以根据ConsumeQueue来查找待消费的消息, 可以认为, ConsumeQueue是逻辑消费队列, 是commitlog的消息索引, 它里边具体保存了指定topic的消息在CommitLog中的起始物理偏移量offset, 消息大小size, tag的hashcode值.文件存储位置为: `$HOME/store/consumequeue/{topic}/{queueId}/{fileName}` .

##### IndexFile

索引文件, 提供了一种根据key或者时间区间来查询消息的方法, 文件名以创建时的时间戳命名, 固定的单个文件大小约为400M, 一个indexFile大概可以保存2000w个索引, 基于hash索引实现. 文件存储位置为: `$HOME/store/index${fileName}`.

从上面的结构图可以看出, rocketmq是混合型的存储结构, 单个broker实例下所有的队列消息, 共用同一个CommitLog来存储, 针对producer和consumer分别采用了数据和索引相分离的存储结构, 具体步骤如下,

1. producer发送消息到broker, 然后broker端采用同步或者异步的方式将消息持久化到CommitLog日志文件中,
2. consumer定期到broker端拉取消息, 如果无法拉取消息, 则可以等待下一次拉取, 并且服务端支持长轮询的模式, 如果一个consumer请求没有拉取到消息, broker允许它等待30s, 如果这段时间有消息到达, 就可以直接返回给消费端.

#### 页缓存内存映射

页缓存(PageCache)是OS对文件的缓存, 用于加速对文件的读写, 一般来说, 程序对文件进行顺序读写的速度接近于内存的读写速度, 其主要原因就是因为OS使用了PageCache机制, 对读写访问操作进行了性能优化, 将一部分内存用作了PageCache.

在rocketmq中, ConsumeQueue存储的数据其实是比较少的, 而且又是顺序读取, 所以在PageCache的预读取机制下, ConsumeQueue文件的读性能接近读内存, 所以即便是消费堆积, 也不会太影响性能.

但是对于CommitLog来说, 读取消息时还是会产生比较多的随机读取, 比较影响性能, 所以这个时候, 如果能采取合适的调度算法, 比如"Deadline", 能提升一些随机读的性能.

另外, rocketmq还通过使用MappedByteBuffer对文件进行读写操作, 它利用了NIO的FileChannel模型, 将磁盘上的文件直接映射到用户态的内存地址(这种Mmap的方式, 主要是减少的传统IO在操作系统内核空间缓冲区和用户程序地址空间缓冲区之间来回进行拷贝的性能开销), 这样, 将对文件的操作, 转化成直接对内存地址进行操作, 极大地提高了文件的读写效率(也正是因为需要使用内存映射机制, rocketmq的文件存储才都使用了定长结构).

**这里需要注意的是, rocketmq使用的是Mmap来实现零拷贝的, 而kafka是通过sendFile来实现零拷贝的.**

#### 消息刷盘

* 同步刷盘, 只有在消息真正持久化到磁盘后, rocketmq的broker端才会返回给producer端一个成功的ack响应, 同步刷盘对mq消息可靠性来说, 是一种不错的保证, 但是性能上会有较大的影响, 一般适用于对消息可靠性要求很高的业务场景,
* 异步刷盘, 能够充分利用OS的PageCache的优势, 只需要将消息写入PageCache即可返回ack给producer端, 消息刷盘主要采用后台异步线程提交的方式, 降低了读写延迟, 提高了性能和吞吐量.

### 消息过滤

rocketmq 是在consumer端订阅消息时, 再做消息过滤的, 在上面讲解rocketmq的存储结构时, 有提到ConsumeQueue这个索引文件, 那consumer实际上就是先从ConsumeQueue中拿到一个索引, 然后再到CommitLog中去读取消息的实体, 而在ConsumeQueue的存储结构中可以看到, 有一个8字节的Message Tag的hash值, 所以, 基于Tag的消息过滤就是基于这个字段值.

![](./rocketmq/img/rocketmq_design_7.png)

#### Tag 过滤

rocketmq的consumer在订阅消息时, 可以指定一个或多个Tag, 用||分隔, 其中, consumer端会将这个订阅请求构建成一个 SubscriptionData , 然后发送一个Pull请求给broker, broker在读取Store文件存储层的数据之前, 会先构建一个MessageFilter传给Store, 之后, Store会从ConsumeQueue读取一条记录, 根据记录的hash值去过滤, 因为可能会有hash冲突, 所以consumer拉到消息之后, 会对消息的原始tag进行对比, 只有相同的时候, 才会消费消息.

#### SQL92 过滤

如果想要使用SQL92的过滤方式, 首先要在broker.conf中添加以下配置.

```json
// 是否支持根据属性过滤 如果使用基于标准的sql92模式过滤消息则改参数必须设置为true
enablePropertyFilter=true
```

SQL92过滤和Tag过滤差不多,  只不过是在Store层的过滤方式不太一样, 真正的SQL expression 的构建和执行是由rocketmq-filter模块负责的, SQL92的表达式上下文是消息的属性, 而且, 因为SQL92属性是写到消息体中的, 所以需要从CommitLog获取到消息后, 解码再进行判断, 性能相对于Tag过滤稍微差一点, 但是在broker端就可以准确过滤.

rocketmq只支持简单的SQL92的查询, 如下,

##### 数值比较

- 数值比较, 例如>, >=, <, <=, BETWEEN, =;
- 字符比较, 例如 =, <>, IN;
- IS NULL 或者 IS NOT NULL;
- 逻辑语法, AND, OR, NOT;

##### 常量类型

- 数值, 例如123, 3.1415;
- 字符, 例如'abc', 必须使用单引号包裹;
- NULL, 特殊常量;
- 布尔类型, TRUE or FALSE;

### 消息查询

rocketmq提供了两种查询消息的方式.

#### 基于MessageId查询

MessageId是rocketmq自动生成的, 长度一共16字节, 包含消息存储主机地址(ip+端口), 消息的CommitLog offset, 所以, 根据MessageId查询时, Client端会解析处broker地址和CommitLog的偏移地址, 然后发送一个RPC请求(请求码: VIEW_MESSAGE_BY_ID)到broker, broker端会通过调用QueryMessageProcessor类的processRequest方法处理请求, 然后会根据commitLog的offset和size到CommitLog中找到指定消息, 解析完成后返回给client端.

#### 基于Message Key查询

rocketmq在发送消息时, 也可指定一个唯一的key, 然后也可以根据这个key去查询指定消息, 这个主要是根据上文提到的IndexFile索引文件来实现的, IndexFile索引文件有点类似于hashmap, 如下所示,

![](./rocketmq/img/rocketmq_design_13.png)

可以看到, 索引数据包含了key hash, commitLog offset, timestamp, next index offset这四个字段, next index offset存储的急速前面的slotValue, 如果出现hash冲突, 就可以通过链地址法将几个索引连接起来,

broker端读取消息, 也是通过QueryMessageProcessor类的processRequest方法来处理的, 其过程就是用topic和key找到IndexFile索引文件的一条记录, 然根据其中的commitLog offset到CommitLog中读取消息, 解析完成后返回给client端.

### 通信机制

### 负载均衡

rocketmq的负载均衡, 其实都是在Client端完成的, 具体有两个方面, 即producer端发送消息的负载均衡和consumer端消费消息的负载均衡.

#### Producer

producer端的负载均衡相对来说比较简单, producer在发送消息时, 会现根据topic找到指定的TopicPublishInfo路由信息, 然后, 默认情况下会调用selectOneMessageQueue方法从TopicPublishInfo的messageQueueList中选择一个队列(MessageQueue)发送消息,

具体的容错机制是在MQFaultStrategy类中定义的, 在这个类中有一个变量sendLatencyFaultEnable(默认为false, 即关闭),

1. 如果开启的话, 在随机递增取模的基础上, 会过滤掉not available的broker, "latencyFaultTolerance"的含义就是, 对之前发送失败过的broker, 按一定时间做退避, 比如说, 上次请求的latency超过了550ms, 就退避3000ms之后再请求,
2. 如果关闭的话, 直接按照随机递增取模的方式选择一个队列(MessageQueue)来发送消息,
3. 这里的"latencyFaultTolerance"也就是消息发送高可用的核心所在了.

#### Consumer

在rocketmq中, consumer有两种消费方式, Push和Pull, 这两种方式都是基于拉模式来实现的, Push实际上是对Pull的一种封装, 其实现就是消息拉取线程从broker拉取到一批消息后, 会提交到消费线程池, 然后再到broker拉取消息, 如果未拉取到消息的话, 会在broker端延迟一下等待消息(有超时时间), 这就是rocketmq的"长轮询"模式.

这两种方式, 都需要consumer知道该到哪个broker拉取消息, 所以, consumer端的负载均衡, 其实就是将broker端的多个MessageQueue分配给同一个ConsumerGroup的哪几个consumer进行消费.

consumer端的负载均衡实现, 主要在RebalanceImpl类中,

有几个需要注意的地方, 如下,

1. 如果一个ConsumerGroup下的consumer数量超过了订阅的topic的MessageQueue数量, 那超过的consumer不会消费消息, 这点和kafka差不多,

## 常见问题

## 参考

* [Apache RocketMQ官方文档](http://rocketmq.apache.org/docs/quick-start/)
* [Apache RocketMQ开发者指南](https://github.com/apache/rocketmq/tree/master/docs/cn)
* RocketMQ实战与原理分析

## 附录

### 常用命令

```json
// 下载
// 解压, 编译
unzip rocketmq-all-4.7.1-source-release.zip
cd rocketmq-all-4.7.1/
mvn -Prelease-all -DskipTests clean install -U

cd distribution/target/rocketmq-4.7.0/rocketmq-4.7.0
// 启动nameserver
nohup sh bin/mqnamesrv 
// 查看当前的namesrv日志
tail -f ~/logs/rocketmqlogs/namesrv.log
// 启动rockermq broker
nohup sh bin/mqbroker -n localhost:9876
// 查看当前的broker日志
tail -f ~/logs/rocketmqlogs/broker.log
// 关闭脚本
// 关闭broker
sh bin/mqshutdown broker
// 关闭namesrv
sh bin/mqshutdown namesrv
// 启动rocketmq-console
cd rocketmq/rocketmq-externals/rocketmq-console
java -jar target/rocketmq-console-ng-1.0.1.jar

// 测试生产者生产消息脚本
sh bin/tools.sh org.apache.rocketmq.example.quickstart.Producer
// 测试消费者消费消息脚本
sh bin/tools.sh org.apache.rocketmq.example.quickstart.Consumer
```

