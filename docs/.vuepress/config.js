// emacs ~/OneDrive/code/github/blog/docs/.vuepress/config.js

const javaArr = [
    //"collection",
    //"hashmap",
    //"concurrent-hashmap",
    //"queue",
    //"proxy",
    //"juc",
    "aqs",
    "reentrant-lock",
    "reentrant-read-write-lock",
    //"StampedLock",
    "count-down-latch",
    "cyclic-barrier",
    "semaphore",
    //"atomic",
    "thread-pool-executor",
    //"thread-local",
    //"jdk-sort",
    //"jmm",
    //"synchronized",
    //"volatile",
];

const jvmArr = [
    "jvm",
    //"class-loader"
];

const springArr = [
    //"spring-ioc",
    //"spring-aop",
    "spring-di",
    //"spring-annotation",
    //"spring-transaction",
    //"spring-design-patterns",
    //"spring-bean-definition",
    //"spring-bean-life-cycle",
    //"spring-bean-post-processor",
    "spring-bean-circular-dependency",
    //"spring-mvc",
    //"spring-boot",
    "spring-boot-initialize",
    //"spring-boot-automatic-assembly",
    //"spring-cloud",

];

const dubboArr = [
    //"spi",
    //"service-export",
    //"reference-import",
    //"proxy",
    //"protocol",
    //"cluster",
    //"registry",
    //"exchange",
    //"transport",
    //"serialization"
]

const mybatisArr = [

]

const tomcatArr = [

]

const nettyArr = [

]

const zkArr = [

]

const mysqlArr = [
    "mysql",
    //"my-cat",
    //"sharding-sphere",
]

const redisArr = [
    //"redis-data-type",
    //"redis-data-structure",
    //"redis-persistence",
    //"redis-expire-delete",
    //"redis-enviction",
    //"redis-ha",
];

const mqArr = [
    //"rocketmq",
    //"kafka"
]

const interviewArr = [
    //"java",
    //"jvm",
    //"spring",
    //"mybatis",
    //"mysql",
    //"redis",
    //"dubbo",
    //"zookeeper",
    //"netty",
    //"tomcat",
    //"mq",
    //"io",
    //"elastic-search",
    //"mongodb",
    //"docker",
    //"linux",
    //"java-web"
    
];

const openArr = [
    //"build-blog"
];

const algorithmArr = [
    
];

const mongoArr = [

]

const hbaseArr = [

]

// elasticsearch
const esArr = [

]

// clickhouse
const ckArr = [

]

module.exports = {
    title: '孤帆远影碧空尽',
    description: 'Hello World',
    base: "/blog/",
    head: [
        ['link', { rel: 'icon', href: '/logo.png' }]
    ],
    locales: {
        "/": {
            lang: "zh-CN",
            selectText: "Languages",
            title: "",
            description: ""
        }
    },
    plugins: ['back-to-top'],
    theme: "reco",
    codeTheme: 'tomorrow',
    themeConfig: {
        // Git项目地址，添加后会在导航栏的最后追加
        repo: 'lasilaso/blog',
        // 启用编辑
        editLinks: true,
        // 编辑按钮的 Text
        editLinkText: '在GitHub上编辑此页',
        // 编辑文档的所在目录
        docsDir: 'docs',
        // 假如文档放在一个特定的分支下：
        // docsBranch: 'master',
        lastUpdated: '上次更新时间',
        author: "鱼丸粗面",
        authorAvatar: 'logo.png', // 作者头像
        mode: 'auto', // 默认auto
        modePicker: true, // 默认true, 即可以切换模式
        startYear: 2019,
        type: 'blog', // 主题类型
        // 博客设置
        blogConfig: {
            category: {
                location: 3, // 在导航栏菜单中所占的位置，默认2
                text: '分类' // 默认 “分类”
            },
            tag: {
                location: 4, // 在导航栏菜单中所占的位置，默认3
                text: '标签' // 默认 “标签”
            }
        },
        // 这里定义的是导航栏
        nav: [
            { text: "主页", link: "/", icon: "reco-home"},
            { text: '时间轴', link: '/timeline/', icon: 'reco-date'},
            {
                text: "Java",
                items: [
                    {
                        text: "Java",
                        link: "/java/"
                    },
                    {
                        text: "Jvm",
                        link: "/jvm/"
                    }
                ]
            },
            {
                text: "开源框架",
                items: [
                    {
                        text: "Spring",
                        link: "/spring/"
                    },
                    {
                        text: "Dubbo",
                        link: "/dubbo/"
                    },
                    /**
                    {
                        text: "Tomcat",
                        link: "/tomcat/"
                    },
                    
                    {
                        text: "Mybatis",
                        link: "/mybatis/"
                    },
                    {
                        text: "Netty",
                        link: "/netty/"
                    },
                    {
                        text: "Zookeeper",
                        link: "/zk/"
                    },
                    {
                        text: "ElasticSearch",
                        link: "/es/"
                    },
                    {
                        text: "ClickHouse",
                        link: "/ck/"
                    },
                     */
                ]
            },
            {
                text: "数据库",
                items: [
                    {
                        text: "MySQL",
                        link: "/db/mysql/"
                    },
                    {
                        text: "Redis",
                        link: "/redis/"
                    },
                    /**
                    {
                        text: "Hbase",
                        link: "/db/hbase/"
                    },
                    {
                        text: "MongoDB",
                        link: "/db/mongodb/"
                    },
                     */
                ]
            },
            {
                text: "消息中间件",
                link: "/mq/"
            },
            /**
            {
                text: "算法",
                link: "/algorithm/"
            },
            */
            /*
            {
                text: "面试",
                link: "/interview/"
            },
            
            {
                text: "随便分享",
                link: "/open/"
            },
            
            {
                text: "404",
                link: "https://www.google.com"
            },
            {
                text: "选择语言",
                items: [
                    {
                        text: "简体中文",
                        link: "/"
                    },
                    {
                        text: "不支持English",
                        link:"/"
                    }
                ]
            }
            */
        ],
        // 这里定义的是侧边栏
        sidebar: {  
            '/java/': [
                {
                    title: "Java",
                    collapsable: false,
                    children: javaArr
                }
            ],
            '/jvm/': [
                {
                    title: "Jvm",
                    collapsable: false,
                    children: jvmArr
                }
            ],
            '/spring/': [
                {
                    title: "Spring",
                    collapsable: false,
                    children: springArr
                }
            ],
            '/dubbo/': [
                {
                    title: "Dubbo",
                    collapsable: false,
                    children: dubboArr
                }
            ],
            '/tomcat/': [
                {
                    title: "Tomcat",
                    collapsable: false,
                    children: tomcatArr
                }
            ],
            '/netty/': [
                {
                    title: "Netty",
                    collapsable: false,
                    children: nettyArr
                }
            ],
            '/mybatis/': [
                {
                    title: "Mybatis",
                    collapsable: false,
                    children: mybatisArr
                }
            ],
            '/zookeeper/': [
                {
                    title: "Zookeeper",
                    collapsable: false,
                    children: zkArr
                }
            ],
            '/db/mysql/': [
                {
                    title: "MySQL",
                    collapsable: false,
                    children: mysqlArr
                }
            ],
            '/redis/': [
                {
                    title: "Redis",
                    collapsable: false,
                    children: redisArr
                }
            ],
            // hbase
            // es
            // ck
            // mongodb
            '/mq/': [
                {
                    title: "消息中间件",
                    collapsable: false,
                    children: mqArr
                }
            ],
            '/interview/': [
                {
                    title: "面试",
                    collapsable: false,
                    children: interviewArr
                }
            ],
            '/open/': [
                {
                    title: "随便分享",
                    collapsable: false,
                    children: openArr
                }
            ]
        },
        // 1: 提取到h2级别标题，2: 提取到h3级别标题
        // sidebarDepth: 1
    },
    markdown: {
        lineNumber: true

    }
}
