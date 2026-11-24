class PlatformWobbleFeature : Feature {
	[double]$wobbleAmplitude = 10
	[double]$wobbleSpeed     = 28
	[double]$wobbleDuration  = 0.45
	[double]$prevVy = 0

	PlatformWobbleFeature([object]$game, [hashtable]$config) : base($game, $config) {}

	[void] update([double]$delta) {
		$ball = $this.game.ball
		$justBounced = ($this.prevVy -gt 0) -and ($ball.vy -lt 0)

		foreach ($p in $this.game.platformManager.platforms) {
			if ($justBounced) {
				$withinX = (($ball.x + $ball.radius) -gt $p.x) -and (($ball.x - $ball.radius) -lt ($p.x + $p.width))
				$nearTop = [Math]::Abs(($ball.y + $ball.radius) - $p.y) -le 15
				if ($withinX -and $nearTop) {
					$p.options["wobbleTimer"] = $this.wobbleDuration
				}
			}

			if ($p.options.ContainsKey("wobbleTimer") -and ($p.options["wobbleTimer"] -gt 0)) {
				$t = $p.options["wobbleTimer"] - $delta
				$p.options["wobbleTimer"] = $t

				if ($t -gt 0) {
					$progress = 1.0 - ($t / $this.wobbleDuration)
					$p.options["wobbleOffset"] = [Math]::Sin($progress * $this.wobbleSpeed) * $this.wobbleAmplitude * (1.0 - $progress)
				}
				else {
					$p.options["wobbleOffset"] = 0.0
					$p.options.Remove("wobbleTimer")
				}
			}
		}

		$this.prevVy = $ball.vy
	}

	[void] draw() {
		$ctx = $this.game.ctx
		foreach ($p in $this.game.platformManager.platforms) {
			if ($p.options.ContainsKey("wobbleTimer")) {
				$offset = $p.options["wobbleOffset"]
				$ctx.fillStyle = "#7F7F7F"
				$ctx.fillRect($p.x, ($p.y + $offset), $p.width, $p.height)
			}
		}
	}
}
