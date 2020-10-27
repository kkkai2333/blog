# Java 中的排序算法

## 问题

1. 了解哪些排序算法？
2. 快排的实现原理知道吗？时间复杂度是多少？
3. Java中的排序算法有了解过吗？
4. Collections#sort()和Arrays.sort()的实现有什么区别？

## 源码分析

### 简要分析

首先了解一点，`Collections#sort()`方法，实际上是在其内部调用了`List#sort()`，而`List#sort()`方法内部又调用了`Arrays#sort()`方法，所以实际上，`Collections#sort()`就是`Arrays.sort()`。

那么，看下表，表中列举了在`Arrays`类中实现、调用的4种排序算法。

| 排序算法            | 实现类                      | 调用方法                          | 状态                   |
| ------------------- | --------------------------- | --------------------------------- | ---------------------- |
| `TimSort`           | `TimSort#sort()`            | 引用类型的`Arrays.sort()`         | 正常，默认使用         |
| `ComparableTimSort` | `ComparableTimSort#sort()`  | 引用类型的`Arrays.parallelSort()` | 正常，默认使用         |
| 双轴快排            | `DualPivotQuicksort#sort()` | 基本类型的`Arrays.sort()`         | 正常，默认使用         |
| 原始归并排序        | `Arrays#legacyMergeSort()`  | 引用类型的`Arrays.sort()`         | 在未来版本可能会被移除 |

从上面的表格可以看出，Arrays类中，最主要调用的两种排序算法实现，就是TimSort和双轴快排。

所以下文呢，就主要分析这两种实现。

### Arrays

首先，`Arrays`类中定义了两个阈值常量。

```java
// 不启用并行排序的数组长度的最大值，意思就是说，如果数组长度超过了这个值，那就要使用并行排序了，主要是在parallelSort方法中使用
private static final int MIN_ARRAY_SORT_GRAN = 1 << 13;
// 使用插入排序的阈值，如果数组长度小于这个阈值，那就使用插入排序，主要是在mergeSort方法中使用
private static final int INSERTIONSORT_THRESHOLD = 7;
```

下面就是重头戏了！

### TimSort#sort

首先，了解下，什么是`TimSort`算法；

1. 

然后，再看下`TimSort`和`ComparableTimSort`区别；

| 实现类                     | 区别                                                    |
| -------------------------- | ------------------------------------------------------- |
| `TimSort#sort()`           | 使用自定义的`Comparator`比较器比较大小                  |
| `ComparableTimSort#sort()` | 使用实现了`Comparable`接口的类的`compareTo`方法比较大小 |

最后，以`TimSort`类为例，来分析Java中是如何实现`TimSort`算法的。

```java
// 定义了一组默认的常量值
// 可以进行归并操作的数组的最小长度
private static final int MIN_MERGE = 32;
// 
private static final int  MIN_GALLOP = 7;
// 
private int minGallop = MIN_GALLOP;
// 默认初始化的临时数组的长度
private static final int INITIAL_TMP_STORAGE_LENGTH = 256;

// 实例属性
// 记录了栈深度
private int stackSize = 0;  // Number of pending runs on stack
// 记录了每个run的起始位置
private final int[] runBase;
// 记录了每个run的长度
private final int[] runLen;
/**
 * 构造方法
 */
private TimSort(T[] a, Comparator<? super T> c, T[] work, int workBase, int workLen) {
    // 给待比较数组赋值
    this.a = a;
    // 给比较器赋值
    this.c = c;
    // Allocate temp storage (which may be increased later if necessary)
    // 数组长度
    int len = a.length;
    // 计算临时数组长度
    int tlen = (len < 2 * INITIAL_TMP_STORAGE_LENGTH) ?
        len >>> 1 : INITIAL_TMP_STORAGE_LENGTH;
    
    if (work == null || workLen < tlen || workBase + tlen > work.length) {
        @SuppressWarnings({"unchecked", "UnnecessaryLocalVariable"})
        T[] newArray = (T[])java.lang.reflect.Array.newInstance
            (a.getClass().getComponentType(), tlen);
        tmp = newArray;
        tmpBase = 0;
        tmpLen = tlen;
    }
    else {
        tmp = work;
        tmpBase = workBase;
        tmpLen = workLen;
    }

    /*
     * Allocate runs-to-be-merged stack (which cannot be expanded).  The
     * stack length requirements are described in listsort.txt.  The C
     * version always uses the same stack length (85), but this was
     * measured to be too expensive when sorting "mid-sized" arrays (e.g.,
     * 100 elements) in Java.  Therefore, we use smaller (but sufficiently
     * large) stack lengths for smaller arrays.  The "magic numbers" in the
     * computation below must be changed if MIN_MERGE is decreased.  See
     * the MIN_MERGE declaration above for more information.
     * The maximum value of 49 allows for an array up to length
     * Integer.MAX_VALUE-4, if array is filled by the worst case stack size
     * increasing scenario. More explanations are given in section 4 of:
     * http://envisage-project.eu/wp-content/uploads/2015/02/sorting.pdf
     */
    // 计算栈的深度，也就是runBase和runLen两个数组的大小
    // 栈深度取值在5、10、24、49之间
    int stackLen = (len <    120  ?  5 :
                    len <   1542  ? 10 :
                    len < 119151  ? 24 : 49);
    runBase = new int[stackLen];
    runLen = new int[stackLen];
}

static <T> void sort(T[] a, int lo, int hi, Comparator<? super T> c,
                        T[] work, int workBase, int workLen) {
    // 校验参数的正确性
    assert c != null && a != null && lo >= 0 && lo <= hi && hi <= a.length;
    // 计算当前要排序的元素个数
    int nRemaining  = hi - lo;
    // 如果小于2，就说明只有1个或0个元素待排序，那就直接返回
    if (nRemaining < 2)
        return;  // Arrays of size 0 and 1 are always sorted
    // 如果待排序数组元素大于2，小于MIN_MERGE（），说明现在待排序的元素比较少，那就使用二分插入排序
    // If array is small, do a "mini-TimSort" with no merges
    if (nRemaining < MIN_MERGE) {
        // 找到从lo开始的第一个升序区间run
        int initRunLen = countRunAndMakeAscending(a, lo, hi, c);
        // 调用二分插入排序
        binarySort(a, lo, hi, lo + initRunLen, c);
        return;
    }

    /**
     * March over the array once, left to right, finding natural runs,
     * extending short natural runs to minRun elements, and merging runs
     * to maintain stack invariant.
     */
    //  初始化一个TimSort实例
    TimSort<T> ts = new TimSort<>(a, c, work, workBase, workLen);
    /*
     * 根据待排序数组长度，计算可以进行归并排序的run的最小长度
     * 1. 如果nRemaining < MIN_MERGE(32)，minRun = nRemaining
     * 2. 如果nRemaining是2的幂次方，minRun = 16
     * 3. 否则，minRun就是一个介于16 - 32之间的一个整数
     */
    int minRun = minRunLength(nRemaining);
    // 下面是一个do while循环，当nRemaining==0时，循环结束
    do {
        // Identify next run
        // 确认下一个run的长度
        int runLen = countRunAndMakeAscending(a, lo, hi, c);

        // If run is short, extend to min(minRun, nRemaining)
        // 如果当前这个run长度小于minRun，那就进行二分插入排序
        if (runLen < minRun) {
            int force = nRemaining <= minRun ? nRemaining : minRun;
            binarySort(a, lo, lo + force, lo + runLen, c);
            runLen = force;
        }
        // 将当前run推到栈顶，其实就是把lo设置到runBase中，把runLen添加到runLen中，通过stackSize属性记录栈的深度
        // Push run onto pending-run stack, and maybe merge
        ts.pushRun(lo, runLen);
        // 然后调用mergeCollapse()方法，mergeCollapse方法中会判断是否要对栈顶的几个run进行merge
        ts.mergeCollapse();
    
        // Advance to find next run
        // 将lo移动runLen长度
        lo += runLen;
        // 将待排序长度-runLen
        nRemaining -= runLen;
    } while (nRemaining != 0);

    // Merge all remaining runs to complete sort
    // check，循环结束后，lo一定等于hi
    assert lo == hi;
    // 进行最终的merge操作
    ts.mergeForceCollapse();
    // 最终merge完之后，栈顶只会剩下一个run，也就是已经排好序的数组
    assert ts.stackSize == 1;
}
/**
 * 找到一个严格升序的区间，称为一个run
 * 1. 找出严格升序的最大个数
 * 2. 找出严格降序的最大个数，并将其反转成升序
 */
private static <T> int countRunAndMakeAscending(T[] a, int lo, int hi,
                                                Comparator<? super T> c) {
    // 校验，lo必须小于hi
    assert lo < hi;
    // 如果lo+1=hi，说明只有两个元素，返回1即可
    int runHi = lo + 1;
    if (runHi == hi)
        return 1;
    // 如果a[lo+1] < a[lo]，说明接下来应该是严格降序
    if (c.compare(a[runHi++], a[lo]) < 0) { // Descending
        // 那就从当前位置，一直向后遍历，直到严格降序结束
        while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) < 0)
            runHi++;
        // 将(lo -> runHi)这个严格降序的区间内的元素反转成升序
        reverseRange(a, lo, runHi);
    } else {                              // Ascending
        // 进入else，说明接下来应该是严格升序，一直向后遍历，直到严格升序结束
        while (runHi < hi && c.compare(a[runHi], a[runHi - 1]) >= 0)
            runHi++;
    }
    // 最后，返回runHi-lo。
    // 说明，从lo开始向后遍历(runHi-lo)个元素，是升序的
    return runHi - lo;
}
/**
 * 将区间[lo, hi]之间的元素由降序反转成升序
 */
private static void reverseRange(Object[] a, int lo, int hi) {
    hi--;
    while (lo < hi) {
        Object t = a[lo];
        a[lo++] = a[hi];
        a[hi--] = t;
    }
}
/**
 * 二分插入排序算法实现
 */
private static <T> void binarySort(T[] a, int lo, int hi, int start,
                                    Comparator<? super T> c) {
    // 校验参数
    assert lo <= start && start <= hi;
    // 如果start=lo，那就把start++，即从下一个元素开始比较
    if (start == lo)
        start++;
    
    // 下面就是二分插入排序算法的主要实现
    for ( ; start < hi; start++) {
        // 得到当前元素
        T pivot = a[start];

        // Set left (and right) to the index where a[start] (pivot) belongs
        // left永远是lo，而[left, start-1]是已经有序的区间
        int left = lo;
        /*
         * 这里把right定义成start，也就是说，把已经有序的数组长度+1，
         * 然后将a[start]和[left, start-1]区间中的元素进行比较，移位，从而得到一个有序的[left, start]区间，
         * 而二分插入排序，就是把比较操作优化了一下，通过二分查找，找到a[start]应该插入的位置a[x]，然后将[x, start-1]区间的元素向后移动一个位置，得到[x+1, start]。
         */
        int right = start;
        // check
        assert left <= right;
        
        /*
         * 循环结束后，一定能得到下标left，能满足，
         * 1. pivot >= all in [lo, left),
         * 2. pivot <  all in [right, start).
         */ 
        // 这个while循环就是二分查找，找到pivot需要插入的位置，
        // 当left==right时循环结束，所以此时，a[left]就是pivot需要插入的位置
        while (left < right) {
            int mid = (left + right) >>> 1;
            /*
             * ComparableTimSort和TimSort的实现区别就在这个地方，
             * 1. ComparableTimSort比较的是实现了Comparable接口的类，调用的是java.lang.Comparable#compareTo方法
             * 2. TimSort是通过传入的Comparator比较器进行比较的，调用的是java.util.Comparator#compare方法
             */
            if (c.compare(pivot, a[mid]) < 0)
                right = mid;
            else
                left = mid + 1;
        }
        assert left == right;

        /*
         * The invariants still hold: pivot >= all in [lo, left) and
         * pivot < all in [left, start), so pivot belongs at left.  Note
         * that if there are elements equal to pivot, left points to the
         * first slot after them -- that's why this sort is stable.
         * Slide elements over to make room for pivot.
         */
        // 计算需要移动的元素个数
        int n = start - left;  // The number of elements to move
        // Switch is just an optimization for arraycopy in default case
        // 如果只需要移动一、两个元素，直接手动copy下；如果n > 2，就调用系统的arraycopy方法
        switch (n) {
            case 2:  a[left + 2] = a[left + 1];
            case 1:  a[left + 1] = a[left];
                        break;
            default: System.arraycopy(a, left, a, left + 1, n);
        }
        // 这里将pivot赋值给a[left]
        a[left] = pivot;
    }
}
/**
 * 根据传入的长度n，计算可以进行归并排序的run的最小长度
 */
private static int minRunLength(int n) {
    assert n >= 0;
    int r = 0;      // Becomes 1 if any 1 bits are shifted off
    while (n >= MIN_MERGE) {
        r |= (n & 1);
        n >>= 1;
    }
    return n + r;
}
/**
 * 将当前run推到栈顶
 * runBase：当前run的起始下标
 * runLen：当前run的长度
 * stackSize：栈的深度
 */
private void pushRun(int runBase, int runLen) {
    this.runBase[stackSize] = runBase;
    this.runLen[stackSize] = runLen;
    stackSize++;
}
/**
 * 合并run
 */
private void mergeCollapse() {
    while (stackSize > 1) {
        int n = stackSize - 2;
        if (n > 0 && runLen[n-1] <= runLen[n] + runLen[n+1]) {
            if (runLen[n - 1] < runLen[n + 1])
                n--;
            mergeAt(n);
        } else if (runLen[n] <= runLen[n + 1]) {
            mergeAt(n);
        } else {
            break; // Invariant is established
        }
    }
}

private void mergeForceCollapse() {
    while (stackSize > 1) {
        int n = stackSize - 2;
        if (n > 0 && runLen[n - 1] < runLen[n + 1])
            n--;
        mergeAt(n);
    }
}

private void mergeAt(int i) {
    assert stackSize >= 2;
    assert i >= 0;
    assert i == stackSize - 2 || i == stackSize - 3;

    int base1 = runBase[i];
    int len1 = runLen[i];
    int base2 = runBase[i + 1];
    int len2 = runLen[i + 1];
    assert len1 > 0 && len2 > 0;
    assert base1 + len1 == base2;

    /*
     * Record the length of the combined runs; if i is the 3rd-last
     * run now, also slide over the last run (which isn't involved
     * in this merge).  The current run (i+1) goes away in any case.
     */
    runLen[i] = len1 + len2;
    if (i == stackSize - 3) {
        runBase[i + 1] = runBase[i + 2];
        runLen[i + 1] = runLen[i + 2];
    }
    stackSize--;

    /*
     * Find where the first element of run2 goes in run1. Prior elements
     * in run1 can be ignored (because they're already in place).
     */
    int k = gallopRight(a[base2], a, base1, len1, 0, c);
    assert k >= 0;
    base1 += k;
    len1 -= k;
    if (len1 == 0)
        return;

    /*
     * Find where the last element of run1 goes in run2. Subsequent elements
     * in run2 can be ignored (because they're already in place).
     */
    len2 = gallopLeft(a[base1 + len1 - 1], a, base2, len2, len2 - 1, c);
    assert len2 >= 0;
    if (len2 == 0)
        return;

    // Merge remaining runs, using tmp array with min(len1, len2) elements
    if (len1 <= len2)
        mergeLo(base1, len1, base2, len2);
    else
        mergeHi(base1, len1, base2, len2);
}

private static <T> int gallopLeft(T key, T[] a, int base, int len, int hint,
                                    Comparator<? super T> c) {
    assert len > 0 && hint >= 0 && hint < len;
    int lastOfs = 0;
    int ofs = 1;
    if (c.compare(key, a[base + hint]) > 0) {
        // Gallop right until a[base+hint+lastOfs] < key <= a[base+hint+ofs]
        int maxOfs = len - hint;
        while (ofs < maxOfs && c.compare(key, a[base + hint + ofs]) > 0) {
            lastOfs = ofs;
            ofs = (ofs << 1) + 1;
            if (ofs <= 0)   // int overflow
                ofs = maxOfs;
        }
        if (ofs > maxOfs)
            ofs = maxOfs;

        // Make offsets relative to base
        lastOfs += hint;
        ofs += hint;
    } else { // key <= a[base + hint]
        // Gallop left until a[base+hint-ofs] < key <= a[base+hint-lastOfs]
        final int maxOfs = hint + 1;
        while (ofs < maxOfs && c.compare(key, a[base + hint - ofs]) <= 0) {
            lastOfs = ofs;
            ofs = (ofs << 1) + 1;
            if (ofs <= 0)   // int overflow
                ofs = maxOfs;
        }
        if (ofs > maxOfs)
            ofs = maxOfs;

        // Make offsets relative to base
        int tmp = lastOfs;
        lastOfs = hint - ofs;
        ofs = hint - tmp;
    }
    assert -1 <= lastOfs && lastOfs < ofs && ofs <= len;

    /*
        * Now a[base+lastOfs] < key <= a[base+ofs], so key belongs somewhere
        * to the right of lastOfs but no farther right than ofs.  Do a binary
        * search, with invariant a[base + lastOfs - 1] < key <= a[base + ofs].
        */
    lastOfs++;
    while (lastOfs < ofs) {
        int m = lastOfs + ((ofs - lastOfs) >>> 1);

        if (c.compare(key, a[base + m]) > 0)
            lastOfs = m + 1;  // a[base + m] < key
        else
            ofs = m;          // key <= a[base + m]
    }
    assert lastOfs == ofs;    // so a[base + ofs - 1] < key <= a[base + ofs]
    return ofs;
}

private static <T> int gallopRight(T key, T[] a, int base, int len,
                                    int hint, Comparator<? super T> c) {
    assert len > 0 && hint >= 0 && hint < len;

    int ofs = 1;
    int lastOfs = 0;
    if (c.compare(key, a[base + hint]) < 0) {
        // Gallop left until a[b+hint - ofs] <= key < a[b+hint - lastOfs]
        int maxOfs = hint + 1;
        while (ofs < maxOfs && c.compare(key, a[base + hint - ofs]) < 0) {
            lastOfs = ofs;
            ofs = (ofs << 1) + 1;
            if (ofs <= 0)   // int overflow
                ofs = maxOfs;
        }
        if (ofs > maxOfs)
            ofs = maxOfs;

        // Make offsets relative to b
        int tmp = lastOfs;
        lastOfs = hint - ofs;
        ofs = hint - tmp;
    } else { // a[b + hint] <= key
        // Gallop right until a[b+hint + lastOfs] <= key < a[b+hint + ofs]
        int maxOfs = len - hint;
        while (ofs < maxOfs && c.compare(key, a[base + hint + ofs]) >= 0) {
            lastOfs = ofs;
            ofs = (ofs << 1) + 1;
            if (ofs <= 0)   // int overflow
                ofs = maxOfs;
        }
        if (ofs > maxOfs)
            ofs = maxOfs;

        // Make offsets relative to b
        lastOfs += hint;
        ofs += hint;
    }
    assert -1 <= lastOfs && lastOfs < ofs && ofs <= len;

    /*
        * Now a[b + lastOfs] <= key < a[b + ofs], so key belongs somewhere to
        * the right of lastOfs but no farther right than ofs.  Do a binary
        * search, with invariant a[b + lastOfs - 1] <= key < a[b + ofs].
        */
    lastOfs++;
    while (lastOfs < ofs) {
        int m = lastOfs + ((ofs - lastOfs) >>> 1);

        if (c.compare(key, a[base + m]) < 0)
            ofs = m;          // key < a[b + m]
        else
            lastOfs = m + 1;  // a[b + m] <= key
    }
    assert lastOfs == ofs;    // so a[b + ofs - 1] <= key < a[b + ofs]
    return ofs;
}

private void mergeLo(int base1, int len1, int base2, int len2) {
    assert len1 > 0 && len2 > 0 && base1 + len1 == base2;

    // Copy first run into temp array
    T[] a = this.a; // For performance
    T[] tmp = ensureCapacity(len1);
    int cursor1 = tmpBase; // Indexes into tmp array
    int cursor2 = base2;   // Indexes int a
    int dest = base1;      // Indexes int a
    System.arraycopy(a, base1, tmp, cursor1, len1);

    // Move first element of second run and deal with degenerate cases
    a[dest++] = a[cursor2++];
    if (--len2 == 0) {
        System.arraycopy(tmp, cursor1, a, dest, len1);
        return;
    }
    if (len1 == 1) {
        System.arraycopy(a, cursor2, a, dest, len2);
        a[dest + len2] = tmp[cursor1]; // Last elt of run 1 to end of merge
        return;
    }

    Comparator<? super T> c = this.c;  // Use local variable for performance
    int minGallop = this.minGallop;    //  "    "       "     "      "
outer:
    while (true) {
        int count1 = 0; // Number of times in a row that first run won
        int count2 = 0; // Number of times in a row that second run won

        /*
         * Do the straightforward thing until (if ever) one run starts
         * winning consistently.
         */
        do {
            assert len1 > 1 && len2 > 0;
            if (c.compare(a[cursor2], tmp[cursor1]) < 0) {
                a[dest++] = a[cursor2++];
                count2++;
                count1 = 0;
                if (--len2 == 0)
                    break outer;
            } else {
                a[dest++] = tmp[cursor1++];
                count1++;
                count2 = 0;
                if (--len1 == 1)
                    break outer;
            }
        } while ((count1 | count2) < minGallop);

        /*
         * One run is winning so consistently that galloping may be a
         * huge win. So try that, and continue galloping until (if ever)
         * neither run appears to be winning consistently anymore.
         */
        do {
            assert len1 > 1 && len2 > 0;
            count1 = gallopRight(a[cursor2], tmp, cursor1, len1, 0, c);
            if (count1 != 0) {
                System.arraycopy(tmp, cursor1, a, dest, count1);
                dest += count1;
                cursor1 += count1;
                len1 -= count1;
                if (len1 <= 1) // len1 == 1 || len1 == 0
                    break outer;
            }
            a[dest++] = a[cursor2++];
            if (--len2 == 0)
                break outer;

            count2 = gallopLeft(tmp[cursor1], a, cursor2, len2, 0, c);
            if (count2 != 0) {
                System.arraycopy(a, cursor2, a, dest, count2);
                dest += count2;
                cursor2 += count2;
                len2 -= count2;
                if (len2 == 0)
                    break outer;
            }
            a[dest++] = tmp[cursor1++];
            if (--len1 == 1)
                break outer;
            minGallop--;
        } while (count1 >= MIN_GALLOP | count2 >= MIN_GALLOP);
        if (minGallop < 0)
            minGallop = 0;
        minGallop += 2;  // Penalize for leaving gallop mode
    }  // End of "outer" loop
    this.minGallop = minGallop < 1 ? 1 : minGallop;  // Write back to field

    if (len1 == 1) {
        assert len2 > 0;
        System.arraycopy(a, cursor2, a, dest, len2);
        a[dest + len2] = tmp[cursor1]; //  Last elt of run 1 to end of merge
    } else if (len1 == 0) {
        throw new IllegalArgumentException(
            "Comparison method violates its general contract!");
    } else {
        assert len2 == 0;
        assert len1 > 1;
        System.arraycopy(tmp, cursor1, a, dest, len1);
    }
}

private void mergeHi(int base1, int len1, int base2, int len2) {
    assert len1 > 0 && len2 > 0 && base1 + len1 == base2;

    // Copy second run into temp array
    T[] a = this.a; // For performance
    T[] tmp = ensureCapacity(len2);
    int tmpBase = this.tmpBase;
    System.arraycopy(a, base2, tmp, tmpBase, len2);

    int cursor1 = base1 + len1 - 1;  // Indexes into a
    int cursor2 = tmpBase + len2 - 1; // Indexes into tmp array
    int dest = base2 + len2 - 1;     // Indexes into a

    // Move last element of first run and deal with degenerate cases
    a[dest--] = a[cursor1--];
    if (--len1 == 0) {
        System.arraycopy(tmp, tmpBase, a, dest - (len2 - 1), len2);
        return;
    }
    if (len2 == 1) {
        dest -= len1;
        cursor1 -= len1;
        System.arraycopy(a, cursor1 + 1, a, dest + 1, len1);
        a[dest] = tmp[cursor2];
        return;
    }

    Comparator<? super T> c = this.c;  // Use local variable for performance
    int minGallop = this.minGallop;    //  "    "       "     "      "
outer:
    while (true) {
        int count1 = 0; // Number of times in a row that first run won
        int count2 = 0; // Number of times in a row that second run won

        /*
         * Do the straightforward thing until (if ever) one run
         * appears to win consistently.
         */
        do {
            assert len1 > 0 && len2 > 1;
            if (c.compare(tmp[cursor2], a[cursor1]) < 0) {
                a[dest--] = a[cursor1--];
                count1++;
                count2 = 0;
                if (--len1 == 0)
                    break outer;
            } else {
                a[dest--] = tmp[cursor2--];
                count2++;
                count1 = 0;
                if (--len2 == 1)
                    break outer;
            }
        } while ((count1 | count2) < minGallop);

        /*
         * One run is winning so consistently that galloping may be a
         * huge win. So try that, and continue galloping until (if ever)
         * neither run appears to be winning consistently anymore.
         */
        do {
            assert len1 > 0 && len2 > 1;
            count1 = len1 - gallopRight(tmp[cursor2], a, base1, len1, len1 - 1, c);
            if (count1 != 0) {
                dest -= count1;
                cursor1 -= count1;
                len1 -= count1;
                System.arraycopy(a, cursor1 + 1, a, dest + 1, count1);
                if (len1 == 0)
                    break outer;
            }
            a[dest--] = tmp[cursor2--];
            if (--len2 == 1)
                break outer;

            count2 = len2 - gallopLeft(a[cursor1], tmp, tmpBase, len2, len2 - 1, c);
            if (count2 != 0) {
                dest -= count2;
                cursor2 -= count2;
                len2 -= count2;
                System.arraycopy(tmp, cursor2 + 1, a, dest + 1, count2);
                if (len2 <= 1)  // len2 == 1 || len2 == 0
                    break outer;
            }
            a[dest--] = a[cursor1--];
            if (--len1 == 0)
                break outer;
            minGallop--;
        } while (count1 >= MIN_GALLOP | count2 >= MIN_GALLOP);
        if (minGallop < 0)
            minGallop = 0;
        minGallop += 2;  // Penalize for leaving gallop mode
    }  // End of "outer" loop
    this.minGallop = minGallop < 1 ? 1 : minGallop;  // Write back to field

    if (len2 == 1) {
        assert len1 > 0;
        dest -= len1;
        cursor1 -= len1;
        System.arraycopy(a, cursor1 + 1, a, dest + 1, len1);
        a[dest] = tmp[cursor2];  // Move first elt of run2 to front of merge
    } else if (len2 == 0) {
        throw new IllegalArgumentException(
            "Comparison method violates its general contract!");
    } else {
        assert len1 == 0;
        assert len2 > 0;
        System.arraycopy(tmp, tmpBase, a, dest - (len2 - 1), len2);
    }
}
```

### DualPivotQuicksort#sort

下面，再看一下jdk中实现的双轴快排算法。

```java
/**
 * The maximum number of runs in merge sort.
 */
private static final int MAX_RUN_COUNT = 67;

/**
 * The maximum length of run in merge sort.
 */
private static final int MAX_RUN_LENGTH = 33;

/**
 * If the length of an array to be sorted is less than this
 * constant, Quicksort is used in preference to merge sort.
 */
private static final int QUICKSORT_THRESHOLD = 286;

/**
 * If the length of an array to be sorted is less than this
 * constant, insertion sort is used in preference to Quicksort.
 */
private static final int INSERTION_SORT_THRESHOLD = 47;

/**
 * If the length of a byte array to be sorted is greater than this
 * constant, counting sort is used in preference to insertion sort.
 */
private static final int COUNTING_SORT_THRESHOLD_FOR_BYTE = 29;

/**
 * If the length of a short or char array to be sorted is greater
 * than this constant, counting sort is used in preference to Quicksort.
 */
private static final int COUNTING_SORT_THRESHOLD_FOR_SHORT_OR_CHAR = 3200;
/**
 * Sorts the specified range of the array using the given
 * workspace array slice if possible for merging
 *
 * @param a the array to be sorted
 * @param left the index of the first element, inclusive, to be sorted
 * @param right the index of the last element, inclusive, to be sorted
 * @param work a workspace array (slice)
 * @param workBase origin of usable space in work array
 * @param workLen usable size of work array
 */
static void sort(int[] a, int left, int right,
                    int[] work, int workBase, int workLen) {
    // Use Quicksort on small arrays
    if (right - left < QUICKSORT_THRESHOLD) {
        sort(a, left, right, true);
        return;
    }

    /*
     * Index run[i] is the start of i-th run
     * (ascending or descending sequence).
     */
    int[] run = new int[MAX_RUN_COUNT + 1];
    int count = 0; run[0] = left;

    // Check if the array is nearly sorted
    for (int k = left; k < right; run[count] = k) {
        if (a[k] < a[k + 1]) { // ascending
            while (++k <= right && a[k - 1] <= a[k]);
        } else if (a[k] > a[k + 1]) { // descending
            while (++k <= right && a[k - 1] >= a[k]);
            for (int lo = run[count] - 1, hi = k; ++lo < --hi; ) {
                int t = a[lo]; a[lo] = a[hi]; a[hi] = t;
            }
        } else { // equal
            for (int m = MAX_RUN_LENGTH; ++k <= right && a[k - 1] == a[k]; ) {
                if (--m == 0) {
                    sort(a, left, right, true);
                    return;
                }
            }
        }

        /*
         * The array is not highly structured,
         * use Quicksort instead of merge sort.
         */
        if (++count == MAX_RUN_COUNT) {
            sort(a, left, right, true);
            return;
        }
    }

    // Check special cases
    // Implementation note: variable "right" is increased by 1.
    if (run[count] == right++) { // The last run contains one element
        run[++count] = right;
    } else if (count == 1) { // The array is already sorted
        return;
    }

    // Determine alternation base for merge
    byte odd = 0;
    for (int n = 1; (n <<= 1) < count; odd ^= 1);

    // Use or create temporary array b for merging
    int[] b;                 // temp array; alternates with a
    int ao, bo;              // array offsets from 'left'
    int blen = right - left; // space needed for b
    if (work == null || workLen < blen || workBase + blen > work.length) {
        work = new int[blen];
        workBase = 0;
    }
    if (odd == 0) {
        System.arraycopy(a, left, work, workBase, blen);
        b = a;
        bo = 0;
        a = work;
        ao = workBase - left;
    } else {
        b = work;
        ao = 0;
        bo = workBase - left;
    }

    // Merging
    for (int last; count > 1; count = last) {
        for (int k = (last = 0) + 2; k <= count; k += 2) {
            int hi = run[k], mi = run[k - 1];
            for (int i = run[k - 2], p = i, q = mi; i < hi; ++i) {
                if (q >= hi || p < mi && a[p + ao] <= a[q + ao]) {
                    b[i + bo] = a[p++ + ao];
                } else {
                    b[i + bo] = a[q++ + ao];
                }
            }
            run[++last] = hi;
        }
        if ((count & 1) != 0) {
            for (int i = right, lo = run[count - 1]; --i >= lo;
                b[i + bo] = a[i + ao]
            );
            run[++last] = right;
        }
        int[] t = a; a = b; b = t;
        int o = ao; ao = bo; bo = o;
    }
}

/**
 * Sorts the specified range of the array by Dual-Pivot Quicksort.
 *
 * @param a the array to be sorted
 * @param left the index of the first element, inclusive, to be sorted
 * @param right the index of the last element, inclusive, to be sorted
 * @param leftmost indicates if this part is the leftmost in the range
 */
private static void sort(int[] a, int left, int right, boolean leftmost) {
    int length = right - left + 1;

    // Use insertion sort on tiny arrays
    if (length < INSERTION_SORT_THRESHOLD) {
        if (leftmost) {
            /*
             * Traditional (without sentinel) insertion sort,
             * optimized for server VM, is used in case of
             * the leftmost part.
             */
            for (int i = left, j = i; i < right; j = ++i) {
                int ai = a[i + 1];
                while (ai < a[j]) {
                    a[j + 1] = a[j];
                    if (j-- == left) {
                        break;
                    }
                }
                a[j + 1] = ai;
            }
        } else {
            /*
             * Skip the longest ascending sequence.
             */
            do {
                if (left >= right) {
                    return;
                }
            } while (a[++left] >= a[left - 1]);

            /*
             * Every element from adjoining part plays the role
             * of sentinel, therefore this allows us to avoid the
             * left range check on each iteration. Moreover, we use
             * the more optimized algorithm, so called pair insertion
             * sort, which is faster (in the context of Quicksort)
             * than traditional implementation of insertion sort.
             */
            for (int k = left; ++left <= right; k = ++left) {
                int a1 = a[k], a2 = a[left];

                if (a1 < a2) {
                    a2 = a1; a1 = a[left];
                }
                while (a1 < a[--k]) {
                    a[k + 2] = a[k];
                }
                a[++k + 1] = a1;

                while (a2 < a[--k]) {
                    a[k + 1] = a[k];
                }
                a[k + 1] = a2;
            }
            int last = a[right];

            while (last < a[--right]) {
                a[right + 1] = a[right];
            }
            a[right + 1] = last;
        }
        return;
    }

    // Inexpensive approximation of length / 7
    int seventh = (length >> 3) + (length >> 6) + 1;

    /*
     * Sort five evenly spaced elements around (and including) the
     * center element in the range. These elements will be used for
     * pivot selection as described below. The choice for spacing
     * these elements was empirically determined to work well on
     * a wide variety of inputs.
     */
    int e3 = (left + right) >>> 1; // The midpoint
    int e2 = e3 - seventh;
    int e1 = e2 - seventh;
    int e4 = e3 + seventh;
    int e5 = e4 + seventh;

    // Sort these elements using insertion sort
    if (a[e2] < a[e1]) { int t = a[e2]; a[e2] = a[e1]; a[e1] = t; }

    if (a[e3] < a[e2]) { int t = a[e3]; a[e3] = a[e2]; a[e2] = t;
        if (t < a[e1]) { a[e2] = a[e1]; a[e1] = t; }
    }
    if (a[e4] < a[e3]) { int t = a[e4]; a[e4] = a[e3]; a[e3] = t;
        if (t < a[e2]) { a[e3] = a[e2]; a[e2] = t;
            if (t < a[e1]) { a[e2] = a[e1]; a[e1] = t; }
        }
    }
    if (a[e5] < a[e4]) { int t = a[e5]; a[e5] = a[e4]; a[e4] = t;
        if (t < a[e3]) { a[e4] = a[e3]; a[e3] = t;
            if (t < a[e2]) { a[e3] = a[e2]; a[e2] = t;
                if (t < a[e1]) { a[e2] = a[e1]; a[e1] = t; }
            }
        }
    }

    // Pointers
    int less  = left;  // The index of the first element of center part
    int great = right; // The index before the first element of right part

    if (a[e1] != a[e2] && a[e2] != a[e3] && a[e3] != a[e4] && a[e4] != a[e5]) {
        /*
         * Use the second and fourth of the five sorted elements as pivots.
         * These values are inexpensive approximations of the first and
         * second terciles of the array. Note that pivot1 <= pivot2.
         */
        int pivot1 = a[e2];
        int pivot2 = a[e4];

        /*
         * The first and the last elements to be sorted are moved to the
         * locations formerly occupied by the pivots. When partitioning
         * is complete, the pivots are swapped back into their final
         * positions, and excluded from subsequent sorting.
         */
        a[e2] = a[left];
        a[e4] = a[right];

        /*
         * Skip elements, which are less or greater than pivot values.
         */
        while (a[++less] < pivot1);
        while (a[--great] > pivot2);

        /*
         * Partitioning:
         *
         *   left part           center part                   right part
         * +--------------------------------------------------------------+
         * |  < pivot1  |  pivot1 <= && <= pivot2  |    ?    |  > pivot2  |
         * +--------------------------------------------------------------+
         *               ^                          ^       ^
         *               |                          |       |
         *              less                        k     great
         *
         * Invariants:
         *
         *              all in (left, less)   < pivot1
         *    pivot1 <= all in [less, k)     <= pivot2
         *              all in (great, right) > pivot2
         *
         * Pointer k is the first index of ?-part.
         */
        outer:
        for (int k = less - 1; ++k <= great; ) {
            int ak = a[k];
            if (ak < pivot1) { // Move a[k] to left part
                a[k] = a[less];
                /*
                 * Here and below we use "a[i] = b; i++;" instead
                 * of "a[i++] = b;" due to performance issue.
                 */
                a[less] = ak;
                ++less;
            } else if (ak > pivot2) { // Move a[k] to right part
                while (a[great] > pivot2) {
                    if (great-- == k) {
                        break outer;
                    }
                }
                if (a[great] < pivot1) { // a[great] <= pivot2
                    a[k] = a[less];
                    a[less] = a[great];
                    ++less;
                } else { // pivot1 <= a[great] <= pivot2
                    a[k] = a[great];
                }
                /*
                 * Here and below we use "a[i] = b; i--;" instead
                 * of "a[i--] = b;" due to performance issue.
                 */
                a[great] = ak;
                --great;
            }
        }

        // Swap pivots into their final positions
        a[left]  = a[less  - 1]; a[less  - 1] = pivot1;
        a[right] = a[great + 1]; a[great + 1] = pivot2;

        // Sort left and right parts recursively, excluding known pivots
        sort(a, left, less - 2, leftmost);
        sort(a, great + 2, right, false);

        /*
            * If center part is too large (comprises > 4/7 of the array),
            * swap internal pivot values to ends.
            */
        if (less < e1 && e5 < great) {
            /*
                * Skip elements, which are equal to pivot values.
                */
            while (a[less] == pivot1) {
                ++less;
            }

            while (a[great] == pivot2) {
                --great;
            }

            /*
                * Partitioning:
                *
                *   left part         center part                  right part
                * +----------------------------------------------------------+
                * | == pivot1 |  pivot1 < && < pivot2  |    ?    | == pivot2 |
                * +----------------------------------------------------------+
                *              ^                        ^       ^
                *              |                        |       |
                *             less                      k     great
                *
                * Invariants:
                *
                *              all in (*,  less) == pivot1
                *     pivot1 < all in [less,  k)  < pivot2
                *              all in (great, *) == pivot2
                *
                * Pointer k is the first index of ?-part.
                */
            outer:
            for (int k = less - 1; ++k <= great; ) {
                int ak = a[k];
                if (ak == pivot1) { // Move a[k] to left part
                    a[k] = a[less];
                    a[less] = ak;
                    ++less;
                } else if (ak == pivot2) { // Move a[k] to right part
                    while (a[great] == pivot2) {
                        if (great-- == k) {
                            break outer;
                        }
                    }
                    if (a[great] == pivot1) { // a[great] < pivot2
                        a[k] = a[less];
                        /*
                            * Even though a[great] equals to pivot1, the
                            * assignment a[less] = pivot1 may be incorrect,
                            * if a[great] and pivot1 are floating-point zeros
                            * of different signs. Therefore in float and
                            * double sorting methods we have to use more
                            * accurate assignment a[less] = a[great].
                            */
                        a[less] = pivot1;
                        ++less;
                    } else { // pivot1 < a[great] < pivot2
                        a[k] = a[great];
                    }
                    a[great] = ak;
                    --great;
                }
            }
        }

        // Sort center part recursively
        sort(a, less, great, false);

    } else { // Partitioning with one pivot
        /*
            * Use the third of the five sorted elements as pivot.
            * This value is inexpensive approximation of the median.
            */
        int pivot = a[e3];

        /*
            * Partitioning degenerates to the traditional 3-way
            * (or "Dutch National Flag") schema:
            *
            *   left part    center part              right part
            * +-------------------------------------------------+
            * |  < pivot  |   == pivot   |     ?    |  > pivot  |
            * +-------------------------------------------------+
            *              ^              ^        ^
            *              |              |        |
            *             less            k      great
            *
            * Invariants:
            *
            *   all in (left, less)   < pivot
            *   all in [less, k)     == pivot
            *   all in (great, right) > pivot
            *
            * Pointer k is the first index of ?-part.
            */
        for (int k = less; k <= great; ++k) {
            if (a[k] == pivot) {
                continue;
            }
            int ak = a[k];
            if (ak < pivot) { // Move a[k] to left part
                a[k] = a[less];
                a[less] = ak;
                ++less;
            } else { // a[k] > pivot - Move a[k] to right part
                while (a[great] > pivot) {
                    --great;
                }
                if (a[great] < pivot) { // a[great] <= pivot
                    a[k] = a[less];
                    a[less] = a[great];
                    ++less;
                } else { // a[great] == pivot
                    /*
                        * Even though a[great] equals to pivot, the
                        * assignment a[k] = pivot may be incorrect,
                        * if a[great] and pivot are floating-point
                        * zeros of different signs. Therefore in float
                        * and double sorting methods we have to use
                        * more accurate assignment a[k] = a[great].
                        */
                    a[k] = pivot;
                }
                a[great] = ak;
                --great;
            }
        }

        /*
            * Sort left and right parts recursively.
            * All elements from center part are equal
            * and, therefore, already sorted.
            */
        sort(a, left, less - 1, leftmost);
        sort(a, great + 1, right, false);
    }
}
```

## 扩展

### Arrays#legacyMergeSort

`Arrays`中同样也实现了原始的归并排序，但是默认是不启用的，下面也稍微分析下。

其实这个归并排序的实现还是比较常规的，只不过是多了一层判断，如果待排序的数组长度小于INSERTIONSORT_THRESHOLD这个阈值，那就直接使用插入排序了。

```java
// 方法名定义的很明显，原始归并排序
private static void legacyMergeSort(Object[] a,
                                    int fromIndex, int toIndex) {
    // 因为fromIndex、toIndex不一定是从0到length-1，所以这里把区间内的原始copy到了一个新数组中
    Object[] aux = copyOfRange(a, fromIndex, toIndex);
    // 调用归并排序
    mergeSort(aux, a, fromIndex, toIndex, -fromIndex);
}

private static void mergeSort(Object[] src,
                              Object[] dest,
                              int low,
                              int high,
                              int off) {
    // 获取待排序的长度
    int length = high - low;
	// 如果长度小于7，那就直接通过插入排序实现
    // Insertion sort on smallest arrays
    if (length < INSERTIONSORT_THRESHOLD) {
        // 两层for循环，
        for (int i=low; i<high; i++)
            for (int j=i; j>low &&
                 ((Comparable) dest[j-1]).compareTo(dest[j])>0; j--)
                swap(dest, j, j-1);
        return;
    }

    // Recursively sort halves of dest into src
    // 原本的起始下标
    int destLow  = low;
    // 原本的结束下标
    int destHigh = high;
    // 根据方法的调用链可以看到，off=-low
    // 那么这里，low == 0
    low  += off;
    // high == destHigh-destLow
    high += off;
    // 找到中间位置
    int mid = (low + high) >>> 1;
    mergeSort(dest, src, low, mid, -off);
    mergeSort(dest, src, mid, high, -off);

    // If list is already sorted, just copy from src to dest.  This is an
    // optimization that results in faster sorts for nearly ordered lists.
    if (((Comparable)src[mid-1]).compareTo(src[mid]) <= 0) {
        System.arraycopy(src, low, dest, destLow, length);
        return;
    }

    // Merge sorted halves (now in src) into dest
    for(int i = destLow, p = low, q = mid; i < destHigh; i++) {
        if (q >= high || p < mid && ((Comparable)src[p]).compareTo(src[q])<=0)
            dest[i] = src[p++];
        else
            dest[i] = src[q++];
    }
}
```

### Arrays#binarySearch

`Arrays`类还实现了二分查找，最后就简单分析下吧。

```java
// 在整个数组内，查找是否存在元素key
public static int binarySearch(int[] a, int key) {
  return binarySearch0(a, 0, a.length, key);
}
// // 在数组的from到to区间内，查找是否存在元素key
public static int binarySearch(int[] a, int fromIndex, int toIndex,
                               int key) {
  // 对于下标是否越界的check
  rangeCheck(a.length, fromIndex, toIndex);
  // 调用二分查找的实现方法
  return binarySearch0(a, fromIndex, toIndex, key);
}
private static int binarySearch0(int[] a, int fromIndex, int toIndex,
                                 int key) {
  // 起始下标
  int low = fromIndex;
  // 结束下标
  int high = toIndex - 1;
  // 循环的实现方式
  while (low <= high) {
    // 找到中间位置的下标
    int mid = (low + high) >>> 1;
    // 取中间值
    int midVal = a[mid];
	// 如果中间值小于目标值
    if (midVal < key)
      // 把起始下标移到mid+1处
      low = mid + 1;
    // 如果中间值大于目标值
    else if (midVal > key)
      // 把结束下标移到mid-1处
      high = mid - 1;
    else
      // 否则，二者相等，直接返回中间位置的下标
      return mid; // key found
  }
  // 一旦while循环结束，代码执行到这里，代表没有找到，返回一个负值
  return -(low + 1);  // key not found.
}
```

## 总结

## 参考

1. [JDK（二）JDK1.8源码分析【排序】timsort](https://www.cnblogs.com/warehouse/p/9342279.html)