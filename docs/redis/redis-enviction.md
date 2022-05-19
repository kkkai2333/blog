---
title: 内存逐出策略
date: 2022-05-09
categories:
- redis
tags:
- redis
sidebar: auto
publish: false
---

## 基础

### 配置文件

```json
// redis.conf
// 配置可使用的内存上限，设置为0代表没有内存限制
maxmemory 100mb
// 配置内存达到上限后，使用的逐出策略，默认是noeviction
maxmemory-policy noeviction
// lru内存逐出和最小过期超时的策略执行时，会通过抽样检测的方式，
// samples配置就是每次逐出时选取的样本数量
maxmemory-samples 5
```

### 可选的逐出算法

- noenviction（驱逐）：禁止驱逐数据，

- volatile-random：从已设置过期时间的数据集（server.db[i].expires）中任意选择数据淘汰，

- allkeys-random：从数据集（server.db[i].dict）中任意选择数据淘汰，

- volatile-ttl：从已设置过期时间的数据集（server.db[i].expires）中挑选将要过期的数据淘汰，

  ***

- volatile-lru：从已设置过期时间的数据集（server.db[i].expires）中的key使用lru算法淘汰，

- allkeys-lru：从数据集（server.db[i].dict）中的key使用lru算法淘汰，

- volatile-lfu：对所有设置了过期时间的key使用LFU算法进行淘汰，

- allkeys-lfu：对所有key使用LFU算法进行淘汰。

**LRU，最近最少使用逐出**

**LFU(Least Frequently Used, 4.0+)，最不常用逐出**

**注，volatile-lru、volatile-ttl、volatile-random在没有符合条件（即所有的key都没有设置过期时间）的key时，逐出行为和no-enviction一致。**

## 源码分析

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

## 总结