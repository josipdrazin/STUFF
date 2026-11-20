function get_dir_size($path, $showmessagebox) {
	if ($showmessagebox -eq "y") {Add-Type -AssemblyName PresentationFramework;}
	$search_path=if (Test-Path $path) {$(gi $path).FullName;} else {return};
	$total_bytes=0;
	foreach ($item in GCI $search_path -Recurse){
		if ($(gi $item.FullName) -is [System.IO.FileInfo]){
			$total_bytes+=$item.Length;
		}
	}
	foreach ($unit in @('B', 'KB', 'MB', 'GB', 'TB')) {
		if ($total_bytes -lt 1024){
			$title="Folder Size Calculator";
			$msg="$($total_bytes.ToString('F2')) $($unit)"
			if ($showmessagebox -eq "y"){
				[System.Windows.MessageBox]::Show($msg, $title);
				return $msg;
			}
			else {
				return $msg;
			}
		}
		$total_bytes/=1024;
	}
	$title="Folder Size Calculator";
	$msg="$($total_bytes.ToString('F2')) PB"
	if ($showmessagebox -eq "y"){
		[System.Windows.MessageBox]::Show($msg, $title);
		return $msg;
	}
	else {
		return $msg;
	}
}
