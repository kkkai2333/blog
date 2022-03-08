(window.webpackJsonp=window.webpackJsonp||[]).push([[113],{693:function(s,t,a){"use strict";a.r(t);var e=a(17),n=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h2",{attrs:{id:"布隆过滤器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#布隆过滤器"}},[s._v("#")]),s._v(" 布隆过滤器")]),s._v(" "),a("h2",{attrs:{id:"一致性hash算法"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#一致性hash算法"}},[s._v("#")]),s._v(" 一致性hash算法")]),s._v(" "),a("h2",{attrs:{id:"缓存的三大问题"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#缓存的三大问题"}},[s._v("#")]),s._v(" 缓存的三大问题")]),s._v(" "),a("h3",{attrs:{id:"缓存击穿"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#缓存击穿"}},[s._v("#")]),s._v(" 缓存击穿")]),s._v(" "),a("p",[a("strong",[s._v("当许多请求在访问同一个key时，这个key失效了，导致大量请求打到数据库上。")])]),s._v(" "),a("h4",{attrs:{id:"问题"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#问题"}},[s._v("#")]),s._v(" 问题")]),s._v(" "),a("p",[s._v("数据库的访问量突增，压力变大，可能会导致数据库宕机。")]),s._v(" "),a("h4",{attrs:{id:"解决方案"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#解决方案"}},[s._v("#")]),s._v(" 解决方案")]),s._v(" "),a("p",[s._v("加锁，当缓存的key为空时，对第一个到数据查询的线程加锁，把其他线程拦在后边，当第一个线程查询到数据，然后重建缓存后，其他线程就可以直接从缓存中获取数据。")]),s._v(" "),a("h3",{attrs:{id:"缓存穿透"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#缓存穿透"}},[s._v("#")]),s._v(" 缓存穿透")]),s._v(" "),a("p",[a("strong",[s._v("查询不存在的数据，比如说，缓存和数据库中都没有查询key，导致每次都要到数据库中查询。")])]),s._v(" "),a("h4",{attrs:{id:"问题-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#问题-2"}},[s._v("#")]),s._v(" 问题")]),s._v(" "),a("p",[s._v("如果有黑客使用不存在的key对系统进行访问，就会导致全部的请求打到数据库上，数据库的访问量突增，压力变大，可能会导致数据库宕机。")]),s._v(" "),a("h4",{attrs:{id:"解决方案-2"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#解决方案-2"}},[s._v("#")]),s._v(" 解决方案")]),s._v(" "),a("ol",[a("li",[s._v("缓存null值")]),s._v(" "),a("li",[s._v("BloomFilter")])]),s._v(" "),a("h3",{attrs:{id:"缓存雪崩"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#缓存雪崩"}},[s._v("#")]),s._v(" 缓存雪崩")]),s._v(" "),a("p",[a("strong",[s._v("在某一时刻，大量和缓存失效，导致原本应该访问缓存的请求全部打在数据库上。")])]),s._v(" "),a("h4",{attrs:{id:"问题-3"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#问题-3"}},[s._v("#")]),s._v(" 问题")]),s._v(" "),a("p",[s._v("大量缓存失效，导致全部的请求打到数据库上，数据库的访问量突增，压力变大，可能会导致数据库宕机。")]),s._v(" "),a("h4",{attrs:{id:"解决方案-3"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#解决方案-3"}},[s._v("#")]),s._v(" 解决方案")]),s._v(" "),a("h3",{attrs:{id:"热点key集中失效-缓存雪崩的变种"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#热点key集中失效-缓存雪崩的变种"}},[s._v("#")]),s._v(" 热点key集中失效（缓存雪崩的变种）")]),s._v(" "),a("h4",{attrs:{id:"解决方案-4"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#解决方案-4"}},[s._v("#")]),s._v(" 解决方案")]),s._v(" "),a("p",[s._v("给不同的key设置不同的缓存时间，比如说，在固定时间上再加一个随机值。")]),s._v(" "),a("h3",{attrs:{id:"缓存和数据库的双写一致性"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#缓存和数据库的双写一致性"}},[s._v("#")]),s._v(" 缓存和数据库的双写一致性")]),s._v(" "),a("h4",{attrs:{id:"问题-4"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#问题-4"}},[s._v("#")]),s._v(" 问题")]),s._v(" "),a("h4",{attrs:{id:"解决方案-5"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#解决方案-5"}},[s._v("#")]),s._v(" 解决方案")]),s._v(" "),a("h3",{attrs:{id:"延伸问题"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#延伸问题"}},[s._v("#")]),s._v(" 延伸问题")]),s._v(" "),a("ul",[a("li",[a("p",[s._v("大key是如何产生的，多大算大key")])]),s._v(" "),a("li",[a("p",[s._v("热key产生的原因及解决方案")])])]),s._v(" "),a("h2",{attrs:{id:"场景分析"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#场景分析"}},[s._v("#")]),s._v(" 场景分析")]),s._v(" "),a("h3",{attrs:{id:"如何测试redis支持的最大qps、tps"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#如何测试redis支持的最大qps、tps"}},[s._v("#")]),s._v(" 如何测试Redis支持的最大qps、tps")]),s._v(" "),a("p",[s._v("Redis发行版本中，提供了redis-benchmark性能测试工具，我们可以通过以下命令来测试Redis支持的并发性。")]),s._v(" "),a("div",{staticClass:"language-java extra-class"},[a("pre",{pre:!0,attrs:{class:"language-java"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ")]),s._v("\nredis"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("benchmark "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("h "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("host"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("p "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("port"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("c "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("clients"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("<")]),s._v("requests"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("k "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("boolean")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("h "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("hostname"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("      "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Server")]),s._v(" hostname "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("127.0")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v(".0")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v(".1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("p "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("port"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("          "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Server")]),s._v(" port "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6379")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("s "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("socket"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Server")]),s._v(" socket "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("overrides host and port"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("a "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("password"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("      "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Password")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Redis")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Auth")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("c "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("clients"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("       "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Number")]),s._v(" of parallel connections "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("50")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("n "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("requests"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("      "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Total")]),s._v(" number of requests "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("100000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("d "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("size"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("          "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Data")]),s._v(" size of SET"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("/")]),s._v("GET value in bytes "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("--")]),s._v("dbnum "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("       SELECT the specified db number "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("k "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("boolean")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("       "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("keep alive "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("reconnect "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("P")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("numreq"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("        "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Pipeline")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("numreq"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[a("span",{pre:!0,attrs:{class:"token namespace"}},[s._v("requests"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")])]),s._v(" Default")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("no pipeline"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("q                 "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Quiet"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v(" Just")]),s._v(" show query"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("/")]),s._v("sec values\n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("t "),a("span",{pre:!0,attrs:{class:"token generics"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("<")]),s._v("tests"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(">")])]),s._v("         "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("Only")]),s._v(" run the comma separated list of "),a("span",{pre:!0,attrs:{class:"token class-name"}},[a("span",{pre:!0,attrs:{class:"token namespace"}},[s._v("tests"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")])]),s._v(" The")]),s._v(" test\n                    names are the same as the ones produced as output"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// -h host地址")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// -p 端口号")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// -c 总客户端数")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// -n 总请求数")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// -d 每个请求的数据包大小(kb)")]),s._v("\nredis"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("benchmark "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("h "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("127.0")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v(".0")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v(".1")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("p "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6379")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("c "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("50")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("n "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("100000")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("d "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("2")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("k "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v("\n")])])]),a("h2",{attrs:{id:"参考"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#参考"}},[s._v("#")]),s._v(" 参考")]),s._v(" "),a("ul",[a("li",[a("a",{attrs:{href:"http://zhangtielei.com/posts/server.html",target:"_blank",rel:"noopener noreferrer"}},[s._v("Redis内部数据结构详解"),a("OutboundLink")],1)]),s._v(" "),a("li",[a("a",{attrs:{href:"https://redis.io/documentation",target:"_blank",rel:"noopener noreferrer"}},[s._v("Redis官方文档"),a("OutboundLink")],1)])])])}),[],!1,null,null,null);t.default=n.exports}}]);