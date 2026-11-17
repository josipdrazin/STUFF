$dict=@{}
$report=@{}
function get_next_num($key, $mod){
	if (-not($dict.ContainsKey($key))) {
		$a=1..$mod;$e=$a.GetEnumerator();
		$dict.Add($key, $e);
	}
	$dict[$key].MoveNext() | Out-Null;
	return $dict[$key].Current
}

function confimation_prompt($title, $msg, $callback){
	Add-Type -AssemblyName PresentationFramework
	# 3. Launch the native Windows Yes/No Choice Window box
	$choice = [System.Windows.MessageBox]::Show($msg, $title, [System.Windows.MessageBoxButton]::YesNo, [System.Windows.MessageBoxImage]::Warning)
	# 4. Process the user's choice click event
	if ($choice -eq "Yes"){
		$callback
	}
	else {
		Write-Host "Operation cancelled by user." -ForegroundColor Yellow
		return
	}
}

function move_safe($f, $npath, $ext, $entry){
	$f=gi $f
	$npath=gi $npath
	if (Test-Path $(Join-Path -Path $npath -ChildPath $f.Name)) {
		$num=get_next_num $(Join-Path -Path $npath -ChildPath $f.Name) 256
		$nfn= $( Join-Path -Path $npath -ChildPath $("$($f.BaseName)($($num))$($f.Extension)") )
		$report[$entry]["Extension"] = $report[$entry]["Extension"]
		$report[$entry]["Original name"] = $report[$entry]["Original name"]
		$report[$entry]["Original location"] = $report[$entry]["Original location"]
		$report[$entry]["Original absolute path"] = $report[$entry]["Original absolute path"]
		$report[$entry]["New name"] = $(Split-Path $nfn -Leaf)
		$report[$entry]["New location"] = $(Split-Path $nfn -Parent)
		$report[$entry]["New absolute path"] = $($nfn)
		Move-Item -Path $f.FullName -Destination $nfn

	} else {
		if ($f.Extension -eq $ext -or $ext -eq ".*") {
			$report[$entry]["Extension"] = $report[$entry]["Extension"]
			$report[$entry]["Original name"] = $report[$entry]["Original name"]
			$report[$entry]["Original location"] = $report[$entry]["Original location"]
			$report[$entry]["Original absolute path"] = $report[$entry]["Original absolute path"]
			$report[$entry]["New name"] = $report[$entry]["New name"]
			$report[$entry]["New location"] = $report[$entry]["New location"]
			$report[$entry]["New absolute path"] = Join-Path -Path $npath.FullName -ChildPath $f.Name
			Move-Item -Path $f.FullName -Destination $npath.FullName
		}
	}
}

function Export-Report($reportDictionary, $exportPath) {
    # 1. Initialize an empty array list to hold our text lines in memory
    $lines = [System.Collections.ArrayList]::new()
	
    # 2. Loop through the master keys (the file entry IDs)
    foreach ($k in $reportDictionary.Keys) {
        [void]$lines.Add( ("-" * 128) )
        
        # 3. Loop through the sub-properties of that specific file entry
        foreach ($l in $reportDictionary[$k].Keys) {
            $value = $reportDictionary[$k][$l]
            
            # Math translation: {0,-32} left-aligns the property name to 32 spaces
            $formattedLine = "{0,-32}:   {1}" -f $l, $value
            [void]$lines.Add($formattedLine)
        }
    }
    [void]$lines.Add( ("-" * 128) )

    # 4. Write all lines to the file at once (handles opening, writing, and closing safely)
    $lines | Out-File -FilePath $exportPath -Encoding utf8
}

function substr($str, $s, $e) {
	# 1. Type validation guard
	if ($null -eq $str) { return "" }
	if (-not ($str -is [string])) {
		return "Must be a string not a $($str.GetType())"
	}

    	# 2. Early exit for empty strings
	if ($str -eq "") { return "" }

	# 3. Ground negative inputs cleanly to 0
	$s = if ($s -le -1) { 0 } else { $s }
	$e = if ($e -le -1) { 0 } else { $e }

	# 4. If the starting index is completely past the string length, return empty
	if ($s -ge $str.Length) { return "" }

	# 5. Calculate the true requested length based on an END position strategy
	# If the end bound ($e) is past the text length, cap it at the string's length
	$cappedEnd = if ($e -gt $str.Length) { $str.Length } else { $e }

	# Calculate target length: end position minus start position
	$targetLength = $cappedEnd - $s

	# 6. Safety check: If the length calculation dips below 0, return empty
	if ($targetLength -le 0) { return "" }

	# Execute the native substring method safely
	return $str.SubString($s, $targetLength)
}

function organize_dir($path, $ext=".*"){
	$directory= if (Test-Path $path) {gi $path} else { return }
	$suffix=if ($ext.StartsWith(".")) {$ext} else {".$ext"}
	$newdirs=[System.Collections.ArrayList]::new()
	foreach ($f in $(gci -Path $directory.FullName -Recurse)) {
		$suffix=if ($ext -eq ".*") {$f.Extension} else {$suffix}
		if ($f -is [System.IO.FileInfo] -and ($f.Extension -eq $suffix)) {
			$subdirectory=$(Join-Path -Path $directory.FullName -ChildPath $(substr $suffix 1 $suffix.Length))
			[void]$newdirs.Add($subdirectory)
			$n=$(get_next_num "organize_dir_tree_report_map" 65535)
			$report[$n] = [ordered]@{
				"Extension" = $f.Extension;
				"Original name" = $f.Name;
				"Original location" = $f.Directory;
				"Original absolute path" = $f.FullName;
				"New name" = $f.Name;
				"New location" = $subdirectory;
				"New absolute path" = $subdirectory;
			}
		}
	}
	$uniqDirs= $newdirs | Select-Object -Unique
	foreach ($dir in $uniqDirs) {if (-not (Test-Path $dir)) {New-Item -ItemType Directory -Path $dir | Out-Null}}
    	# Execute the physical file movements
	foreach ($k in $report.Keys) {
		$oldpath = Join-Path -Path $report[$k]["Original location"] -ChildPath $report[$k]["Original name"]
		$newpath = $report[$k]["New location"]
		move_safe $oldpath $newpath $ext $k
	}

	# Formats and drops the map into the file
	Export-Report $report $(Join-Path -Path $directory -ChildPath "organize_dir_tree - report.txt")
	$dict.Clear()
	$report.Clear()
}

function organize_dir_tree($path, $ext=".*"){
	$directory= if (Test-Path $path) {gi $path} else { return }
	$suffix=if ($ext.StartsWith(".")) {$ext} else {".$ext"}
	$newdirs=[System.Collections.ArrayList]::new()
	foreach ($f in $(gci -Path $directory.FullName -Recurse)) {
		$suffix=if ($ext -eq ".*") {$f.Extension} else {$suffix}
		if ($f -is [System.IO.FileInfo]) {
			$subdirectory=$(Join-Path -Path $directory.FullName -ChildPath $(substr $suffix 1 $suffix.Length))
			[void]$newdirs.Add($subdirectory)
			$n=$(get_next_num "organize_dir_tree_report_map" 65535)
			$report[$n] = [ordered]@{
				"Extension" = $f.Extension;
				"Original name" = $f.Name;
				"Original location" = $f.Directory;
				"Original absolute path" = $f.FullName;
				"New name" = $f.Name;
				"New location" = $subdirectory;
				"New absolute path" = $subdirectory;
			}
		}
	}
	$uniqDirs= $newdirs | Select-Object -Unique
	foreach ($dir in $uniqDirs) {if (-not (Test-Path $dir)) {New-Item -ItemType Directory -Path $dir | Out-Null}}
    	# Execute the physical file movements
	foreach ($k in $report.Keys) {
		$oldpath = Join-Path -Path $report[$k]["Original location"] -ChildPath $report[$k]["Original name"]
		$newpath = $report[$k]["New location"]
		move_safe $oldpath $newpath $ext $k
	}

	# Formats and drops the map into the file
	Export-Report $report $(Join-Path -Path $directory -ChildPath "organize_dir_tree - report.txt")
	$dict.Clear()
	$report.Clear()
}

function undo_organize($logFilePath) {
    <#
    .SYNOPSIS
        Parses a custom text migration log card file and restores all moved files
        back to their original absolute directory pathways.
    #>
    if ($null -eq $logFilePath -or (-not (Test-Path $logFilePath))) {
        Write-Error "CRITICAL: Specified migration log file path does not exist!"
        return
    }
	
	$title = "Confirm System Rollback"
	$msg   = "Are you sure you want to restore all files back to their original locations?"

	confimation_prompt -title $title -msg $msg -callback $(Write-Host "")

    # Initialize path tracking buckets
    $currentActivePath = $null
    $originalTargetPath = $null
    $rollbackCount = 0

    # Read the log file line-by-line to process large logs without memory exhaustion
    foreach ($line in [System.IO.File]::ReadLines($logFilePath)) {
        $cleanLine = $line.Trim()

        # 1. Capture the target destination path mapping rule
        if ($cleanLine -match '^Original absolute path\s*:\s*(.*)$') {
            $originalTargetPath = $Matches[1].Trim()
        }

        # 2. Capture the current active file location path rule
        if ($cleanLine -match '^New absolute path\s*:\s*(.*)$') {
            $currentActivePath = $Matches[1].Trim()
        }

        # 3. Once both endpoints are successfully matched, execute the reverse migration
        if ($null -ne $currentActivePath -and $null -ne $originalTargetPath) {
            
            if (Test-Path $currentActivePath) {
                # Ensure the original parent directory exists before moving the file back
                $originalParentDir = Split-Path $originalTargetPath -Parent
                if (-not (Test-Path $originalParentDir)) {
                    New-Item -ItemType Directory -Path $originalParentDir | Out-Null
                }

                # Move the file back to its exact original historical location
                Move-Item -Path $currentActivePath -Destination $originalTargetPath -Force
                $rollbackCount++
            } else {
                Write-Warning "Skipping entry: File not found at active location ($currentActivePath)"
            }

            # Flush the coordinate pointers to safely prepare for the next text line block loop
            $currentActivePath = $null
            $originalTargetPath = $null
        }
    }

    Write-Host "SUCCESS: Rollback engine finished processing. Restored $rollbackCount files back to their original paths!" -ForegroundColor Green
	
	$title = "Delete logfile?"
	$msg   = "Do you want to delete the logfile?"
	confimation_prompt -title $title -msg $msg -callback $(Remove-Item -Path $logFilePath)
}
