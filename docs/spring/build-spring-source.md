---
title: 如何编译 Spring 源码
date: 2022-05-09
categories:
- spring
tags:
- spring
sidebar: auto
publish: false
---

## 步骤

```json
// Spring 最新的源码是用gradle build的
// 首先，从github上clone最新的spring源码，然后切换分支到5.0.x
// 然后，在源码目录下执行下述两个命令
gradle objenesisRepackJar
gradle cglibRepackJar
```

