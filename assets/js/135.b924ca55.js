(window.webpackJsonp=window.webpackJsonp||[]).push([[135],{716:function(t,n,e){"use strict";e.r(n);var s=e(17),a=Object(s.a)({},(function(){var t=this,n=t.$createElement,e=t._self._c||n;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"spring-cloud"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#spring-cloud"}},[t._v("#")]),t._v(" Spring Cloud")]),t._v(" "),e("h2",{attrs:{id:"spring-cloud-netflix"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#spring-cloud-netflix"}},[t._v("#")]),t._v(" Spring Cloud Netflix")]),t._v(" "),e("h2",{attrs:{id:"spring-cloud-alibaba"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#spring-cloud-alibaba"}},[t._v("#")]),t._v(" Spring Cloud Alibaba")]),t._v(" "),e("div",{staticClass:"language-yaml extra-class"},[e("pre",{pre:!0,attrs:{class:"language-yaml"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# spring feign 配置")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# 开了熔断器")]),t._v("\nfeign.hystrix.enabled=true\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# 启用hystrix的配置，即5s后超时，默认是1s")]),t._v("\nhystrix.command.default.execution.isolation.thread.timeoutInMilliseconds=5000\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# 不开熔断器")]),t._v("\nfeign.hystrix.enabled=false\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# 启用feign.client.config的配置，即当connect超过3s后抛错，read超过3s后抛错")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# 如果没有配置，则一直连接直到返回，貌似没有超时时间，我sleep一分钟都还在等待返回")]),t._v("\nfeign.client.config.default.connectTimeout=3000\nfeign.client.config.default.readTimeout=3000\n")])])])])}),[],!1,null,null,null);n.default=a.exports}}]);