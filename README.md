# 星图远征

星图远征是一个用 Electron 构建的 Windows 地理学习工具，提供地图识别、行政区划和车牌记忆练习。项目使用本地存储保存学习进度。

## 从源码运行

安装 Node.js 22.13 或更新版本，在仓库根目录运行以下命令。

```powershell
npm ci
npm run build:icon
npm start
```

首次启动需要联网。数据脚本会从 DataV、JSON.cn 和 SimpleMaps 获取输入，并使用 npm 依赖中的行政区划数据和美国地图。下载缓存保存在 `raw/`，生成的数据写入 `src/data/`。上游来源及数据处理见 `scripts/build-map.js` 与 `scripts/build-data.js`。

## 测试与打包

- `npm test` 运行数据和交互测试。
- `npm run dist` 构建 Windows 安装包。
- `npm run portable` 构建便携版。
