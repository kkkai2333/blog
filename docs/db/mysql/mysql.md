---
title: 基础
date: 2020-10-27
categories:
- mysql
tags:
- db
- mysql
sidebar: false
publish: true
---

## 事务

* 原子性, 事务是一个不可分割的最小单元, 一个事务的所有操作, 要么全部成功, 要么全部失败,
* 一致性, 数据库在事务执行的前后都保持一个一致的状态, 在一致性的状态下, 所有事务对一个数据的读取结果都是一致的,
* 隔离性, 事务在最终提交前, 对其他事务是不可见的,
* 持久性, 一个事务一旦执行成功, 则其所做的修改一定会保存到数据库中, 即便系统发生崩溃, 事务执行的结果也不能丢.

## 隔离级别

* 读未提交, 即一个事务还没有提交, 它做的变更就能被其他事务看到, 最低的隔离级别, 无法避免脏读, 不可重复读和幻读, 一般不使用,
* 读已提交, 即一个事务提交之后, 它做的变更才会被其他事务看到, 无法避免不可重复读和幻读,
* 可重复读, 即, 一个事务执行过程中看到的数据, 总是和这个事务启动时看到的数据是一直的, 无法避免幻读,
  * 这里稍微解释下幻读, **即在一个事务执行过程中, 看到了原本不存在的行**, 也就是说, 只有看到了新插入的行, 才能叫幻读,
  * InnoDB 通过 MVCC + (Next-Key Lock) 解决了幻读的问题.
* 串行化, 即对一个记录, 读会加读锁, 写会加写锁, 是最高的隔离级别, 性能会大幅度下降, 一般不推荐使用.

| 隔离级别 | 脏读 | 不可重复读 | 幻影读 |
| :------: | :--: | :--------: | :----: |
| 未提交读 |  ✅   |     ✅      |   ✅    |
|  提交读  |  ❌   |     ✅      |   ✅    |
| 可重复读 |  ❌   |     ❌      |   ✅    |
| 可串行化 |  ❌   |     ❌      |   ❌    |

**注: MySQL 默认的隔离级别是可重复读.**

## 存储引擎

### InnoDB

1. InnoDB 是现在 MySQL 默认使用的存储引擎, 它支持事务, 并且最小支持行锁, 支持的并发较高, 一般, 只有在使用它不提供的特性时, 才会考虑使用其他存储引擎,
2. InnoDB 采用 MVCC(即多版本并发控制) 来支持高并发, 它默认的隔离级别是可重复读, 在此隔离级别下, 通过 MVCC + Next-Key Lock 可以防止幻读,
3. InnoDB 采用B+树的数据结构来保存数据, 
   1. 主键索引是聚簇索引, 在 B+ 树的叶子节点上保存了行的所有字段, 
   2. 非主键索引是非聚簇索引, 在 B+ 树的叶子节点上保存了行的主键ID, 这也就是, 为什么根据非主键索引查询时, 可能(这里说可能, 是因为覆盖索引不需要回表)要二次回表的原因.
4. InnoDB 在其内部做了很多优化, 比如说从磁盘读取数据时, 采用了可预测性读, 能够在内存中创建hash索引(自适应hash索引)来加速读操作, 能够加速插入操作的插入缓冲区(changebuffer),
5. InnoDB 支持在线热备份.

### MyISAM

1. 数据以紧密格式存储, 对于只读数据, 小表来说, 依然可以考虑使用,
2. 提供了一些特性, 比如说压缩表, 空间数据索引等,
3. 不支持事务,
4. 不支持行锁, 只能对整张表进行加锁, 读取会加读锁, 插入会加写锁, 但是在表有读取操作时, 也可以插入新的数据, 这就是并发插入.

### 对比

| 存储引擎 | InnoDB          | MyISAM                    |
| -------- | --------------- | ------------------------- |
| 事务     | ✅               | ❌                         |
| 锁       | 支持表锁, 行锁. | 只支持表锁.               |
| 外键     | ✅               | ❌                         |
| 备份     | 支持在线热备份. |                           |
| 崩溃恢复 |                 | 崩溃损坏的概率高, 恢复慢. |
| 其他特性 |                 | 支持压缩表, 空间数据索引. |

## 日志模块

MySQL 最终会将数据存储到磁盘上, 下面, 我们就来分析下 MySQL 的两个重要的日志模块.

### redo log

在 MySQL 中, 如果每一次更新操作, 都需要写进磁盘, 那就涉及到要先找到对应的记录, 然后更新, 这整个过程的随机IO和查询成本很高, 所以, MySQL 就用到了**WAL技术, 全称是Write-Ahead Logging**, 也就是先写日志, 再写磁盘.

具体的来说, 就是当有一条记录需要更新时, InnoDB 引擎会先将记录写到 redo log 里边, 然后更新内存, 就结束了. 在之后, InnoDB 会在适当的时候(一般都是系统比较空闲的时候), 将这个操作记录并更新到磁盘里.

与此同时, redo log 的大小是固定的, 比如说可以配置成一组4个文件, 每个文件1GB, 那就是一共有4GB可以使用, 整个 redo log, 可以当成一个环, 每次从头开始写, 写到末尾之后, 就又回到了开头, 如下图所示.

![redo log](./img/redo-log.png) 

**write pos**是当前记录的位置, 一边写一边向后移动,**checkpoint**是当前要擦除的位置, 也是不停向后移动的, 在擦除记录前, 要把记录更新到数据文件, 也就是落盘. 一旦**write pos**追上了**checkpoint**的位置, 那就要先停下来擦除一些记录, 才能继续写入.

有了 redo log, InnoDB 就能保证, 即便数据库发生异常重启, 之前提交的记录也不会丢失, 这个能力称为 **crash-safe**.

### binlog

MySQL 从整体上来看, 就分为两块, server 层和存储引擎层, 那上面讲到的redo log, 实际上是 InnoDB 特有的日志, 而 server 层也有自己的日志, 也就是**binlog(归档日志)**.

这里多提一句, binlog有三种记录格式, 

1. `statement`格式记录的是 SQL 语句, 

2. `row`格式会记录行的内容, 记两条, 更新前和更新后都有,

3. `mixed`格式, 其实就是上面两种格式的混合装,

   因为`statement`可能会导致主备不一致, 而`row`格式又很占空间, 所以 MySQL 就取了个这种方案, 它会判断这个 SQL 语句会不会导致主备不一致, 如果会, 那就使用`row`格式, 如果不会, 那就使用`statement`格式.

一般, 在生产环境, 都建议将binlog格式设置为`row`, 它最直接的好处就是, 可以**恢复数据**, 因为它记录的是更新前后的原数据.

可以使用如下配置, 设置binlog的格式为`row`.

```SQL
--- 将binlog的格式改成row
binlog_format='row'
```

### 对比

| redo log                                     | binlog                                                       |
| -------------------------------------------- | ------------------------------------------------------------ |
| InnoDB 特有的                                | MySQL 在 server 层实现的, 所有引擎都可以使用                 |
| 物理日志, 记录的是"在某个数据页做了什么修改" | 逻辑日志, 记录的是这个语句的原始逻辑, <br />比如说: "给ID=2这一行的c字段+1" |
| 循环写, 日志大小固定                         | 追加写, 当一个 binlog 文件写到一定大小之后, 会切换下一个     |

### 更新语句的执行过程

假设有下面这样一行更新语句, MySQL 是如何执行的.

```SQL
update T set c=c+1 where id=2
```

1. 执行器先找 InnoDB 获取id=2的这一行, 因为id是主键, 所以InnoDB 用树搜索查找到这一行, 如果这一行的数据页在内存中, 直接返回, 如果不在, 则需要先从磁盘读入内存, 然后再返回,
2. 执行器拿到这行数据, 把c+1, 然后再调用 InnoDB 接口写入这行新数据,
3. InnoDB 将这行数据更新到内存中, 并记录到redo log, 此时redo log处于**prepare**状态, 再告知执行器操作完成, 可以提交事务,
4. 执行器生成这个操作的 binlog, 并将binlog写入磁盘,
5. 执行器调用 InnoDB 的提交事务接口, 将刚才的redo log改成**commit**状态,
6. 更新结束.

这里, 就是典型的**两阶段提交**了, 使用它的目的, 就是为了避免 MySQL 异常宕机导致数据丢失的情况.

在上面分析的过程, 可以看到, 实际上是有两次写盘操作的, 而WAL 机制又说是为了减少磁盘写, 那它的优势在哪呢? 

1. 其实很简单, 因为 redo log 和 binlog 都是**顺序写**, 而磁盘的顺序写比随机写要快很多,
2. 另外还有个**组提交机制**也大幅度的降低了磁盘的IOPS消耗.

### 配置

MySQL 提供了两个配置参数, 建议都设置为1, 这样可以保证MySQL 异常重启后, 数据不会丢失.

```sql
--- 配置为0, 表示每次事务提交时, 只把redo log留在redo log buffer中
--- 配置为1, 表示每次事务提交时, 都要把redo log持久化到磁盘
--- 配置为2时, 表示每次事务提交时, 只把redo log写到page cache
innodb_flush_log_at_trx_commit=1
--- 配置为0, 表示每次事务提交时, 只write, 不fsync
--- 配置为1, 表示每次事务提交时, 即write, 还要fsync, 也就是说将binlog持久化到磁盘
--- 配置成N(N>1)时, 表示每次事务提交时, 只write, 累计N个事务后再近些fsybc
sync_binlog=1
```

## 索引

MySQL 的索引是在存储引擎层实现的.

### B+ Tree 索引

* 有序, 除了查询还可以进行排序和分组,
* 可以指定多个列作为索引键, 即联合索引,
* 支持全键值, 键值范围和键前缀查找(最左前缀),
* 全表扫描只需要遍历主键索引树的所有叶子节点即可,
* 查询复杂度稳定, 因为数据都保存在主键索引的叶子节点上, 索引无论查询条件是什么, 最终都会遍历完主键索引树的所有层级.

### 哈希索引

* 支持O(1)的查询时间复杂度, 但是只支持精确查找, 无法用于部分查找, 范围查找, 更没办法进行排序和分组.

### 全文索引

* myisam存储引擎支持全文索引, 用于查找文本中的关键词, 而不是直接匹配是否相等, 查找条件使用的是 MATCH AGAINST, 全文索引使用**倒排索引**实现, 记录了关键词到文档的映射,
* InnoDB 在MySQL 5.6.4之后也开始支持全文索引.

### 聚簇索引和非聚簇索引

InnoDB 存储引擎是通过索引树来保存数据的.

聚簇索引也就是常说的主键索引, 即该索引树的叶子节点保存了数据行的完整数据,

非聚簇索引也叫辅助索引, 即该索引树的叶子节点保存的是数据行的主键ID, 当索引树没有查询的列时, 需要回表(到主键索引树)二次查询.

InnoDB 的主键索引的定义规则如下,

1. 在表上定义主键PRIMARY KEY, InnoDB将主键索引用作聚簇索引,
2. 如果表没有定义主键, InnoDB 会选择第一个不为NULL的唯一索引列用作聚簇索引,
3. 如果以上两个都没有, InnoDB 会使用一个6 字节长整型的隐式字段 ROWID字段构建聚簇索引, 该ROWID字段会在插入新行时自动递增.

### 唯一索引和普通索引

唯一索引就是说在索引树上, 只会一条相同索引, 如果再次插入相同索引时, 会报错, 即可以保证索引的唯一性, 而普通索引就没有这个限制.

那应该选择唯一索引还是普通索引呢? 我们从两个方面来分析,

#### 查询时

1. 对于普通索引来说, 查到满足条件的第一个记录后, 还需要查询下一个记录, 直到返回的记录不满足条件, 才会停止检索,

2. 而对于唯一索引来说, 查到满足条件的第一个记录后, 就会停止检索.

那表面上看, ~~貌似唯一索引会比普通索引更快~~, 但是实际上, **MySQL在读取数据是按页读取的**, 也就是说, 当需要读取一条记录时, 并不是将这条记录从磁盘上读出, 而是以页为单位, 将整个数据页读入内存, 而InnoDB每个数据页的大小, 默认是16KB.

那这么看来, 普通索引在检索下一条记录时, 实际上就是内存的读取了, 速度是相当快的; 即便是极端情况, 某个普通索引有很多记录, 导致跨页了, 也只是稍微慢了一点,

而且, 假设对于整型字段来说, 一个数据页就可以放下近千个索引, 所以, 相同索引跨页的这种概率, 实际上是很低的.

**所以, 我们可以认为, 普通索引和唯一索引, 在读取操作的性能上基本没有区别.**

#### 更新时

提到更新, 那就要先说一说**changebuffer**的概念,

##### changebuffer

当需要更新一个数据页时, 如果该数据页在内存中, 那就会直接更新; 如果这个数据页不在内存中, 在不影响数据一致性的前提下, InnoDB会将这些更新缓存到changebuffer中, 这样, 就不需要从磁盘读取这个数据页了. 当下一次读取这个数据页时, 再执行changebuffer中与这个数据页相关的操作.

并且, changebuffer也是可以持久化的, 即changebuffer在内存中有拷贝, 也会被写到磁盘上, 这样也就避免了MySQL异常宕机时更新丢失.

那将changebuffer的更新应用到数据页的过程称为**merge**, 除了访问该数据页会有merge外, MySQL也有后台线程进行定期merge, 在数据库关闭时, 也会进行merge.

所以, 将更新先缓存到changebuffer中, 就减少了读磁盘, 提高了语句的执行速度, 并且, 因为将数据页读入内存是需要占用**buffer pool**的空间了, 那changebuffer还能避免占用空间, 提搞内存的利用率.

changebuffer讲完了, 我们再回过头来看唯一索引, 既然是唯一的, 那所有的更新操作都需要判断索引的唯一性, 那就必须将数据页读入内存才能判断, 数据已经读入内存了, 那更新肯定是直接执行了, 就用不到changebuffer了,

反之, 对于普通索引来说, 不需要判断唯一性, 也就不需要读取数据页, 当数据页不在内存中时, 就可以将更新缓存到changebuffer, 直接返回.

那这里可以举个栗子, 当需要在表中插入一条新纪录时,

1. 如果这个记录要更新的数据页在内存中,
   1. 对于唯一索引来说, 判断有没有相同索引, 若没有, 直接插入, 语句执行结束,
   2. 对于普通索引来说, 直接找到对应位置插入, 语句执行结束.
2. 如果这个记录要更新的数据页不在内存中,
   1. 对于唯一索引来说, 需要先将数据页读入内存, 然后再执行1.1的操作,
   2. 对于普通索引来说, 直接将更新写入changebuffer, 语句执行结束.

将数据页从磁盘读入内存, 涉及到随机IO, 是数据库成本最高的操作之一了, 而changebuffer减少了磁盘的随机访问, 对于更新操作的性能提升是很明显的.

**所以, 我们可以认为, 在多数情况下, 普通索引相对于唯一索引, 在更新操作上, 性能更好.**

不过, changebuffer也不是万能的, 比如说, 更新之后, 立马就要读取这个数据页, 那就会直接触发merge动作, 这就导致, 不仅没有降低磁盘的随机访问IO, 还增加了changebuffer的维护成本.

#### 小结

这里, 就可以得出两条结论,

1. 如果可用通过应用程序保证字段的唯一性, 那就优先选择普通索引, 因为更新的性能更好,
2. 但是, 如果在更新之后, 直接就要读取这个数据页, 可以考虑关闭changebuffer, 在其他情况下, changebuffer都能提高更新的性能.

### 页分裂, 页合并

InnoDB 保存数据的最小单位是页(page), 默认大小是16K,

#### 页分裂

上面提到, 页的大小默认是16K, 那就总会有用完的时候, 当索引插入时, 如果判断到当前页满了,而恰好下一个页也满了, 这个时候, InnoDB 就会执行如下操作,

1. 创建一个新页,
2. 找到当前页应该分裂的位置(按数据行算),
3. 将这些数据移动到新页,
4. 将索引插入到合适的位置,
5. 重新定义页之间的指向关系.

此时, B+ 树的路径在逻辑上是连续的, 但是物理上, 页是无序的.

一旦发生页分裂, 就只能通过下面的页合并逻辑触发来恢复了, 当然, 也可以通过OPTIMIZE优化表结构来触发, 只不过比较浪费资源罢了.

#### 页合并

页有个重要的属性, MERGE_THRESHOLD(默认值是50, 即50%, 可设置的范围是1-50).

在多次执行删除操作后, 如果(某个数据页的数据量/数据页的大小)<阈值(即上面的MERGE_THRESHOLD)时, InnoDB 就会检查该页相邻的两个页的数据量, 判断是否可以执行合并操作, 如果有某个页的数据量也小于MERGE_THRESHOLD, 那InnoDB就会执行合并操作, 将两个页的数据合并到一个页上, 将另一个页置空, 留待使用.

### 索引优化

* 在进行查询时, 索引列不能是表达式的一部分, 也不能是函数的参数, 也不能是前缀模糊查询, 否则无法使用索引,

* **覆盖索引**, 即索引树包含了想要查询的所有列, 这种情况下, InnoDB 不需要二次回表查询; 并且, 索引通常小于数据行的大小, 只读取索引能大大减少数据的访问量; 还有一些存储引擎(如myisam), 在内存中只缓存索引, 这种情况下, 可以避免系统调用,

* **索引下推**, 在MySQL 5.6之后, 引入了索引下推优化, 即在索引遍历过程中, 会先对索引中包含的字段做判断, 直接过滤掉不满足条件的行, 减少回表的次数.,

* **联合索引**, 如果查询时会根据多列进行搜索, 可以考虑建立联合索引, 同时, 将选择性最强的列放到前面,

* **前缀索引**, 对于blob, text, varchar等类型的列来说, 必须使用前缀索引, 即只索引开始部分的字符, 同时, 前缀索引的长度, 也需要根据字符内容的选择性进行决定,
  
  索引的选择性指的是, 不重复的索引值/记录总数=m, m最大为1, 那m越大时, 选择性越强, 下面给出一个简单的示例, 来判断字段的选择性和字段前缀长度的的选择性.
  
  ```sql
  SELECT
  	count( DISTINCT ( name ) ) / COUNT( * )  as all_char,
  	count( DISTINCT ( LEFT(name,1) ) ) / COUNT( * )  as 1_char,
  	count( DISTINCT ( LEFT(name,2) ) ) / COUNT( * )  as 2_char,
  	count( DISTINCT ( LEFT(name,3) ) ) / COUNT( * )  as 3_char,
  	count( DISTINCT ( LEFT(name,4) ) ) / COUNT( * )  as 4_char,
  	COUNT(*) as all_count
  FROM
  	test
  ```

* **最左前缀匹配**, MySQL 会一直向右匹配索引直到遇到范围查询(>, <, between, like), =和in都可以乱序执行, 比如说建立了索引(a,b,c), 那语句`select * from where c=1 and b=2 and a=3`一样可以使用索引,
* 尽量选择扩展索引, 而不是新建索引.

### 索引的优点

* 大大减少的服务器需要扫描的数据行,
* 将随机IO变成了顺序IO, 因为B+ 树索引是有序的, 会将相邻的元素保存到一个数据页.

### 索引的使用条件

* 对于比较小的表, 可能全表扫描要比建立索引更高效, 因为, 根据索引查询, 如果不满足覆盖索引的前提, 需要二次回表查询,
* 对于中到大型表, 建立索引的优势比较大,
* 对于超大型的表, 建立和维护索引的代价也会随之增长, 所以更好的办法是进行拆分表.

### 为什么 InnoDB 选用 B+ 树

#### 常见的数据结构

##### 哈希

hash 很简单, 像hashmap就是hash的数据结构, 以键值对的方式保存数据, 时间复杂度为O(1),

但是, 缺点也很明显, 就是只支持精确查找, 想模糊查找, 范围查找, 都只能通过全表扫描来实现.

所以在 MySQL 中只有 Memory 引擎支持hash索引(~~InnoDB的自适应hash不在讨论范围内, 因为没有办法手动设置~~), 场景单一.

##### 数组

数组就是一块连续的空间, 根据下标查询速度很快, 可以访问指定位置的元素内容, 但是同样, 它也只支持精确查找和范围查找, 想要模糊查找的话也只能全表扫描, 而且, 由于它是一块连续的空间, 插入时需要将指定位置之后的元素都向后移动, 才能插入, 所以它的查询效率高, 但是插入, 删除的效率很低.

##### AVL 树

平衡二叉树, 它最主要的特点是, 左右子树的层级最多相差1, 当插入或者删除数据的时候, 会通过**左旋右旋**来保证树的平衡, 所以它的查询性能接近于二分查找, 也就是O(log2n), 但是它的插入, 删除会比较慢.

但是, 因为 MySQL 的数据是持久化到磁盘上的, 而每个树节点的读取都涉及到一次磁盘IO, 所以树的高度, 就等于检索的次数, 那在表数据量很大的情况下, 它的性能就会很差.

##### 红黑树

红黑树和AVL树一样, 都是对二叉搜索树的改进版, 不同的地方在于, 

1. 红黑树给树的每个节点都标了颜色, 即red或者black,
2. 并且, 红黑树不像AVL树那样要求极端平衡, 红黑树只要求不会存在一条路径比其他路径长2倍, 所以它是近似平衡的,
3. 红黑树在AVL树的**左旋右旋**的基础上, 又添加了**着色**, 因为左旋右旋涉及到树节点的变动, 而着色只是对节点属性的变更, 所以它的插入, 删除更快, 但是查询相对于AVL 树来说, 会比较慢.

下面列举一下红黑树的特性,

1. 每个结点的颜色只能是红色或黑色的,
2. 根结点是黑色的,
3. 每个叶子结点(NIL)是黑色的,
4. 如果一个结点是红色的, 那么它的两个子结点都是黑色的,
5. 对每个结点来说, 从该结点到其所有后代叶子节点的简单路径上, 均包含相同数目的黑色结点.

那红黑树的问题, 其实和AVL 树的问题类似, 在查询的时候, 每个树节点的读取都涉及到一次磁盘IO, 所以树的高度, 就等于检索的次数, 那在表数据量很大的情况下, 它的性能就会很差.

##### B 树

考虑到MySQL 的数据是按页存储的, 而且每次读取数据都是将整个数据页读入内存, 那每页只存储一个节点数据是十分浪费的, 所以就将二叉树改造成了多叉树(每个节点存储了多个数据, 并且有多个分叉, 其目的就是为了降低树的深度), 也就是B 树.

下面列举一下B 树的特性,

1. B 树的每个节点都存储了多个元素, 并且非叶子节点都有多个分叉,
2. 节点中的元素包含了键值和数据, 按照键值从大到小排列, 也就是说, **每个节点都会用来存储数据**,
3. 父节点的元素不会出现在子节点中,
4. 所有叶子节点都位于同一层, 叶子节点具有相同的深度, 并且没有指针相互连接.

下面借一张敖丙的图来展示 B 树的基本结构,

![B Tree](./img/b-tree.jpg)

那B 树的问题在于什么呢?

1.  因为B 树在非叶子节点和叶子节点上都会保存数据, 这就导致, 如果某一张表的字段很多, 一行记录所占的空间就会增大, 非叶子节点存储的记录数就会减少, 同样也会增加树高, 也就会导致磁盘的IO次数增加,
2. B 树不支持范围查找, 因为数据存储在不同的节点上, 而节点之间又没有指针联系, 所以要查找一个范围内的数据, 就要每次都回到主节点重新进行检索, 查询效率就会降低.

##### B+ 树

B+ 树, 节点有序, 只有叶子节点会保存数据, 非叶子节点只会保存键值, 并且叶子节点之间使用双向指针进行连接, 形成了一个双向链表.

下面借一张敖丙的图来展示 B +树的基本结构,

![B+ Tree](./img/b+tree.jpg)

那 B + 树的优势有哪些呢?

1. 由于非叶子节点只保存键值, 不存储数据, 那相对于B 树来说, 单个数据页能容纳的数据就会比较多, 树的高度就会变矮, 就可以降低磁盘IO,

2. 和B 树一样, 支持等值查询, 虽然要读取到树的叶子节点才能得到记录的完整数据, 但是配合优化1, 二者的性能基本差不多,

3. 由于叶子节点之间有双向指针连接, 所以可以很好的支持范围查询,

   举个栗子, 假设要查询id在5-20之间的数据, 那就可以先按照等值查询, 查找到id=5的节点位置, 然后顺序向后遍历叶子节点中的数据, 直到找到id=20的记录(这里因为id是主键, 所以查到id=20就可以返回了), 就可返回数据.

4. 所有数据都保存在叶子节点, 无论查询什么数据, 最后都要读取到树的最后一层(当然, 如果是覆盖索引的话, 就无须读取到叶子节点, 查询到数据直接返回即可), 查询性能比较稳定.

## MVCC

上文多次提到了MVCC, 那它的全称是**多版本并发控制**, 是 InnoDB 实现隔离级别的一种方式, 它用于实现已提交读和可重复读这两种, 未提交读总是读取数据最新的行, 无需使用MVCC, 而串行化是通过加锁来实现的.

在实现上, MVCC会在需要的时候, 创建一个一致性视图(read-view), 访问数据时, 都以视图的逻辑结果为准,

1. 对于**读提交**来说, 一致性视图是在每个SQL语句开始执行的时候创建的,
2. 对于**可重复读**来说, 一致性视图是在事务启动的时候创建的, 整个事务执行期间, 都用这一个视图.

### 一致性视图

首先, InnoDB 中有一个事务ID, 叫做`transaction id`, 它是事务在启动是向系统申请的, 是严格递增的, 

然后, 在InnoDB 中, 每个数据行都有多个数据版本, 每次事务更新数据时, 都会生成一个新的数据版本, 并把上面的`transaction id`赋值给这个数据版本的事务ID, 即`row trx_id`, 同时, 旧的数据版本会保留, 在新的数据版本中, 也可以拿到它. 

这也就是说, 一个数据行是可能有多个版本的, 并且每个版本都有自己的`row trx_id`. 这里就引入了一个新的概念, **undo log(回滚日志)**, 即数据库记录了数据行的更新操作, 如果需要回滚到旧的row版本, 会依次反向执行更新, 进而恢复到以前的row版本.

那在可重复读级别下, 事务在启动的时候, 就"拍了个快照", 这个快照是基于整库的, 那快照实际上就是通过将事务启动时, 所有活跃的事务ID保存到一个数组中, 这里的"活跃", 就是说启动了还没提交. 然后, 将数组中的最小值, 记为低水位, 将当前已创建的最大的事务ID+1, 记为高水位, 这个数组和高水位就构成了一个一致性视图, 而数据的可见性, 就是将数据的`row trx_id`和这个一致性数图进行比较.

那这里, 我们直接总结下,

一个数据版本, 对于一个事务视图来说, 除了自己的更新总是可见以外, 有三种情况:

1. 版本未提交, 不可见,
2. 版本已提交, 但是是在视图创建后提交的, 不可见,
3. 版本已提交, 是在视图创建前提交的, 可见.

除此之外, 这里还有一条规则, 就是**每次更新操作, 都是先读后写的, 而这个读, 只能读当前最新的数据, 称为当前读(current read)**, 那当前读, 就是会读到数据的最新值, 而不是一致性视图中的数据版本.

那除了 update 语句之外, 也可以通过在`select`语句后加`lock in shard mode`(读锁)或者`for update`(写锁), 开启当前读.

到这里, 就把一致性视图, 当前读和行锁串联起来了, 总的来说, **可重复读的核心就是一致性读, 而事务更新数据时, 只能用当前读, 如果当前记录的行锁被其他事务占用的话, 就必须进入锁等待**.

而读提交的逻辑和可重复读类似, 二者的区别是,

* 在可重复读隔离级别下, 只需要在事务开始的时候创建一致性视图, 之后事务里的其他查询都共用这个一致性视图,
* 在读提交隔离级别下, 每一个语句执行前都会重新算出一个新的视图,
* 并且, 在读提交隔离级别下, `start transaction with consistent snapshot`就等同于`start transaction`, 因为它是在每个语句执行前重新生成一个视图.

小结一下,

* 对于可重复读, 查询只承认在事务启动前就提交完成的数据,
* 对于读提交, 查询只承认在语句执行前就提交完成的数据,
* 而对于当前读, 总是读取数据已经提交完成的最新版本.

### 事务是何时启动的

**如果没有特殊说明, 下面都是在autocommit=1的基础上进行分析.**

显式的启动事务有两种方式,

* `begin/start transaction`, 需要注意的是, 这个语句并不是事务的起点, 只有在其之后执行的第一个语句, 才会真正的启动事务, 也就是说, 一致性视图, 是在执行第一个语句的时候创建的.
* `start transaction with consistent snapshot`, 这个语句会马上启动一个事务, 也就是说, 一致性视图, 是在执行该语句的时候创建的.

## 锁

因为 InnoDB 是 MySQL 默认的存储引擎, 也是使用最多的, 所以下面主要分析 InnoDB 的锁.

### 锁的分类

* 读锁/共享锁(S Lock), 允许事务读一行数据,
* 写锁/排它锁(X Lock), 允许事务删除或者更新一行数据,
* 意向共享锁(IS Lock), 事务想要获得一张表中某几行的共享锁,
* 意向排它锁, 事务想获取一个表中某几行的排它锁.

#### 全局锁

全局锁, 就是对整个数据库实例进行加锁, MySQL提供了一个加全局读锁的命令, 即 `Flush tables with read lock (FTWRL)`, 使用这个命令后, 其他的数据更新语句, 数据定义语句, 更新类事务的提交语句都会被阻塞.

**那全局锁的典型应用场景, 就是做全库逻辑备份.** 但是, 让全库只读的风险是很大的, 比如说, 如果是在主库备份, 就会导致所有的业务停摆; 如果是在从库备份, 就会导致较长的主从延迟, 那如何解决呢?

这个时候, 就是MVCC出场的时候了, 上文有提到, 在可重复读隔离级别下, 开启事务可以生成一个一致性视图, 而且不会影响其他事务的执行. 

那MySQL自带的mysqldump逻辑备份工具, 其实就是这么实现的, 当`mysqldump`使用参数`-single-transaction`时, 就会在导出数据前, 开启事务, 拿到一个一致性视图, 进而就可以在逻辑备份的同时, 也不影响其他线程的更新操作.

 但是请注意, `-single-transaction`参数**只适用于所有的表都使用了事务引擎(目前应该只有InnoDB)的库**.

#### 表级锁

表级锁分为两种, 即表锁和MDL锁.

##### 表锁

可通过`lock tables … read/write`开启表锁, 和`FTWRL`类似, 可以通过`unlock tables`释放锁, 也可以在客户端断开连接时自动释放.

在没出现更细粒度的锁之前, 表锁是常用的处理并发的方式, 但是对于InnoDB这种支持行锁的引擎来说, 不建议使用表锁, 毕竟锁整个表的影响太大.

##### MDL锁(metadata Lock)

在 MySQL 5.5 版本中引入了 MDL锁, MDL锁不需要显式的开启, 在访问一个表时会自动加上, 当对一个表做增删改查操作的时候, 加 MDL 读锁; 当要对表做结构变更操作的时候, 加 MDL 写锁.

**注: 事务中的MDL锁, 会在语句开始执行的时候加上, 但是要等事务结束后才会释放.**

#### 行锁

目前应该只有 InnoDB 引擎支持行锁, 这也是 MyISAM 被 InnoDB 取代的重要原因之一.

顾名思义, 行锁就是在数据行上加锁, 比如说, 线程A来更新数据, 加上了行锁, 那当线程B也来更新同一行时, 只能等待A完成后再执行更新操作.

##### 两阶段锁协议

在 InnoDB 中, 行锁是在需要的时候加上, 但是要等到事务结束后再释放, 这就是两阶段锁协议.

**建议: 如果你的事务中需要锁多个行，要把最可能造成锁冲突、最可能影响并发度的锁尽量往后放。**

**注: MySQL行锁的最大并发数差不多是500左右.**

#### 间隙锁(Gap Lock)

InnoDB 为了解决可重复读隔离级别下的幻读问题, 引入了间隙锁, 上文有提到过, 幻读就是说, 一个事务在执行过程中, 前后两次查询同一个范围的时候, 后一次查询看到了看到了原本不存在的行.

那这里额外说明一下, 因为可重复读隔离级别, 在启动事务的时候, 会开启一个快照, 所以它是看不到别的数据插入的行的, 所以, 幻读只会在"当前读"下才会发生.

顾名思义, 间隙锁就是说, 在两个值之间的空隙上加锁, 假设说一张表只有一个id字段, 一共有3条数据[1,2,3], 这张表就会有4个间隙, 即`(-∞~1), (1~2), (2~3), (3~+∞)`, 那当执行语句`select * from t for update`时, 不光会为三行记录加3个行锁, 同时也会为4个间隙加上间隙锁.

和读锁或者写锁不同, 间隙锁之间并不冲突, 可以有多个线程同时往同一个间隙上加锁, 和间隙锁冲突的是"要往这个间隙添加一条记录"这个动作.

引入间隙锁, 虽然可以解决幻读的问题, 但是, 它却降低了并发度, 因为它锁的范围更大, 举个栗子, 假设我们有这样一张表,

```sql
CREATE TABLE `t` (
  `id` int(11) NOT NULL,
  `b` int(11) DEFAULT NULL,
  `c` int(11) DEFAULT NULL,
  `d` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UPIQUE KEY `b` (`b`)
  KEY `c` (`c`)
) ENGINE=InnoDB;

insert into t values(0,0,0),(5,5,5),
(10,10,10),(15,15,15),(20,20,20),(25,25,25);
```

然后有两个线程要执行如下操作, 就会出现死锁, 因为两个session都在(5, 10)这个区间上加了间隙锁, session 2在执行insert语句的时候会被session 1的间隙锁block, 而session 1执行insert的时候, 会被session 2的间隙锁block, 就发生了死锁

| session 1                                                    | session 2                                         |
| ------------------------------------------------------------ | ------------------------------------------------- |
| begin;<br />select * from t where id=9 for update;           |                                                   |
|                                                              | begin<br />select * from t where id=9 for update; |
|                                                              | insert into t values(9,9,9);<br />(这里会被block) |
| insert into t values(9,9,9);<br />(这里就会出现死锁, deadlock found) |                                                   |

#### Next-key Lock

Next-Key Lock = 行锁+间隙锁, 是个前开后闭的区间, 而InnoDB在可重复读隔离级别下默认的加锁单位, 就是Next-key Lock.

### 加锁逻辑

首先, 要注意三点,

1.  **锁是加在索引上的**,
2. `lock in share mode`只锁覆盖索引(意思就是说, 如果满足覆盖索引的条件, 就不会到主键索引树上给访问到的行加锁), 如果要避免这一点, 就必须在查询时加入索引中没有的行,
3. `for update`, 使用这个语句, MySQL 会默认接下来要更新数据, 所以也会到主键索引树上加锁.

下面, 借用一下[MySQL实战45讲](https://time.geekbang.org/column/article/75659)总结的 InnoDB 的加锁规则, 如下所示,

因为间隙锁是在可重复读隔离级别下才有效, 所以下面的加锁规则, 默认就是在可重复读下.

1. 原则1, 加锁的基本单位是`Next-key Lock`, `Next-key Lock`是一个前开后闭的区间,
2. 原则2, 查找过程中, 访问的到对象才会加锁,
3. 优化1, 索引上的等值查询, 给唯一索引加锁时, `Next-key Lock`退化为行锁,
4. 优化2, 索引上的等值查询, 向右遍历, 且最后一个值不满足等值条件时, `Next-key Lock`退化为间隙锁,
5. ~~1个bug~~, 唯一索引上的范围查询, 会访问到不满足条件的第一个值为止.

下面, 用上面的加锁规则来考虑一个问题, 即**MySQL 的唯一索引, 非唯一索引, 无索引加锁有什么区别?**

```sql
/* 主键索引 */
select * from t where id = 5 for update;
select * from t where id >= 5 and id < 10 for update;
/* 唯一索引 */
select * from t where b = 5 for update;
select * from t where b > 5 and b <= 10 for update;
/* 非唯一索引 */
select * from t where c = 5 for update;
select * from t where c >= 5 and c < 10 for update;
/* 无索引 */
select * from t where d = 5 for update;
select * from t where d >= 5 and d < 10 for update;
```

参考上面的表t, 执行上面四条语句, 根据上面的加锁规则, 分别会加什么样的锁?

1. 主键索引, 
   1. 等值查询,
      1. 根据原则1, 加锁的基本单位是`next-key lock`, 所以会先给(0, 5]区间加`next-key lock`, 
      2. 同时根据优化1, 给唯一索引加锁时, `next-key lock`退化为行锁, 
      3. 所以最终只会给主键索引树上id=5这一行加行锁.
   2. 区间查询, 
      1. 根据原则1, 加锁的基本单位是`next-key lock`, 所以会先给(0, 5]区间加`next-key lock`, 
      2. 同时根据优化1, 给唯一索引加锁时, `next-key lock`退化为行锁,
      3. 因为是范围查询, 所以还要继续向后找, 找到第一个不满足条件的值为止, 所以会再给(5, 10]这个区间加`next-key lock`,
      4. 所以最终会给主键索引树上的id=5加行锁, 给区间(5, 10]加`next-key lock`.
2. 唯一索引,
   1. 等值查询, 
      1. 根据原则1, 加锁的基本单位是`next-key lock`, 所以会先给(0, 5]区间加`next-key lock`, 
      2. 同时根据优化1, 唯一索引上的等值查询, `next-key lock`会退化为行锁, 
      3. 所以最终会给b索引树上b=5这一行加上行锁, 由于是`for update`, 所以还会给主键索引树上的id=5这样加行锁.
   2. 区间查询, **注意, 唯一索引的区间查询的示例和其他的不一样, 这个只是为了说明上文提到的~~1个bug~~**
      1. 根据原则1, 加锁的基本单位是`next-key lock`, 所以会先给(5, 10]区间加`next-key lock`, 
      2. 因为是范围查询, 所以还要继续向后找, 直到扫描到第一个不满足条件的行为止, 也就是b=15, 所以还会给(10, 15]区间加`next-key lock`,
      3. 所以, 最终会给b索引树上(5, 10], (10, 15]区间加`next-key lock`, 由于是`for update`,  所以主键索引树上扫描到的行, 都会加上行锁 , 在这里就是会给主键索引树上的id=10这一行加行锁, ~~id=15这一行没有加锁, 是因为这一行在b索引树上扫描到了, 但是不符合查询条件, 索引没有回到主键索引树扫描, 也就没有给这行加行锁~~.
      4. 那这里, 因为是唯一索引, 所以当在b索引树上检索到b=15这一行时, 就可以停止了, 但是MySQL 还是会继续向下检索, 直到扫描到第一个不满足条件的行为止, ~~所以说这里可能会有一些小问题, 但是官方并没有说这个是bug, 所以就小声bb一下~~.
3. 非唯一索引,
   1. 等值查询, 
      1. 根据原则1, 加锁的基本单位是`next-key lock`, 所以会先给(0, 5]区间加`next-key lock`, 
      2. 因为是普通索引, 所以还要向后遍历, 查到c=10时才停止, 此时根据原则2, 访问到的数据都要加锁, 所以会给(5, 10]加`next-key lock`, 
      3. 又根据优化2, 索引上的等值查询, 向右遍历且最后一个值不满足条件, `next-key lock`退化为间隙锁, 
      4. 所以最终会给c索引树上的(0, 5], (5, 10)这两个区间加锁, 由于是`for update`, 所以主键索引树上扫描到的行, 都会加上行锁, 那在这里就会给id=5这一行加行锁.
   2. 区间查询, 
      1. 根据原则1, 加锁的基本单位是`next-key lock`, 所以会先给(0, 5]区间加`next-key lock`, 
      2. 由于是普通索引, 所以`next-key lock`不会退化,
      3. 因为是范围查询, 所以还要继续向后找, 找到第一个不满足条件的值为止, 所以会再给(5, 10]这个区间加`next-key lock`,
      4. 所以最终会给c索引树上的(0, 5], (5, 10]这两个区间加`next-key lock`, 由于是`for update`, 所以主键索引树上扫描到的行, 都会加上行锁, 那在这里就会给id=5这一行加行锁.
4. 无索引,
   1. 等值查询, 
      1. 因为没有索引, 所以要进行全表扫描, 根据原则1, 加锁的基本单位是`next-key lock`, 
      2. 根据原则2, 访问到的对象都要加锁,
      3. 所以最终会锁住整个主键索引树, 即(-∞, 0], (0, 5], (5,10], (10, 15], (15, 20], (20, 25], (25, super]全都会加上锁.
   2. 区间查询, 
      1. 因为没有索引, 所以要进行全表扫描, 根据原则1, 加锁的基本单位是`next-key lock`, 
      2. 根据原则2, 访问到的对象都要加锁,
      3. 所以最终会锁住整个主键索引树, 即(-∞, 0], (0, 5], (5,10], (10, 15], (15, 20], (20, 25], (25, super]全都会加上锁.

### 对比

| 存储引擎 | InnoDB | myisam |
| -------- | ------ | ------ |
| 全局锁   | ✅      | ✅      |
| 表级锁   | ✅      | ✅      |
| 行锁     | ✅      | ❌      |

### 死锁和死锁检测

当并发系统中不同线程出现循环资源依赖, 涉及的线程都在等待别的线程释放资源时, 就会导致这几个线程都进入无限等待的状态, 称为死锁.

假设, 有一个事务A在等待事务B释放id=1上的行锁, 而事务B在等待事务A释放id=2上的行锁, 两个事务都在互相等待对方的资源释放, 这时就是死锁状态.  这个时候, 我们有两种解决策略: 

* 一种是直接进入等待, 直到超时, 我们可以通过参数innodb_lock_wait_timeout来设置超时时间, 默认是50s. 
* 另一种是发起死锁检测, 当发现死锁后, 主动回滚死锁链条中的某一个事务, 让其他事务可以继续执行, 将参数innodb_deadlock_detect设置为on, 代表开启这个逻辑. 
超时等待有一个弊端, 就是我们不清楚到底应该设置为多少, 默认的50s显然是太长的, 如果是在线服务, 这个等待时间是无法接受的; 但是如果设置的比较短, 就会导致, 如果只是一个简单的锁等待, 太短的等待时间会导致我们正常的业务逻辑受影响. 
所以, 一般情况下, 我们会选择第二种策略, 即主动死锁检测, 而且, 它也是默认打开的. 
但是, 死锁检测也是有额外负担的, 如果说我们有很多线程对同一行数据进行更新, 那每个新来的线程都需要判断会不会导致死锁, 这样就会引入额外的时间复杂度, 就会消耗大量的CPU资源, 导致CPU利用率飙升, 但是却没执行多少事务. 
对于上述死锁检测的问题, 我们大概有几种思路: 
* 关闭死锁检测, 缺点是, 一旦出现死锁, 就意味着大量的超时, 这对我们的业务是有影响的, 治标不治本的方式, 不建议. 
* 控制并发度, 即在客户端做控制, 同一行同一时间只允许几个线程进行修改, 缺点是, 如果客户端很多, 一样会导致修改的线程很多, 导致并发增高, 同样也是治标不治本, 但是如果客户端连接很少, 可以考虑. 
* 在服务端进行并发控制, 如果有中间件, 可以在中间件层实现, ~~如果没有, 也可以修改MySQL的源码, 在MySQL里进行控制, 理论上我们使用队列, 将请求queue起来, 就能解决这个问题, 缺点是, 对技术要求较高, 需要有能修改MySQL源码的人参与~~. 
* 一行数据变多行, 减少锁冲突, 将请求的线程随机选一条数据进行修改, 这样的话, 冲突概率就可以减少, 缺点是, 需要业务代码做额外的处理, 在查询时要将多行数据合为一行. 
其实, 综上来看, 我们可以发现, 减少死锁的主要思路, 就是要控制访问相同资源并发数量.

## 查询优化

首先, 涉及到SQL优化, 那肯定少不了通过explain语句分析select查询语句, 所以, 先简单了解下, explain语句的返回列的含义.

| 列              | 含义         | 返回值的含义                                                 |
| --------------- | ------------ | ------------------------------------------------------------ |
| **select_type** | 查询类型     | **simple**, 简单查询,<br />**union**, 联合查询,<br />**subquery**, 子查询. |
| table           | 要查询的表   |                                                              |
| possible_keys   | 可选择的索引 |                                                              |
| key             | 使用的索引   |                                                              |
| **type**        | 索引查询类型 | **system**, 表只有这一行数据, const的特殊情况,<br />**const**, 使用主键或者唯一索引查询时, 只有一行返回,<br />**eq_ref**, 进行联合查询时, 使用主键或者唯一索引, 并且只返回了一行数据,<br />**ref**, 使用非唯一索引查询时, <br />**range**, 使用主键, 单个字段的辅助索引, 多个字段的辅助索引的最后一个字段, 进行范围查询时,<br />**index**, 和all的区别是, 1) 查询的字段是索引的一部分, 覆盖索引, 2) 使用主键进行排序,<br />**all**, 全表扫描. |
| **ref**         |              |                                                              |
| rows            | 扫描的行数   | 预估值, 并不准确, 但是越小越好.                              |
| **Extra**       |              |                                                              |

### 一些优化思路

1. 减少请求的数据量,
   1. 查询时, 返回指定的列, 尽量避免使用`select * from xxx `语句,
   2. 只返回必要的行数, 使用limit语句限制返回的行数,
   3. 对大表进行分页查询时, 不要使用limit n, offset m语句, 如果可以的话, 带着id进行查询, 没有id, 那就先查询出id, 再根据id查询数据行.
2. 优先使用覆盖索引, 避免回表查询,
3. 使用联合索引查询时, 注意最左前缀的要求, 且索引的使用可以乱序
4. 如果需要使用join语句, 以小表(这里的小表说的是, 符合where条件的数据行比较少的表)作为驱动表, 同时, 建议给被驱动表的关联字段加上索引,
5. 分解大查询, 可以将一个大的连接查询, 分解成多个单表查询, 然后应用程序中进行关联.

### 其他优化

1. count(*), count(1)和count(id)的区别.
   1. 对于count(*)来说, InnoDB 会遍历整张表, 但是不取值, server层对于返回的每一行, 按行累加, 下面是官网原话,
   2. 对于count(1)来说, InnoDB 会遍历整张表, 但是不取值, server层对于返回的每一行, 放一个数字"1"进去, 然后判断不为空, 再按行累加,
      下面是官方文档原话,
      `InnoDB` processes `SELECT COUNT(*)` statements by traversing the smallest available secondary index unless an index or optimizer hint directs the optimizer to use a different index. If a secondary index is not present, the clustered index is scanned.
      `InnoDB` handles `SELECT COUNT(*)` and `SELECT COUNT(1)` operations in the same way. There is no performance difference.
      就是说, count(*)和count(1)都会优先扫描索引树较小的二级索引树来进行统计, 如果没有二级索引, 才会扫描主键索引, 所以二者的性能是差不多的.
   3. 对于count(id)来说, InnoDB 会遍历整张表, 把每一行的id值都取出来, 返回给server层, server层拿到id后, 判断不为空, 然后按行累加,
   4. 对于count(field)来说, 和count(id)类似, InnoDB 会遍历整张表, 把每一行的field值都取出来, 判断不为空, 然后按行累加,
   5. 所以, 可以得出结论, 在查询效率上, `count(*)=count(1)>count(id)>count(field)`,
   6. 这里还有个特殊的地方, 就是 myisam 存储引擎是有特殊优化的, 如果是`select count(*) from t`这种查询的话, myisam会非常快, 因为它存储了表准确的行数, 但是如果是带有`where`查询的`select count(*)`, myisam也是需要扫描的,
   7. 而 InnoDB 因为 MVCC 的存在, 没办法保存表的准确行数, 每次都要进行扫描,
   8. 如果只需要获取表的近似行数, 也可以使用`show table status`命令.

## 分库分表

### 垂直切分

一般都是根据业务来切分, 现在都是微服务开发, 每个系统都有各自的DB, 每个系统各自持久化数据.

### 水平切分

将数据量很大的表进行水平切分, 每个表的结构都是一样的, 以此来解决单个表的数据量上限的问题.

### 问题

#### 分布式事务

无论是垂直分还是水平分, 都会涉及到多个系统之间的配合, 那如果一个业务需要多个系统进行配合, 而且还要满足事务的特性, 就肯定会涉及到分布式事务.

现有的分布式事务解决方案有很多, 像XA协议的有2pc, 3pc, 或者一些柔性事务的有tcc, saga, 消息最终一致性等等, 之后会有一片专门的分布式事务的文章, 在这里就先不赘述了.

#### 跨库join

以前是只有一个DB, 所有的join可以使用一个select语句完成(当然, 超多表的join也不推荐使用), 现在有多个DB, 如果联查多个库的多张表, 就会涉及到跨库join.

那一般都会考虑, 将原来的多表查询分解成多个单表查询, 拿到返回数据后在用户程序中进行连接, 而且, 也要注意尽量避免超大数据量的查询, 可能会导致用户程序的使用内存暴增.

#### sharding策略

sharing策略其实就是水平切分的策略了, 什么样的数据路由到哪个DB, 那一般有如下几种常用的策略,

1. hash取模, 比如说根据某一个唯一key, 进行hash(key)/%N, 这里的N就是分表的数量, 这种方式最简单, 但是问题也很明显, 如果以后要扩展分表的数量, 就需要进行表数据迁移.
2. 范围切分, 可以根据ID也可以根据时间, 举个栗子,
   1. 如果数据量很大的话, 那可以每个月分一张表, 这样就不会有扩展上的问题, 因为时间是一直向前的, 类似于订单类型的数据, 可以考虑使用这种方式, 然后提供给用户查询时, 可以把查询条件限制为时间维度, 比如说查询`2020-10`这个月的数据, 那可以路由到该月的DB去查询.
3. 映射表, 其实就是通过一个单独的数据库来维护路由规则.

#### 数据唯一性

唯一性就是说, 同一个表的每条记录肯定要有个唯一的ID嘛, 那有以下几种思路,

1. ~~UUID~~, 不建议使用,
2. 使用全局唯一 ID(GUID), 比如说可以有一个专门生成ID的服务,
3. 为每个分片指定一个ID范围,
4. 分布式ID生成器, 比如雪花算法这种.

## 高可用

~~肝不动了, 下次补上.~~

### 主从复制

### 读写分离

## 一些常用命令

```sql
/* 重建表*/
alter table t engine = InnoDB;
/* 可以用来重新统计索引信息 */
analyze table t;
/* 等于 recreate + analyze */
optimize table t;
/* 等于 drop + create */
truntace table t;
```

## 数据库的三范式

1. 第一范式: 列不可再分, 
2. 第二范式: 行可以唯一区分, 主键约束, 
3. 第三范式: 表的非主属性不能依赖与其他表的非主属性, 外键约束, 
4. 三大范式是一级一级依赖的, 第二范式建立在第一范式上, 第三范式建立第一第二范式上.  

## 参考

* 高性能MySQL
* [MySQL 5.7 Reference Manual](https://dev.mysql.com/doc/refman/5.7/en/)
* [MySQL实战45讲](https://time.geekbang.org/column/intro/139)
* [MySQL索引原理及慢查询优化](https://tech.meituan.com/2014/06/30/mysql-index.html)
* [一口气搞懂MySQL索引所有知识点](https://mp.weixin.qq.com/s/faOaXRQM8p0kwseSHaMCbg)
* [国庆肝了8天整整2W字的数据库知识点](https://mp.weixin.qq.com/s/J3kCOJwyv2nzvI0_X0tlnA)