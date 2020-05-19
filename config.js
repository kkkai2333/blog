const openArr = [
    "how-to-build-redis-cluster",
    "how-to-build-blog"
];

const algorithmArr = [
    
];

const interviewArr = [
    "java",
    "jvm",
    "spring",
    "mybatis",
    "mysql",
    "redis",
    "mq",
    "io",
    "dubbo",
    "zookeeper",
    "mongodb",
    "elastic-search",
    "linux",
    "docker",
    "分库分表",
    "设计模式",
    "排序算法",
    "计算机网络",
    "经典数据结构",
    "高并发系统设计"
    
];

const javaArr = [
    "hashmap",
    "concurrent-hashmap",
    "thread-pool-executor",
    "ThreadLocal",
    "aqs",
    "ReentrantLock",
    "ReadWriteLock",
    "JVM"
];

const springArr = [
    "spring-ioc",
    "spring-aop",
    "spring-annotation",
    "spring-transaction",
    "spring-design-patterns",
    "spring-bean-post-processor",
    "spring-bean-life-cycle",
    "spring-bean-circular-dependency",
    "Spring-mvc",
    "Spring-boot",
    "spring-boot-initialize",
    "spring-boot-automatic-assembly",
    "Spring-cloud",
    "mybatis",
    "tomcat",
    "dubbo",
    "zookeeper"
];

const redisArr = [
    "redis-data-type",
    "redis-data-structure",
    "缓存三大问题",
    "高可用方案"
];

const dbArr = [
    "MySQL",
    "MyCat",
    "ShardingSphere",
    "MongoDB",
]

const mqArr = [
    "rabbitmq",
    "rocketmq",
    "kafka"
]

module.exports = {
    title: 'IT Forever Young',
    description: 'IT Forever Young',
    base: "/",
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
    themeConfig: {
        // 你的 Git 项目地址，添加后会在导航栏的最后追加
        repo: 'itForeverYoung/blog',
        // 启用编辑
        editLinks: true,
        // 编辑按钮的 Text
        editLinkText: '在GitHub上编辑此页',
        // 编辑文档的所在目录
        docsDir: 'docs',
        // 假如文档放在一个特定的分支下：
        // docsBranch: 'master',
        lastUpdated: '上次更新时间',
        // 这里定义的是导航栏
        nav: [
            /**
            {
                text: "Java",
                link: "/java/"
            },
            {
                text: "Spring",
                link: "/spring/"
            },
            {
                text: "Redis",
                link: "/redis/"
            },
            {
                text: "数据库",
                link: "/db/"
            },
            {
                text: "消息中间件",
                link: "/mq/"
            },
            **/
            {
                text: "面试专题",
                link: "/interview/"
            },
            /**
            {
                text: "算法",
                link: "/algorithm/"
            },
            {
                text: "分享",
                link: "/open/"
            },
            **/
            /*
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
                    title: "Java专题",
                    collapsable: false,
                    children: javaArr
                }
            ],
            '/spring/': [
                {
                    title: "Spring专题",
                    collapsable: false,
                    children: springArr
                }
            ],
            '/redis/': [
                {
                    title: "Redis专题",
                    collapsable: false,
                    children: redisArr
                }
            ],
            '/db/': [
                {
                    title: "数据库专题",
                    collapsable: false,
                    children: dbArr
                }
            ],
            '/mq/': [
                {
                    title: "消息中间件专题",
                    collapsable: false,
                    children: mqArr
                }
            ],
            '/interview/': [
                {
                    title: "面试专题",
                    collapsable: false,
                    children: interviewArr
                }
            ],
            '/algorithm/': [
                {
                    title: "算法专题",
                    collapsable: false,
                    children: algorithmArr
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
        sidebarDepth: 1
    },
    markdown: {
        lineNumber: true

    }
}
