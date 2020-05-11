# MQ

**注：我认为，MQ是加分项，简单会使用即可，因为主要侧重于应用方向**

## RabbitMQ

### command

```json

```



## RocketMQ

### command

```json
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
// 关闭broker
sh bin/mqshutdown broker
// 关闭namesrv
sh bin/mqshutdown namesrv
```



## kafka

### command

```json

```



## 面试问题连环炮

1. 为什么要用mq
   1. 解耦
   2. 异步
   3. 削峰
2. 用了mq之后有什么坏处
   1. 系统可用性降低
   2. 系统复杂性升高
   3. 数据一致性问题
3. mq有好几种，为什么选择了这个，是否有调研过，是否了解每种mq的优缺点