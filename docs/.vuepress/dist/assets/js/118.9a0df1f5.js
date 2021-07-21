(window.webpackJsonp=window.webpackJsonp||[]).push([[118],{647:function(e,s,a){"use strict";a.r(s);var t=a(6),r=Object(t.a)({},(function(){var e=this,s=e.$createElement,a=e._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[a("h1",{attrs:{id:"redis-过期删除策略"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#redis-过期删除策略"}},[e._v("#")]),e._v(" Redis 过期删除策略")]),e._v(" "),a("h2",{attrs:{id:"基础"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#基础"}},[e._v("#")]),e._v(" 基础")]),e._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// redis.conf")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// 配置serverCron任务的执行频率，默认：10次/每秒")]),e._v("\nhz "),a("span",{pre:!0,attrs:{class:"token number"}},[e._v("10")]),e._v("\n")])])]),a("p",[a("strong",[e._v("Redis的过期删除策略有两种，一种被动删除，一种主动删除。")])]),e._v(" "),a("p",[a("strong",[e._v("key过期信息存储为绝对的Unix时间戳（ms），这代表Redis的过期策略，对宿主机器时间的稳定性有强要求。")])]),e._v(" "),a("h3",{attrs:{id:"主节点的过期key处理"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#主节点的过期key处理"}},[e._v("#")]),e._v(" 主节点的过期key处理")]),e._v(" "),a("ol",[a("li",[a("p",[e._v("被动删除，当有客户端访问一个key时，Redis会检测这个key是否过期，如果过期，会删除这个key。")])]),e._v(" "),a("li",[a("p",[e._v('主动删除，CPU空闲时，执行serverCron定时任务，执行周期为每秒10次（可通过修改配置属性"hz"来修改执行周期），任务分为以下几个步骤：')]),e._v(" "),a("ol",[a("li",[e._v("每次过期清理时间不超过CPU时间的25%，")]),e._v(" "),a("li",[e._v("随机选择20个key，判断它们是否过期，如果过期，则删除，")]),e._v(" "),a("li",[e._v("如果发现一次选择中，有超过25%（默认情况下就是5个）的key都过期了，则重复步骤2，直到随机选择中，过期的key百分比低于25%。")])])])]),e._v(" "),a("h3",{attrs:{id:"从节点和aof文件的过期key处理"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#从节点和aof文件的过期key处理"}},[e._v("#")]),e._v(" 从节点和aof文件的过期key处理")]),e._v(" "),a("ol",[a("li",[e._v("当主节点判断到一个key过期后，就会对这些key执行del命令；")]),e._v(" "),a("li",[e._v("主节点执行的del操作会持久化到aof文件并且同步给从节点，这样从节点就会删除这个key；")]),e._v(" "),a("li",[e._v("从节点不会主动执行删除操作，所以，当一个key过期了，但是主节点还没有同步过来del命令时，客户端还是可以在从节点获取到这个key；")]),e._v(" "),a("li",[e._v("这样的话，过期删除的操作就集中在主节点上，aof文件和从节点只需要添加和执行同步过来的del命令即可。")])]),e._v(" "),a("h2",{attrs:{id:"源码分析"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#源码分析"}},[e._v("#")]),e._v(" 源码分析")]),e._v(" "),a("div",{staticClass:"language-c extra-class"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// expire.c")]),e._v("\n")])])]),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[e._v("#")]),e._v(" 总结")])])}),[],!1,null,null,null);s.default=r.exports}}]);