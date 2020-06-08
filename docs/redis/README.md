# Redis 专题

首先，看一下Redis的知识图谱。

![Redis知识图谱](./redis/redis.jpg)

## Redis是什么

Redis是一个开源的，可持久化的内存数据结构存储服务，可用作数据库、缓存、消息代理。

它支持多种数据结构如string，list，hash，set，sorted set，bitmap，stream等。

并且，它还提供了Redis sentinel、Redis cluster两种高可用架构。

## Redis 为什么快

1. 基于内存
2. 单线程
3. IO多路复用机制

## 布隆过滤器

## 一致性hash算法

## 缓存的三大问题

### 缓存击穿

**当许多请求在访问同一个key时，这个key失效了，导致大量请求打到数据库上。**

#### 问题

数据库的访问量突增，压力变大，可能会导致数据库宕机。

#### 解决方案

加锁，当缓存的key为空时，对第一个到数据查询的线程加锁，把其他线程拦在后边，当第一个线程查询到数据，然后重建缓存后，其他线程就可以直接从缓存中获取数据。

### 缓存穿透

**查询不存在的数据，比如说，缓存和数据库中都没有查询key，导致每次都要到数据库中查询。**

#### 问题

如果有黑客使用不存在的key对系统进行访问，就会导致全部的请求打到数据库上，数据库的访问量突增，压力变大，可能会导致数据库宕机。

#### 解决方案

1. 缓存null值
2. BloomFilter

### 缓存雪崩

**在某一时刻，大量和缓存失效，导致原本应该访问缓存的请求全部打在数据库上。**

#### 问题

大量缓存失效，导致全部的请求打到数据库上，数据库的访问量突增，压力变大，可能会导致数据库宕机。

#### 解决方案

### 热点key集中失效（缓存雪崩的变种）

#### 解决方案

给不同的key设置不同的缓存时间，比如说，在固定时间上再加一个随机值。

### 缓存和数据库的双写一致性

#### 问题

#### 解决方案

### 延伸问题

* 大key是如何产生的，多大算大key

* 热key产生的原因及解决方案

## 场景分析

### 如何测试Redis支持的最大qps、tps

Redis发行版本中，提供了redis-benchmark性能测试工具，我们可以通过以下命令来测试Redis支持的并发性。

```java
// 
redis-benchmark [-h <host>] [-p <port>] [-c <clients>] [-n <requests]> [-k <boolean>]
 -h <hostname>      Server hostname (default 127.0.0.1)
 -p <port>          Server port (default 6379)
 -s <socket>        Server socket (overrides host and port)
 -a <password>      Password for Redis Auth
 -c <clients>       Number of parallel connections (default 50)
 -n <requests>      Total number of requests (default 100000)
 -d <size>          Data size of SET/GET value in bytes (default 2)
 --dbnum <db>       SELECT the specified db number (default 0)
 -k <boolean>       1=keep alive 0=reconnect (default 1)
 -P <numreq>        Pipeline <numreq> requests. Default 1 (no pipeline).
 -q                 Quiet. Just show query/sec values
 -t <tests>         Only run the comma separated list of tests. The test
                    names are the same as the ones produced as output.
// -h host地址
// -p 端口号
// -c 总客户端数
// -n 总请求数
// -d 每个请求的数据包大小(kb)
redis-benchmark -h 127.0.0.1 -p 6379 -c 50 -n 100000 -d 2 -k 1
```

## 参考

* [Redis内部数据结构详解](http://zhangtielei.com/posts/server.html)
* [Redis官方文档](https://redis.io/documentation)