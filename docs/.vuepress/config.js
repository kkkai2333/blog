const algorithmArr = [
    "test1",
    "test2",
    "test3"
];

const javaArr = [
    "java1",
    "java2",
    "java3"
];

const openArr = [
    "how to build blog",
    "open2",
    "open3"
];

module.exports = {
    title: 'IT Forever Young',
    description: 'IT Forever Young',
    base: "/",
    head: [

    ],
    locales: {
        "/": {
            lang: "简体中文",
            selectText: "Languages",
            title: "",
            description: ""
        }
    },
    themeConfig: {
        // 这里定义的是导航栏
        nav: [
            {
                text: "Java",
                link: "/java/"
            },
            {
                text: "算法",
                link: "/algorithm/"
            },
            {
                text: "分享",
                link: "/open/"
            },
            /*
            {
                text: "选择语言",
                items: [
                    {
                        text: "简体中文",
                        link: "/"
                    },
                    {
                        text: "不支持English",
                        link:"/en/"
                    }
                ]
            },
            {
                text: "Github",
                link: "https://github.com/Damon-kz/ItForeverYoung"
            },
            */
            {
                text: "404",
                link: "https://www.google.com"
            }
        ],
        // 这里定义的是侧边栏
        sidebar: {
            '/java/': [
                {
                    title: "这里是Java",
                    collapsable: true,
                    children: javaArr
                }
            ],
            '/algorithm/': [
                {
                    title: "这里是算法",
                    collapsable: false,
                    children: algorithmArr
                }
            ],
            '/open/': [
                {
                    title: "这里是随便分享",
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
