
using namespace System.Collections.Generic
using namespace System.Windows.Forms
using namespace System.Drawing

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore



$script:GRAVITY = 0.6
$script:BALL_RADIUS = 6
$script:BASE_BOUNCE = 6
$script:BOOST_MULTIPLIER = 1.5
$script:PLATFORM_WIDTH = 60
$script:PLATFORM_HEIGHT = 6
$script:PLATFORM_VERTICAL_GAP = 100
$script:MAX_PLATFORMS = 20
$script:PIE_CHANCE = 0.5
$script:PIE_RADIUS = 10
$script:PIE_SCORE_VALUE = 3
$script:MAX_ENERGY = 100
$script:ENERGY_REGEN_RATE = 1
$script:ENERGY_BOOST_COST = 30
$script:ENERGY_PLATFORM_REWARD = 5
$script:CAMERA_TRIGGER_RATIO = 1 / 3
$script:PLATFORM_CLEANUP_OFFSET = 100
$script:COLLECTIBLE_CLEANUP_OFFSET = 50
$script:GAME_OVER_OFFSET = 200
$script:STAR_COUNT = 100
$script:SPACE_HEIGHT = 9000
$script:PLANET_HEIGHT = 15000
$script:UI_FONT = "20px Arial"
$script:UI_BIG_FONT = "48px Arial"
$script:ENERGY_BAR_WIDTH = 200
$script:ENERGY_BAR_HEIGHT = 16
$script:GAME_STATE = [PSObject]@{
    RUNNING 	= "running"
    PAUSED 		= "paused"
    GAMEOVER 	= "gameover"
}

function chance([double]$probability) {
    return ($script:rng.NextDouble() -lt $probability)
}

$script:rng = [System.Random]::new()

class CanvasGradient {
    [double]$x0; [double]$y0; [double]$x1; [double]$y1
    [List[object]]$stops

    CanvasGradient([double]$x0, [double]$y0, [double]$x1, [double]$y1) {
        $this.x0 = $x0; $this.y0 = $y0; $this.x1 = $x1; $this.y1 = $y1
        $this.stops = [System.Collections.Generic.List[object]]::new()
    }

    [void] addColorStop([double]$offset, [string]$color) {
        $this.stops.Add(@{ offset = $offset; color = [Canvas2D]::ParseColor($color) })
    }
}

class Canvas2D {
    [System.Drawing.Graphics]$g
    [object]$fillStyle = "#000000"
    [object]$strokeStyle = "#000000"
    [object]$font = "16px Arial"
    [string]$textAlign = "left"
    [System.Collections.Generic.Stack[System.Drawing.Drawing2D.GraphicsState]]$stateStack
    [System.Collections.Generic.List[object]]$pathOps

    Canvas2D() {
        $this.stateStack = [System.Collections.Generic.Stack[System.Drawing.Drawing2D.GraphicsState]]::new()
        $this.pathOps = [System.Collections.Generic.List[object]]::new()
    }

    static [System.Drawing.Color] ParseColor([string]$c) {
    if ($c -match '^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$') {
        $red   = [int]$Matches[1]
        $green = [int]$Matches[2]
        $blue  = [int]$Matches[3]
        $alpha = if ($Matches[4]) { [int]([double]$Matches[4] * 255) } else { 255 }
        return [System.Drawing.Color]::FromArgb($alpha, $red, $green, $blue)
    }
    return [System.Drawing.ColorTranslator]::FromHtml($c)
}

    [System.Drawing.Brush] _getBrush([double]$x, [double]$y, [double]$w, [double]$h) {
        if ($this.fillStyle -is [CanvasGradient]) {
            $grad = $this.fillStyle
            $c1 = if ($grad.stops.Count -gt 0) { $grad.stops[0].color } else { [System.Drawing.Color]::White }
            $c2 = if ($grad.stops.Count -gt 1) { $grad.stops[$grad.stops.Count - 1].color } else { $c1 }
            $rect = [System.Drawing.RectangleF]::new([float]$x, [float]$y, [float][Math]::Max(1, $w), [float][Math]::Max(1, $h))
            return [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $c1, $c2, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
        }
        return [System.Drawing.SolidBrush]::new([Canvas2D]::ParseColor([string]$this.fillStyle))
    }

    [System.Drawing.Font] _getFont() {
        if ($this.font -is [System.Drawing.Font]) { return $this.font }
        if ([string]$this.font -match '(\d+)px\s+(.+)') {
            return [System.Drawing.Font]::new($Matches[2].Trim(), [float]$Matches[1], [System.Drawing.GraphicsUnit]::Pixel)
        }
        return [System.Drawing.Font]::new("Arial", 14)
    }

    [void] save() { $this.stateStack.Push($this.g.Save()) }
    [void] restore() { if ($this.stateStack.Count -gt 0) { $this.g.Restore($this.stateStack.Pop()) } }
    [void] translate([double]$x, [double]$y) { $this.g.TranslateTransform([float]$x, [float]$y) }
    [void] rotate([double]$rad) { $this.g.RotateTransform([float]($rad * 180.0 / [Math]::PI)) }

    [CanvasGradient] createLinearGradient([double]$x0, [double]$y0, [double]$x1, [double]$y1) {
        return [CanvasGradient]::new($x0, $y0, $x1, $y1)
    }

    [void] clearRect([double]$x, [double]$y, [double]$w, [double]$h) {
        $this.g.Clear([System.Drawing.Color]::Black)
    }

    [void] fillRect([double]$x, [double]$y, [double]$w, [double]$h) {
        $brush = $this._getBrush($x, $y, $w, $h)
        try { $this.g.FillRectangle($brush, [float]$x, [float]$y, [float]$w, [float]$h) }
        finally { $brush.Dispose() }
    }

    [void] strokeRect([double]$x, [double]$y, [double]$w, [double]$h) {
        $pen = [System.Drawing.Pen]::new([Canvas2D]::ParseColor([string]$this.strokeStyle), 1)
        try { $this.g.DrawRectangle($pen, [float]$x, [float]$y, [float]$w, [float]$h) }
        finally { $pen.Dispose() }
    }

    [void] beginPath() { $this.pathOps.Clear() }

    [void] arc([double]$x, [double]$y, [double]$r, [double]$sAngle, [double]$eAngle) {
        $this.pathOps.Add(@{ x = $x - $r; y = $y - $r; w = $r * 2; h = $r * 2 })
    }

    [void] ellipse([double]$x, [double]$y, [double]$rx, [double]$ry, [double]$rot, [double]$sAngle, [double]$eAngle) {
        $this.pathOps.Add(@{ x = $x - $rx; y = $y - $ry; w = $rx * 2; h = $ry * 2 })
    }

    [void] fill() {
        foreach ($op in $this.pathOps) {
            $brush = $this._getBrush($op.x, $op.y, $op.w, $op.h)
            try { $this.g.FillEllipse($brush, [float]$op.x, [float]$op.y, [float]$op.w, [float]$op.h) }
            finally { $brush.Dispose() }
        }
    }

    [void] fillText([string]$text, [double]$x, [double]$y) {
        $f = $this._getFont()
        $brush = [System.Drawing.SolidBrush]::new([Canvas2D]::ParseColor([string]$this.fillStyle))
        try {
            # Subtract font height so Y matches HTML5 alphabetic baseline closely
            $this.g.DrawString($text, $f, $brush, [float]$x, [float]($y - $f.Size))
        }
        finally {
            $brush.Dispose()
            if ($this.font -isnot [System.Drawing.Font]) { $f.Dispose() }
        }
    }
}


class Background {
	[object]$game
	[double]$offsetY
	[List[psobject]]$layers

	Background([object]$game) {
		$this.game = $game
		$this.offsetY = 0
		$this.layers = [List[psobject]]::new()
		$this.createCloudLayer()
	}

	[void] createCloudLayer() {
    
		$clouds = [List[psobject]]::new()
		for ($i = 0; $i -lt 20; $i++) {
			$clouds.Add([psobject]@{
				x 	= ($script:rng.NextDouble() * $this.game.canvas.ClientSize.Width)
				y 	= ($script:rng.NextDouble() * $this.game.canvas.ClientSize.Height)
				size 	= (20 + $script:rng.NextDouble() * 40)
				speed 	= (0.2 + $script:rng.NextDouble() * 0.3)
			})
		}
		$this.layers.Add([psobject]@{"items" = $clouds})
		$this.layers.Add([psobject]@{"type" = "clouds"})
	}

	[void] shift($amount) {
		$this.offsetY = $amount
	}

	[void] draw() {
		$ctx = $this.game.ctx
		$this.drawSkyGradient()
		$ctx.save()
		$ctx.translate(0, $this.offsetY)
		foreach ($layer in $this.layers) {
			if ($layer.type -eq "clouds") {
				$this.drawCloudLayer($layer)
			}
		}
		$ctx.restore()
	}

	[void] drawSkyGradient() {
		$canvas = $this.game.canvas
		$ctx = $this.game.ctx
		$gradient = $ctx.createLinearGradient(0, 0, 0, $canvas.ClientSize.Height)
		$gradient.addColorStop(0, "#6ec3ff")
		$gradient.addColorStop(1, "#cfe9ff")
		$ctx.fillStyle = $gradient
		$ctx.fillRect(0, 0, $canvas.ClientSize.Width, $canvas.ClientSize.Height)
	}

	[void] drawCloudLayer($layer) {
		$canvas = $this.game.canvas;
		$ctx = $this.game.ctx
		$ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
		foreach ($cloud in $layer.items) {
			$ctx.beginPath()
			$ctx.ellipse($cloud.x, $cloud.y, $cloud.size, $cloud.size * 0.6, 0, 0, [Math]::PI * 2)
			$ctx.fill()
			$cloud.x += $cloud.speed
			if (($cloud.x - $cloud.size) -gt $canvas.ClientSize.Width) { $cloud.x = -$cloud.size }
		}
	}
}

class CameraSystem {
	[object]$game
	[double]$y
	[double]$smoothFactor

	CameraSystem([object]$game) {
		$this.game = $game
		$this.y = $game.canvas.ClientSize.Height/10
		$this.smoothFactor = 100
  	}

	[void] update($delta) {
		$ball = $this.game.ball;
		$canvas = $this.game.canvas;
		$threshold = $canvas.ClientSize.Height / 3;
		if ($ball.y -lt $threshold) {
			$diff = $threshold - $ball.y
			$moveAmount = $diff * $this.smoothFactor * $delta * 60
			$maxMove = $diff;
			if ($moveAmount -gt $maxMove) { $moveAmount = $maxMove }
			$ball.y += $moveAmount
			$this.shiftWorld(-$moveAmount)
		}
	}

	[void] shiftWorld($amount) {
		$this.game.platformManager.shiftY(-$amount);
		$this.game.collectibleManager.shiftY(-$amount);
		$this.game.background.shift($amount * 0.3);

	}
}


class TimeManager {
	[object]$game
	[double]$lastTimestamp
	[double]$delta
	[double]$elapsed
	[bool]$paused

	TimeManager([object]$game) {
		$this.game 		= $game
		$this.lastTimestamp 	= 0
		$this.delta 		= 0
		$this.elapsed 		= 0
		$this.paused 		= $false
	}

	[void] update($timestamp) {
		if ($this.lastTimestamp -eq $null) {
			$this.lastTimestamp = $timestamp
			return
		}
		$this.delta = [Math]::Min(0.05, (($timestamp - $this.lastTimestamp) / 1000))
		$this.lastTimestamp = $timestamp
		if (-not ($this.paused)) { $this.elapsed += $this.delta }
	}

	[double] getDelta() {
		return $this.delta
	}

	[double] getElapsed() {
		return $this.elapsed
	}

	[void] pause() {
		$this.paused = $true
	}

	[void] resume() {
		$this.paused = $false
	}

	[void] reset() {
		$this.lastTimestamp = 0
		$this.delta = 0
		$this.elapsed = 0
	}
}

class ScoreManager {
	[object]$game
	[uint16]$score
	[uint16]$highscore
	[string]$username
	[string]$game_id

	ScoreManager([object]$game) {
		$this.game 	= $game
		$this.score 	= 0
		$this.highscore = 0
		$this.username 	= "guest"
		$this.game_id 	= "bounce_ball_climber"
		$this.loadHighscore()
	}

	[void] add($amount) {
		$this.score += $amount;
	}

	[void] reset() {
		$this.score = 0;
	}

	[void] loadHighscore() {
		$this.highscore = $this.highscore
	}

	[void] submitScore($arg) {
		Write-Host "Submitted!"
	}

	[void] updateHighscoreIfNeeded() {
		if ($this.score -gt $this.highscore) {
			$this.highscore = $this.score
		}
	}

	[void] drawUI() {
		$this.game.ctx.fillStyle = "white"
		$this.game.ctx.font = "20px Arial"
		$this.game.ctx.fillText("Score: $($this.score)", 20, 30)
		$this.game.ctx.fillText("Highscore: $($this.highscore)", 20, 60)
	}
}

class PlatformManager {
	[object]$game
	[List[Platform]]$platforms
	[uint16]$nextPlatformId
	[uint16]$passedPlatforms

	PlatformManager([object]$game) {
		$this.game 		= $game
		$this.platforms 	= [List[Platform]]::new()
		$this.nextPlatformId 	= 1
		$this.passedPlatforms 	= 0
		$this.spawnInitialPlatforms()
	}

	[void] spawnInitialPlatforms() {
		$canvas = $this.game.canvas
		$startX = $canvas.ClientSize.Width / 2 - $script:PLATFORM_WIDTH / 2
		$startY = $canvas.ClientSize.Height - 80;
		$startPlatform = [Platform]::new(
			$this.game,
			$startX,
			$startY,
      			@{
				width 	= $script:PLATFORM_WIDTH
				height 	= $script:PLATFORM_HEIGHT
				id 	= 0
			}
		)
		$this.platforms.Add($startPlatform);
		for ($i = 1; $i -lt $script:MAX_PLATFORMS; $i++) {
			$this.spawnPlatform($startY - $i * $script:PLATFORM_VERTICAL_GAP)
		}
	}

	[void] spawnPlatform($y) {
		$x = $script:rng.NextDouble() * ($this.game.canvas.ClientSize.Width - $script:PLATFORM_WIDTH)

		$platform = [Platform]::new(
			$this.game,
			$x,
			$y,
			@{
				width	= $script:PLATFORM_WIDTH
				height 	= $script:PLATFORM_HEIGHT
				id 	= ($this.nextPlatformId++)
			}
		)

		$this.platforms.Add($platform)
		if ($null -ne $this.game.collectibleManager) {
			$this.game.collectibleManager.spawnForPlatform($platform)
		}
	}

	[void] update($delta) {
		$limit = $this.game.canvas.ClientSize.Height + 10
		for ($i = $this.platforms.Count - 1; $i -ge 0; $i--) {
			$platform = $this.platforms[$i]
			$platform.update($delta)
			if ($platform.y -ge $limit) {
				$this.platforms.RemoveAt($i)
				$this.passedPlatforms++
			}
		}

		while ($this.platforms.Count -lt $script:MAX_PLATFORMS) {
			$highest = ($this.platforms.y | Measure-Object -Minimum).Minimum
			if ($null -eq $highest) { $highest = $this.game.canvas.ClientSize.Height }
			$this.spawnPlatform($highest - $script:PLATFORM_VERTICAL_GAP)
		}
}

	[void] draw() {
		foreach ($platform in $this.platforms) {
			$platform.draw()
		}
	}

	[void] shiftY($amount) {
		foreach ($platform in $this.platforms) {
			$platform.y += $amount
		}
	}
}

class InputManager {
	[object]$game
	[bool]$dragging
	[double]$lastPointerX

	InputManager([object]$game) {
		$this.game 		= $game
		$this.dragging 		= $false
		$this.lastPointerX 	= 0
    		$this.initEvents();
	}
	[void] initEvents() {
		$self = $this
		$canvas = $self.game.canvas
		$canvas.Add_MouseDown({
        param($sender, $e)
        if ($e.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
            if ($e.Y -lt ($canvas.ClientSize.Height / 2)) {
                $self.game.ball.activateBoost()
            } else {
                $self.dragging = $true
                $self.lastPointerX = $e.X
            }
        }
    }.GetNewClosure())

    $canvas.Add_MouseMove({
        param($sender, $e)
        if (-not ($self.dragging)) { return }
        $dx = $e.X - $self.lastPointerX
        $self.game.ball.x += $dx
        $self.lastPointerX = $e.X
    }.GetNewClosure())

    		$canvas.Add_MouseUp({
        		param($sender, $e)
        		$self.dragging = $false
    		}.GetNewClosure())
	}
}

class EnergyManager {
	[object]$game
	[double]$maxEnergy
	[double]$regenRate
	[double]$regenInterval
	[double]$energy
	[double]$lastRegenTime


	EnergyManager([object]$game) {
		$this.game 		= $game
		$this.maxEnergy 	= 100
		$this.regenRate 	= 1
		$this.regenInterval 	= 1000
		$this.energy 		= 100
		$this.lastRegenTime 	= 0
	}

	
	[void] add($amount) {
		$this.energy = [Math]::Min($this.maxEnergy, $this.energy + $amount);
	}

	[void] subtract($amount) {
		$this.energy -= $amount;
	}

	[bool] canUse($amount) {
		return $this.energy -ge $amount;
	}

	[void] set($amount) {
		$this.energy = [Math]::Max(0, [Math]::Min($this.maxEnergy, $amount))
	}

	[bool] useBoost($cost = 30) {
		if (-not (this.canUse($cost))) { return $false }
		$this.subtract($cost)
		return $true
	}

	[void] update($delta) {
		$this.energy += $this.regenRate * $delta
		if ($this.energy -gt $this.maxEnergy) {
			$this.energy = $this.maxEnergy
		}
	}

	[void] drawUI($ctx) {
		$barWidth = 200
		$barHeight = 15
		$x = 20
		$y = 80
		$percent = $this.energy / $this.maxEnergy
		$ctx.fillStyle = "#ff0000"
		$ctx.fillRect($x, $y, $barWidth, $barHeight)
		$ctx.fillStyle = "lime"
		$ctx.fillRect($x, $y, $barWidth * $percent, $barHeight)
		$ctx.fillStyle = "white"
		$ctx.font = "16px Arial"
		$ctx.fillText("Energy: $([Math]::Floor($this.energy))", $x, $y - 8)
	}
}

class CollectibleManager {
	[object]$game
	[List[Collectible]]$collectibles

	CollectibleManager([object]$game) {
		$this.game 		= $game
		$this.collectibles 	= [List[Collectible]]::new()
	}

	[void] spawnForPlatform($platform) {
		if (-not (chance $script:PIE_CHANCE)) { return }
		$pie = [Collectible]::new(
			$this.game,
			($platform.x + $platform.width / 2),
			($platform.y - $script:PIE_RADIUS - 5),
			@{ radius = $script:PIE_RADIUS }
		)
		$this.collectibles.Add($pie)
	}

	[void] update($delta) {
		$ball = $this.game.ball;
		$self = $this
		$limitY = $this.game.canvas.ClientSize.Height + 50
		for ($i = $this.collectibles.Count - 1; $i -ge 0; $i--) {
			$pie = $this.collectibles[$i]
			$pie.update($delta)
			if ($pie.checkCollisionWith($ball) -or ($pie.y -gt $limitY)) {
				$this.collectibles.RemoveAt($i)
			}
		}
	}

	[void] draw() {
		foreach ($pie in $this.collectibles) {
			$pie.draw()
		}
	}

	[void] shiftY($amount) {
		foreach ($pie in $this.collectibles) {
			$pie.y += $amount
		}
	}
}

class UI {
	[object]$game
	[Font]$uiFont

	UI([object]$game) {
		$this.game 	= $game
		$this.uiFont 	= [Font]::new("Arial", 13, [FontStyle]::Bold)
	}

	[void] draw() {
		$this.game.ctx.save()
		$this.drawScore()
		$this.drawHighscore()
		$this.drawEnergylabel()
		$this.drawEnergy()
		$this.drawHeight()
		$this.game.ctx.restore()
	}

	[void] drawScore() {

		$score = $this.game.scoreManager.score
		$this.game.ctx.fillStyle = "#222"
		$this.game.ctx.font = $this.uiFont
		$this.game.ctx.textAlign = "left"
		$this.game.ctx.fillText("Score: $($score)", $this.game.canvas.ClientSize.Width-220, 40)
	}

	[void] drawHighscore() {
		$highscore = $this.game.scoreManager.highscore
		$this.game.ctx.fillStyle = "#222"
		$this.game.ctx.font = $this.uiFont
		$this.game.ctx.textAlign = "left"
		$this.game.ctx.fillText("Highscore: $($highscore)", $this.game.canvas.ClientSize.Width-220, 70)
	}

	[void] drawHeight() {
		$height = if ($this.game.elevation) { ($this.game.elevation / 100).ToString("F2") } else { "0.00" }
		$this.game.ctx.fillStyle = "#222"
		$this.game.ctx.font = $this.uiFont
		$this.game.ctx.textAlign = "left"
		$this.game.ctx.fillText("Elevation: $($height)", $this.game.canvas.ClientSize.Width-220, 100)
	}

	[void] drawEnergylabel() {
		$this.game.ctx.fillStyle = "#222"
		$this.game.ctx.font = $this.uiFont
		$this.game.ctx.textAlign = "left"
		$this.game.ctx.fillText("Energy: $($this.game.energyManager.energy.toString("F2"))", 80, 40)
	}

	[void] drawEnergy() {
		$energy = $this.game.energyManager.energy
		$max = $this.game.energyManager.maxEnergy
		$width = 200
		$height = 16
		$x = 20
		$y = 20
		$ratio = $energy / $max
		$this.game.ctx.fillStyle = "#333"
		$this.game.ctx.fillRect($x, $y+30, $width, $height)
		$this.game.ctx.fillStyle = "#00d26a"
		$this.game.ctx.fillRect($x, $y+30, $width * $ratio, $height)
		$this.game.ctx.strokeStyle = "#000"
		$this.game.ctx.strokeRect($x, $y+30, $width, $height)
	}
}

class Ball {
	[object]$game
	[double]$x
	[double]$y
	[double]$prevY
	[double]$radius
	[double]$vy
	[double]$gravity
	[Platform]$highestPlatform
	[bool]$boostAvailable
	[bool]$boostQueued

	Ball([object]$game) {
		$this.game 				= $game
		$this.x 				= $game.canvas.ClientSize.Width / 2
		$this.y 				= $game.canvas.ClientSize.Height / 1.5
		$this.radius			= $script:BALL_RADIUS
		$this.vy 				= -600
		$this.gravity 			= 1300
		$this.boostAvailable 	= $false
		$this.boostQueued 		= $false
		$this.prevY 			= $this.y
	}

	[void] update([double]$delta) {
		$this.prevY = $this.y;
		$this.vy += $this.gravity * $delta;
		$this.y += $this.vy * $delta;
		$this.handleHorizontalWrap();
		$this.handlePlatformCollisions()
	}

	[void] handlePlatformCollisions() {
		$platforms = $this.game.platformManager.platforms

		foreach ($platform in $platforms) {

			$platformTop = $platform.y

			$ballBottomPrev = $this.prevY + $this.radius
			$ballBottomNow = $this.y + $this.radius

			$withinX = (($this.x + $this.radius -gt $platform.x) -and ($this.x - $this.radius) -lt ($platform.x + $platform.width))

			$landed = (($this.vy -gt 0) -and $withinX -and ($ballBottomPrev -le $platformTop) -and ($ballBottomNow -ge $platformTop))

			if ($platform.isBallLanding($this)) {
				if (-not ($this.highestPlatform)) {
					$this.highestPlatform = $platform
				}
				$this.landOnPlatform($platform)
			}
		}
	}

	[void] landOnPlatform($platform) {
		$this.y = $platform.y - $this.radius
		$bouncePower = 600
		if ($this.boostQueued) {
			$bouncePower *= 1.5
			$this.boostQueued = $false
		}

		$this.vy = -$bouncePower

		$this.boostAvailable = $true;
		if ((-not ($platform.energyGranted)) -and ($platform.id -gt $this.highestPlatform.id)) {
			$this.highestPlatform = $platform
			$this.game.energyManager.add(5)
			$platform.energyGranted = $true
		}
	}

	[void] handleCameraScroll() {
		$canvas = $this.game.canvas

		if ($this.y -lt ($canvas.ClientSize.Height / 3)) {

			$diff = (canvas.ClientSize.Height / 3) - $this.y

			$this.y += diff;
			$this.game.platformManager.shiftY($diff)
			$this.game.collectibleManager.shiftY($diff)
			$this.game.addElevation($diff)
		}
	}

	[void]handleHorizontalWrap() {
		$canvas = $this.game.canvas
		if ($this.x -lt -$this.radius) {
			$this.x = $canvas.ClientSize.Width + $this.radius
		}
		if ($this.x -gt $canvas.ClientSize.Width + $this.radius) {
			$this.x = -$this.radius
		}
	}

	[void] activateBoost() {
		if (-not ($this.boostAvailable)) { return }
		if ($this.game.energyManager.energy -lt 30) { return }
		$this.game.energyManager.subtract(30)
		$this.boostQueued = $true
		$this.boostAvailable = $false
	}

	[void] draw() {
		$ctx = $this.game.ctx;
		$ctx.fillStyle = if ($this.boostAvailable) { "orange" } else { "#cc6600" }
		$ctx.beginPath()
		$ctx.arc($this.x, $this.y, $this.radius, 0, [Math]::PI * 2)
		$ctx.fill()
	}
}


class Platform {
	[object]$game
	[double]$x
	[double]$y
	[double]$width
	[double]$height
	[double]$speed
	[uint16]$id
	[sbyte]$direction
	[string]$type
	[bool]$moving
	[bool]$energyGranted
	[bool]$isDrawn

	Platform([object]$game, [double]$x, [double]$y, [hashtable]$options) {
		$this.game 			= $game
		$this.x 			= $x
		$this.y 			= $y
		$this.width 		= if ($options.ContainsKey("width")) {$options.width} else {$script:PLATFORM_WIDTH}
		$this.height 		= if ($options.ContainsKey("height")) {$options.height} else {$script:PLATFORM_HEIGHT}
		$this.moving 		= if ($options.ContainsKey("moving")) {$options.moving} else {$false}
		$this.speed 		= if ($options.ContainsKey("speed")) {$options.speed} else {0}
		$this.direction 	= 1
		$this.type 			= if ($options.ContainsKey("type")) {$options.type} else {"static"}
		$this.id 			= $options.id
		$this.energyGranted = $false
		$this.isDrawn 		= $false
	}

	[void] update([double]$delta) {
		if ($this.moving) {
			$this.x += $this.speed * $this.direction * ($delta / 16);
			if (($this.x -le 0) -or (($this.x + $this.width) -ge $this.game.canvas.ClientSize.Width)) {
				$this.direction *= -1;
			}
		}
	}

	[bool] isBallLanding($ball) {

		$platformTop = $this.y;
		$ballBottomPrev = $ball.prevY + $ball.radius;
		$ballBottomNow = $ball.y + $ball.radius;

		$withinX = ((($ball.x + $ball.radius) -gt $this.x) -and (($ball.x - $ball.radius) -lt ($this.x + $this.width)))

		return (($ball.vy -gt 0) -and $withinX -and ($ballBottomPrev -le $platformTop) -and ($ballBottomNow -ge $platformTop))
	}

	[void] draw() {
		$ctx = $this.game.ctx;
		$ctx.fillStyle = $this.getColor();
		$ctx.fillRect( $this.x, $this.y, $this.width, $this.height)
	}

	[string]getColor() {
		switch ($this.type) {
			"boost" { return "#ff9900" }
			"breakable" { return "#ff4444" }
		}
		return "#888888"
	}
}

class Collectible {
	[object]$game
	[double]$x
	[double]$y
	[double]$radius
	[double]$rotation
	[byte]$value
	[string]$type
	[bool]$collected

	Collectible([object]$game, [double]$x, [double]$y, [hashtable]$options) {
		$this.game 	= $game
		$this.x 	= $x
		$this.y 	= $y
		$this.radius	= if ($options.ContainsKey("radius")) {$options.radius} else { $script:PIE_RADIUS }
		$this.type 	= if ($options.ContainsKey("type")) {$options.type} else { "score" }
		$this.value 	= if ($options.ContainsKey("value")) {$options.value} else { $script:PIE_SCORE_VALUE }
		$this.collected = $false
		$this.rotation 	= 0
	}

	[void] update([double]$delta) {
		$this.rotation += 0.05 * ($delta / 16)
	}

	[bool] checkCollisionWith([Ball]$ball) {
		$dx = $ball.x - $this.x
		$dy = $ball.y - $this.y

		$distance = [Math]::Sqrt(($dx * $dx) + ($dy * $dy))

		if ($distance -lt ($ball.radius + $this.radius)) {
			$this.collect()
			return $true
    		}

    		return $false
	}

	[void] collect() {

		if ($this.collected) { return }

		$this.collected = $true

		switch ($this.type) {
			"score" { $this.game.addScore($this.value) }
			"energy" { $this.game.addEnergy($this.value) }
			"boost" { $this.game.ball.boostAvailable = $true }
			default { $this.game.addScore($this.value) }
		}
	}

	[void] draw() {
		if ($this.collected) { return }

		$ctx = $this.game.ctx

		$ctx.save()

		$ctx.translate($this.x, $this.y)
		$ctx.rotate($this.rotation)

		$ctx.fillStyle = $this.getColor()

		$ctx.beginPath()
		$ctx.arc(0, 0, $this.radius, 0, [Math]::PI * 2)
		$ctx.fill()

		$ctx.restore()
	}

	[string]getColor() {
		switch ($this.type) {
			"energy" { return "lime" }
			"boost" { return "orange" }
		}
		return "pink"
	}
}

class Game {
	[Form]$form
	[System.Windows.Forms.PictureBox]$canvas
	[Canvas2D]$ctx
	[System.Windows.Forms.Timer]$loopTimer
	[System.Diagnostics.Stopwatch]$stopwatch
	[UI]$UI
	[Background]$background
	[CameraSystem]$camera
	[PlatformManager]$platformManager
	[CollectibleManager]$collectibleManager
	[InputManager]$input
	[EnergyManager]$energyManager
	[TimeManager]$timeManager
	[ScoreManager]$scoreManager
	[Ball]$ball
	[uint16]$score
	[double]$energy
	[double]$elevation
	[double]$lastTime
	[bool]$gameOver
	Game() {
		$this.form 					= New-Object System.Windows.Forms.Form
		$this.form.Text 			= "Bounce Ball Climber"
		$this.form.ClientSize 		= New-Object System.Drawing.Size(480, 640)
		$this.form.FormBorderStyle 	= 'FixedSingle'
		$this.form.MaximizeBox 		= $false
		$this.canvas 				= New-Object System.Windows.Forms.PictureBox
		$this.canvas.Dock 			= 'Fill'
		$this.form.Controls.Add($this.canvas)
		$this.ctx 					= [Canvas2D]::new()
		$this.background 			= [Background]::new($this)
		$this.camera 				= [CameraSystem]::new($this)
		$this.platformManager 		= [PlatformManager]::new($this)
		$this.collectibleManager 	= [CollectibleManager]::new($this)
		$this.input 				= [InputManager]::new($this)
		$this.energyManager 		= [EnergyManager]::new($this)
		$this.timeManager 			= [TimeManager]::new($this)
		$this.scoreManager 			= [ScoreManager]::new($this)
		$this.score 				= $this.scoreManager.score
		$this.energy 				= $this.energyManager.energy.toString("F2")
		$this.elevation 			= 1
		$this.UI 					= [UI]::new($this)
		$this.ball 					= [Ball]::new($this)

		$this.lastTime 	= $this.timeManager.lastTimestamp
		$this.gameOver 	= $false
		$self 		= $this

    # Wire up Paint ONCE
    $this.canvas.Add_Paint({
        param($sender, $e)
        $e.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $self.ctx.g = $e.Graphics
        $self.draw()
    }.GetNewClosure())

    # Start the 60 FPS Timer ONCE
    $this.stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $this.loopTimer = [System.Windows.Forms.Timer]::new()
    $this.loopTimer.Interval = 16
    $this.loopTimer.Add_Tick({
        $self.loop($self.stopwatch.Elapsed.TotalMilliseconds)
        $self.canvas.Invalidate() # Triggers Add_Paint on the UI thread
    }.GetNewClosure())
    $this.loopTimer.Start()
}

# 2. Runs every ~16ms when $loopTimer ticks
[void] loop($timestamp) {
    $this.timeManager.update($timestamp)
    $delta = $this.timeManager.getDelta()

    if (-not ($this.gameOver)) {
        $this.update($delta)
    }
    # Do NOT call $this.draw() or requestAnimationFrame() here!
    # $this.canvas.Invalidate() in the Timer tick handles drawing via Add_Paint.
}

	[void] update($delta) {
		$this.platformManager.update($delta)
		$this.collectibleManager.update($delta)
		$this.ball.update($delta)
		$this.camera.update($delta)
		$this.energyManager.update($delta)
		$this.addElevation(
			($this.canvas.ClientSize.Height-$this.ball.y) +
			($this.platformManager.passedPlatforms*$script:PLATFORM_VERTICAL_GAP))
		$this.checkGameOver()
	}

	[void] draw() {
		$this.ctx.clearRect(0, 0, $this.canvas.ClientSize.Width, $this.canvas.ClientSize.Height)
		$this.background.draw()
		$this.platformManager.draw()
		$this.collectibleManager.draw()
		$this.ball.draw()
		$this.UI.draw()
	}

	[void] drawUI() {
    		$this.ctx.fillStyle = "white"
    		$this.ctx.font = "20px Arial"
    		$this.ctx.fillText("Score: $(this.score)", 20, 30)
    		$this.ctx.fillText("Elevation: $([Math]::Floor($this.elevation / 10)) m", 20, 60)
		$this.ctx.fillStyle = "orange"
		$this.ctx.fillRect(20, 80, $this.energyManager.energy * 2, 15)
	}


	[void] addScore($amount) {
		$this.scoreManager.add($amount)
	}

	[void] addEnergy($amount) {
		$this.energyManager.add($amount)
	}

	[void] subtractEnergy($amount) {
		$this.energyManager.subtract($amount)
	}

	[void] addElevation($amount) {
		$this.elevation = $amount
	}

	[void] checkGameOver() {
		if ($this.gameOver) { return }
		$lowestPlatform = ($this.platformManager.platforms.y | Measure-Object -Maximum).Maximum
		if ($this.ball.y - $this.ball.radius -gt $lowestPlatform + 200) {
			$this.gameOver = $true
			$this.handleGameOver()
		}
	}
	[void] handleGameOver() {
		Write-Warning "Game Over"
		$this.scoreManager.submitScore({
			elevation: $this.elevation
		});
	}
}
