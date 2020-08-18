# RocketMQ

## command

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

## 应用