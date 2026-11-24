const { app, BrowserWindow, Menu, Tray, nativeImage, dialog } = require("electron");
const path = require("path");

let mainWindow;
let tray;
let isQuitting = false;

const appName = "星图远征";
const aboutStory = [
  "上一世，它只是课本边角里散落的地名：省界模糊，城市失序，区县如星尘坠入长夜。",
  "它曾在默写纸上败北，在空白地图前沉默，被车牌字母和行政代码反复击穿。",
  "这一世，路途记携省、市、区县三级轮廓重生归来，以离线数据为骨，以清晰矢量地图为刃，把地理位置、名称和记忆抽测重新锻成一条路。",
  "从省到地级市，再到区县；从名单默写到看图写名。此番归来，只为把曾经错过的每一处山河，都稳稳夺回。"
].join("\n\n");

function getIconPath() {
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), "星图远征.ico");
  }
  return path.join(__dirname, "..", "build", "icon.ico");
}

function showMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function dialogParent() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
}

function showAboutDialog() {
  dialog.showMessageBox(dialogParent(), {
    type: "info",
    title: "关于星图远征",
    message: `${appName} ${app.getVersion()}`,
    detail: `关于这个软件星图远征\n\n${aboutStory}\n\n离线运行：行政区划、车牌排序、训练记录与空白矢量地图均随免安装版提供。`,
    buttons: ["知道了"],
    icon: getIconPath()
  });
}

function showSettingsDialog() {
  dialog.showMessageBox(dialogParent(), {
    type: "info",
    title: "设置",
    message: "设置",
    detail: "已启用：关闭窗口后在系统托盘后台运行。\n退出方式：右键托盘图标，选择“退出”。\n数据模式：离线优先，安装后练习不需要联网。",
    buttons: ["知道了"],
    icon: getIconPath()
  });
}

function showMapHelpDialog() {
  dialog.showMessageBox(dialogParent(), {
    type: "info",
    title: "地图练习",
    message: "地图练习",
    detail: "空白地图用于把位置和名称一起记。它会跟随当前层级显示省级、地级或区县级边界；“看图抽测”会从当前地图范围里高亮一个轮廓，输入名称后检查。",
    buttons: ["知道了"],
    icon: getIconPath()
  });
}

function buildAppMenu() {
  return Menu.buildFromTemplate([
    {
      label: "文件",
      submenu: [
        { label: "显示主窗口", click: showMainWindow },
        { type: "separator" },
        {
          label: "退出",
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: "练习",
      submenu: [
        { label: "地图练习说明", click: showMapHelpDialog },
        { label: "关闭后托盘运行：已启用", enabled: false }
      ]
    },
    {
      label: "设置",
      submenu: [{ label: "打开设置", click: showSettingsDialog }]
    },
    {
      label: "视图",
      submenu: [
        { label: "重新加载", role: "reload" },
        { label: "开发者工具", role: "toggleDevTools" }
      ]
    },
    {
      label: "帮助",
      submenu: [{ label: "关于星图远征", click: showAboutDialog }]
    }
  ]);
}

function createTray() {
  if (tray) return tray;

  const icon = nativeImage.createFromPath(getIconPath());
  tray = new Tray(icon);
  tray.setToolTip(appName);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: `显示${appName}`,
        click: showMainWindow
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("double-click", showMainWindow);

  return tray;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: `${appName} ${app.getVersion()}`,
    icon: getIconPath(),
    backgroundColor: "#0d1210",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  return mainWindow;
}

app.whenReady().then(() => {
  app.setAppUserModelId("local.china-map-memory");
  Menu.setApplicationMenu(buildAppMenu());
  createTray();
  createWindow();

  app.on("activate", () => {
    if (!mainWindow || mainWindow.isDestroyed()) createWindow();
    showMainWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});
