# Redis

### Redis 单线程模型

### Redis 数据结构

#### 基本数据类型

* string
* hash
* list
* set
* zset

#### 高级数据类型

* bitmap（位图）
* stream

#### 底层数据结构

* dict（字典）
* sds（可扩展字符串）
* robj（Redis对象）
* ziplist（特殊的双向链表）
* quicklist（快速索引表）
* skiplist（跳表）
* intset（int集合）

**参考文章：[Redis内部数据结构详解](http://zhangtielei.com/posts/server.html)**

### Redis 持久化策略

* rdb
* aof
* mix 混合持久化模式
* 为什么会出现混合持久化策略，
* 生产环境应主要用哪种持久化策略

### Redis 的删除策略

### 缓存的三大问题

* 缓存击穿
* 缓存穿透
* 缓存雪崩
* 延伸问题：缓存和数据库的双写一致性

### 一致性hash算法

### 布隆过滤器

### Redis 主从配置

### Redis Cluster 配置

### 场景分析

* 微博场景如何使用Redis来维护用户关系
* 如何实现排行榜top 10
* 如何实现点赞功能