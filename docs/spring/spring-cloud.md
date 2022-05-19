---
title: Spring Cloud
date: 2022-05-09
categories:
- spring cloud
tags:
- spring cloud
sidebar: auto
publish: false
---

## Spring Cloud Netflix

## Spring Cloud Alibaba

```yaml
# spring feign 配置

# 开了熔断器
feign.hystrix.enabled=true
# 启用hystrix的配置，即5s后超时，默认是1s
hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds=5000

# 不开熔断器
feign.hystrix.enabled=false
# 启用feign.client.config的配置，即当connect超过3s后抛错，read超过3s后抛错
# 如果没有配置，则一直连接直到返回，貌似没有超时时间，我sleep一分钟都还在等待返回
feign.client.config.default.connectTimeout=3000
feign.client.config.default.readTimeout=3000
```

