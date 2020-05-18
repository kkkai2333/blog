# Redis 篇

## 基础

1. Redis是什么

2. Redis 为什么快

3. [Redis 的数据类型](../redis/redis-data-type.md)有哪些

   1. 基本数据类型
      * Binary-safe strings
      * Hashes
      * Lists
      * Sets
      * Sorted sets
      * Streams
   2. 高级数据类型
      * bitmaps（位图）
      * HyperLogLogs
      * Pub/Sub
      * pipeline
      * geo

4. [Redis 的底层数据结构](../redis/redis-data-structure.md)了解过吗

   * dict
   * sds
   * robj
   * ziplist
   * quicklist
   * skiplist
   * intset

5. Redis 的持久化策略

   1. rdb
   2. aof
   3. aof rewrite

6. Redis 的过期删除策略

   1. 被动删除
   2. 主动删除
   3. 内存达到maxmemory后按照内存逐出策略进行删除

7. Redis 的内存逐出策略

   **注，volatile-lru、volatile-ttl、volatile-random在没有符合条件（即所有的key都没有设置过期时间）的key时，逐出行为和no-enviction一致。**

   1. no-enviction（驱逐）：禁止驱逐数据，
   2. volatile-lru：从已设置过期时间的数据集（server.db[i].expires）中的key使用lru算法淘汰，
   3. allkeys-lru：从数据集（server.db[i].dict）中的key使用lru算法淘汰，
   4. volatile-lfu：对所有设置了过期时间的key使用LFU算法进行淘汰，
   5. allkeys-lfu：对所有key使用LFU算法进行淘汰，
   6. volatile-ttl：从已设置过期时间的数据集（server.db[i].expires）中挑选将要过期的数据淘汰，
   7. volatile-random：从已设置过期时间的数据集（server.db[i].expires）中任意选择数据淘汰，
   8. allkeys-random：从数据集（server.db[i].dict）中任意选择数据淘汰。

8. Redis 的qps最高可以达到多少？如何得出的

9. 缓存的三大问题是什么？如何避免？

10. 缓存和 MySQL 的双写一致性如何解决？

11. 了解哪些一致性hash算法

## 配置

1. Redis 主从配置
2. Redis Sentinel 配置
3. Redis Cluster 配置

## 场景分析

1. 微博场景如何使用Redis来维护用户关系，共同好友，共同关注
2. 如何实现排行榜top 10
3. 如何实现点赞功能