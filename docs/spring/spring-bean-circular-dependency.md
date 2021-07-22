---
title: Spring Bean 循环依赖
date: 2020-10-27
categories:
- spring
tags:
- spring
sidebar: auto
publish: true
---

## 问题

1. Spring Bean 是否支持循环依赖?
2. 如何实现的?
3. 为什么要使用三级缓存?
4. 构造器注入的情况是否支持循环依赖?

## 答案

1. Spring 默认支持循环依赖, 并且可以关闭,

2. Spring 通过提前将创建中的bean的工厂暴露出来, 来解决bean的循环依赖,

   这里可以稍微延伸下：通过查看源码, 我们可以了解到, Spring定义了三级缓存, 从上到下分别是,

   1. `singletonObjects`, 单例池, 存放已经创建好的bean; 
   2. `earlySingletonObjects`, 第一次通过`singletonFactories`中的工厂bean的getObject方法获取到bean时, 会将生成的bean放到`earlySingletonObjects`中, 然后删除`singletonFactories`中对该工厂bean的引用;
   3. `singletonFactories`, 存放提前暴露出来的bean的工厂实例; 

3. 简单点说, 通过bean的包装工厂, 去生成一个bean, 可能是要经过很多步骤（比如说通过后置处理器生成aop代理对象, 这个我们写aop的时候会讲到）, 那么, 既然我们第一次调用getObject方法时, 已经完成了这些步骤, 得到了处理好的bean对象, 此时就可以把它缓存起来, 以供其他的bean使用, 加快bean的初始化速度,

4. 不支持, 因为提前暴露bean到`singletonFactories`是在bean实例化之后进行的操作, 下面展示了创建bean的方法.

   ```java
   protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
       throws BeanCreationException {
   
       // Instantiate the bean.
       BeanWrapper instanceWrapper = null;
       if (mbd.isSingleton()) {
           instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
       }
       if (instanceWrapper == null) {
           /**
            * 创建一个bean实例，并且包装成一个BeanWrapper，其中有3中创建方式
            * 1. 通过其工厂类进行创建
            * 2. 如果配置了构造方法，优先调用构造方法去创建bean实例
            * 3. 通过无参构造方法创建bean实例
            * 如果bean的配置信息中配置了lookup-method和replace-method，在这里也会对bean做增强
            * 
            * 1. 在这里, 已经调用当前bean所属类的构造方法实例化完成了
            */
           instanceWrapper = createBeanInstance(beanName, mbd, args);
       }
       // 省略一些代码
       ...
       // 是否允许当前bean暴露早期引用，条件是：1. 单例bean 2. 允许循环依赖 3. 当前bean正在创建中
       // Eagerly cache singletons to be able to resolve circular references
       // even when triggered by lifecycle interfaces like BeanFactoryAware.
       boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
                                         isSingletonCurrentlyInCreation(beanName));
       if (earlySingletonExposure) {
           if (logger.isDebugEnabled()) {
               logger.debug("Eagerly caching bean '" + beanName +
                            "' to allow for resolving potential circular references");
           }
           // 此处，将当前正在初始化的bean的工厂类添加到了DefaultSingletonBeanRegistry的singletonFactories（循环依赖的第三级缓存）集合中，并且将beanName放到registeredSingletons集合中
           // 2. 而提前暴露bean是在这里处理的, 所以构造器注入的方式无法解决循环依赖
           addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
       }
       // 省略一些代码
       ...
   ```

## 源码分析

OK, 下面, 就分析下Spring的源码, 来验证我们的观点. 

**主要是对源码进行分析, 搭建出主线脉络**

首先, 我们可以查看`org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory`的源码, 其中有一个属性是`allowCircularReferences`, 默认为true, 看到注释, 我们大概可以猜到, 这个参数就是为了解决循环依赖的. 

```java
/** Whether to automatically try to resolve circular references between beans. */
	private boolean allowCircularReferences = true;
```

当然, 我们也可以关闭对循环依赖的支持, 我们以`AnnotationConfigApplicationContext`举例：

```java
AnnotationConfigApplicationContext applicationContext = new AnnotationConfigApplicationContext();
// 关闭循环依赖
        applicationContext.setAllowCircularReferences(false);
```

那我们继续向下看, 通过上一篇文章**spring bean 的生命周期**, 我们大概了解了spring bean 的初始化过程, 那对循环依赖的支持的第一步操作, 其实就在创建bean这里, 请看源码：

```java
protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
			throws BeanCreationException {
  	// 这里, 我们忽略一些无关源码
  	...
    
		// 看这里, 当bean是单例的（我们创建的就是单例的bean, 所以这个条件成立）, 
  	// 并且, allowCircularReferences=true（默认允许循环依赖）, 
  	// 并且, isSingletonCurrentlyInCreation(beanName), 字面意思, 这个bean是不是在创建中
  	// 当上述条件都满足时, 会把当前正在创建的bean的工厂bean添加到singletonFactories（是个map, 也就是所谓的一级缓存）中, 此时虽然当前bean还没有完成初始化, 但是, 这个bean的访问入口已经提前暴露出来了. 
      
		// Eagerly cache singletons to be able to resolve circular references
		// even when triggered by lifecycle interfaces like BeanFactoryAware.
		boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
				isSingletonCurrentlyInCreation(beanName));
		if (earlySingletonExposure) {
			if (logger.isTraceEnabled()) {
				logger.trace("Eagerly caching bean '" + beanName +
						"' to allow for resolving potential circular references");
			}
      // put到singletonFactories中
			addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
		}
  	
  	// Initialize the bean instance.
		Object exposedObject = bean;
		try {
      // 这里有段关键代码, 里边有处理@Autowired和@Resources的逻辑, 我们放到最后进行分析【3】
			populateBean(beanName, mbd, instanceWrapper);
			exposedObject = initializeBean(beanName, exposedObject, mbd);
		}
		catch (Throwable ex) {
			if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
				throw (BeanCreationException) ex;
			}
			else {
				throw new BeanCreationException(
						mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
			}
		}
  
		// 忽略一些无关源码
		...
	}
```

```java
// 将当前bean提前暴露出来, 即将该bean的工厂实例添加到singletonFactories（是个map, 也是所谓的一级缓存）中
protected void addSingletonFactory(String beanName, ObjectFactory<?> singletonFactory) {
		Assert.notNull(singletonFactory, "Singleton factory must not be null");
		synchronized (this.singletonObjects) {
			if (!this.singletonObjects.containsKey(beanName)) {
				this.singletonFactories.put(beanName, singletonFactory);
				this.earlySingletonObjects.remove(beanName);
				this.registeredSingletons.add(beanName);
			}
		}
	}
```

```java
// 判断当前bean是否正在创建中, 其实主要就是判断singletonsCurrentlyInCreation中是否包含这个beanName, 下文会有分析, 是何时将该beanName添加到set集合中的
public boolean isCurrentlyInCreation(String beanName) {
		Assert.notNull(beanName, "Bean name must not be null");
		return (!this.inCreationCheckExclusions.contains(beanName) && isActuallyInCreation(beanName));
	}

	protected boolean isActuallyInCreation(String beanName) {
		return isSingletonCurrentlyInCreation(beanName);
	}

	/**
	 * Return whether the specified singleton bean is currently in creation
	 * (within the entire factory).
	 * @param beanName the name of the bean
	 */
	public boolean isSingletonCurrentlyInCreation(String beanName) {
		return this.singletonsCurrentlyInCreation.contains(beanName);
	}
```

上述源码, 展示了spring 是在什么时候讲 bean提前暴露出来的, 下面, 我们看一下, spring是如何获取这个bean来解决循环依赖的. 

同样, 根据**spring bean 的生命周期**, 我们了解到, spring是通过调用`org.springframework.beans.factory.support.AbstractBeanFactory#doGetBean`方法来获取/生成bean的, 源码如下：

```java
protected <T> T doGetBean(final String name, @Nullable final Class<T> requiredType,
			@Nullable final Object[] args, boolean typeCheckOnly) throws BeansException {

		final String beanName = transformedBeanName(name);
		Object bean;
  
		// 其实, 问题的关键就在getSingleton()方法这里, 我们向下看一下它的源码【1】
		// Eagerly check singleton cache for manually registered singletons.
		Object sharedInstance = getSingleton(beanName);
		if (sharedInstance != null && args == null) {
			if (logger.isTraceEnabled()) {
				if (isSingletonCurrentlyInCreation(beanName)) {
					logger.trace("Returning eagerly cached instance of singleton bean '" + beanName +
							"' that is not fully initialized yet - a consequence of a circular reference");
				}
				else {
					logger.trace("Returning cached instance of singleton bean '" + beanName + "'");
				}
			}
			bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
		}
		else {
			
      // 这里, 忽略了一些代码
      ...

			try {
				final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
				checkMergedBeanDefinition(mbd, beanName, args);

        // 这里, 忽略了一些代码
        ...

				// Create bean instance.
				if (mbd.isSingleton()) {
          
          // 第二个关键点, 这里又调用了一次getSingleton的重载方法, 往下拖看源码【2】
					sharedInstance = getSingleton(beanName, () -> {
						try {
							return createBean(beanName, mbd, args);
						}
						catch (BeansException ex) {
							// Explicitly remove instance from singleton cache: It might have been put there
							// eagerly by the creation process, to allow for circular reference resolution.
							// Also remove any beans that received a temporary reference to the bean.
							destroySingleton(beanName);
							throw ex;
						}
					});
					bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
				}
      
			// 这里, 也忽略了一些代码
			...
      
			}
			catch (BeansException ex) {
				cleanupAfterBeanCreationFailure(beanName);
				throw ex;
			}
		}

		// 这里也忽略了一些代码
  	...
	}
```

1. **org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#getSingleton(java.lang.String)**

```java
// 空壳方法, 调用了重载方法getSingleton(String beanName, boolean allowEarlyReference) , 并且allowEarlyReference默认为true
public Object getSingleton(String beanName) {
		return getSingleton(beanName, true);
	}

	@Nullable
	protected Object getSingleton(String beanName, boolean allowEarlyReference) {
    // 首先, 从单例池中获取该bean, 如果获取到（代表该bean已经完成了初始化）, 就直接返回
		Object singletonObject = this.singletonObjects.get(beanName);
    // 当单例池中没有时, 判断该bean是不是创建过程中, 如果是, 则继续执行代码块
		if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
			// 加个锁, 避免此时将该bean放入单例池
      synchronized (this.singletonObjects) {
        // 尝试从二级缓存中获取该bean, 如果不存在, 并且allowEarlyReference=true, 则继续执行代码块
				singletonObject = this.earlySingletonObjects.get(beanName);
				if (singletonObject == null && allowEarlyReference) {
          // 关键代码, 可以看到, 这里的singletonFactories, 就是我们在createBean方法中, put工厂bean的那个map（也就是三级缓存）
					ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
					if (singletonFactory != null) {
            // 这里调用getBean, 就得到了该bean提前暴露出来的引用
						singletonObject = singletonFactory.getObject();
            // 然后将这个bean放到二级缓存中, （避免每次使用这个bean都要让工厂再生成一次）
						this.earlySingletonObjects.put(beanName, singletonObject);
            // 然后, 从三级缓存中清除这个bean的工厂实例, 为了gc
						this.singletonFactories.remove(beanName);
					}
				}
			}
		}
		return singletonObject;
	}
```

2. **org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#getSingleton(java.lang.String, org.springframework.beans.factory.ObjectFactory<?>)**

```java
public Object getSingleton(String beanName, ObjectFactory<?> singletonFactory) {
		Assert.notNull(beanName, "Bean name must not be null");
		synchronized (this.singletonObjects) {
      // 首先, 从单例池中获取一次这个bean
			Object singletonObject = this.singletonObjects.get(beanName);
			if (singletonObject == null) {
				if (this.singletonsCurrentlyInDestruction) {
					throw new BeanCreationNotAllowedException(beanName,
							"Singleton bean creation not allowed while singletons of this factory are in destruction " +
							"(Do not request a bean from a BeanFactory in a destroy method implementation!)");
				}
				if (logger.isDebugEnabled()) {
					logger.debug("Creating shared instance of singleton bean '" + beanName + "'");
				}
        // 执行创建bean之前的逻辑, 也就在吧beanName加到singletonsCurrentlyInCreation的set集合中, 标志着这个bean正在创建（跟上文判断这个bean是否在创建, 对上了）
				beforeSingletonCreation(beanName);
				boolean newSingleton = false;
				boolean recordSuppressedExceptions = (this.suppressedExceptions == null);
				if (recordSuppressedExceptions) {
					this.suppressedExceptions = new LinkedHashSet<>();
				}
				try {
          // 从bean的工厂实例中, 生成这个bean
					singletonObject = singletonFactory.getObject();
          // 标记bean是新建的
					newSingleton = true;
				}
				catch (IllegalStateException ex) {
          // 如果出现异常, 判断这个bean是不是已经在单例池中了, 如果存在, 代表其他线程创建成功, 如果不存在, 则代表出现错误, 抛出异常
					// Has the singleton object implicitly appeared in the meantime ->
					// if yes, proceed with it since the exception indicates that state.
					singletonObject = this.singletonObjects.get(beanName);
					if (singletonObject == null) {
						throw ex;
					}
				}
				catch (BeanCreationException ex) {
					if (recordSuppressedExceptions) {
						for (Exception suppressedException : this.suppressedExceptions) {
							ex.addRelatedCause(suppressedException);
						}
					}
					throw ex;
				}
				finally {
					if (recordSuppressedExceptions) {
						this.suppressedExceptions = null;
					}
          // 跟上边的before...对称, 这里是清除bean创建中的状态
					afterSingletonCreation(beanName);
				}
        // 如果是刚创建的, 也就是是在当前这次代码调用中创建成功的
				if (newSingleton) {
          // 将该bean添加到单例池
					addSingleton(beanName, singletonObject);
				}
			}
			return singletonObject;
		}
	}
```

3. **org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#populateBean**

```java
protected void populateBean(String beanName, RootBeanDefinition mbd, @Nullable BeanWrapper bw) {
		if (bw == null) {
			if (mbd.hasPropertyValues()) {
				throw new BeanCreationException(
						mbd.getResourceDescription(), beanName, "Cannot apply property values to null instance");
			}
			else {
				// Skip property population phase for null instance.
				return;
			}
		}

  	// 这里, 调用了一次后置处理器
		// Give any InstantiationAwareBeanPostProcessors the opportunity to modify the
		// state of the bean before properties are set. This can be used, for example,
		// to support styles of field injection.
		if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
			for (BeanPostProcessor bp : getBeanPostProcessors()) {
				if (bp instanceof InstantiationAwareBeanPostProcessor) {
					InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
					if (!ibp.postProcessAfterInstantiation(bw.getWrappedInstance(), beanName)) {
						return;
					}
				}
			}
		}

		PropertyValues pvs = (mbd.hasPropertyValues() ? mbd.getPropertyValues() : null);
		// 这里我们可以看到, 从BeanDefinition的实例中获取了当前bean的自动注入模式
  	// 自动注入模式有4种
    // 1. AUTOWIRE_NO, 2. AUTOWIRE_BY_NAME, 3. AUTOWIRE_BY_TYPE 4. AUTOWIRE_CONSTRUCTOR
		int resolvedAutowireMode = mbd.getResolvedAutowireMode();
		if (resolvedAutowireMode == AUTOWIRE_BY_NAME || resolvedAutowireMode == AUTOWIRE_BY_TYPE) {
			MutablePropertyValues newPvs = new MutablePropertyValues(pvs);
			// Add property values based on autowire by name if applicable.
			if (resolvedAutowireMode == AUTOWIRE_BY_NAME) {
        // AUTOWIRE_BY_NAME, 很简单, 其实根据name去调用doGetBean方法
				autowireByName(beanName, mbd, bw, newPvs);
			}
			// Add property values based on autowire by type if applicable.
			if (resolvedAutowireMode == AUTOWIRE_BY_TYPE) {
        // AUTOWIRE_BY_TYPE
				autowireByType(beanName, mbd, bw, newPvs);
			}
			pvs = newPvs;
		}

		boolean hasInstAwareBpps = hasInstantiationAwareBeanPostProcessors();
		boolean needsDepCheck = (mbd.getDependencyCheck() != AbstractBeanDefinition.DEPENDENCY_CHECK_NONE);

		PropertyDescriptor[] filteredPds = null;
		if (hasInstAwareBpps) {
			if (pvs == null) {
				pvs = mbd.getPropertyValues();
			}
      // 如果没有指定自动注入的模式, 那就是默认为no, 即不开启自动注入, 代码会执行到这里, 
      // 这里也调用了一次后置处理器, 这段代码, 我们可以先主要关注两个BeanProcessor的实现类
      // CommonAnnotationBeanPostProcessor（这个, 其实是spring对@Resources注解的处理类）
      // AutowiredAnnotationBeanPostProcessor（这个, 就是spring对无类型的@Autowired的处理类）
      // 在"spring 依赖注入"一文中, 详细分析了这个后置处理器
			for (BeanPostProcessor bp : getBeanPostProcessors()) {
				if (bp instanceof InstantiationAwareBeanPostProcessor) {
					InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
					PropertyValues pvsToUse = ibp.postProcessProperties(pvs, bw.getWrappedInstance(), beanName);
					if (pvsToUse == null) {
						if (filteredPds == null) {
							filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);
						}
						pvsToUse = ibp.postProcessPropertyValues(pvs, filteredPds, bw.getWrappedInstance(), beanName);
						if (pvsToUse == null) {
							return;
						}
					}
					pvs = pvsToUse;
				}
			}
		}
		if (needsDepCheck) {
			if (filteredPds == null) {
				filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);
			}
			checkDependencies(beanName, mbd, filteredPds, pvs);
		}

		if (pvs != null) {
			applyPropertyValues(beanName, mbd, bw, pvs);
		}
	}
```

## 总结

说到这, 其实我们已经大概把spring的循环依赖串起来了, 虽然很具体的后置处理器的代码逻辑没有写（后面会有专门的一篇后置处理器的文章）, 但是逻辑主线其实已经拼接好了. 

最后, 我们通过一张简单的图, 来模拟循环依赖的两个bean的初始化过程. 

![spring-bean-circular-dependency](./img/spring-bean-circular-dependency.jpg)

OK, 那本篇文章就到这里了, 欢迎各位大佬多提宝贵意见, 我们下期再见. 