# 高并发系统设计

## 设计一个秒杀系统

### 需要考虑的问题

1. 防止超卖
2. 避免缓存出现宕机
3. 服务降级，限流，熔断

### 解决思路

1. 首先考虑单一原则，我们专门设计一个秒杀系统，使用单独的数据库，这样的话，即便秒杀系统挂了，也不会影响其他服务。
2. 秒杀系统集群部署，既然单机服务怕挂掉，那我就多部署几个服务，前端可以通过Nginx进行负载均衡。
3. Redis也进行集群部署，主从模式/Sentinel 哨兵模式/cluster 集群模式
4. 缓存预热，把相关的商品信息，秒杀数量等等全都加载到缓存中，尽量保证在秒杀阶段这些信息都能命中缓存。
5. 静态资源加载到cdn中，尽量减少前端服务的压力。
6. 对请求URL进行加密，避免有人直接通过查看服务端URL写脚本发送大量请求。
7. 在前端页面做限流，间隔100ms（配置）之内的重复点击，不发送请求。
8. 在网关层做限流，同一个ip地址的请求超过10次（配置）后即不做处理，避免有人通过查看url直接把请求打到服务端。
9. 在service层，先抢库存，写一个lua脚本，有库存时就-1返回true，没库存时就返回false。
10. 当service层返回false时，前端可以直接提示用户秒杀失败，这样就避免了用户的无效点击（对用户来说无效，但是对系统来说可是实打实的一次请求，所以此处也是限流）。
11. 当某个请求抢库存成功之后，将创建订单的动作组装一个message发布到mq中，订单系统从mq中接受message开始真正的创建订单。
12. 创建订单完成后，可以异步发送消息提示用户，秒杀成功。
13. ~~如果有多种商品秒杀，上述第9步也有可能发生单点故障，毕竟Redis的qps也是有上限的，即便是我们做了集群部署。那么此时可以考虑，把减库存、创建订单两个动作组装成一个message发布到mq中，然后异步处理。~~
14. 服务降级其实就是考虑到资源不够用的问题，由于此时我们主要考虑秒杀系统，所以可以把用户管理、地址管理等等服务降级。
15. 上述设计中，步骤7，8，9，10其实都属于限流操作。
16. 上述设计中，其实没有具体的熔断措施，但是，因为一开始，就把秒杀系统做成了一个独立的系统，并且与其他系统的交互都是通过mq，所以即便是秒杀系统宕机，也不会影响其他服务。

**注：考虑到Redis的访问速度很快，一般的秒杀可以参考思路9、10，如果是商品很多的秒杀活动，可以把步骤9、10更换为步骤11。**

## 分布式锁

### zookeeper 实现

### Redis 实现

### MySQL 实现

## 分布式事务

### tcc（两阶段提交协议）

### 最大努力保证模式

### 事务补偿机制

## 负载均衡

### 硬件负载均衡

#### F5

### 软件负载均衡

#### 四层负载均衡

##### lvs

#### 七层负载均衡

##### Nginx

upstream 配置

```nginx
Syntax: upstream name { ... }
Default: -
Context: http
// Nginx负载均衡支持将客户端请求代理转发到一组upstream虚拟服务池

upstream load_pass {
 ip_hash; // 采用ip_hash的调度算法
 // 下面是轮询的调度算法
 server 10.0.0.6:80 weight=5; // 当前节点的权重是5
 server 10.0.0.7:80 down; // 当前节点是宕机的，不参与负载
 server 10.0.0.8:80 backup; // 预留的备份服务器
 server 10.0.0.9:80 max_conns; // max_conns：当前节点支持的tcp最大连接数
 server 10.0.0.10:80 max_fails=1 fail_timeout=10s; // max_fails：允许请求失败的次数 fail_timeout：超过最大的失败次数后，服务暂停访问的时间
 // 健康检查需要依赖第三方模块：nginx_upstream_check_module
 # interval 检测间隔时间，单位为毫秒
 # rise 表示请求2次正常，标记此后端的状态为up
 # fall 表示请求3次失败，标记此后端的状态为down
 # type 类型为tcp
 # timeout 超时时间，单位为毫秒
 check interval=3000 rise=2 fall=3 timeout=1000 type=tcp;
}

server {
  listen 80;
  server_name xxx.aaa.com;
  location / {
  proxy_pass http://load_pass;
  include proxy_params;
  // 当出现指定错误时，将请求转移到其他节点上
  proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
  }
}

```

```nginx
// proxy_params的配置
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 
proxy_connect_timeout 30;
proxy_send_timeout 60;
proxy_read_timeout 60;
 
proxy_buffering on;
proxy_buffer_size 32k;
proxy_buffers 4 128k;
```

调度算法

1. 轮询
2. 加权轮询
3. ip_hash

##### HAProxy

#### 阿里云SLB

## 了解哪些限流方案

## 如何实现一个熔断器

