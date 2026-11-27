from Npp import editor, notepad
import re

val = notepad.prompt(
    "Enter space width per tab (e.g., 4 replaces 4 spaces -> 1 tab, 8 -> 2 tabs, 12 -> 3 tabs):",
    "Spaces to Tabs",
    "4"
)

if val and val.isdigit() and int(val) > 0:
    width = int(val)
    text = editor.getText()

    # Replaces each exact leading block of `width` spaces with 1 tab (4 -> \t, 8 -> \t\t, 12 -> \t\t\t)
    new_text = re.sub(
        r'(?m)^((?: {' + str(width) + r'})+)(?=[^ ])',
        lambda m: '\t' * (len(m.group(1)) // width),
        text
    )

    editor.beginUndoAction()
    editor.setText(new_text)
    editor.endUndoAction()
