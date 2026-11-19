import pathlib, shutil, re
from tkinter import messagebox
report_dict={}
sequence_tracker={}
def get_next_number(key, mod):
    if key not in sequence_tracker:
        sequence_tracker[key] = 1
    if sequence_tracker[key]<mod:
        sequence_tracker[key]+=1
    else:
        sequence_tracker[key]=1
    return sequence_tracker[key]

def move_safe(f, npath, ext, entry):
    """
    Just a helper method to avoid overwriting stuff and to avoid unnecessary nesting.
    Watch out for suffix-less files ;)
    """
    f=pathlib.Path(f)
    npath=pathlib.Path(npath)
    if pathlib.Path(npath/f.name).exists():
        num=get_next_number(str(npath.joinpath(f.name)), 255)
        nfn=pathlib.Path("{}({}){}".format(str(npath.joinpath(f.stem)), num, str(f.suffix)))
        while pathlib.Path(nfn).exists():
            num=get_next_number(str(npath.joinpath(f.name)), 255)
            nfn=pathlib.Path("{}({}){}".format(str(npath.joinpath(f.stem)), num, str(f.suffix)))
        report_dict[entry]["New name"]=nfn.name
        report_dict[entry]["New location"]=nfn.parent
        report_dict[entry]["New absolute path"]=nfn.absolute()
        f.rename(nfn)
    else:
        if f.suffix == ext or ext == ".*":
            report_dict[entry]["New name"]=f.name
            report_dict[entry]["New location"]=npath
            report_dict[entry]["New absolute path"]=npath.joinpath(f.name).absolute()
            f.rename(npath.joinpath(f.name))

def export_report(report_dictionary, export_path, export_format="list"):
    if export_format == "list":
        f=open(export_path, "w")
        for k in report_dictionary.keys():
            f.write(f"{'-'*127}\n")
            for l in report_dictionary[k]:
                f.write(f"{l}{' '*(31-len(l))}:   {report_dictionary[k][l]}\n")
        f.write(f"{'-'*127}\n")
        f.close()

def organize_dir(path: str="", ext: str=".*"):
    """
    Fetches all files with the same extension/suffix as directed by argument 'ext'
    inside the immediate directory into subfolder named as their extension/suffix.
    
    Scans the top level of the target path, automatically creates folders named 
    after detected file extensions (or 'no_extension'), and moves matching files safely.
    
    Parameters:
        path (str): Absolute or relative path to the directory to organize.
        ext (str): Specific extension to target (e.g., '.pdf'). Defaults to '.*' for all.
        *params: create-directories-only
    """
    path=pathlib.Path(path) if pathlib.Path(path).exists() else ""
    if (path==""): return
    suffix= "."+ext if not ext.startswith(".") else ext
    title="Proceed?"
    msg=f"This will sort all {'' if (suffix=='.*') else suffix} files in '{str(path.absolute())}' directory to directory specified by their extension.\nAre you sure you want to proceed?"
    if not messagebox.askyesno(title, msg): return 
    dir_list=[]
    for f in path.glob("./*"):
        suffix=str(f.suffix) if ext==".*" else suffix
        if f.is_file() and str(f.suffix) == suffix:
            if not (path.joinpath(suffix[1:])) in dir_list:
                dir_list.append(path.joinpath(suffix[1:]))
            report_dict[get_next_number("organize_dir_report_map", 65535)]={
            "Extension": f.suffix,
            "Original name": f.name,
            "Original location": f.parent,
            "Original absolute path": f.absolute(),
            "New name": f.name, 
            "New location": (path/suffix[1:]),
            "New absolute path": (path/suffix[1:]).absolute()
            }
    for item in dir_list:
        if not item.exists():
            item.mkdir()
    for f in report_dict.keys():
        oldpath=report_dict[f]["Original location"].joinpath(report_dict[f]["Original name"])
        newpath=report_dict[f]["New location"]
        move_safe(oldpath, newpath, ext, f)
    export_report(report_dict, path.joinpath("organize_dir - report.txt"))
    report_dict.clear()
    sequence_tracker.clear()   
    messagebox.showinfo("Success!", "All operations completed successfully!")

def organize_dir_tree(path: str="", ext: str=".*"):
    """
    This one is nasty.
    Recursively traverses a directory tree to consolidate and sort all nested files.
    
    Safely fetches files across all subdirectories and groups them into extension folders 
    at the root path. Includes guard logic to ignore target sorting folders, 
    preventing infinite loops during recursive processing.
    
    Parameters:
        path (str): Root path of the directory tree to traverse.
        ext (str): Specific extension to target. Defaults to '.*' for all
        
    This one will fetch every single file in whole directory tree within the directory
    passed through argument 'path' (Note: if the directory does not exist it won't do anything
    or it will throw NoneType error or some other type of error like 'Cannot split a NoneType!').
    
    It doesn't delete emptied directories.
    
    """
    path=pathlib.Path(path) if pathlib.Path(path).exists() else ""
    if (path==""): return
    suffix="."+ext if not ext.startswith(".") else ext
    title="Proceed?"
    msg=f"This will sort all {'' if (suffix=='.*') else suffix} files inside '{str(path.absolute())}' directory tree to directory specified by their extension.\nAre you sure you want to proceed?"
    if not messagebox.askyesno(title, msg): return 
    dir_list=[]
    dirstoremove=[]
    for f in path.glob("**/*"):
        suffix=str(f.suffix) if ext==".*" else suffix
        if f.is_dir() and not f.absolute() in dirstoremove: dirstoremove.append(f.absolute())
        if f.is_file() and str(f.suffix) == suffix:
            if not (path.joinpath(suffix[1:])) in dir_list and not (path.joinpath(suffix[1:])) == path:
                dir_list.append(path.joinpath(suffix[1:]))
            report_dict[get_next_number("organize_dir_report_map", 65535)]={
            "Extension": f.suffix,
            "Original name": f.name,
            "Original location": f.parent,
            "Original absolute path": f.absolute(),
            "New name": f.name, 
            "New location": (path/suffix[1:]),
            "New absolute path": (path/suffix[1:]).absolute()
            }
    for item in dir_list:
        if not item.exists():
            item.mkdir()
        if item.absolute() in dirstoremove: dirstoremove.remove(item.absolute())
    for f in report_dict.keys():
        oldpath=report_dict[f]["Original location"].joinpath(report_dict[f]["Original name"])
        newpath=report_dict[f]["New location"]
        move_safe(oldpath, newpath, ext, f)
    export_report(report_dict, path.joinpath("organize_dir_tree - report.txt"))
    report_dict.clear()
    sequence_tracker.clear()
    for dup in dirstoremove:
        if dup==path.absolute():
            dirstoremove.remove(dup)
    title="Proceed?"
    msg="All operations completed successfully!\nDo you want to delete emptied directories?"
    if messagebox.askyesno(title, msg):
        for item in dirstoremove:
            if item.exists():
                shutil.rmtree(item)
    else: return
    

def undo_organize(logfilepath):
    if (logfilepath == "") or (not pathlib.Path(logfilepath).exists()): return
    
    title = "Confirm System Rollback"
    msg = "Are you sure you want to restore all files back to their original locations?"
    if not messagebox.askyesno(title, msg): return
    
    currpath=""
    origpath=""
    rollback_count=0
    dirstoremove=[]
    f=open(pathlib.Path(logfilepath), "r")
    for line in f.readlines():
        cleanLine = line.strip()
        match = re.match(r'^Original absolute path\s*:\s*(.*)$', cleanLine)
        if match:
            origpath = match.group(1).strip()
        match = re.match(r'^New absolute path\s*:\s*(.*)$', cleanLine)
        if match:
            currpath = match.group(1).strip()
        if (not origpath == "") and (not currpath == ""):
            if (pathlib.Path(currpath).exists):
                if not (pathlib.Path(origpath).parent.exists()):
                    pathlib.os.makedirs(pathlib.Path(origpath).parent)
                if not (pathlib.Path(currpath).parent in dirstoremove): dirstoremove.append(pathlib.Path(currpath).parent.absolute())
                pathlib.Path(currpath).rename(pathlib.Path(origpath))
                rollback_count+=1
            else:
                print(f"Skipping entry: File not found at active location {currpath}")
            currpath=""
            origpath=""
    print(f"SUCCESS: Rollback engine finished processing. Restored {rollback_count} files back to their original paths!")
    f.close()
    for dup in dirstoremove:
        if dup==pathlib.Path(logfilepath).parent.absolute():
            dirstoremove.remove(dup)

    funcname=re.match(r'\s*(.*) - report.txt$', pathlib.Path(logfilepath).name)
    title = "Delete logfile and emptied directories?"
    msg   = "Do you want to delete the logfile and directories created by {}()?".format(funcname.group(1))
    if messagebox.askyesno(title, msg): 
        pathlib.Path(logfilepath).unlink()
        for item in dirstoremove:
            pathlib.Path(item).rmdir()
    else: return
