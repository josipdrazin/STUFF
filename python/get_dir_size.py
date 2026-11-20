
from os.path import basename, normpath, abspath, isfile, join, getsize
from sys import argv
from glob import iglob
from tkinter.messagebox import showinfo

def get_readable_size(path):
    # Ensure we use an absolute path for globbing
    search_path = join(path, '**', '*')
    
    # Calculate total size of files safely
    total_bytes = 0
    for f in iglob(search_path, recursive=True):
        try:
            if isfile(f):
                total_bytes += getsize(f)
        except (PermissionError, FileNotFoundError):
            continue  # Skip locked system files or broken symlinks

    # Format the bytes into a human-readable string
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if total_bytes < 1024:
            return f"{total_bytes:.2f} {unit}"
        total_bytes /= 1024
    return f"{total_bytes:.2f} PB"

if __name__ == "__main__":
    print(f"Please wait! Calculating size of {abspath(argv[1])}")
    # Get the folder path passed by the Windows context menu
    if len(argv) > 1:
        target_dir = argv[1]

        # Calculate and display the result
        folder_name = basename(normpath(target_dir))
        size_str = get_readable_size(target_dir)
        
        showinfo("Folder Size Calculator", f"Folder: {folder_name}\nTotal Size: {size_str}")
