# Spring 依赖注入

## 问题

1. 什么是 Spring 依赖注入
2. Spring 的自动注入有几种模式

## 答案

依赖注入是实现IOC的一种方式，spring 选择这种方式来完成bean的属性设置。

首先，Spring 的依赖注入<sup>[1]</sup>有两种类型：

1. 手动注入
2. 自动注入

其次，Spring 的依赖注入<sup>[1]</sup>有两种方式：

1. 基于构造器的依赖注入
2. 基于setter方法的依赖注入

最后，Spring 的自动注入有4种模式<sup>[2]</sup>：

1. no，不启用自动注入
2. byName，按名称
3. byType，按类型
4. constructor，构造器

下面是我从官网上抄过来的**Autowiring modes**描述图。

| Mode          | Explanation                                                  |
| :------------ | :----------------------------------------------------------- |
| `no`          | (Default) No autowiring. Bean references must be defined by `ref` elements. Changing the default setting is not recommended for larger deployments, because specifying collaborators explicitly gives greater control and clarity. To some extent, it documents the structure of a system. |
| `byName`      | Autowiring by property name. Spring looks for a bean with the same name as the property that needs to be autowired. For example, if a bean definition is set to autowire by name and it contains a `master` property (that is, it has a `setMaster(..)` method), Spring looks for a bean definition named `master` and uses it to set the property. |
| `byType`      | Lets a property be autowired if exactly one bean of the property type exists in the container. If more than one exists, a fatal exception is thrown, which indicates that you may not use `byType`autowiring for that bean. If there are no matching beans, nothing happens (the property is not set). |
| `constructor` | Analogous to `byType` but applies to constructor arguments. If there is not exactly one bean of the constructor argument type in the container, a fatal error is raised. |

## 源码分析

OK，那下面就来认识一下 Spring 的依赖注入吧，下文的例子，基本参考官方文档。

首先来分析一下，依赖注入的两种方式及其变种。

1. 基于构造器注入

   ```java
   public class ExampleBean {
   
       private AnotherBean beanOne;
   
       private YetAnotherBean beanTwo;
   
       private int i;
   
       public ExampleBean(
           AnotherBean anotherBean, YetAnotherBean yetAnotherBean, int i) {
           this.beanOne = anotherBean;
           this.beanTwo = yetAnotherBean;
           this.i = i;
       }
   }
   ```

   ```xml
   <bean id="exampleBean" class="examples.ExampleBean">
       <!-- constructor injection using the nested ref element -->
       <constructor-arg>
           <ref bean="anotherExampleBean"/>
       </constructor-arg>
   
       <!-- constructor injection using the neater ref attribute -->
       <constructor-arg ref="yetAnotherBean"/>
   
       <constructor-arg type="int" value="1"/>
   </bean>
   
   <bean id="anotherExampleBean" class="examples.AnotherBean"/>
   <bean id="yetAnotherBean" class="examples.YetAnotherBean"/>
   ```

2. 基于setting方法注入

   ```java
   public class ExampleBean {
   
       private AnotherBean beanOne;
   
       private YetAnotherBean beanTwo;
   
       private int i;
   
       public void setBeanOne(AnotherBean beanOne) {
           this.beanOne = beanOne;
       }
   
       public void setBeanTwo(YetAnotherBean beanTwo) {
           this.beanTwo = beanTwo;
       }
   
       public void setIntegerProperty(int i) {
           this.i = i;
       }
   }
   ```

   ```xml
   <bean id="exampleBean" class="examples.ExampleBean">
       <!-- setter injection using the nested ref element -->
       <property name="beanOne">
           <ref bean="anotherExampleBean"/>
       </property>
   
       <!-- setter injection using the neater ref attribute -->
       <property name="beanTwo" ref="yetAnotherBean"/>
       <property name="integerProperty" value="1"/>
   </bean>
   
   <bean id="anotherExampleBean" class="examples.AnotherBean"/>
   <bean id="yetAnotherBean" class="examples.YetAnotherBean"/>
   ```

3. 基于构造器的变种1-静态工厂方法

   ```java
   public class ExampleBean {
   
       // a private constructor
       private ExampleBean(...) {
           ...
       }
   
       // a static factory method; the arguments to this method can be
       // considered the dependencies of the bean that is returned,
       // regardless of how those arguments are actually used.
       public static ExampleBean createInstance (
           AnotherBean anotherBean, YetAnotherBean yetAnotherBean, int i) {
   
           ExampleBean eb = new ExampleBean (...);
           // some other operations...
           return eb;
       }
   }
   ```

   ```xml
   <bean id="exampleBean" class="examples.ExampleBean" factory-method="createInstance">
       <constructor-arg ref="anotherExampleBean"/>
       <constructor-arg ref="yetAnotherBean"/>
       <constructor-arg value="1"/>
   </bean>
   
   <bean id="anotherExampleBean" class="examples.AnotherBean"/>
   <bean id="yetAnotherBean" class="examples.YetAnotherBean"/>
   ```

4. 基于setting方法的变种2-@Autowired

   ```java
   @Component
   public class OrderService {
   
   	@Autowired
   	private UserService userService;
   
   }
   
   @Component
   public class OrderService {
   
   	private UserService userService;
   
   	@Autowired
   	public void setUserService(UserService userService) {
   		this.userService = userService;
   	}
   }
   
   ```

然后，我们再分析下依赖注入的两种类型，手动注入和自动注入。

1. 首先，要明确，手动注入是没有注入模式的（你都手动指定了，还要啥模式）。

2. 然后，上文也给出了自动注入的4种注入模式，其实是3种，因为`no`代表不开启自动注入。

   1. byName，按名称
   2. byType，按类型
   3. constructor，构造器

3. 下面分析一下源码。

4. 第一次注入判断，

   `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#createBeanInstance`

   ```java
   protected BeanWrapper createBeanInstance(String beanName, RootBeanDefinition mbd, @Nullable Object[] args) {
   		// Make sure bean class is actually resolved at this point.
   		Class<?> beanClass = resolveBeanClass(mbd, beanName);
       
       // 这里省略了一些代码
       ...
   
   		// Candidate constructors for autowiring?
       // 推断构造方法
   		Constructor<?>[] ctors = determineConstructorsFromBeanPostProcessors(beanClass, beanName);
       // 这里的if判断是||操作，所以，只要有一个条件满足，就可以进入
       // 也就是说，下面这段if代码cover了两种情况
       // 1. 如果手动设置了构造方法，并且配置了要注入的bean
       // 2. DI-3，如果当前bean的自动注入模式是AUTOWIRE_CONSTRUCTOR（构造器）
   		if (ctors != null || mbd.getResolvedAutowireMode() == AUTOWIRE_CONSTRUCTOR ||
   				mbd.hasConstructorArgumentValues() || !ObjectUtils.isEmpty(args)) {
   			return autowireConstructor(beanName, mbd, ctors, args);
   		}
   
   		// No special handling: simply use no-arg constructor.
   		return instantiateBean(beanName, mbd);
   	}
   ```

5. 第二、三、四次注入判断

   `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#populateBean`

   ```java
   protected void populateBean(String beanName, RootBeanDefinition mbd, @Nullable BeanWrapper bw) {
   		// 这里省略了一些代码
       ...
   
   		PropertyValues pvs = (mbd.hasPropertyValues() ? mbd.getPropertyValues() : null);
   
   		int resolvedAutowireMode = mbd.getResolvedAutowireMode();
       // 可以看到，这里对自动注入的模式进行了判断，如果是byName、byType就会进入下面的代码段
       // 也就是说，下面这段if代码cover了两种情况
       // DI-1，AUTOWIRE_BY_NAME
       // DI-2，AUTOWIRE_BY_TYPE
   		if (resolvedAutowireMode == AUTOWIRE_BY_NAME || resolvedAutowireMode == AUTOWIRE_BY_TYPE) {
   			MutablePropertyValues newPvs = new MutablePropertyValues(pvs);
   			// Add property values based on autowire by name if applicable.
         // DI-1，如果是AUTOWIRE_BY_NAME
   			if (resolvedAutowireMode == AUTOWIRE_BY_NAME) {
   				autowireByName(beanName, mbd, bw, newPvs);
   			}
   			// Add property values based on autowire by type if applicable.
         // DI-2，如果是AUTOWIRE_BY_TYPE
   			if (resolvedAutowireMode == AUTOWIRE_BY_TYPE) {
   				autowireByType(beanName, mbd, bw, newPvs);
   			}
   			pvs = newPvs;
   		}
   
   		boolean hasInstAwareBpps = hasInstantiationAwareBeanPostProcessors();
   		boolean needsDepCheck = (mbd.getDependencyCheck() != AbstractBeanDefinition.DEPENDENCY_CHECK_NONE);
   
   		if (hasInstAwareBpps || needsDepCheck) {
   			if (pvs == null) {
   				pvs = mbd.getPropertyValues();
   			}
   			PropertyDescriptor[] filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);
   			if (hasInstAwareBpps) {
           // 这里，是第四次注入，也就是说，非自动注入的时候，会在这里完成属性注入
           // 也就是说这里cover了以下三种情况
           // 1. DI-0，AUTOWIRE_NO
           // 2. @Autowired，由AutowiredAnnotationBeanPostProcessor后置处理器完成
           // 3. @Resources，由CommonAnnotationBeanPostProcessor后置处理器完成
   				for (BeanPostProcessor bp : getBeanPostProcessors()) {
   					if (bp instanceof InstantiationAwareBeanPostProcessor) {
   						InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
   						pvs = ibp.postProcessPropertyValues(pvs, filteredPds, bw.getWrappedInstance(), beanName);
   						if (pvs == null) {
   							return;
   						}
   					}
   				}
   			}
   			if (needsDepCheck) {
   				checkDependencies(beanName, mbd, filteredPds, pvs);
   			}
   		}
   
   		if (pvs != null) {
   			applyPropertyValues(beanName, mbd, bw, pvs);
   		}
   	}
   ```

但是，到了这里，就有个疑问了，不是都说~~@Autowired是自动注入~~吗，怎么上文分析出来，发现它是手动注入？

1. **没错的，@Autowired其实是手动注入，并且也不是byType。因为byType是自动注入的4种模式之一，和@Autowired是不相关的。**

2. **实际上，@Autowired是通过AutowiredAnnotationBeanPostProcessor后置处理器完成依赖注入的。**

3. 下面就分析下AutowiredAnnotationBeanPostProcessor的源码。

   ```java
   // 属性注入的时候，会调用postProcessPropertyValues方法
   public PropertyValues postProcessPropertyValues(
   			PropertyValues pvs, PropertyDescriptor[] pds, Object bean, String beanName) throws BeanCreationException {
       // 拿到当前需要注入的属性
   		InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);
   		try {
         // 调用metadata的inject方法
   			metadata.inject(bean, beanName, pvs);
   		}
   		catch (BeanCreationException ex) {
   			throw ex;
   		}
   		catch (Throwable ex) {
   			throw new BeanCreationException(beanName, "Injection of autowired dependencies failed", ex);
   		}
   		return pvs;
   	}
   // metadata中的inject方法会变量上面拿到metadata中的checkedElements属性
   public void inject(Object target, @Nullable String beanName, @Nullable PropertyValues pvs) throws Throwable {
   		Collection<InjectedElement> checkedElements = this.checkedElements;
   		Collection<InjectedElement> elementsToIterate =
   				(checkedElements != null ? checkedElements : this.injectedElements);
   		if (!elementsToIterate.isEmpty()) {
   			for (InjectedElement element : elementsToIterate) {
   				if (logger.isDebugEnabled()) {
   					logger.debug("Processing injected element of bean '" + beanName + "': " + element);
   				}
           // 关键是这里，循环调用element的inject方法
   				element.inject(target, beanName, pvs);
   			}
   		}
   	}
   // 而InjectedElement在AutowiredAnnotationBeanPostProcessor类中又定义了两种实现
   // 1. AutowiredFieldElement，对应的是在属性上使用@Autowired注解
   // 2. AutowiredMethodElement，对应的是在方法上使用@Autowired注解
   // 二者基本一致，下面简单看下AutowiredFieldElement类的inject方法的实现
   protected void inject(Object bean, @Nullable String beanName, @Nullable PropertyValues pvs) throws Throwable {
         // 这里强转一下，拿到当前需要注入的属性，因为已经知道到这里肯定是在属性上使用@Autowired注解了
   			Field field = (Field) this.member;
   			Object value;
   			if (this.cached) {
   				value = resolvedCachedArgument(beanName, this.cachedFieldValue);
   			}
   			else {
   				DependencyDescriptor desc = new DependencyDescriptor(field, this.required);
   				desc.setContainingClass(bean.getClass());
   				Set<String> autowiredBeanNames = new LinkedHashSet<>(1);
   				Assert.state(beanFactory != null, "No BeanFactory available");
   				TypeConverter typeConverter = beanFactory.getTypeConverter();
   				try {
             // 这里就是需要注入的属性，可以看到，是调用了beanFactory的resolveDependency()方法
   					value = beanFactory.resolveDependency(desc, beanName, autowiredBeanNames, typeConverter);
   				}
   				catch (BeansException ex) {
             // 这里会捕获异常，如果查找属性bean出现错误
   					throw new UnsatisfiedDependencyException(null, beanName, new InjectionPoint(field), ex);
   				}
           // 省略了一些代码
   				...
   			}
     		// 如果value不为空，就把它设置到当前bean
   			if (value != null) {
           // 设置field的访问权限
   				ReflectionUtils.makeAccessible(field);
           // 这里就是将获取到的bean设置到当前的bean的对应属性上
   				field.set(bean, value);
   			}
   		}
   
   ```
   
4. 这里再看下beanFactory的resolveDependency()方法。

    `org.springframework.beans.factory.support.DefaultListableBeanFactory#resolveDependency`

    ```java
      public Object resolveDependency(DependencyDescriptor descriptor, @Nullable String requestingBeanName,
       			@Nullable Set<String> autowiredBeanNames, @Nullable TypeConverter typeConverter) throws BeansException {
       
       		descriptor.initParameterNameDiscovery(getParameterNameDiscoverer());
       		// 省略了一些代码
           ...
       		else {
       			Object result = getAutowireCandidateResolver().getLazyResolutionProxyIfNecessary(
       					descriptor, requestingBeanName);
       			if (result == null) {
               // 上面的代码还没有分析什么时候会调用，先留个TODO
               // 但是一般情况下，方法会走到这里去调用doResolveDependency()方法
       				result = doResolveDependency(descriptor, requestingBeanName, autowiredBeanNames, typeConverter);
       			}
       			return result;
       		}
       	}
       
       // 继续往下看，所谓的@Autowired默认按类型，其次按名称注入的说法就是来自这段代码
       @Nullable
       	public Object doResolveDependency(DependencyDescriptor descriptor, @Nullable String beanName,
       			@Nullable Set<String> autowiredBeanNames, @Nullable TypeConverter typeConverter) throws BeansException {
       
       		InjectionPoint previousInjectionPoint = ConstructorResolver.setCurrentInjectionPoint(descriptor);
       		try {
       			// 这里忽略了一些代码
       			...
            // 这里调用findAutowireCandidates方法，会到spring容器中查询类型为type的beanName的class集合，这里就是所谓的byType（这个描述是不对的，我在这里用只是为了说明）
            // 如果type是接口，那可能会有多个bean，所以这里是个map
       			Map<String, Object> matchingBeans = findAutowireCandidates(beanName, type, descriptor);
             // 如果符合条件的bean为空，那就说明没找到
       			if (matchingBeans.isEmpty()) {
               // 如果当前bean的这个属性必需的，即@Autowired(required=true)的
       				if (isRequired(descriptor)) {
                 // 这里就会标注一个异常，即没有找到合适的bean
       					raiseNoMatchingBeanFound(type, descriptor.getResolvableType(), descriptor);
       				}
               // 然后这里返回null
       				return null;
       			}
       
       			String autowiredBeanName;
       			Object instanceCandidate;
       
             // 如果类型为type的bean有多个，即matchingBeans.size()>1
       			if (matchingBeans.size() > 1) {
               // 这里会根据属性名称去选择一个更合适的候选bean，也就是所谓的byName（这个描述是不对的，我在这里用只是为了说明）
       				autowiredBeanName = determineAutowireCandidate(matchingBeans, descriptor);
               // 如果没有找到符合条件的候选bean
       				if (autowiredBeanName == null) {
                 // 而这个属性bean又是必需的，即@Autowired(required=true)
       					if (isRequired(descriptor) || !indicatesMultipleBeans(type)) {
                   // 这里其实是抛出了个NoUniqueBeanDefinitionException异常，即没有唯一的bean，所以spring不知道该用哪个bean注入到当前bean中
       						return descriptor.resolveNotUnique(type, matchingBeans);
       					}
       					else {
       						// In case of an optional Collection/Map, silently ignore a non-unique case:
       						// possibly it was meant to be an empty collection of multiple regular beans
       						// (before 4.3 in particular when we didn't even look for collection beans).
       						// 如果这个属性bean的不是必需的，那就直接返回null即可
                   return null;
       					}
       				}
               // 代码执行到这里，就说明找到了合适的候选bean，那就直接从map中把这个bean的class对象赋值给instanceCandidate
       				instanceCandidate = matchingBeans.get(autowiredBeanName);
       			}
       			else {
       				// We have exactly one match.
               // 这里其实就能确定matchingBeans中只有一个kv了，即matchingBeans.size()==1，所以就直接把key赋值给autowiredBeanName，把value赋值给instanceCandidate了
       				Map.Entry<String, Object> entry = matchingBeans.entrySet().iterator().next();
       				autowiredBeanName = entry.getKey();
       				instanceCandidate = entry.getValue();
       			}
       
       			if (autowiredBeanNames != null) {
               // 这里就是把符合条件的beanName添加到autowiredBeanNames（这个集合是方法调用者传入的）中
       				autowiredBeanNames.add(autowiredBeanName);
       			}
       			// 那到这里，instanceCandidate肯定是一个class对象
       			if (instanceCandidate instanceof Class) {
       			  // 这里调用beanFactory的getBean()方法，拿到最终的bean对象赋值给instanceCandidate
       				instanceCandidate = descriptor.resolveCandidate(autowiredBeanName, type, this);
       			}
       			Object result = instanceCandidate;
             // 由于上边刚刚从beanFactory中取getBean，那这里就要做个判断，看看这个bean是不是一个NullBean
       			if (result instanceof NullBean) {
       			  // 如果bean是Null的，并且这个属性还是必需的，那这里还是要抛出异常
       				if (isRequired(descriptor)) {
       					raiseNoMatchingBeanFound(type, descriptor.getResolvableType(), descriptor);
       				}
       				// 将result设置为null
       				result = null;
       			}
       			if (!ClassUtils.isAssignableValue(type, result)) {
       				throw new BeanNotOfRequiredTypeException(autowiredBeanName, type, instanceCandidate.getClass());
       			}
             // 执行到这里，只有两种情况
             // 1. 找到合适的bean了，返回bean
             // 2. 没找到合适的bean，返回null，并抛一个NoSuchBeanDefinitionException错误出去
       			return result;
       		}
       		finally {
       			ConstructorResolver.setCurrentInjectionPoint(previousInjectionPoint);
       		}
       	}
    ```

5. 到这里，其实就清楚了@Autowired注解的属性是如何注入的，那么下面就总结一下吧。

   1. @Autowired是手动注入，
   
   2. @Autowired可以加在属性上，也可以加在方法上，是因为AutowiredAnnotationBeanPostProcessor后置处理器中，提供了两个InjectedElement接口的实现类，
      1. AutowiredFieldElement，对应的是在属性上使用@Autowired注解
      2. AutowiredMethodElement，对应的是在方法上使用@Autowired注解
      
   3. @Autowired不是自动注入，~~所以也就没有byType和byName这种说法了~~。
   
   4. 实际上，应该这样描述：
     
      AutowiredAnnotationBeanPostProcessor后置处理器，在进行依赖注入时，会先按照需要注入的属性的类型去beanFactory中查找符合条件的bean，
      
      1. 如果没有合适的bean，会抛出NoSuchBeanDefinitionException异常，
      2. 如果找到1个bean，那就直接注入这个bean，
      3. 如果找到1个以上的bean，会再根据属性的字段名进行二次选择，选择beanName为字段名的bean进行注入，
         1. 如果根据字段名没有匹配到bean，则抛出NoUniqueBeanDefinitionException异常，
         2. 如果根据字段名匹配到bean，那就直接注入这个bean。
      
   5. 这里还要提一句，如果是@Autowired(required=false)的情况，上面的异常都不会抛出了。

上文其实主要分析的是手动注入的方式，那么既然@Autowired都不是自动注入了，又应该怎么样开启自动注入呢？

下面列出两种开启自动注入的方法。

1. xml配置

   在xml文件中，配置`default-autowire=byName/byType/constructor`。

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <beans xmlns="http://www.springframework.org/schema/beans"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.springframework.org/schema/beans
          http://www.springframework.org/schema/beans/spring-beans.xsd"
   	   default-autowire="byType">
   
   		<bean id="a" class="com.luban.app.A">
   		</bean>
   		<bean id="b"  class="com.luban.app.B">
   		</bean>
   </beans>
   ```

2. beanPostProcessor配置

   ```java
   @Component
   public class OrderBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
   
   	@Override
   	public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
   		GenericBeanDefinition bd;
       // 这里，可以通过后置处理器，拿到想要修改自动注入模式的BeanDefinition，手动设置其AutowireMode
   		if ((bd = (GenericBeanDefinition)beanFactory.getBeanDefinition("orderService")) != null) {
   			bd.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_NAME);
   		}
   	}
   
   }
   ```

3. ……

4. 可能还有别的方式，我暂时想不到了，留个TODO。

5. 简单记录自动注入的缺点吧，可能是错的，所以这段就不要看了。

   1. ~~AUTOWIRE_CONSTRUCTOR，构造器注入，~~
      1. ~~注入的bean为空时，会抛出NoSuchBeanDefinitionException异常，~~
      2. ~~注入的bean有多个实现时，会抛出NoUniqueBeanDefinitionException异常，~~
      3. ~~而且有点搞不明白和默认情况下的构造方法注入有什么区别。~~
   2. ~~AUTOWIRE_BY_NAME，按照名称注入，默认根据字段名从beanFactory获取bean，如果获取不到就直接忽略。所以如果是注入接口的实现类，字段名称最好用实现类的beanName。~~
   3. ~~AUTOWIRE_BY_TYPE，按照类型注入，同样会走到上文中的doResolveDependency()方法中，但是如果根据类型找到了多个bean，没办法再根据字段名进行二次选择，会直接抛出NoUniqueBeanDefinitionException异常。~~
   4. ~~AUTOWIRE_CONSTRUCTOR默认required=true，AUTOWIRE_BY_NAME和AUTOWIRE_BY_TYPE是默认required=false的。~~
   5. ~~AUTOWIRE_BY_NAME和AUTOWIRE_BY_TYPE是基于setter方法注入的。~~

## 总结

其实本来也感觉依赖注入是个挺小的知识点，之前面试的时候也是直接答百度上的答案。

后来看了子路老师的文章，才发现，这里边点也挺多的，于是也去翻了下源码，看完源码之后，发现百度的答案有很多是错的。

所以，算是为了避免再次踩坑吧，写了这篇文章。

## 参考

[1]. [Spring-Dependency-Injection官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-factory-collaborators)

[2]. [Spring-Autowiring-Modes官方文档](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-factory-autowire)

[3]. [子路老师的大神文档](https://blog.csdn.net/java_lyvee/article/details/102499560)

