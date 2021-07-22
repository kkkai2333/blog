(window.webpackJsonp=window.webpackJsonp||[]).push([[15],{516:function(a,e,t){a.exports=t.p+"assets/img/queue.481d647c.png"},517:function(a,e,t){a.exports=t.p+"assets/img/deque.deb84c39.png"},622:function(a,e,t){"use strict";t.r(e);var r=t(6),u=Object(r.a)({},(function(){var a=this,e=a.$createElement,r=a._self._c||e;return r("ContentSlotsDistributor",{attrs:{"slot-key":a.$parent.slotKey}},[r("h1",{attrs:{id:"java-队列"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-队列"}},[a._v("#")]),a._v(" Java 队列")]),a._v(" "),r("h2",{attrs:{id:"源码分析"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#源码分析"}},[a._v("#")]),a._v(" 源码分析")]),a._v(" "),r("h3",{attrs:{id:"queue-队列"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#queue-队列"}},[a._v("#")]),a._v(" Queue（队列）")]),a._v(" "),r("p",[r("img",{attrs:{src:t(516),alt:"Queue"}})]),a._v(" "),r("h4",{attrs:{id:"java-util-priorityqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-priorityqueue"}},[a._v("#")]),a._v(" java.util.PriorityQueue")]),a._v(" "),r("p",[a._v("优先级队列")]),a._v(" "),r("h4",{attrs:{id:"java-util-concurrent-concurrentlinkedqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-concurrentlinkedqueue"}},[a._v("#")]),a._v(" java.util.concurrent.ConcurrentLinkedQueue")]),a._v(" "),r("p",[a._v("线程安全的有界（capacity上限为Integer.MAX_VALUE）非阻塞队列")]),a._v(" "),r("h4",{attrs:{id:"java-util-concurrent-blockingqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-blockingqueue"}},[a._v("#")]),a._v(" java.util.concurrent.BlockingQueue")]),a._v(" "),r("p",[a._v("阻塞队列父接口")]),a._v(" "),r("h5",{attrs:{id:"java-util-concurrent-arrayblockingqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-arrayblockingqueue"}},[a._v("#")]),a._v(" java.util.concurrent.ArrayBlockingQueue")]),a._v(" "),r("p",[a._v("使用独占锁实现的有界（初始化队列时，capacity必须指定）阻塞队列（数组实现），其内维护了一个ReentrantLock的实例和两个Condition的条件变量，每次入队、出队、删除、计算size都需要获得lock锁，锁的粒度相对于LinkedBlockingQueue较大。")]),a._v(" "),r("h5",{attrs:{id:"java-util-concurrent-linkedblockingqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-linkedblockingqueue"}},[a._v("#")]),a._v(" java.util.concurrent.LinkedBlockingQueue")]),a._v(" "),r("p",[a._v("使用独占锁实现的有界（capacity上限为Integer.MAX_VALUE）阻塞队列（链表实现），其内维护了两个ReentrantLock的实例，和对应的Condition条件变量，每次入队需要需要获得putLock锁，每次出队需要获得takeLock锁，每次删除需要同时获得两把锁，锁的粒度相对于ArrayBlockingQueue较小，并发度更高。")]),a._v(" "),r("h5",{attrs:{id:"java-util-concurrent-priorityblockingqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-priorityblockingqueue"}},[a._v("#")]),a._v(" java.util.concurrent.PriorityBlockingQueue")]),a._v(" "),r("p",[a._v("使用独占锁实现的带优先级的有界（capacity上限为Integer.MAX_VALUE - 8）阻塞队列（数组实现），每次出队都返回优先级最高或者最低的元素，其内是通过最大堆/最小堆实现的，默认通过对象的compareTo方法进行比较，也可通过初始化时传入的Comparator比较器进行比较。")]),a._v(" "),r("h5",{attrs:{id:"java-util-concurrent-delayqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-delayqueue"}},[a._v("#")]),a._v(" java.util.concurrent.DelayQueue")]),a._v(" "),r("p",[a._v("使用独占锁实现的延迟有界（capacity上限为Integer.MAX_VALUE - 8）阻塞队列，其内使用PriorityQueue存放数据，使用一个ReentrantLock实例来实现线程同步，队列中的元素需要实现Delayed接口，而Delayed的接口继承了Comparable接口，这也就满足了使用PriorityQueue队列的前提条件（需要通过compareTo方法比较大小）。")]),a._v(" "),r("h5",{attrs:{id:"java-util-concurrent-synchronousqueue"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-synchronousqueue"}},[a._v("#")]),a._v(" java.util.concurrent.SynchronousQueue")]),a._v(" "),r("p",[a._v("使用独占锁实现的同步阻塞队列")]),a._v(" "),r("h3",{attrs:{id:"deque-双端队列"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#deque-双端队列"}},[a._v("#")]),a._v(" Deque（双端队列）")]),a._v(" "),r("p",[r("img",{attrs:{src:t(517),alt:"Dueue"}})]),a._v(" "),r("h4",{attrs:{id:"java-util-arraydeque"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-arraydeque"}},[a._v("#")]),a._v(" java.util.ArrayDeque")]),a._v(" "),r("h4",{attrs:{id:"java-util-concurrent-concurrentlinkeddeque"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-concurrentlinkeddeque"}},[a._v("#")]),a._v(" java.util.concurrent.ConcurrentLinkedDeque")]),a._v(" "),r("h4",{attrs:{id:"java-util-concurrent-blockingdeque"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-blockingdeque"}},[a._v("#")]),a._v(" java.util.concurrent.BlockingDeque")]),a._v(" "),r("h5",{attrs:{id:"java-util-concurrent-linkedblockingdeque"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#java-util-concurrent-linkedblockingdeque"}},[a._v("#")]),a._v(" java.util.concurrent.LinkedBlockingDeque")]),a._v(" "),r("h2",{attrs:{id:"总结"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[a._v("#")]),a._v(" 总结")])])}),[],!1,null,null,null);e.default=u.exports}}]);