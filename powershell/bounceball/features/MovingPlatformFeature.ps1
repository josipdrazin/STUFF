class MovingPlatformFeature : Feature {

	MovingPlatformFeature([object]$game, [hashtable]$config) : base($game, $config) {}

	[void] update([double]$delta) {
		$canvasWidth = $this.game.canvas.ClientSize.Width

		foreach ($p in $this.game.platformManager.platforms) {
			if ($p.options["type"] -eq "moving") {
				if ($p.options.ContainsKey("collectible") -and ($null -ne $p.options["collectible"])) {
					$p.options["collectible"].x = $p.x + ($p.width / 2)
				}

				$p.x += $p.options["speed"] * $p.options["direction"] * $delta

				if ($p.x -le 0) {
					$p.x = 0
					$p.options["direction"] = 1
				}
				elseif (($p.x + $p.width) -ge $canvasWidth) {
					$p.x = $canvasWidth - $p.width
					$p.options["direction"] = -1
				}
			}
		}
	}
}
