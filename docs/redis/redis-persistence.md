# Redis 持久化策略

## 基础

### Redis 有哪些持久化策略

* rdb
* aof
* aof rewrite
* mix 混合持久化

### aof 重写

### 为什么会出现混合持久化策略，何时进行压缩

### 生产环境应主要用哪种持久化策略

### 配置文件

```json
// rdb持久化使用BGSAVE命令
// rdb持久化执行的规则
// 不持久化
// save ""
// 900s执行了1次更新
save 900 1
// 300s执行了10次更新
// save 300 10
// 60s执行了10000次更新
// save 60 10000

// 当bgsave执行失败后，是否停止接收客户端的写入命令
stop-writes-on-bgsave-error yes
// 是否开启rdb文件压缩
rdbcompression yes
// rdb文件名称
dbfilename dump.rdb

// 开启aof持久化
appendonly yes
// aof文件名称
appendfilename "appendonly.aof"

// 每次命令都先写入aof缓冲区，再写入aof文件，最安全，效率最低
// appendfsync always
// 每次命令都先写入aof缓冲区，每秒自动将缓冲区的内容写入aof文件，最合适
appendfsync everysec
// 只把命令写入aof缓冲区，至于什么时候写入aof文件由操作系统控制，可能会丢失日志
// appendfsync no

// aof重写使用BGREWRITEAOF命令
// aof文件重写触发的条件
// 2. 当aof文件的大小，相比于服务启动时或上一次重写后的文件大小，超过了100%，那就启动重写，配置为0则关闭自动重写
auto-aof-rewrite-percentage 100
// 1. 当aof文件大于64mb时再触发重写
auto-aof-rewrite-min-size 64mb
```



## 源码分析

## 总结
