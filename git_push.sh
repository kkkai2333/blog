echo '=====git pull code start====='
git pull
echo '=====git pull code end====='

echo '=====git push code start====='
git add -A
git commit -m 'deploy'
git push
echo '=====git push code end====='
