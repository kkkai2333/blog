# Redis

## Redis是什么

Redis是一个开源的，可持久化的内存数据结构存储服务，可用作数据库、缓存、消息代理。

它支持多种数据结构如string，list，hash，set，sorted set，bitmap，stream等。

并且，它还提供了Redis sentinel、Redis cluster两种高可用架构。

## Redis 为什么快

1. 单线程
2. 底层是IO多路复用机制

## Redis 数据结构

### 基本数据类型

* Binary-safe strings
* Hashes
* Lists
* Sets
* Sorted sets

### 高级数据类型

* bitmaps（位图）
* HyperLogLogs
* Streams

### 底层数据结构

**主要理解sds和skiplist，面试中问的比较多，其他的了解即可。**

* dict（字典）

* sds（可扩展字符串）

* robj（Redis对象）

  ```c
  /* in server.h */
  
  /* The actual Redis Object */
  #define OBJ_STRING 0    /* String object. */
  #define OBJ_LIST 1      /* List object. */
  #define OBJ_SET 2       /* Set object. */
  #define OBJ_ZSET 3      /* Sorted set object. */
  #define OBJ_HASH 4      /* Hash object. */
  
  /* Objects encoding. Some kind of objects like Strings and Hashes can be
   * internally represented in multiple ways. The 'encoding' field of the object
   * is set to one of this fields for this object. */
  #define OBJ_ENCODING_RAW 0     /* Raw representation */
  #define OBJ_ENCODING_INT 1     /* Encoded as integer */
  #define OBJ_ENCODING_HT 2      /* Encoded as hash table */
  #define OBJ_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
  #define OBJ_ENCODING_LINKEDLIST 4 /* No longer used: old list encoding. */
  #define OBJ_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
  #define OBJ_ENCODING_INTSET 6  /* Encoded as intset */
  #define OBJ_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
  #define OBJ_ENCODING_EMBSTR 8  /* Embedded sds string encoding */
  #define OBJ_ENCODING_QUICKLIST 9 /* Encoded as linked list of ziplists */
  #define OBJ_ENCODING_STREAM 10 /* Encoded as a radix tree of listpacks */
  ```

* ziplist（特殊的双向链表）

* quicklist（快速索引表）

* skiplist（跳表）

* intset（int集合）

## Redis 持久化策略

* rdb
* aof
* mix 混合持久化
* 为什么会出现混合持久化策略，何时进行压缩？
* 生产环境应主要用哪种持久化策略

## Redis 的过期删除策略

**Redis的过期删除策略有两种，一种被动删除，一种主动删除。**

**key过期信息存储为绝对的Unix时间戳（ms），这代表Redis的过期策略，对宿主机器时间的稳定性有强要求。**

1. 当有客户端访问一个key时，Redis会检测这个key是否过期，如果过期，会删除这个key。

2. CPU空闲时，执行serverCron定时任务，执行周期为每秒10次（可通过修改配置属性"hz"来修改执行周期），任务分为以下几个步骤：
   1. 每次过期清理时间不超过CPU时间的25%，
   2. 随机选择20个key，判断它们是否过期，如果过期，则删除，
   3. 如果发现一次选择中，有超过25%（默认情况下就是5个）的key都过期了，则重复步骤2，直到随机选择中，过期的key百分比低于25%。

### 副本和aof文件的过期key处理

当Redis判断一组key过期后，就会对这些key同时执行del命令。

这样的话，过期删除的操作就集中在master实例上，aof文件和副本只需要添加和执行同步过来的命令即可。

```c
// expire.c
```

## Redis 的内存逐出策略

逐出算法有两大类：

* LRU
* LFU(Least Frequently Used, 4.0+)

可选的逐出算法：

- no-enviction（驱逐）：禁止驱逐数据，

  ***

- volatile-lru：从已设置过期时间的数据集（server.db[i].expires）中的key使用lru算法淘汰，

- allkeys-lru：从数据集（server.db[i].dict）中的key使用lru算法淘汰，

  ***

- volatile-lfu：对所有设置了过期时间的key使用LFU算法进行淘汰，

- allkeys-lfu：对所有key使用LFU算法进行淘汰，

  ***

- volatile-ttl：从已设置过期时间的数据集（server.db[i].expires）中挑选将要过期的数据淘汰，

  ***

- volatile-random：从已设置过期时间的数据集（server.db[i].expires）中任意选择数据淘汰，

- allkeys-random：从数据集（server.db[i].dict）中任意选择数据淘汰。

```c
// evict.c
int freeMemoryIfNeededAndSafe(void) {
    // 当没有lua脚本执行，并且server不在加载状态时执行freeMemoryIfNeeded()
    if (server.lua_timedout || server.loading) return C_OK;
    return freeMemoryIfNeeded();
}
// 根据逐出策略来清理内存
int freeMemoryIfNeeded(void) {
    // 默认情况下slave不需要执行内存逐出方法，只需要执行master的命令即可，
		if (server.masterhost && server.repl_slave_ignore_maxmemory) return C_OK;
    ...
    // 通过getMaxmemoryState函数，获得当前要释放多少内存mem_tofree
    if (getMaxmemoryState(&mem_reported,NULL,&mem_tofree,NULL) == C_OK)
        return C_OK;
    
    // 当Redis需要清理内存，但是逐出策略又是："MAXMEMORY_NO_EVICTION"（禁止逐出）时，跳转到cant_free代码块
    if (server.maxmemory_policy == MAXMEMORY_NO_EVICTION)
        goto cant_free; /* We need to free memory, but policy forbids. */
    
    while (mem_freed < mem_tofree) {
        sds bestkey = NULL;
        int bestdbid;
				// lru算法、lfu算法、过期键删除
        if (server.maxmemory_policy & (MAXMEMORY_FLAG_LRU|MAXMEMORY_FLAG_LFU) ||
            server.maxmemory_policy == MAXMEMORY_VOLATILE_TTL)
        {
        }
        // 随机删除
        /* volatile-random and allkeys-random policy */
        else if (server.maxmemory_policy == MAXMEMORY_ALLKEYS_RANDOM ||
                 server.maxmemory_policy == MAXMEMORY_VOLATILE_RANDOM)
        {
        }
				// 删除所选的key
        /* Finally remove the selected key. */
        if (bestkey) {
            db = server.db+bestdbid;
            // 获取当前已使用的内存
            delta = (long long) zmalloc_used_memory();
            latencyStartMonitor(eviction_latency);
            // 判断是否为异步删除
            if (server.lazyfree_lazy_eviction)
                dbAsyncDelete(db,keyobj);
            else
                dbSyncDelete(db,keyobj);
            signalModifiedKey(NULL,db,keyobj);
            latencyEndMonitor(eviction_latency);
            latencyAddSampleIfNeeded("eviction-del",eviction_latency);
            // 计算释放了多少内存
            delta -= (long long) zmalloc_used_memory();
            mem_freed += delta;
            ...

            // 当需要释放的内存很大时，在这里可能会花费很多时间，所以循环内部会调用flushSlavesOutputBuffers函数强制刷新到slave
            if (slaves) flushSlavesOutputBuffers();
          	// 当前线程在释放内存时，也有可能其他线程会删除key，所以此处判断一次当前内存是否已降到目标内存（大概是这个意思）
            if (server.lazyfree_lazy_eviction && !(keys_freed % 16)) {
                if (getMaxmemoryState(NULL,NULL,NULL,NULL) == C_OK) {
                    /* Let's satisfy our stop condition. */
                    mem_freed = mem_tofree;
                }
            }
        } else {
            goto cant_free; /* nothing to free... */
        }
    }
    result = C_OK;
    // cant_free只做了一件事情，那就是检查lazyfree线程是否还有任务要执行，然后等待
}
```

```c
{
  /* When evicting a random key, we try to evict a key for
             * each DB, so we use the static 'next_db' variable to
             * incrementally visit all DBs. */
  // 随机删除的策略比较简单，循环遍历每个db，
  // 如果策略是MAXMEMORY_ALLKEYS_RANDOM，获取db-dict，从全部key中随机选择
  // 如果策略是MAXMEMORY_VOLATILE_RANDOM，则获取db->expires，从设置了过期时间的key中随机选择
  for (i = 0; i < server.dbnum; i++) {
    j = (++next_db) % server.dbnum;
    db = server.db+j;
    dict = (server.maxmemory_policy == MAXMEMORY_ALLKEYS_RANDOM) ?
      db->dict : db->expires;
    if (dictSize(dict) != 0) {
      de = dictGetRandomKey(dict);
      bestkey = dictGetKey(de);
      bestdbid = j;
      break;
    }
  }
}
```

```c
// 
```

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

### 延伸问题

* 缓存和数据库的双写一致性

* 大key是如何产生的，多大算大key

* 热key产生的原因及解决方案

## Redis 主从配置

## Redis Sentinel 配置

## Redis Cluster 配置

## 布隆过滤器

## 一致性hash算法

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

### 微博场景如何使用Redis来维护用户关系

### 如何实现排行榜top 10

### 如何实现点赞功能

## 参考

* [Redis内部数据结构详解](http://zhangtielei.com/posts/server.html)
* [Redis官方文档](https://redis.io/documentation)