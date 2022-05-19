---
title: AOP
date: 2022-05-09
categories:
- spring
tags:
- spring
- aop
sidebar: auto
publish: false
---

## 问题

### 什么是 AOP

### AspectJ又是什么

### 什么是切点（pointcut）

### 支持的切点类型（pointcut）

* execution
* within
* this
* target
* args
* @target
* @args
* @within
* @annotation

### 什么是通知（advice）

### 有几种通知类型（advice）

* @Before
* @AfterReturning
* @AfterThrowing
* @After
* @Around

### spring 是如何完成aop的

## 源码分析

### AopProxy

#### JdkDynamicAopProxy

#### CglibAopProxy

### AopProxyFactory

### DefaultAopProxyFactory

### AbstractAutoProxyCreator

spring aop定义的一个后置处理器，在spring 生命周期中，调用beanPostProcessor的after方法时，会调用这个后置处理器。

### AopAutoConfiguration

spring boot 中，aop的自动配置类。

### jdk proxy 和 cglib 在代理上有什么区别，为什么

1. proxy 只能代理接口。
   1. 简单点讲，通过反编译Proxy生成的代理类，可以看到，代理类继承了Proxy类，实现了XX目标接口。那么，由于Java是单继承的，由此可以证明，为什么基于Proxy的动态代理只能代理接口。
   2. 复杂点讲，直接看下源码。
2. cglib 会默认生成一个代理类的子类，所以可以代理Java类，但是这要求被代理的类不能是final的。

## 扩展

在spring 5.x中，默认配置下，

1. 如果代理的是一个接口，spring 会使用 jdk Proxy 动态代理，也就是使用JdkDynamicAopProxy类生成代理类。

2. 如果代理的是一个类，spring 会使用 cglib 动态代理，也就是使用CglibAopProxy类生成代理类。

3. 可以通过以下配置让spring 只使用 cglib 代理。

   ```java
   // proxyTargetClass = true，代表使用cglib代理
   @EnableAspectJAutoProxy(proxyTargetClass = true)
   public class AppConfig {
   }
   ```

在spring boot 2.x中，默认使用cglib代理。