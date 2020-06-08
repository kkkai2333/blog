(window.webpackJsonp=window.webpackJsonp||[]).push([[54],{415:function(t,a,s){"use strict";s.r(a);var n=s(43),e=Object(n.a)({},(function(){var t=this,a=t.$createElement,s=t._self._c||a;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h1",{attrs:{id:"juc-并发编程包"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#juc-并发编程包"}},[t._v("#")]),t._v(" JUC 并发编程包")]),t._v(" "),s("p",[s("strong",[t._v("Doug Lea 🐂🍺！")])]),t._v(" "),s("h2",{attrs:{id:"问题"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#问题"}},[t._v("#")]),t._v(" 问题")]),t._v(" "),s("h3",{attrs:{id:"什么是cas"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#什么是cas"}},[t._v("#")]),t._v(" 什么是CAS")]),t._v(" "),s("h3",{attrs:{id:"什么是aba问题"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#什么是aba问题"}},[t._v("#")]),t._v(" 什么是ABA问题")]),t._v(" "),s("h2",{attrs:{id:"源码分析"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#源码分析"}},[t._v("#")]),t._v(" 源码分析")]),t._v(" "),s("h3",{attrs:{id:"unsafe"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#unsafe"}},[t._v("#")]),t._v(" UnSafe")]),t._v(" "),s("h3",{attrs:{id:"locksupport"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#locksupport"}},[t._v("#")]),t._v(" LockSupport")]),t._v(" "),s("h3",{attrs:{id:"lock"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#lock"}},[t._v("#")]),t._v(" Lock")]),t._v(" "),s("h3",{attrs:{id:"abstractqueuedsynchronizer"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#abstractqueuedsynchronizer"}},[t._v("#")]),t._v(" "),s("RouterLink",{attrs:{to:"/java/aqs.html"}},[t._v("AbstractQueuedSynchronizer")])],1),t._v(" "),s("h3",{attrs:{id:"condition"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#condition"}},[t._v("#")]),t._v(" Condition")]),t._v(" "),s("p",[s("strong",[t._v("条件锁")])]),t._v(" "),s("div",{staticClass:"language-java extra-class"},[s("pre",{pre:!0,attrs:{class:"language-java"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("interface")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Condition")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n\t\t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 进入无限等待，直到被唤醒或者被中断，可响应中断")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("void")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("await")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("throws")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("InterruptedException")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\t\t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 进入等待，直到被唤醒，不响应中断")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("void")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("awaitUninterruptibly")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\t\t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 进入等待，直到被唤醒或者被中断或者超时，nanosTimeout纳秒后，等待超时，可响应中断")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("long")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("awaitNanos")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("long")]),t._v(" nanosTimeout"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("throws")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("InterruptedException")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\t\t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 进入等待，直到被唤醒或者被中断或者超时，单位为unit的time后，等待超时，可响应中断")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("boolean")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("await")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("long")]),t._v(" time"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("TimeUnit")]),t._v(" unit"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("throws")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("InterruptedException")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\t\t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 进入等待，直到被唤醒或者被中断或者超时，直到deadline日期，等待超时，可响应中断")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("boolean")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("awaitUntil")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Date")]),t._v(" deadline"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("throws")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("InterruptedException")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\t\t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 唤醒一个")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("void")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("signal")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\t\t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 唤醒所有")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("void")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("signalAll")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("p",[t._v("Condition有两个默认的实现类，分别是AbstractQueuedSynchronizer和AbstractQueuedLongSynchronizer中的ConditionObject类。")]),t._v(" "),s("p",[t._v("但AbstractQueuedLongSynchronizer暂时还没有继承类，所以目前可使用的默认的条件锁，只有AbstractQueuedSynchronizer中的ConditionObject。")]),t._v(" "),s("p",[t._v("更具体的分析，请查看AQS文章的"),s("RouterLink",{attrs:{to:"/java/aqs.html#ConditionObject"}},[t._v("ConditionObject")]),t._v("部分。")],1),t._v(" "),s("h3",{attrs:{id:"reentrantlock"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#reentrantlock"}},[t._v("#")]),t._v(" "),s("RouterLink",{attrs:{to:"/java/ReentrantLock.html"}},[t._v("ReentrantLock")])],1),t._v(" "),s("h3",{attrs:{id:"readwritelock"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#readwritelock"}},[t._v("#")]),t._v(" ReadWriteLock")]),t._v(" "),s("p",[s("strong",[t._v("读写锁")])]),t._v(" "),s("div",{staticClass:"language-java extra-class"},[s("pre",{pre:!0,attrs:{class:"language-java"}},[s("code",[s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("public")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("interface")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("ReadWriteLock")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 返回一个读锁")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Lock")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("readLock")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n  \t"),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 返回一个写锁")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Lock")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("writeLock")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("p",[s("strong",[t._v("ReadWriteLock接口比较简单，只定义了两个Lock方法，分别返回读锁和写锁。")])]),t._v(" "),s("p",[t._v("它有两个默认的实现类，分别是ReentrantReadWriteLock和StampedLock.ReadWriteLockView，会有单独的文章进行分析。")]),t._v(" "),s("h4",{attrs:{id:"reentrantreadwritelock"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#reentrantreadwritelock"}},[t._v("#")]),t._v(" "),s("RouterLink",{attrs:{to:"/java/ReentrantReadWriteLock.html"}},[t._v("ReentrantReadWriteLock")])],1),t._v(" "),s("h4",{attrs:{id:"stampedlock"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#stampedlock"}},[t._v("#")]),t._v(" "),s("RouterLink",{attrs:{to:"/java/StampedLock.html"}},[t._v("StampedLock")])],1),t._v(" "),s("h3",{attrs:{id:"atomic"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#atomic"}},[t._v("#")]),t._v(" "),s("RouterLink",{attrs:{to:"/java/atomic.html"}},[t._v("Atomic*")])],1),t._v(" "),s("h3",{attrs:{id:"countdownlatch（线程计数器）"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#countdownlatch（线程计数器）"}},[t._v("#")]),t._v(" CountDownLatch（线程计数器）")]),t._v(" "),s("h3",{attrs:{id:"cyclicbarrier（栅栏机制）"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#cyclicbarrier（栅栏机制）"}},[t._v("#")]),t._v(" CyclicBarrier（栅栏机制）")]),t._v(" "),s("h3",{attrs:{id:"countdownlatch和cyclicbarrier的区别，从源码级别看"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#countdownlatch和cyclicbarrier的区别，从源码级别看"}},[t._v("#")]),t._v(" CountDownLatch和CyclicBarrier的区别，从源码级别看")]),t._v(" "),s("h3",{attrs:{id:"semaphore（信号量）"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#semaphore（信号量）"}},[t._v("#")]),t._v(" Semaphore（信号量）")]),t._v(" "),s("h2",{attrs:{id:"总结"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[t._v("#")]),t._v(" 总结")])])}),[],!1,null,null,null);a.default=e.exports}}]);