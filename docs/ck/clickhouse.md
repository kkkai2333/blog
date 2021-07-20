---
title: ClickHouse 基础
date: 2021-04-21
categories:
- clickhouse
tags:
- clickhouse
sidebar: auto
publish: false
---

## 环境搭建

### 安装

首先, 

因为clickhouse(下面简称ck)需要使用SSE 4.2指令集, 所有先执行以下命令检查当前CPU是否支持该指令集.

```shell
grep -q sse4_2 /proc/cpuinfo && echo "SSE 4.2 supported" || echo "SSE 4.2 not supported"
```

### 单机

### 集群

## 测试

```sql
-- 测试clickhouse-local
cho -e "1\n2\n3" | clickhouse-local -q "create table test_table(id Int64) engine=File(CSV, stdin); select id from test_table;"
-- 打印系统用户内存用量
ps aux | tail -n +2 | awk '{ printf("%s\t%s\n", $1, $4)}' | clickhouse-local -S "user String, memory Float64" -q "select user, round(sum(memory), 2) as memoryTotal from table group by user order by memoryTotal desc format Pretty"
-- clickhouse-benchmark 测试sql性能
echo "select * from system.numbers limit 100" | clickhouse-benchmark -i 5 loaded 1 queries.
```



## 参考

* 朱凯. ClickHouse 原理解析与应用实践

