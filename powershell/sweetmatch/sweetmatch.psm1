using namespace System.Collections.Generic
using namespace System.Windows.Forms
using namespace System.Drawing

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore

function Get-WebpAsDrawingImage {
	param([string]$Path)

	if (-not (Test-Path $Path)) { return $null }

	try {
		$uri     = [Uri]::new($Path)
		$decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
			$uri,
			[System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
			[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
		)
		$encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
		$encoder.Frames.Add($decoder.Frames[0])

		$memStream = [System.IO.MemoryStream]::new()
		$encoder.Save($memStream)
		$memStream.Position = 0

		return [System.Drawing.Image]::FromStream($memStream)
	} catch {
		return $null
	}
}


# =========================
# CONSTANTS & HELPERS
# =========================
$script:WIDTH  = 8
$script:SWEETS = @("🥧", "🎂", "🧁", "🍰", "🥮", "🍩")

function Get-RandomFromArray {
param([IList[string]]$Arr)
return $Arr[(Get-Random -Minimum 0 -Maximum $Arr.Count)]
}

# =========================
# UI COMPONENTS (ScoreUI, LevelUI, BellyBar, UI)
# =========================
class ScoreUI {
	[Label]$label

	ScoreUI([Control]$parent) {
		$this.label = [Label]@{
			Text      = "Score: 0"
			Location  = [Point]::new(15, 10)
			AutoSize  = $true
			Font      = [Font]::new("Arial", 13, [FontStyle]::Bold)
			BackColor = [Color]::Transparent
		}
		$parent.Controls.Add($this.label)
	}

	[void] update([int]$score) {
		$this.label.Text = "Score: $score"
	}
}

class LevelUI {
	[Label]$label
	LevelUI([Control]$parent) {
		$this.label = [Label]@{
			Text      = "Level: 1"
			Location  = [Point]::new(165, 10)
			AutoSize  = $true
			Font      = [Font]::new("Arial", 13, [FontStyle]::Bold)
			BackColor = [Color]::Transparent
		}
		$parent.Controls.Add($this.label)
	}

	[void] update([int]$level) {
		$this.label.Text = "Level: $level"
	}
}

class BellyBar {
	[ProgressBar]$bar

	BellyBar([Control]$parent) {
		$this.bar = [ProgressBar]@{
			Location = [Point]::new(15, 42)
			Size     = [Size]::new(420, 18)
			Minimum  = 0
			Maximum  = 100
			Value    = 0
		}
		$parent.Controls.Add($this.bar)
	}

	[void] update([double]$percent) {
		$clamped = [Math]::Max(0, [Math]::Min(100, [int]$percent))
		$this.bar.Value = $clamped
	}
}

class UI {
	[object]$game
	[ScoreUI]$scoreUI
	[LevelUI]$levelUI
	[BellyBar]$bellyBar

	UI([object]$game, [Control]$parent) {
		$this.game     = $game
		$this.scoreUI  = [ScoreUI]::new($parent)
		$this.levelUI  = [LevelUI]::new($parent)
		$this.bellyBar = [BellyBar]::new($parent)
	}

	[void] drawUI() {}
}

# =========================
# SYSTEMS (Match, Gravity, Score, Level, Difficulty)
# =========================
class MatchSystem {
	[object]$game

	MatchSystem([object]$game) {
		$this.game = $game
	}

	[HashSet[int]] findMatches() {
		$board   = $this.game.board
		$w       = $board.width
		$matched = [HashSet[int]]::new()

		for ($i = 0; $i -lt ($w * $w); $i++) {
			$sweet = $board.getTile($i).sweet
			if ([string]::IsNullOrEmpty($sweet)) { continue }

			# Horizontal check
			if (($i % $w) -le ($w - 3) -and
				$sweet -eq $board.getTile($i + 1).sweet -and
				$sweet -eq $board.getTile($i + 2).sweet) {
				[void]$matched.Add($i)
				[void]$matched.Add($i + 1)
				[void]$matched.Add($i + 2)
			}

			# Vertical check
			if ($i -lt ($w * ($w - 2)) -and
				$sweet -eq $board.getTile($i + $w).sweet -and
				$sweet -eq $board.getTile($i + ($w * 2)).sweet) {
				[void]$matched.Add($i)
				[void]$matched.Add($i + $w)
				[void]$matched.Add($i + ($w * 2))
			}
		}
		return $matched
	}
}

class GravitySystem {
	[object]$game

	GravitySystem([object]$game) {
	$this.game = $game
	}

	[void] applyGravity() {
		$board = $this.game.board
		$w     = $board.width

		for ($col = 0; $col -lt $w; $col++) {
			$remaining = [List[string]]::new()

			for ($row = 0; $row -lt $w; $row++) {
				$sweet = $board.getTile($row * $w + $col).sweet
				if ($sweet -ne "") {
					$remaining.Add($sweet)
				}
			}

			for ($row = $w - 1; $row -ge 0; $row--) {
				$tile = $board.getTile($row * $w + $col)
				if ($remaining.Count -gt 0) {
					$lastIdx = $remaining.Count - 1
					$val = $remaining[$lastIdx]
					$remaining.RemoveAt($lastIdx)
					$tile.setSweet($val)
				} else {
					$tile.setSweet((Get-RandomFromArray -Arr $board.sweets))
				}
			}
		}
	}
}

class ScoreSystem {
	[object]$game
	[int]$score = 0

	ScoreSystem([object]$game) {
		$this.game = $game
	}

	[void] add([int]$points) {
		$this.score += $points
		$this.game.ui.scoreUI.update($this.score)
	}
}

class DifficultySystem {
	[object]$game
	[int]$tier = 1

	DifficultySystem([object]$game) {
		$this.game = $game
	}

	[void] increaseDifficulty() {
		$this.tier++
		Write-Host "Difficulty increased!"
		if ($this.game.board -and -not $this.game.board.sweets.Contains("🔥")) {
			$this.game.board.sweets.Add("🔥")
		}
	}
}

class LevelSystem {
	[object]$game
	[int]$level = 1
	[int]$tilesToWin = 20
	[int]$maxTilesForLevel = 20

	LevelSystem([object]$game) {
		$this.game = $game
	}

	[void] addProgress([int]$amount) {
		$this.tilesToWin -= $amount
		$pct = (($this.maxTilesForLevel - [Math]::Max(0, $this.tilesToWin)) / $this.maxTilesForLevel) * 100
		$this.game.ui.bellyBar.update($pct)

		if ($this.tilesToWin -le 0) {
			$this.levelUp()
		}
	}

	[void] levelUp() {
		[MessageBox]::Show("Level Up!", "Sweet Match") | Out-Null
		$this.level++
		$this.tilesToWin = 20 + ($this.level * 5)
		$this.maxTilesForLevel = $this.tilesToWin
		$this.game.ui.levelUI.update($this.level)
		$this.game.ui.bellyBar.update(0)
	}
}

# =========================
# ENTITIES (Tile, Board) — Styled to match style.css
# =========================
class Tile {
	[int]$id
	[string]$sweet
	[object]$board
	[Button]$tileElement

	Tile([int]$id, [string]$sweet, [object]$board, [int]$size, [int]$gap) {
		$this.id    = $id
		$this.sweet = $sweet
		$this.board = $board

		$row = [Math]::Floor($id / $board.width)
		$col = $id % $board.width

		$btn = [Button]@{
			Text      = $sweet
			Size      = [Size]::new($size, $size)
			Location  = [Point]::new($gap + ($col * ($size + $gap)), $gap + ($row * ($size + $gap)))
			Font      = [Font]::new("Segoe UI Emoji", 18)
			BackColor = [ColorTranslator]::FromHtml("#fff8dc") # .tile background
			FlatStyle = [FlatStyle]::Flat
			Tag       = $this
		}
		$btn.FlatAppearance.BorderSize  = 0
		$btn.FlatAppearance.BorderColor = [ColorTranslator]::FromHtml("#ff006e") # .selected outline

		$btn.Add_Click({
			param($sender, $e)
			$tileObj = $sender.Tag
			$tileObj.board.handleTileClick($tileObj)
		})

		$this.tileElement = $btn
	}

	[void] setSelected([bool]$selected) {
		$this.tileElement.FlatAppearance.BorderSize = if ($selected) { 3 } else { 0 }
	}

	[void] setSweet([string]$sweet) {
		$this.sweet = $sweet
		$this.tileElement.Text = $sweet
	}
}

class Board {
	[object]$game
	[int]$width
	[List[string]]$sweets
	[List[Tile]]$tiles
	[Tile]$selectedTile = $null
	[bool]$isProcessing = $false
	[Panel]$boardElement

	Board([object]$game, [Control]$parentForm) {
		$this.game   = $game
		$this.width  = $script:WIDTH
		$this.sweets = [List[string]]::new([string[]]$script:SWEETS)
		$this.tiles  = [List[Tile]]::new()

		$tileSize = 48
		$gap      = 4
		$boardPx  = ($this.width * ($tileSize + $gap)) + $gap

		$this.boardElement = [Panel]@{
			Size      = [Size]::new($boardPx, $boardPx)
			Location  = [Point]::new(15, 75)
			BackColor = [ColorTranslator]::FromHtml("#d48c45") # #board background
		}
		$parentForm.Controls.Add($this.boardElement)
	}

	[void] createBoard() {
		$this.boardElement.Controls.Clear()
		$this.tiles.Clear()

		for ($i = 0; $i -lt ($this.width * $this.width); $i++) {
			$tile = [Tile]::new($i, (Get-RandomFromArray -Arr $this.sweets), $this, 48, 4)
			$this.tiles.Add($tile)
			$this.boardElement.Controls.Add($tile.tileElement)
		}

		while ($this.game.matchSystem.findMatches().Count -gt 0) {
			foreach ($idx in $this.game.matchSystem.findMatches()) {
				$this.tiles[$idx].setSweet((Get-RandomFromArray -Arr $this.sweets))
			}
		}
	}

	[Tile] getTile([int]$index) {
		return $this.tiles[$index]
	}

	[void] handleTileClick([Tile]$tile) {
		if ($this.isProcessing) { return }

		if ($null -eq $this.selectedTile) {
			$this.selectedTile = $tile
			$tile.setSelected($true)
			return
		}

		$first = $this.selectedTile
		$first.setSelected($false)
		$this.selectedTile = $null

		if ($first -eq $tile) { return }

		$r1 = [Math]::Floor($first.id / $this.width)
		$c1 = $first.id % $this.width
		$r2 = [Math]::Floor($tile.id / $this.width)
		$c2 = $tile.id % $this.width

		if (([Math]::Abs($r1 - $r2) + [Math]::Abs($c1 - $c2)) -ne 1) { return }

		$this.isProcessing = $true
		$this.swapSweets($first, $tile)
		[Application]::DoEvents()

		if ($this.game.matchSystem.findMatches().Count -gt 0) {
			$this.resolveBoard()
		} else {
			Start-Sleep -Milliseconds 250
			$this.swapSweets($first, $tile)
			[Application]::DoEvents()
		}
		$this.isProcessing = $false
	}
	[void] swapSweets([Tile]$t1, [Tile]$t2) {
		$temp = $t1.sweet
		$t1.setSweet($t2.sweet)
		$t2.setSweet($temp)
	}
	[void] resolveBoard() {
		$matches = $this.game.matchSystem.findMatches()
		if ($matches.Count -eq 0) { return }
		foreach ($idx in $matches) {
			$this.tiles[$idx].setSweet("")
		}
		$this.game.scoreSystem.add($matches.Count * 10)
		$this.game.levelSystem.addProgress($matches.Count)
		[Application]::DoEvents()
		Start-Sleep -Milliseconds 250
		$this.game.gravitySystem.applyGravity()
		[Application]::DoEvents()
		Start-Sleep -Milliseconds 250
		$this.resolveBoard()
	}
}

#=========================


#START SCREEN (#start-screen, #play-btn)


#=========================

class StartScreen {
	[Panel]$screenPanel
	[Button]$playBtn
	[object]$game
	StartScreen([object]$game, [Control]$parentForm) {
		$this.game = $game
		$this.screenPanel = [Panel]@{
			Size      = $parentForm.ClientSize
			Location  = [Point]::new(0, 0)
			BackColor = [ColorTranslator]::FromHtml("#111111")
		}
		$bgImage = Get-WebpAsDrawingImage -Path (Join-Path $PSScriptRoot "start-bg.webp")
		if ($null -ne $bgImage) {
			$this.screenPanel.BackgroundImage       = $bgImage
			$this.screenPanel.BackgroundImageLayout = [ImageLayout]::Stretch
		}

		$btnWidth  = [int]($parentForm.ClientSize.Width * 0.75)
		$btnHeight = 95
		$btnX      = [int](($parentForm.ClientSize.Width - $btnWidth) / 2)
		$btnY      = [int]($parentForm.ClientSize.Height * 0.65)
		$this.playBtn = [Button]@{
			Text      = "PLAY"
			Size      = [Size]::new($btnWidth, $btnHeight)
			Location  = [Point]::new($btnX, $btnY)
			Font      = [Font]::new("Arial", 36, [FontStyle]::Bold)
			ForeColor = [Color]::Beige
			BackColor = [ColorTranslator]::FromHtml("#ff7a00")
			FlatStyle = [FlatStyle]::Flat
			Cursor    = [Cursors]::Hand
			Tag       = $this
		}
		$this.playBtn.FlatAppearance.BorderSize = 0
		$this.playBtn.Add_Paint({
			param($sender, $e)
			$g    = $e.Graphics
			$rect = $sender.ClientRectangle
			$shadowBrush = [SolidBrush]::new([ColorTranslator]::FromHtml("#c75a00"))
			$g.FillRectangle($shadowBrush, 0, 6, $rect.Width, $rect.Height - 6)
			$faceRect  = [Rectangle]::new(0, 0, $rect.Width, $rect.Height - 6)
			$gradBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
				$faceRect,
				[ColorTranslator]::FromHtml("#ffb347"),
				[ColorTranslator]::FromHtml("#ff7a00"),
				[System.Drawing.Drawing2D.LinearGradientMode]::Vertical
			)
			$g.FillRectangle($gradBrush, $faceRect)
			$sf = [StringFormat]@{
				Alignment     = [StringAlignment]::Center
				LineAlignment = [StringAlignment]::Center
			}
			$shadowTextRect = [RectangleF]::new(2, 2, $faceRect.Width, $faceRect.Height)
			$mainTextRect   = [RectangleF]::new(0, 0, $faceRect.Width, $faceRect.Height)
			$g.DrawString($sender.Text, $sender.Font, [Brushes]::Black, $shadowTextRect, $sf)
			$g.DrawString($sender.Text, $sender.Font, [Brushes]::Beige, $mainTextRect, $sf)
		})
		$this.playBtn.Add_Click({
		param($sender, $e)
		$screen = $sender.Tag
		$screen.hide()
		$screen.game.board.createBoard()
		})
		$this.screenPanel.Controls.Add($this.playBtn)
		$parentForm.Controls.Add($this.screenPanel)
		$this.screenPanel.BringToFront()
	}
	[void] hide() {
		$this.screenPanel.Visible = $false
	}
}

#=========================


#GAME ORCHESTRATOR


#=========================

class Game {
	[Form]$form
	[StartScreen]$startScreen
	[UI]$ui
	[ScoreSystem]$scoreSystem
	[MatchSystem]$matchSystem
	[GravitySystem]$gravitySystem
	[DifficultySystem]$difficultySystem
	[LevelSystem]$levelSystem
	[Board]$board
	Game() {
		$this.form = [Form]@{
		Text            = "Sweet Match"
		ClientSize      = [Size]::new(450, 515)
		StartPosition   = [FormStartPosition]::CenterScreen
		FormBorderStyle = [FormBorderStyle]::FixedSingle
		MaximizeBox     = $false
		BackColor       = [ColorTranslator]::FromHtml("#ffe5ec")
		}
		$this.ui               = [UI]::new($this, $this.form)
		$this.scoreSystem      = [ScoreSystem]::new($this)
		$this.matchSystem      = [MatchSystem]::new($this)
		$this.gravitySystem    = [GravitySystem]::new($this)
		$this.difficultySystem = [DifficultySystem]::new($this)
		$this.levelSystem      = [LevelSystem]::new($this)
		$this.board            = [Board]::new($this, $this.form)
		$this.startScreen      = [StartScreen]::new($this, $this.form)
	}
	[void] start() {
		[Application]::Run($this.form)
	}
}