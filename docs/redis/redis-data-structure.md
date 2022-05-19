---
title: 底层数据结构
date: 2022-05-09
categories:
- redis
tags:
- redis
sidebar: auto
publish: false
---

## dict

### 定义

dict其实就是Redis对hash这种数据结构的具体实现，它的实现和1.7版本的hashmap很像，添加节点使用头插法，hash冲突是用链表来维护。

### 源码分析

1. 首先看下dict的结构定义。

```c
typedef struct dictEntry {
    // key，void类型代表可以指向任意类型
    void *key;
    // value，联合类型，当类型是uint64_t、int64_t、double时不需要额外空间，当然也可以是void，即指向任意类型
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;
    // 下一个节点
    struct dictEntry *next;
} dictEntry;

typedef struct dictType {
    // 对key进行hash值计算的算法
    uint64_t (*hashFunction)(const void *key);
    // 拷贝key，深拷贝
    void *(*keyDup)(void *privdata, const void *key);
    // 拷贝value，深拷贝
    void *(*valDup)(void *privdata, const void *obj);
    // 定义两个key的比较操作，在根据key查找时会用到
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);
    // key的析构函数
    void (*keyDestructor)(void *privdata, void *key);
    // value的析构函数
    void (*valDestructor)(void *privdata, void *obj);
} dictType;

/* This is our hash table structure. Every dictionary has two of this as we
 * implement incremental rehashing, for the old to the new table. */
typedef struct dictht {
    // dictEntry的指针数组
    dictEntry **table;
    // 指针数组的长度
    unsigned long size;
    // =size-1，用于和key的hash值进行&运算，得到该key对应的table的下标
    unsigned long sizemask;
    // dict中现有的数据数量
    unsigned long used;
} dictht;

typedef struct dict {
    // 指向dictType的指针
    dictType *type;
    // 私有数据指针？
    void *privdata;
    // 存储数据的两个哈希表，正常情况下只有ht[0]有值；如果再重哈希过程中的话，ht[0]和ht[1]都有值
    dictht ht[2];
    // 当前是否在重哈希，-1：没有重哈希 >-1:重哈希到哪一步了
    long rehashidx; /* rehashing not in progress if rehashidx == -1 */
    // 正在遍历的迭代器的数量
    unsigned long iterators; /* number of iterators currently running */
} dict;
```

这里要注意一点的是，dict在进行重哈希时，并不是单次重哈希，而是增量式的。也就是说，重哈希是分散到每次对dict的增删改查操作中的，具体细节下面会讲到。

根据代码中对dict的定义也可以看出，他持有两个dictht指针数组的引用，重哈希也就是先扩展ht[1]，然后再把数据从ht[0]迁移到ht[1]。

2. 再看下dict的初始化函数，dict的初始化比较简单，ht[*].table都给了null，size、sizemask、used=0，dict的其他属性默认给了初始值。

```c
/* Create a new hash table */
dict *dictCreate(dictType *type,
        void *privDataPtr)
{
    dict *d = zmalloc(sizeof(*d));

    _dictInit(d,type,privDataPtr);
    return d;
}

/* Initialize the hash table */
int _dictInit(dict *d, dictType *type,
        void *privDataPtr)
{
    _dictReset(&d->ht[0]);
    _dictReset(&d->ht[1]);
    d->type = type;
    d->privdata = privDataPtr;
    d->rehashidx = -1;
    d->iterators = 0;
    return DICT_OK;
}
/* Reset a hash table already initialized with ht_init().
 * NOTE: This function should only be called by ht_destroy(). */
static void _dictReset(dictht *ht)
{
    ht->table = NULL;
    ht->size = 0;
    ht->sizemask = 0;
    ht->used = 0;
}
```

3. 接着分析下dictFind函数。

```c
dictEntry *dictFind(dict *d, const void *key)
{
    dictEntry *he;
    uint64_t h, idx, table;
		// 当ht[0]和ht[1]的used都为0时，代表没有元素
    if (d->ht[0].used + d->ht[1].used == 0) return NULL; /* dict is empty */
    // 判断当前是否在重哈希，如果是，辅助重哈希
    if (dictIsRehashing(d)) _dictRehashStep(d);
    // 获取当前key的hash值
    h = dictHashKey(d, key);
    // 这里实际上是循环遍历ht数组，分别查找对应ht[*].table[index]位置是否有这个key，如果有，则返回其value，如果没有，返回null
    // 这里多说一句，为什么要循环ht数组，因为在重哈希过程中，没办法知道当前key是在ht[0]还是在ht[1]，有可能ht[0].table[index]位置的entry已经迁移到ht[1]中了，也有可能还没有迁移过去，所以只能循环。
    for (table = 0; table <= 1; table++) {
        // 计算key所在的ht[0].table[index]的index
        idx = h & d->ht[table].sizemask;
        // 有可能table[index]已经形成了一个链表，所以要循环下
        // 从这里也可以看出，dict的entry结构和1.7版本的hashmap中的entry是基本类似的
        he = d->ht[table].table[idx];
        while(he) {
            if (key==he->key || dictCompareKeys(d, key, he->key))
                return he;
            he = he->next;
        }
        // 这里其实是提早结束循环的一个判断，如果当前没有再重哈希，就说明ht[1]是空的，那也就没必要遍历了
        if (!dictIsRehashing(d)) return NULL;
    }
    return NULL;
}
```

4. dictAdd插入一对新的key和value，如果key存在，则插入失败。

5. dictReplace插入一对新的key和value，如果key存在，则更新value。

```c
/* Add an element to the target hash table */
int dictAdd(dict *d, void *key, void *val)
{
    // 这个地方有点意思，可以看到，dict是先找到key所在的ht[*].table[index]之后，只是创建了一个entry插入到对应位置
    dictEntry *entry = dictAddRaw(d,key,NULL);
	  // 如果找不到这个entry，返回错误，
    // 从dictAddRaw函数中也可以看到，当key已经存在时，会返回null，这就代表dictAdd只会添加，不会覆盖
    if (!entry) return DICT_ERR;
    // 然后，把value设置到到这个entry节点的value中
    dictSetVal(d, entry, val);
    return DICT_OK;
}

dictEntry *dictAddRaw(dict *d, void *key, dictEntry **existing)
{
    long index;
    dictEntry *entry;
    dictht *ht;
    // 判断是否在进行重哈希，如果是，则辅助重哈希
    if (dictIsRehashing(d)) _dictRehashStep(d);

    /* Get the index of the new element, or -1 if
     * the element already exists. */
    // 获取当前元素的index，如果这个key已经存在，则返回-1
    // 从这里可以看出，dictAdd函数在key存在时是插入失败的，所以也有了对应的dictReplace函数（下面会分析）
    if ((index = _dictKeyIndex(d, key, dictHashKey(d,key), existing)) == -1)
        return NULL;

    /* Allocate the memory and store the new entry.
     * Insert the element in top, with the assumption that in a database
     * system it is more likely that recently added entries are accessed
     * more frequently. */
    // 判断当前是否在重哈希，如果在，则插入到ht[1]中，如果不在，则插入到ht[0]中
    ht = dictIsRehashing(d) ? &d->ht[1] : &d->ht[0];
    // 分配空间，生成一个entry（dictentry的对象）
    entry = zmalloc(sizeof(*entry));
    // 将当前entry的next指向原本table[index]位置的entry
    entry->next = ht->table[index];
    // 再讲table[index]指向当前entry
    // 很明显，这里是采用的头插法，因为Redis是单线程的，所以这里不会有线程安全的问题
    ht->table[index] = entry;
    // 元素数量+1
    ht->used++;

    /* Set the hash entry fields. */
    // 把当前的key的值设置到新生成的entry中
    dictSetKey(d, entry, key);
    return entry;
}

int dictReplace(dict *d, void *key, void *val)
{
    dictEntry *entry, *existing, auxentry;

    /* Try to add the element. If the key
     * does not exists dictAdd will succeed. */
    // 先尝试add，如果entry不为空，代表key不存在，直接赋值，然后返回即可
    entry = dictAddRaw(d,key,&existing);
    if (entry) {
        dictSetVal(d, entry, val);
        return 1;
    }

    /* Set the new value and free the old one. Note that it is important
     * to do that in this order, as the value may just be exactly the same
     * as the previous one. In this context, think to reference counting,
     * you want to increment (set), and then decrement (free), and not the
     * reverse. */
    auxentry = *existing;
    // 如果key已经存在了，那就直接去更新
    dictSetVal(d, existing, val);
    // 更新成功后，existing会返回旧的entry引用，这里调用dictFreeVal函数，其实是调用了valDestructor析构函数，清除了这个entry的value
    dictFreeVal(d, &auxentry);
    return 0;
}

```

6. 在dict中有个rehashidx属性，如果rehashidx>-1，代表当前在重哈希，那就接着看下辅助重哈希的_dictRehashStep函数。

```c
static void _dictRehashStep(dict *d) {
    // 只有当前没有迭代器循环时，才进行重哈希
    // 从这也可以看出，凡是调用_dictRehashStep函数辅助重哈希的，都最多向前推进了1步
    if (d->iterators == 0) dictRehash(d,1);
}

int dictRehash(dict *d, int n) {
    int empty_visits = n*10; /* Max number of empty buckets to visit. */
    // 如果当前没有再重哈希，直接返回
    if (!dictIsRehashing(d)) return 0;
    // 
    while(n-- && d->ht[0].used != 0) {
        dictEntry *de, *nextde;

        /* Note that rehashidx can't overflow as we are sure there are more
         * elements because ht[0].used != 0 */
        // 断言，dictentry数组的长度要大于当前重哈希的index
        assert(d->ht[0].size > (unsigned long)d->rehashidx);
        // 找到ht[0]下一个不为空的entry节点
        while(d->ht[0].table[d->rehashidx] == NULL) {
            d->rehashidx++;
            // 当空转访问了10个空桶之后，直接返回
            if (--empty_visits == 0) return 1;
        }
        // 拿到要迁移的table[d->rehashidx]位置的entry
        de = d->ht[0].table[d->rehashidx];
        /* Move all the keys in this bucket from the old to the new hash HT */
        // 循环迁移当前entry的所有节点
        while(de) {
            uint64_t h;
						
            nextde = de->next;
            /* Get the index in the new hash table */
            // 根据扩容后的ht[1]的sizemask重新计算当前的entry的头结点所在的ht[1].table[index]的index值
            h = dictHashKey(d, de->key) & d->ht[1].sizemask;
            // 当前entry的next指向原本ht[1].table[index]位置的entry
            de->next = d->ht[1].table[h];
            // 再把ht[1].table[index]的指针指向当前entry
            // 还是头插法
            d->ht[1].table[h] = de;
            d->ht[0].used--;
            d->ht[1].used++;
            de = nextde;
        }
        // 迁移完之后，把ht[0].table中这个位置的entry置空
        d->ht[0].table[d->rehashidx] = NULL;
        // rehashidx+1
        d->rehashidx++;
    }

    /* Check if we already rehashed the whole table... */
    // 如果ht[0]上已经没有元素了，代表重哈希结束，1. 释放ht[0]的空间，2. 然后让ht[0]指向ht[1]所对应的内容 3. 重置ht[1] 4. 把rehashidx设置为-1
    if (d->ht[0].used == 0) {
        zfree(d->ht[0].table);
        d->ht[0] = d->ht[1];
        _dictReset(&d->ht[1]);
        d->rehashidx = -1;
        return 0;
    }

    /* More to rehash... */
    return 1;
}
```

7. 上面我们只看到了辅助重哈希的函数，那么，dict在什么时候会进行重哈希呢，答案就是：在add函数中，调用dictKeyIndex函数计算下标时，所以，最后就来看下会触发重哈希的dictKeyIndex函数。

```c
static long _dictKeyIndex(dict *d, const void *key, uint64_t hash, dictEntry **existing)
{
    unsigned long idx, table;
    dictEntry *he;
    if (existing) *existing = NULL;

    /* Expand the hash table if needed */
    // 判断是否要扩充ht[0].table，分析下面的代码得出，当1. 已经在重哈希过程中了 2. 扩容失败的时候，会返回DICT_ERR
    if (_dictExpandIfNeeded(d) == DICT_ERR)
        return -1;
    for (table = 0; table <= 1; table++) {
        idx = hash & d->ht[table].sizemask;
        /* Search if this slot does not already contain the given key */
        he = d->ht[table].table[idx];
        while(he) {
            if (key==he->key || dictCompareKeys(d, key, he->key)) {
                if (existing) *existing = he;
                return -1;
            }
            he = he->next;
        }
        if (!dictIsRehashing(d)) break;
    }
    return idx;
}

static int _dictExpandIfNeeded(dict *d)
{
    /* Incremental rehashing already in progress. Return. */
    // 如果已经在重哈希过程中了，就直接返回
    if (dictIsRehashing(d)) return DICT_OK;

    /* If the hash table is empty expand it to the initial size. */
    // 如果ht[0].size=0，说明应该是第一次添加元素，那就默认初始化一个大小为4的table
    if (d->ht[0].size == 0) return dictExpand(d, DICT_HT_INITIAL_SIZE);

    /* If we reached the 1:1 ratio, and we are allowed to resize the hash
     * table (global setting) or we should avoid it but the ratio between
     * elements/buckets is over the "safe" threshold, we resize doubling
     * the number of buckets. */
    // 1. 当ht[0].table已使用的桶 >= 桶的个数，并且dict_can_resize配置又允许扩容，就默认扩容到ht[0].used的两倍
    // 2. 当dict_can_resize不允许扩容，但是ht[0].table中元素的个数/ht[0].size > 5时，强制扩容到ht[0].used的两倍
    if (d->ht[0].used >= d->ht[0].size &&
        (dict_can_resize ||
         d->ht[0].used/d->ht[0].size > dict_force_resize_ratio))
    {
        return dictExpand(d, d->ht[0].used*2);
    }
    return DICT_OK;
}

// 扩容或者创建一个table
/* Expand or create the hash table */
int dictExpand(dict *d, unsigned long size)
{
    /* the size is invalid if it is smaller than the number of
     * elements already inside the hash table */
    // 1. 如果当前已经在重哈希了，返回错误
    // 2. 扩容传进来的size还是小于当前ht[0]中的元素个数，代表这个size已经不正确了，返回错误
    if (dictIsRehashing(d) || d->ht[0].used > size)
        return DICT_ERR;

    dictht n; /* the new hash table */
    // 这里调用_dictNextPower对传入的size进行处理，做了两种操作：
    // 1. 判断是否大于LONG_MAX，如果大于，则返回LONG_MAX+1， 
    // 2. 返回一个大于size的，最小的2^n值（保证size是2的幂次方，因为sizemask = size-1，而sizemask又在计算key的hash值时参与了&运算）
    unsigned long realsize = _dictNextPower(size);

    /* Rehashing to the same table size is not useful. */
    // 如果发现扩充后的size和目前ht[0]的size一样，那就没啥意义了，扩充失败，返回错误
    if (realsize == d->ht[0].size) return DICT_ERR;

    /* Allocate the new hash table and initialize all pointers to NULL */
    // 初始化一个新的dictht
    n.size = realsize;
    n.sizemask = realsize-1;
    n.table = zcalloc(realsize*sizeof(dictEntry*));
    n.used = 0;

    /* Is this the first initialization? If so it's not really a rehashing
     * we just set the first hash table so that it can accept keys. */
    // 如果此时，ht[0].table为null，那说明现在是第一次初始化ht[0].table，那就直接将ht[0]指向n即可
    if (d->ht[0].table == NULL) {
        d->ht[0] = n;
        return DICT_OK;
    }

    /* Prepare a second hash table for incremental rehashing */
    // 将ht[1]指向n，设置rehashidx=0，代表要开始进行重哈希了
    d->ht[1] = n;
    d->rehashidx = 0;
    return DICT_OK;
}
```

## sds

### 定义

**全称Simple Dynamic String，动态字符串**

有以下优点

1. 可动态扩展内存
2. 二进制安全（Binary safe），可存储任意二进制数据
3. 与传统c语言字符串兼容

### 源码分析

```c
// 可以看到，sds的基础，就是一个字符串(c语言中的)，只不过Redis对这个字符串做了扩展
typedef char *sds;
/**
 * len 字符串的真正长度，不包含sds后边占位的null
 * alloc sds的长度，不包含最后一位的null结束符
 * flags 总是占用一个字节，低三位用来表示header的类型
 * buf[] 真正的字符数组，柔型数组
 */
/* Note: sdshdr5 is never used, we just access the flags byte directly.
 * However is here to document the layout of type 5 SDS strings. */
struct __attribute__ ((__packed__)) sdshdr5 {
    unsigned char flags; /* 3 lsb of type, and 5 msb of string length */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len; /* used */
    uint8_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr16 {
    uint16_t len; /* used */
    uint16_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr32 {
    uint32_t len; /* used */
    uint32_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr64 {
    uint64_t len; /* used */
    uint64_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};

#define SDS_TYPE_5  0
#define SDS_TYPE_8  1
#define SDS_TYPE_16 2
#define SDS_TYPE_32 3
#define SDS_TYPE_64 4
#define SDS_TYPE_MASK 7
#define SDS_TYPE_BITS 3
#define SDS_HDR_VAR(T,s) struct sdshdr##T *sh = (void*)((s)-(sizeof(struct sdshdr##T)));
// 获取sds header的起始指针
#define SDS_HDR(T,s) ((struct sdshdr##T *)((s)-(sizeof(struct sdshdr##T))))
// 获取sdshdr5高5位存储的长度
#define SDS_TYPE_5_LEN(f) ((f)>>SDS_TYPE_BITS)
```

默认情况下，sds的指针指向真正数据开始的地方，也就是字符数组的起始位置。所以，Redis解析一个sds对象有如下步骤：

1. 把指针指向的位置-1，得到flags，判断其低3位的值得到当前sds的header类型，
2. 调用SDS_HDR(T, s)，传入header类型、sds对象，得到sds的header的起始位置，
3. 根据sds不同类型的结构定义，来分析len和alloc所占的字节长度。

这里需要注意，sdshdr5和其他四种类型不同，它没有alloc字段，并且它的len是通过flags的高5位来存储的。这就说明，它没有剩余空间，所以，如果字符串需要增长，就需要重新分配内存。由此可见，这种类型比较适合存储静态的短字符串（长度小于32）。

## ziplist

### 定义

### 源码分析

## quicklist

### 定义

### 源码分析

## skiplist

### 定义

### 源码分析

## intset

### 定义

### 源码分析

## robj

### 定义

**Redis 中的对象**

### 源码分析

```c
/* in server.h */

/* The actual Redis Object */
#define OBJ_STRING 0    /* String object. */
#define OBJ_LIST 1      /* List object. */
#define OBJ_SET 2       /* Set object. */
#define OBJ_ZSET 3      /* Sorted set object. */
#define OBJ_HASH 4      /* Hash object. */

/* Objects encoding. Some kind of objects like Strings and Hashes can be
 * internally represented in multiple ways. The 'encoding' field of the object
 * is set to one of this fields for this object. */
#define OBJ_ENCODING_RAW 0     /* Raw representation */
#define OBJ_ENCODING_INT 1     /* Encoded as integer */
#define OBJ_ENCODING_HT 2      /* Encoded as hash table */
#define OBJ_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
#define OBJ_ENCODING_LINKEDLIST 4 /* No longer used: old list encoding. */
#define OBJ_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define OBJ_ENCODING_INTSET 6  /* Encoded as intset */
#define OBJ_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
#define OBJ_ENCODING_EMBSTR 8  /* Embedded sds string encoding */
#define OBJ_ENCODING_QUICKLIST 9 /* Encoded as linked list of ziplists */
#define OBJ_ENCODING_STREAM 10 /* Encoded as a radix tree of listpacks */
```

