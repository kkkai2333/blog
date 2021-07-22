(window.webpackJsonp=window.webpackJsonp||[]).push([[131],{660:function(a,t,r){"use strict";r.r(t);var s=r(6),o=Object(s.a)({},(function(){var a=this,t=a.$createElement,r=a._self._c||t;return r("ContentSlotsDistributor",{attrs:{"slot-key":a.$parent.slotKey}},[r("h1",{attrs:{id:"spring-aop"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#spring-aop"}},[a._v("#")]),a._v(" Spring Aop")]),a._v(" "),r("h2",{attrs:{id:"问题"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#问题"}},[a._v("#")]),a._v(" 问题")]),a._v(" "),r("h3",{attrs:{id:"什么是-aop"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#什么是-aop"}},[a._v("#")]),a._v(" 什么是 AOP")]),a._v(" "),r("h3",{attrs:{id:"aspectj又是什么"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#aspectj又是什么"}},[a._v("#")]),a._v(" AspectJ又是什么")]),a._v(" "),r("h3",{attrs:{id:"什么是切点-pointcut"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#什么是切点-pointcut"}},[a._v("#")]),a._v(" 什么是切点（pointcut）")]),a._v(" "),r("h3",{attrs:{id:"支持的切点类型-pointcut"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#支持的切点类型-pointcut"}},[a._v("#")]),a._v(" 支持的切点类型（pointcut）")]),a._v(" "),r("ul",[r("li",[a._v("execution")]),a._v(" "),r("li",[a._v("within")]),a._v(" "),r("li",[a._v("this")]),a._v(" "),r("li",[a._v("target")]),a._v(" "),r("li",[a._v("args")]),a._v(" "),r("li",[a._v("@target")]),a._v(" "),r("li",[a._v("@args")]),a._v(" "),r("li",[a._v("@within")]),a._v(" "),r("li",[a._v("@annotation")])]),a._v(" "),r("h3",{attrs:{id:"什么是通知-advice"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#什么是通知-advice"}},[a._v("#")]),a._v(" 什么是通知（advice）")]),a._v(" "),r("h3",{attrs:{id:"有几种通知类型-advice"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#有几种通知类型-advice"}},[a._v("#")]),a._v(" 有几种通知类型（advice）")]),a._v(" "),r("ul",[r("li",[a._v("@Before")]),a._v(" "),r("li",[a._v("@AfterReturning")]),a._v(" "),r("li",[a._v("@AfterThrowing")]),a._v(" "),r("li",[a._v("@After")]),a._v(" "),r("li",[a._v("@Around")])]),a._v(" "),r("h3",{attrs:{id:"spring-是如何完成aop的"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#spring-是如何完成aop的"}},[a._v("#")]),a._v(" spring 是如何完成aop的")]),a._v(" "),r("h2",{attrs:{id:"源码分析"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#源码分析"}},[a._v("#")]),a._v(" 源码分析")]),a._v(" "),r("h3",{attrs:{id:"aopproxy"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#aopproxy"}},[a._v("#")]),a._v(" AopProxy")]),a._v(" "),r("h4",{attrs:{id:"jdkdynamicaopproxy"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#jdkdynamicaopproxy"}},[a._v("#")]),a._v(" JdkDynamicAopProxy")]),a._v(" "),r("h4",{attrs:{id:"cglibaopproxy"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#cglibaopproxy"}},[a._v("#")]),a._v(" CglibAopProxy")]),a._v(" "),r("h3",{attrs:{id:"aopproxyfactory"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#aopproxyfactory"}},[a._v("#")]),a._v(" AopProxyFactory")]),a._v(" "),r("h3",{attrs:{id:"defaultaopproxyfactory"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#defaultaopproxyfactory"}},[a._v("#")]),a._v(" DefaultAopProxyFactory")]),a._v(" "),r("h3",{attrs:{id:"abstractautoproxycreator"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#abstractautoproxycreator"}},[a._v("#")]),a._v(" AbstractAutoProxyCreator")]),a._v(" "),r("p",[a._v("spring aop定义的一个后置处理器，在spring 生命周期中，调用beanPostProcessor的after方法时，会调用这个后置处理器。")]),a._v(" "),r("h3",{attrs:{id:"aopautoconfiguration"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#aopautoconfiguration"}},[a._v("#")]),a._v(" AopAutoConfiguration")]),a._v(" "),r("p",[a._v("spring boot 中，aop的自动配置类。")]),a._v(" "),r("h3",{attrs:{id:"jdk-proxy-和-cglib-在代理上有什么区别-为什么"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#jdk-proxy-和-cglib-在代理上有什么区别-为什么"}},[a._v("#")]),a._v(" jdk proxy 和 cglib 在代理上有什么区别，为什么")]),a._v(" "),r("ol",[r("li",[a._v("proxy 只能代理接口。\n"),r("ol",[r("li",[a._v("简单点讲，通过反编译Proxy生成的代理类，可以看到，代理类继承了Proxy类，实现了XX目标接口。那么，由于Java是单继承的，由此可以证明，为什么基于Proxy的动态代理只能代理接口。")]),a._v(" "),r("li",[a._v("复杂点讲，直接看下源码。")])])]),a._v(" "),r("li",[a._v("cglib 会默认生成一个代理类的子类，所以可以代理Java类，但是这要求被代理的类不能是final的。")])]),a._v(" "),r("h2",{attrs:{id:"扩展"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#扩展"}},[a._v("#")]),a._v(" 扩展")]),a._v(" "),r("p",[a._v("在spring 5.x中，默认配置下，")]),a._v(" "),r("ol",[r("li",[r("p",[a._v("如果代理的是一个接口，spring 会使用 jdk Proxy 动态代理，也就是使用JdkDynamicAopProxy类生成代理类。")])]),a._v(" "),r("li",[r("p",[a._v("如果代理的是一个类，spring 会使用 cglib 动态代理，也就是使用CglibAopProxy类生成代理类。")])]),a._v(" "),r("li",[r("p",[a._v("可以通过以下配置让spring 只使用 cglib 代理。")]),a._v(" "),r("div",{staticClass:"language-java extra-class"},[r("pre",{pre:!0,attrs:{class:"language-java"}},[r("code",[r("span",{pre:!0,attrs:{class:"token comment"}},[a._v("// proxyTargetClass = true，代表使用cglib代理")]),a._v("\n"),r("span",{pre:!0,attrs:{class:"token annotation punctuation"}},[a._v("@EnableAspectJAutoProxy")]),r("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v("(")]),a._v("proxyTargetClass "),r("span",{pre:!0,attrs:{class:"token operator"}},[a._v("=")]),a._v(" "),r("span",{pre:!0,attrs:{class:"token boolean"}},[a._v("true")]),r("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v(")")]),a._v("\n"),r("span",{pre:!0,attrs:{class:"token keyword"}},[a._v("public")]),a._v(" "),r("span",{pre:!0,attrs:{class:"token keyword"}},[a._v("class")]),a._v(" "),r("span",{pre:!0,attrs:{class:"token class-name"}},[a._v("AppConfig")]),a._v(" "),r("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v("{")]),a._v("\n"),r("span",{pre:!0,attrs:{class:"token punctuation"}},[a._v("}")]),a._v("\n")])])])])]),a._v(" "),r("p",[a._v("在spring boot 2.x中，默认使用cglib代理。")])])}),[],!1,null,null,null);t.default=o.exports}}]);