@echo off
setlocal EnableDelayedExpansion

set "EXPR=%*"
if not defined EXPR goto :stdin

echo(!EXPR!| mawk -f C:\Users\KAZAN\interpreter\awk\interpreter.mawk C:\Users\KAZAN\interpreter\awk\def.mawk -
exit /b

:stdin
mawk -f C:\Users\KAZAN\interpreter\awk\interpreter.mawk C:\Users\KAZAN\interpreter\awk\def.mawk -
