# Spring 后置处理器

**OK，废话不多说，今天我们来聊一下，spring 的后置处理器。**

## 问题

1. 有哪些后置处理器？作用是什么？
2. Spring有哪些扩展点？
3. 如何基于后置处理器来扩展Spring功能？

## 源码分析

**先放一张图，看一下目前spring中有哪些后置处理器。**

![BeanPostProcessor继承类图](./spring/BeanPostProcessor-extends.png)

**各种Aware**



**然后，理解两个单词的含义，本文会大量出现这两个单词，需要分清楚。**

1. Instantiation：实例化
2. Initialization：初始化

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

1. AutowiredAnnotationBeanPostProcessor

