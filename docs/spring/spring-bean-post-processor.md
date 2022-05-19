---
title: 后置处理器(bean processor)
date: 2022-05-09
categories:
- spring
tags:
- spring
sidebar: auto
publish: false
---

**OK，废话不多说，今天我们来聊一下，spring 的后置处理器。**

## 问题

1. 有哪些后置处理器？作用是什么？
2. ConfigurationClassPostProcessor的作用是什么？
3. Spring有哪些扩展点？
4. 如何基于后置处理器来扩展Spring功能？

## 源码分析

**先放一张类图，看一下目前spring中有哪些后置处理器（不完整，这里是以spring bean生命周期中出现的几个后置处理器为例进行分析）。**

**BeanPostProcessor**

![BeanPostProcessor](./img/BeanPostProcessor.png)**BeanFactoryPostProcessor**

**FactoryBean**

**ImportBeanDefinitionRegistrar**

**ConfigurationClassPostProcessor**

**三种spring bean 生命周期中出现的Aware**

![Aware](./img/Aware.png)

**然后，理解两个单词的含义，本文会大量出现这两个单词，需要分清楚。**

1. Instantiation：实例化
2. Initialization：初始化

**接下来，开始分析源码**

1. 首先，我们先看下后置处理器的最原始的接口，可以看到，默认的BeanPostProcessor中的两个方法都是默认方法（jdk 8的新特性），并且没有对bean做任何处理，直接返回。

   ```java
   public interface BeanPostProcessor {
   
     // 初始化前调用
   	@Nullable
   	default Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
   		return bean;
   	}
   	// 初始化完成后调用
   	@Nullable
   	default Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
   		return bean;
   	}
   }
   ```

2. 其次，是另一个比较关键的接口类。

   ```java
   public interface InstantiationAwareBeanPostProcessor extends BeanPostProcessor {
   
     // 实例化之前调用
   	@Nullable
   	default Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) throws BeansException {
   		return null;
   	}
   	// 实例化完成后调用
   	default boolean postProcessAfterInstantiation(Object bean, String beanName) throws BeansException {
   		return true;
   	}
     // 可以给一些属性赋值
   	@Nullable
   	default PropertyValues postProcessPropertyValues(
   			PropertyValues pvs, PropertyDescriptor[] pds, Object bean, String beanName) throws BeansException {
   
   		return pvs;
   	}
   
   }
   ```

ConfigurationClassPostProcessor

AutowiredAnnotationBeanPostProcessor

CommonAnnotationBeanPostProcessor

AbstractAutoProxyCreator

## 总结