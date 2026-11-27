import ctypes
from ctypes import wintypes
import wx

user32 = ctypes.windll.user32

LONG_PTR = ctypes.c_ssize_t
UINT_PTR = ctypes.c_size_t
TIMERPROC = ctypes.WINFUNCTYPE(None, wintypes.HWND, wintypes.UINT, UINT_PTR, wintypes.DWORD)

user32.GetWindowLongPtrW.argtypes = [wintypes.HWND, ctypes.c_int]
user32.GetWindowLongPtrW.restype = LONG_PTR
user32.SetWindowLongPtrW.argtypes = [wintypes.HWND, ctypes.c_int, LONG_PTR]
user32.SetWindowLongPtrW.restype = LONG_PTR
user32.SetParent.argtypes = [wintypes.HWND, wintypes.HWND]
user32.SetParent.restype = wintypes.HWND
user32.SendMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
user32.SendMessageW.restype = LONG_PTR
user32.GetClassNameW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.GetClassNameW.restype = ctypes.c_int
user32.IsWindow.argtypes = [wintypes.HWND]
user32.IsWindow.restype = wintypes.BOOL
user32.SetTimer.argtypes = [wintypes.HWND, UINT_PTR, wintypes.UINT, TIMERPROC]
user32.SetTimer.restype = UINT_PTR
user32.KillTimer.argtypes = [wintypes.HWND, UINT_PTR]
user32.KillTimer.restype = wintypes.BOOL

WM_USER = 0x0400
NPPMSG = WM_USER + 1000
NPPM_DMMREGASDCKDLG = NPPMSG + 33
NPPM_DMMSHOW = NPPMSG + 30
NPPM_DMMHIDE = NPPMSG + 31

DOCK_POSITIONS = {
    "left":   0x00000000,
    "right":  0x02000000,
    "top":    0x04000000,
    "bottom": 0x06000000,
}

class tTbData(ctypes.Structure):
    _fields_ = [
        ("hClient", wintypes.HWND),
        ("pszName", wintypes.LPCWSTR),
        ("dlgID", ctypes.c_int),
        ("uMask", wintypes.UINT),
        ("hIconTab", wintypes.HICON),
        ("pszAddInfo", wintypes.LPCWSTR),
        ("rcFloat", wintypes.RECT),
        ("iPrevCont", ctypes.c_int),
        ("pszModuleName", wintypes.LPCWSTR),
    ]

if not hasattr(wx, "_npp_dock_registry"):
    wx._npp_dock_registry = {}

_timers = []
_pump_started = False
_next_dlg_id = 55001

def _find_npp_hwnd():
    hwnd = user32.FindWindowW(u"Notepad++", None)
    if hwnd and user32.IsWindow(hwnd):
        buf = ctypes.create_unicode_buffer(64)
        user32.GetClassNameW(hwnd, buf, 64)
        if buf.value == u"Notepad++":
            return hwnd
    return None

def _start_wx_idle_pump(npp_hwnd):
    """Pumps wx.App idle/pending events safely on Notepad++'s main thread without blocking."""
    global _pump_started
    if _pump_started:
        return
    _pump_started = True

    def _pump_cb(hwnd, msg, timer_id, dw_time):
        app = wx.GetApp()
        if app:
            app.ProcessPendingEvents()

    cb = TIMERPROC(_pump_cb)
    _timers.append(cb)
    user32.SetTimer(npp_hwnd, 59001, 50, cb)

def run_on_npp_main_thread(func, delay_ms=10):
    npp_hwnd = _find_npp_hwnd()
    if not npp_hwnd:
        return

    holder = {}
    def _timer_cb(hwnd, msg, timer_id, dw_time):
        user32.KillTimer(hwnd, timer_id)
        if holder in _timers:
            _timers.remove(holder)
        func()

    cb = TIMERPROC(_timer_cb)
    holder["cb"] = cb
    _timers.append(holder)
    user32.SetTimer(npp_hwnd, id(cb) & 0xFFFF, max(10, int(delay_ms)), cb)

class NppDockablePanel(wx.Frame):
    PANEL_NAME = u"Custom Panel"
    DOCKING = "right"
    DEFAULT_SIZE = (280, 500)

    def __init__(self):
        super(NppDockablePanel, self).__init__(
            None,
            title=self.PANEL_NAME,
            size=self.DEFAULT_SIZE,
            style=wx.BORDER_NONE | wx.CLIP_CHILDREN
        )
        self._tb_data = None
        self._npp_hwnd = None

    def _dock_to_npp(self, npp_hwnd):
        global _next_dlg_id
        self._npp_hwnd = npp_hwnd
        hwnd = self.GetHandle()

        GWL_STYLE = -16
        WS_CHILD = 0x40000000
        WS_CLIPCHILDREN = 0x02000000
        WS_CLIPSIBLINGS = 0x04000000
        WS_POPUP = 0x80000000
        style = user32.GetWindowLongPtrW(hwnd, GWL_STYLE)
        new_style = (style & ~WS_POPUP) | WS_CHILD | WS_CLIPCHILDREN | WS_CLIPSIBLINGS
        user32.SetWindowLongPtrW(hwnd, GWL_STYLE, new_style)
        user32.SetParent(hwnd, npp_hwnd)

        tb = tTbData()
        tb.hClient = hwnd
        tb.pszName = unicode(self.PANEL_NAME)
        tb.dlgID = _next_dlg_id
        _next_dlg_id += 1
        tb.uMask = DOCK_POSITIONS.get(self.DOCKING.lower(), DOCK_POSITIONS["right"])
        tb.pszModuleName = u"PythonScript.dll"
        self._tb_data = tb

        user32.SendMessageW(npp_hwnd, NPPM_DMMREGASDCKDLG, 0, ctypes.addressof(tb))
        self.Show()
        self.Layout()
        self.Refresh()

    def reveal(self):
        if self._npp_hwnd and user32.IsWindow(self._npp_hwnd):
            user32.SendMessageW(self._npp_hwnd, NPPM_DMMSHOW, 0, self.GetHandle())
        self.Show()
        self.Layout()
        self.Refresh()

    def on_panel_shown(self):
        pass

    @classmethod
    def get_instance(cls):
        inst = wx._npp_dock_registry.get(cls.PANEL_NAME)
        if inst and user32.IsWindow(inst.GetHandle()):
            return inst
        return None

    @classmethod
    def show_or_focus(cls, delay_sec=0.0):
        def _create_on_main():
            npp_hwnd = _find_npp_hwnd()
            if not npp_hwnd:
                return
            if not wx.GetApp():
                app = wx.App(False)
                app.SetExitOnFrameDelete(False)
                wx._npp_wx_app = app  # Prevent GC of wx.App
            _start_wx_idle_pump(npp_hwnd)

            inst = cls.get_instance()
            if inst is not None:
                inst.reveal()
                inst.on_panel_shown()
                return

            inst = cls()
            wx._npp_dock_registry[cls.PANEL_NAME] = inst
            inst._dock_to_npp(npp_hwnd)
            inst.on_panel_shown()

        delay_ms = max(10, int(delay_sec * 1000))
        run_on_npp_main_thread(_create_on_main, delay_ms=delay_ms)
