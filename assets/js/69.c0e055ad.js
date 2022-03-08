(window.webpackJsonp=window.webpackJsonp||[]).push([[69],{637:function(v,_,l){"use strict";l.r(_);var i=l(17),o=Object(i.a)({},(function(){var v=this,_=v.$createElement,l=v._self._c||_;return l("ContentSlotsDistributor",{attrs:{"slot-key":v.$parent.slotKey}},[l("h1",{attrs:{id:"java-web"}},[l("a",{staticClass:"header-anchor",attrs:{href:"#java-web"}},[v._v("#")]),v._v(" Java web")]),v._v(" "),l("h2",{attrs:{id:"_5-1-jvm-指令集简介"}},[l("a",{staticClass:"header-anchor",attrs:{href:"#_5-1-jvm-指令集简介"}},[v._v("#")]),v._v(" 5.1 jvm 指令集简介")]),v._v(" "),l("p",[l("strong",[v._v("注1：不完整")])]),v._v(" "),l("p",[l("strong",[v._v("注2：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用, #: 0-5")])]),v._v(" "),l("ol",{attrs:{start:"2"}},[l("li",[l("p",[v._v("方法的修饰属性")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("public")]),v._v("，公有方法")]),v._v(" "),l("li",[l("code",[v._v("private")]),v._v("，私有方法")]),v._v(" "),l("li",[l("code",[v._v("protected")]),v._v("，子类和包可见的方法")]),v._v(" "),l("li",[l("code",[v._v("static")]),v._v("，静态方法，可通过类名直接访问")]),v._v(" "),l("li",[l("code",[v._v("final")]),v._v("，不可覆盖方法")]),v._v(" "),l("li",[l("code",[v._v("synchronized")]),v._v("，同步方法，同时只能被一个对象访问")]),v._v(" "),l("li",[l("code",[v._v("native")]),v._v("，本地方法")]),v._v(" "),l("li",[l("code",[v._v("abstract")]),v._v("，抽象方法")])])]),v._v(" "),l("li",[l("p",[v._v("与方法相关的指令")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("invokeinterface")]),v._v("，调用接口方法")]),v._v(" "),l("li",[l("code",[v._v("invokespecial")]),v._v("，调用超类构造方法，实例初始化方法或私有方法")]),v._v(" "),l("li",[l("code",[v._v("invokestatic")]),v._v("，调用静态方法")]),v._v(" "),l("li",[l("code",[v._v("invokevirtual")]),v._v("，调用实例方法")])])]),v._v(" "),l("li",[l("p",[v._v("数据类型的表示方式")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("[（表示成[I）")]),v._v("，数组（如int[]）")]),v._v(" "),l("li",[l("code",[v._v("L（表示成Ljava/lang/String;）")]),v._v("，类(如String)")]),v._v(" "),l("li",[l("code",[v._v("B")]),v._v("，byte")]),v._v(" "),l("li",[l("code",[v._v("Z")]),v._v("，boolean")]),v._v(" "),l("li",[l("code",[v._v("C")]),v._v("，char")]),v._v(" "),l("li",[l("code",[v._v("D")]),v._v("，double")]),v._v(" "),l("li",[l("code",[v._v("F")]),v._v("，float")]),v._v(" "),l("li",[l("code",[v._v("I")]),v._v("，int")]),v._v(" "),l("li",[l("code",[v._v("J")]),v._v("，long")]),v._v(" "),l("li",[l("code",[v._v("S")]),v._v("，short")]),v._v(" "),l("li",[l("code",[v._v("V")]),v._v("，void")])])]),v._v(" "),l("li",[l("p",[v._v("类属性的修饰属性")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("public")]),v._v("，公有的")]),v._v(" "),l("li",[l("code",[v._v("private")]),v._v("，私有的")]),v._v(" "),l("li",[l("code",[v._v("protected")]),v._v("，子类和包可见")]),v._v(" "),l("li",[l("code",[v._v("static")]),v._v("，静态的")]),v._v(" "),l("li",[l("code",[v._v("final")]),v._v("，不可修改")]),v._v(" "),l("li",[l("code",[v._v("volatile")]),v._v("，弱引用")]),v._v(" "),l("li",[l("code",[v._v("transient")]),v._v("，临时属性")])])]),v._v(" "),l("li",[l("p",[v._v("与类属性相关的指令")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("getfield")]),v._v("，获取指定类的实例域，并将其值压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("putfield")]),v._v("，为指定类的实例域赋值")]),v._v(" "),l("li",[l("code",[v._v("getstatic")]),v._v("，获取指定类的静态域，并将其值压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("putstatic")]),v._v("，为指定类的静态域赋值")])])]),v._v(" "),l("li",[l("p",[v._v("与栈操作相关")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("dup")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("dup_x1")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("dup_x2")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("dup2")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("dup2_x1")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("dup2_x2")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("pop")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("pop2")]),v._v("，")]),v._v(" "),l("li",[l("code",[v._v("swap")]),v._v("，")])])]),v._v(" "),l("li",[l("p",[v._v("与本地变量操作相关")]),v._v(" "),l("p",[l("strong",[v._v("注：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用, #: 0-3")])]),v._v(" "),l("ul",[l("li",[l("code",[v._v("*store_#")]),v._v("，将栈顶元素存入本地变量#中，变量是一个"),l("code",[v._v("*")]),v._v("类型")]),v._v(" "),l("li",[l("code",[v._v("*load_#")]),v._v("，将本地变量#压入栈顶，变量是一个"),l("code",[v._v("*")]),v._v("类型")]),v._v(" "),l("li",[l("code",[v._v("*store n")]),v._v("，将栈顶元素存入本地变量n中，变量是一个"),l("code",[v._v("*")]),v._v("类型")]),v._v(" "),l("li",[l("code",[v._v("*load n")]),v._v("，将本地变量n压入栈顶，变量是一个"),l("code",[v._v("*")]),v._v("类型")]),v._v(" "),l("li",[l("code",[v._v("iinc n increment")]),v._v("，将制定int型变量增加指定值")])])]),v._v(" "),l("li",[l("p",[v._v("与运算操作相关")]),v._v(" "),l("p",[l("strong",[v._v("注：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用")])]),v._v(" "),l("ul",[l("li",[l("code",[v._v("*add")]),v._v("，将栈顶两个"),l("code",[v._v("*")]),v._v("类型数值相加，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("*sub")]),v._v("，将栈顶两个"),l("code",[v._v("*")]),v._v("类型数值相减，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("*div")]),v._v("，将栈顶两个"),l("code",[v._v("*")]),v._v("类型数值相除，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("*mul")]),v._v("，将栈顶两个"),l("code",[v._v("*")]),v._v("类型数值相乘，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("*neg")]),v._v("，将栈顶"),l("code",[v._v("*")]),v._v("类型数值取负，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("*rem")]),v._v("，将栈顶两个"),l("code",[v._v("*")]),v._v("类型数值做取模运算，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("*cmpg")]),v._v("，比较栈顶两个"),l("code",[v._v("*")]),v._v("类型数值大小，并将结果1、0、-1压入栈顶，当其中一个数值为NaN时，将1压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("*cmpl")]),v._v("，比较栈顶两个"),l("code",[v._v("*")]),v._v("类型数值大小，并将结果1、0、-1压入栈顶，当其中一个数值为NaN时，将-1压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("i2b")]),v._v("，将栈顶int类型数值强转为byte，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("i2c，")]),v._v("将栈顶int类型数值强转为char，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("i2s")]),v._v("，将栈顶int类型数值强转为short，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("iand")]),v._v("，将栈顶两个int类型数值相与，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("ior")]),v._v("，将栈顶两个int类型数值相或，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("ixor")]),v._v("，将栈顶两个int类型数值按位异或，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("ishl")]),v._v("，将int类型数值左移位指定位数，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("ishr")]),v._v("，将int类型数值右移位指定位数，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("iushr")]),v._v("，将无符号int类型数值右移位指定位数，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("land")]),v._v("，将栈顶两个long类型数值相与，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("lor")]),v._v("，将栈顶两个long类型数值相或，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("lxor")]),v._v("，将栈顶两个long类型数值按位异或，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("lshl")]),v._v("，将long类型数值左移位指定位数，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("lshr")]),v._v("，将long类型数值右移位指定位数，结果压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("lushr")]),v._v("，将无符号long类型数值右移位指定位数，结果压入栈顶")])])]),v._v(" "),l("li",[l("p",[v._v("与常量操作相关")]),v._v(" "),l("p",[l("strong",[v._v("注：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用")])]),v._v(" "),l("ul",[l("li",[l("code",[v._v("*const_#")]),v._v("，向栈顶压入一个*类型常量#")]),v._v(" "),l("li",[l("code",[v._v("iconst_m1")]),v._v("，将int类型-1压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("aconst_null")]),v._v("，将null压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("bipush n")]),v._v("，将单字节的常量值-128~127压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("sipush n")]),v._v("，将短整型的常量值-32768~32767压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("ldc")]),v._v("，将int，float，String类型常量值从常量池压入栈顶")]),v._v(" "),l("li",[l("code",[v._v("ldc_w")]),v._v("，将int，float，String类型常量值从常量池压入栈顶（宽索引）")]),v._v(" "),l("li",[l("code",[v._v("ldc2_w")]),v._v("，将long，double类型常量值从常量池压入栈顶（宽索引）")])])]),v._v(" "),l("li",[l("p",[v._v("ava控制指令相关")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("goto")]),v._v("，跳转到指定的偏移地址")]),v._v(" "),l("li",[l("code",[v._v("return")]),v._v("，从当前方法返回")]),v._v(" "),l("li",[l("code",[v._v("*return")]),v._v("，从当前方法返回一个"),l("code",[v._v("*")]),v._v("类型数值")]),v._v(" "),l("li",[l("code",[v._v("lookupswitch")]),v._v("，用与switch条件跳转")]),v._v(" "),l("li",[l("code",[v._v("tableswitch")]),v._v("，用与switch条件跳转")])])]),v._v(" "),l("li",[l("p",[v._v("Java数据类型转换相关")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("*2*")]),v._v("，将栈顶"),l("code",[v._v("*")]),v._v("类型元素转换成"),l("code",[v._v("*")]),v._v("类型")])])]),v._v(" "),l("li",[l("p",[v._v("Java同步操作相关")]),v._v(" "),l("ul",[l("li",[l("code",[v._v("monitorenter")]),v._v("，获取对象的锁，适用于同步方法或同步块")]),v._v(" "),l("li",[l("code",[v._v("monitorexit")]),v._v("，获取对象的锁，适用于同步方法或同步块")])])])])])}),[],!1,null,null,null);_.default=o.exports}}]);