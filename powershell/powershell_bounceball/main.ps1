
using module .\bounceball3.psm1

$game = [Game]::new()
[void]$game.form.ShowDialog()
$game.loopTimer.Dispose()
