# Redis 专题

首先，看一下Redis的知识图谱。

![Redis知识图谱](./img/redis.jpg)

## Redis是什么

Redis是一个开源的，可持久化的内存数据结构存储服务，可用作数据库、缓存、消息代理。

它支持多种数据结构如string，list，hash，set，sorted set，bitmap，stream等。

并且，它还提供了Redis sentinel、Redis cluster两种高可用架构。

## Redis 为什么快

1. 基于内存
2. 单线程
3. IO多路复用机制
