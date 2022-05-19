---
title: 高可用方案
date: 2022-05-09
categories:
- redis
tags:
- redis
sidebar: auto
publish: false
---

**注：在Redis客户端，可以通过以下命令，指定当前的Redis server作为某一台Redis server的slave。**

```json
// 在从节点中设置主节点的IP和端口
slaveof <host> <port>
// 如果主节点有密码，可通过下面的命令设置主节点的密码
config set masterauth <password>
```

## Redis 主从配置

## Redis Sentinel 配置

1. 哨兵模式启动后，如果Redis master宕机，sentinel会选举出一个slave晋升为master，这个过程会导致Redis集群短暂的不可用。
2. 假设一个Redis客户端已经连接上了Redis哨兵集群，此时，Redis Sentinel全部挂掉，这个客户端一样可以正常连接Redis集群，因为它已经记录下了Redis集群中的master的地址；但如果此时，master节点也宕机，则Redis集群不可用，除非master节点重新连接或Redis sentinel重新启动选举出新的master。

## Redis Cluster 配置

