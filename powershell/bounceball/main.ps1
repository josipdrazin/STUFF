
using module .\bounceball.psm1

$game = [Game]::new()
[void]$game.form.ShowDialog()
$game.loopTimer.Dispose()
