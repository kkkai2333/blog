(window.webpackJsonp=window.webpackJsonp||[]).push([[70],{640:function(t,a,s){"use strict";s.r(a);var n=s(17),r=Object(n.a)({},(function(){var t=this,a=t.$createElement,s=t._self._c||a;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("h1",{attrs:{id:"leetcode-刷题"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#leetcode-刷题"}},[t._v("#")]),t._v(" LeetCode 刷题")]),t._v(" "),s("h2",{attrs:{id:"二叉树"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#二叉树"}},[t._v("#")]),t._v(" 二叉树")]),t._v(" "),s("h2",{attrs:{id:"链表"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#链表"}},[t._v("#")]),t._v(" 链表")]),t._v(" "),s("h3",{attrs:{id:"翻转单链表"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#翻转单链表"}},[t._v("#")]),t._v(" 翻转单链表")]),t._v(" "),s("h2",{attrs:{id:"数组"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#数组"}},[t._v("#")]),t._v(" 数组")]),t._v(" "),s("h2",{attrs:{id:"队列"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#队列"}},[t._v("#")]),t._v(" 队列")]),t._v(" "),s("h2",{attrs:{id:"栈"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#栈"}},[t._v("#")]),t._v(" 栈")]),t._v(" "),s("h2",{attrs:{id:"二分查找"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#二分查找"}},[t._v("#")]),t._v(" 二分查找")]),t._v(" "),s("h2",{attrs:{id:"动态规划"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#动态规划"}},[t._v("#")]),t._v(" 动态规划")]),t._v(" "),s("h2",{attrs:{id:"深度优先搜索-dfs"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#深度优先搜索-dfs"}},[t._v("#")]),t._v(" 深度优先搜索（DFS）")]),t._v(" "),s("p",[s("strong",[t._v("使用递归实现")])]),t._v(" "),s("p",[t._v("代码框架如下,")]),t._v(" "),s("div",{staticClass:"language-java extra-class"},[s("pre",{pre:!0,attrs:{class:"language-java"}},[s("code",[s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// (x, y) 为坐标位置")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("void")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("fill")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" x"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" y"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("fill")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("x "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" y"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 上")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("fill")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("x "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("+")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" y"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 下")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("fill")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("x"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" y "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 左")]),t._v("\n    "),s("span",{pre:!0,attrs:{class:"token function"}},[t._v("fill")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("x"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" y "),s("span",{pre:!0,attrs:{class:"token operator"}},[t._v("+")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),s("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 右")]),t._v("\n"),s("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),s("h2",{attrs:{id:"广度优先搜索-bfs"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#广度优先搜索-bfs"}},[t._v("#")]),t._v(" 广度优先搜索（BFS）")]),t._v(" "),s("p",[s("strong",[t._v("使用队列实现，可用来解层序遍历、最短路径问题。")])])])}),[],!1,null,null,null);a.default=r.exports}}]);