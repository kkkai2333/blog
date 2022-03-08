(window.webpackJsonp=window.webpackJsonp||[]).push([[105],{682:function(a,t,s){"use strict";s.r(t);var r=s(17),e=Object(r.a)({},(function(){var a=this,t=a.$createElement,s=a._self._c||t;return s("ContentSlotsDistributor",{attrs:{"slot-key":a.$parent.slotKey}},[s("h2",{attrs:{id:"概念"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#概念"}},[a._v("#")]),a._v(" 概念")]),a._v(" "),s("h2",{attrs:{id:"特性"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#特性"}},[a._v("#")]),a._v(" 特性")]),a._v(" "),s("h2",{attrs:{id:"架构设计"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#架构设计"}},[a._v("#")]),a._v(" 架构设计")]),a._v(" "),s("h2",{attrs:{id:"常见问题"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#常见问题"}},[a._v("#")]),a._v(" 常见问题")]),a._v(" "),s("ol",[s("li",[s("p",[a._v("kafka发送失败的时候一般是如何处理的?\n一般, 发送失败肯定是producer端,\n首先,发送的时候可以配置retries属性, 表示如果发送失败, kafka最多重试几次(自动重试), 如果达到最大重试次数, 都没发送成功, 就得代码里边去catch这个异常,\n然后, 可以有一个本地消息表去持久化要发送的消息,如果说catch了1最后的异常,就代表这个消息是没发送成功的,\n最后, 可以有一个后台定时任务, 定时去查询表中没有发送成功的消息做重试,\n最最后, 可以设定一个重发阈值, 如果定时重发一直失败, 可以触发预警机制.")])]),a._v(" "),s("li",[s("p",[a._v("kafka重复消费如何解决?")])])]),a._v(" "),s("p",[a._v("消息唯一标识 + 状态机")]),a._v(" "),s("ol",{attrs:{start:"3"}},[s("li",[a._v("kafka自动提交offset会有什么问题?")])]),a._v(" "),s("p",[a._v("自动提交offset下, 是定时去处理的, 默认5s poll一次消息, 然后会自动commit上一次poll的最大offset\n如果有一个消费者挂了，那会触发消费者再平衡，这个时候就会有两个问题，")]),a._v(" "),s("ol",[s("li",[a._v("c1消费者最后一次poll是200-300区间, 在提交offset的时候挂掉了, 再平衡之后, c2就会重新消费200-300的区间, 就会有重复消费")]),a._v(" "),s("li",[a._v("c1消费者倒数第二次poll是200-300区间, 最后一次poll是300-400区间, 这个时候, 会提交offset到300, 但是消费者还没有消费完200-300的消息, 再平衡之后, c2就会从300开始往后消费, 那200-300的消息就不会被消费了")])]),a._v(" "),s("h2",{attrs:{id:"参考"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#参考"}},[a._v("#")]),a._v(" 参考")]),a._v(" "),s("ul",[s("li",[a._v("深入理解kafka：核心设计与实践原理")])]),a._v(" "),s("h2",{attrs:{id:"附录"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#附录"}},[a._v("#")]),a._v(" 附录")]),a._v(" "),s("h3",{attrs:{id:"常用命令"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#常用命令"}},[a._v("#")]),a._v(" 常用命令")]),a._v(" "),s("div",{staticClass:"language-json extra-class"},[s("pre",{pre:!0,attrs:{class:"language-json"}},[s("code",[a._v("\n")])])])])}),[],!1,null,null,null);t.default=e.exports}}]);