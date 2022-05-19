---
title: Dubbo
date: 2022-05-09
sidebar: auto
publish: false
---

## Dubbo 知识图谱

## dubbo-framework

首先，贴一下dubbo官网最精确的分层架构图，多级的分层结构，虽然带来的代码的复杂度，但是确提高了代码的可扩展性。

下层通过接口提供给上层调用，上层无需关心下层的内部设计，这也是面向对象设计所提倡的核心思想，再配合dubbo自定义的SPI机制，就使得dubbo有如此好的可扩展性。

~~别慌，我第一次看的时候，也被吓到了……~~

所以，在接下来的几个篇章里，我会配合源码，加上官方文档，简单分析下dubbo的架构设计。

![dubbo-framework](./img/dubbo-framework.jpg)

## RPC

**远程过程调用**

