# Java web

## 5.1 jvm 指令集简介

**注1：不完整**

**注2：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用, #: 0-5**

2. 方法的修饰属性

   * `public`，公有方法
   * `private`，私有方法
   * `protected`，子类和包可见的方法
   * `static`，静态方法，可通过类名直接访问
   * `final`，不可覆盖方法
   * `synchronized`，同步方法，同时只能被一个对象访问
   * `native`，本地方法
   * `abstract`，抽象方法
   
2. 与方法相关的指令

   * `invokeinterface`，调用接口方法
   * `invokespecial`，调用超类构造方法，实例初始化方法或私有方法
   * `invokestatic`，调用静态方法
   * `invokevirtual`，调用实例方法

3. 数据类型的表示方式

   * `[（表示成[I）`，数组（如int[]）
   * `L（表示成Ljava/lang/String;）`，类(如String)
   * `B`，byte
   * `Z`，boolean
   * `C`，char
   * `D`，double
   * `F`，float
   * `I`，int
   * `J`，long
   * `S`，short
   * `V`，void

4. 类属性的修饰属性

   * `public`，公有的
   * `private`，私有的
   * `protected`，子类和包可见
   * `static`，静态的
   * `final`，不可修改
   * `volatile`，弱引用
   * `transient`，临时属性

5. 与类属性相关的指令

   * `getfield`，获取指定类的实例域，并将其值压入栈顶
   * `putfield`，为指定类的实例域赋值
   * `getstatic`，获取指定类的静态域，并将其值压入栈顶
   * `putstatic`，为指定类的静态域赋值

6. 与栈操作相关

   * `dup`，
   * `dup_x1`，
   * `dup_x2`，
   * `dup2`，
   * `dup2_x1`，
   * `dup2_x2`，
   * `pop`，
   * `pop2`，
   * `swap`，

7. 与本地变量操作相关

   **注：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用, #: 0-3**

   * `*store_#`，将栈顶元素存入本地变量#中，变量是一个`*`类型
   * `*load_#`，将本地变量#压入栈顶，变量是一个`*`类型
   * `*store n`，将栈顶元素存入本地变量n中，变量是一个`*`类型
   * `*load n`，将本地变量n压入栈顶，变量是一个`*`类型
   * `iinc n increment`，将制定int型变量增加指定值

8. 与运算操作相关

   **注：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用**

   * `*add`，将栈顶两个`*`类型数值相加，结果压入栈顶
   * `*sub`，将栈顶两个`*`类型数值相减，结果压入栈顶
   * `*div`，将栈顶两个`*`类型数值相除，结果压入栈顶
   * `*mul`，将栈顶两个`*`类型数值相乘，结果压入栈顶
   * `*neg`，将栈顶`*`类型数值取负，结果压入栈顶
   * `*rem`，将栈顶两个`*`类型数值做取模运算，结果压入栈顶
   * `*cmpg`，比较栈顶两个`*`类型数值大小，并将结果1、0、-1压入栈顶，当其中一个数值为NaN时，将1压入栈顶
   * `*cmpl`，比较栈顶两个`*`类型数值大小，并将结果1、0、-1压入栈顶，当其中一个数值为NaN时，将-1压入栈顶
   * `i2b`，将栈顶int类型数值强转为byte，结果压入栈顶
   * `i2c，`将栈顶int类型数值强转为char，结果压入栈顶
   * `i2s`，将栈顶int类型数值强转为short，结果压入栈顶
   * `iand`，将栈顶两个int类型数值相与，结果压入栈顶
   * `ior`，将栈顶两个int类型数值相或，结果压入栈顶
   * `ixor`，将栈顶两个int类型数值按位异或，结果压入栈顶
   * `ishl`，将int类型数值左移位指定位数，结果压入栈顶
   * `ishr`，将int类型数值右移位指定位数，结果压入栈顶
   * `iushr`，将无符号int类型数值右移位指定位数，结果压入栈顶
   * `land`，将栈顶两个long类型数值相与，结果压入栈顶
   * `lor`，将栈顶两个long类型数值相或，结果压入栈顶
   * `lxor`，将栈顶两个long类型数值按位异或，结果压入栈顶
   * `lshl`，将long类型数值左移位指定位数，结果压入栈顶
   * `lshr`，将long类型数值右移位指定位数，结果压入栈顶
   * `lushr`，将无符号long类型数值右移位指定位数，结果压入栈顶

10. 与常量操作相关

     **注：*: f/d/l/i/a,   f: float, d: double, l: long, i: int, a: 引用**

     * `*const_#`，向栈顶压入一个*类型常量#
     * `iconst_m1`，将int类型-1压入栈顶
     * `aconst_null`，将null压入栈顶
     * `bipush n`，将单字节的常量值-128~127压入栈顶
     * `sipush n`，将短整型的常量值-32768~32767压入栈顶
     * `ldc`，将int，float，String类型常量值从常量池压入栈顶
     * `ldc_w`，将int，float，String类型常量值从常量池压入栈顶（宽索引）
     * `ldc2_w`，将long，double类型常量值从常量池压入栈顶（宽索引）

   11. ava控制指令相关
       * `goto`，跳转到指定的偏移地址
       * `return`，从当前方法返回
       * `*return`，从当前方法返回一个`*`类型数值
       * `lookupswitch`，用与switch条件跳转
       * `tableswitch`，用与switch条件跳转

12. Java数据类型转换相关

      * `*2*`，将栈顶`*`类型元素转换成`*`类型

13. Java同步操作相关

     * `monitorenter`，获取对象的锁，适用于同步方法或同步块
     * `monitorexit`，获取对象的锁，适用于同步方法或同步块

