# deploy file

#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run docs:build

# 进入静态文件所在文件夹
cd docs/.vuepress/dist

# 如果要发布到私人域名
echo 'holmess.top' > CNAME

# 提交到github
# git init
git add -A
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io
# git push -f git@github.com:Damon-kz/Damon-kz.github.io.git master
# git push -f https://81c5540a281599807c3c4bb54279bd7476c3a49c@github.com/Damon-kz/Damon-kz.github.io.git master:gh-pages
git push -f https://${GITHUB_TOKEN1}@github.com/Damon-kz/Damon-kz.github.io.git master:gh-pages
# 如果发布到 https://<USERNAME>.github.io/<REPO>
# git push -f git@github.com:<USERNAME>/<REPO>.git master:gh-pages

cd -