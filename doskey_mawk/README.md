## An example of awk / mawk integration in conhost environment

###### It is very simple to use 

First add it to Powershell or Command Prompt alias:

Command Prompt / Doskey
```
_=@echo $* $B mawk -F"[(),]" -f /path/to/interpreter.awk /path/to/def.awk -
```
PowerShell / Alias
```
function _(){ $raw = $MyInvocation.Line -replace '^\s*maw\s+', '';$raw | mawk -F"[(),]" -f /path/to/interpreter.awk /path/to/def.awk -}
```
Then you can call it with:
```
In Command Prompt
$>_ ord(a)
97
$>_ chr(65)
'A'
$>_ sum(2,5,6,3)
16
$>_ hex(346)
'0x15a'
$>_ bin(346)
'0b101011010'
$>_ oct(346)
'0o532'
$>_ any(0,0)
0
$>_ any(1,"a",2)
1
$>_ all(1,"a",2)
1
$>_ all(1,"",2)
0
```
For some reason doskey doesn't pipe the output but the literal argument (example '_ chr(65) | clip' copies chr(65) literally to clipboard, not the result)
But that can be resolved by pasting this to _.bat or _.cmd:
```
@echo off

if "%~1"=="" goto :stdin
echo %* | mawk -F"[(),]" -f /path/to/interpreter.awk /path/to/def.awk -
exit /b

:stdin
mawk -F"[(),]" -f /path/to/interpreter.awk /path/to/def.awk -
```
In powershell is somewhat similar... you have to wrap whole function argument in quotes single or double (avoid back quotes because those are like escape character in powershell)
You can either:
```
function _(){ $raw = $MyInvocation.Line -replace '^\s*maw\s+', '';$raw | mawk -F"[(),]" -f /path/to/interpreter.awk /path/to/def.awk -}
```
Or use the _.bat / _.cmd alternatively.
Although Powershell is a little less restrictive, but inside conhost environment it impossible to get rid of all quirks.
Anyway, piping works but with a little extra values. For example ```"_ ord(c)" | clip``` will append ```"99" | clip``` to clipboard
So, again, the .bat / .cmd wins again...
