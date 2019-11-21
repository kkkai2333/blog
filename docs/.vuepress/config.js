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
    "open1",
    "open2",
    "open3"
];

module.exports = {
    title: 'IT Forever Young',
    description: 'IT Forever Young',
    base: "/gh-pages",
    head: [

    ],
    locales: {
        "/gh-pages": {
            lang: "简体中文",
            selectText: "Languages",
            title: "",
            description: "",
        }
    },
    themeConfig: {
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
            //{
            //    text: "Github",
            //    link: "https://github.com/Damon-kz/ItForeverYoung"
            //},
            {
                text: "404",
                link: "https://www.google.com"
            }
        ],
        sidebar: {
            '/java/': [
                {
                    title: "这边是Java",
                    collapsable: true,
                    children: javaArr
                }
            ],
            '/algorithm/': [
                {
                    title: "这边是算法",
                    collapsable: false,
                    children: algorithmArr
                }
            ],
            '/open/': [
                {
                    title: "这边是随便分享",
                    collapsable: true,
                    children: openArr
                }
            ]
        },
        locales: {
            "/": {
                lang: "简体中文",
                selectText: "Languages",
                // editLinkText: "update on github",
                title: "",
                description: "",
            }
        }
    },
    markdown: {
        lineNumber: true

    }

}
