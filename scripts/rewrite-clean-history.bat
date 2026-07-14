@echo off
setlocal
cd /d "%~dp0.."

set GIT_AUTHOR_NAME=cipherlabzgit
set GIT_AUTHOR_EMAIL=cipherlabzgit@users.noreply.github.com
set GIT_COMMITTER_NAME=cipherlabzgit
set GIT_COMMITTER_EMAIL=cipherlabzgit@users.noreply.github.com

git checkout main 2>nul
git branch -D clean-main 2>nul

git checkout --orphan clean-main
if errorlevel 1 exit /b 1

git add -A
if errorlevel 1 exit /b 1

for /f %%i in ('git write-tree') do set TREE=%%i

for /f %%i in ('git commit-tree %TREE% -m "Initial commit: Don and Sons DMS backend frontend POS and scripts"') do set NEW=%%i

git reset --hard %NEW%
if errorlevel 1 exit /b 1

git branch -D main 2>nul
git branch -m main

echo ---
git log -1 --format="commit: %%H%%nAuthor: %%an <%%ae>%%nCommitter: %%cn <%%ce>%%n---%%n%%B"

git push --force origin main
exit /b %errorlevel%
