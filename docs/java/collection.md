---
title: Java 中的集合
date: 2020-10-27
categories:
- java
tags:
- java
- collection
sidebar: auto
publish: false
---

## 问题

### 链表的层次变量

## 源码分析

### Map

#### [HashMap](./hashmap.md)

##### 1.7

头插法，数组 + 链表；

##### 1.8

尾插法，数组 + 链表/红黑树；

#### [ConcurrentHashMap](./concurrent-hashmap.md)

##### 1.7

segment分段锁，数组 + 链表；

##### 1.8

cas + synchronized，数组 + 链表/红黑树；

#### TreeMap

TreeMap实现了SortedMap；

#### Hashtable

### Set

#### HashSet

#### TreeSet

TreeSet实现了SortedSet；

### List

#### ArrayList

底层基于数组，线程不安全，效率高。



#### LinkedList

底层基于双向链表。

#### Vector

底层基于数组，所有方法都用synchronized修饰，线程安全，但是效率低。

## 总结

