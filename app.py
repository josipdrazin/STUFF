from flask import Flask, render_template, request, flash, redirect, url_for
import pathlib
# Import your utility functions from your core script
from core import organizeFilesIntoFolders, organizeFilesIntoFoldersAll

app = Flask(__name__)
app.secret_key = "super_secret_dev_key"  # Needed for flash messages

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        target_path = request.form.get("path", "").strip()
        target_ext = request.form.get("ext", ".*").strip()
        is_recursive = "recursive" in request.form

        # Basic path verification
        if not target_path:
            flash("Please provide a valid directory path.", "error")
            return redirect(url_for("index"))
        
        p = pathlib.Path(target_path)
        if not p.exists() or not p.is_dir():
            flash(f"The path '{target_path}' does not exist or is not a directory.", "error")
            return redirect(url_for("index"))

        try:
            # Execute your backend functions based on form inputs
            if is_recursive:
                organizeFilesIntoFoldersAll(path=target_path, ext=target_ext)
            else:
                organizeFilesIntoFolders(path=target_path, ext=target_ext)
            
            flash(f"Successfully organized files in: {target_path}", "success")
        except Exception as e:
            flash(f"An error occurred: {str(e)}", "error")

        return redirect(url_for("index"))

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5001)
