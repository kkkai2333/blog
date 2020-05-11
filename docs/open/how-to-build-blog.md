# 如何快速搭建blog

## 写在最前

其实早就想搞一个blog玩一玩，但是苦于没有时间。~~归根结底就是懒，10/6/5有脸说自己没时间？~~

<img width="100" height="100" src="./howToBuildBlog/blackQuestion.jpg" />

最近由于某四自建站搭blog的鞭策，百忙之中（~~上班摸鱼~~）搭出来这个简单的blog。

**虽然简单，但是，相比自建站来说，不花钱，难道它不香吗？**

<img width="100" height="100" src="./howToBuildBlog/realFragrant.jpg" />

那第一篇具有纪念意义的blog，当然是写一下搭blog时踩的那些坑了。虽然这种帖子满大街都是，但是对我来说，还是有几个小坑的，所以，就勉强拿来练笔了。

OK，废话不多说，让我们开始真香旅程。

## 我们需要什么

### 一些无关紧要的介绍

* `GitHub`，全球最大的“同性”交友[网站]( https://github.com/ )。我们用到的是其提供的GitHub Pages，点击[Pages]( https://pages.github.com/ )简单了解一下吧。
* `VuePress`，关于如何把Markdown文档构建成HTML静态文件，当然是让你先到官方[网站](https://vuepress.vuejs.org/zh/ )看一下啦。
* `Travis CI`，自动发布，持续集成[网站]( https://travis-ci.org)，可以不用，后边会详细讲到。

### 快速安装必备开发环境

* 点击[git]( https://git-scm.com/downloads )快速下载，一路next安装，安装完成后，在命令行输入`git --version`，输出版本信息代表安装完成，即可使用`git`。
* 点击[yarn]( https://yarnpkg.com/zh-Hans/docs/install#windows-stable )快速下载，一路next安装，安装完成后，在命令行输入`yarn --version`，输出版本信息代表安装完成，即可使用`yarn`。
* 点击[nodejs]( https://nodejs.org/zh-cn/ )快速下载，一路next安装，安装完成后，在命令行输入`node -v`，输出版本信息代表安装完成，即可使用`npm`。

### 把大象放进冰箱需要几步

1. 获取HTML静态文件。
2. 三分钟搞定GitHub Pages。
3. 将HTML文件发布到GitHub Pages。

4. 简单集成Travis，实现快速发布。

严格意义上来说，上边三个步骤，已经完成了目标，但是科技使人变懒，本着能少敲一行命令就绝不碰键盘一下的原则，我们又有了第四步。

### 我们的目标

~~是没有蛀牙~~，是完成blog搭建。

## VuePress

### 快速上手

戳[快速上手](https://vuepress.vuejs.org/zh/guide/getting-started.html#全局安装 )到官网系统学习，或者，往下看。

```typescript
# 全局安装
# 如果你已经使用了webpack 3.x，推荐使用Yarn方式安装VuePress，因为这种情况下，npm会生成错误的依赖树。
# 如果你不懂这个问题是啥意思也没有关系，因为这表示你没有用到webpack 3.x，可以跳过本条，直接向下。
npm install -g vuepress # 或者：yarn global add vuepress

# 当然，你也可以局部安装
# npm install -d vuepress

# 新建一个 markdown 文件
echo '# Hello VuePress!' > README.md

# 开始写作，执行后会生成一个URL，访问URL就可以实时预览你写的东西，非常方便。
vuepress dev .

# 构建静态文件，可以将 markdown 文件编译成HTML，这一步需要用小本本记下来，后边会用到。
vuepress build .
```

当你在文件夹中`install`了`VuePress`之后，会默认生成一个`package.json`文件，接着，在文件中添加一些脚本。

```typescript
{
  "scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs"
  }
}
```

其实很容易理解滴，上述脚本就是将执行和构建命令封装了一下，给`npm`或者`yarn`使用，如下所示。

执行，开始写作：

```typescript
npm run docs:dev # 或者：yarn docs:dev
```

构建静态HTML文件：

```typescript
npm run docs:build # 或者：yarn docs:build
```

默认情况下，文件会生成在`.vuepress/dist`中，当然，你也可以通过 `.vuepress/config.js` 中的 `dest` 字段来修改，生成的文件就是HTML格式的啦。

Ok，第一阶段完成，我们已经得到了HTML文件。

## GitHub Pages

## Travis CI

## 引用

