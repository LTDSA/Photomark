# Photomark
A tool to add watermark on a picture.

## Features
* Multiple logos & fonts available
* Local execution only, no server upload

## 水印样式

上传照片后，在「水印样式」中切换，预览会自动更新。选择缩放比例和导出质量后，点击「保存」下载 JPEG。

| 样式 | 效果 |
| --- | --- |
| 经典白框 | 底部左右两列展示机型、时间、镜头参数及位置，支持品牌图标 |
| 圆角白框 | 圆角照片、四周留白、居中品牌与拍摄信息 |
| 文字内嵌 | 照片内部叠加半透明信息板，保持原图尺寸 |
| 复古时间戳 | 右下角橙色胶片日期，可在「时间」中编辑文字 |
| 重复水印 | 半透明斜向平铺，可编辑「重复水印文字」；清空文字可取消平铺 |

新增样式参考本地图片工具站的水印边框布局重新实现，无新增运行时依赖。
时间戳和重复水印不显示品牌图标。没有 EXIF 的图片仍可处理，时间可手动填写。
所有布局随照片宽度缩放，超长信息自动省略，预览和导出使用同一绘制入口。

## 开发与验证

这是静态网页项目，用任意静态 HTTP 服务打开项目目录即可，无需构建。

* `watermark-styles.js`：样式绘制、文本限宽、品牌图标等比布局；每项功能均有中文注释。
* `index.html`：样式选择、输入事件、异步加载及统一预览/导出流程。
* `zh-cn.json` / `en-us.json`：中文及英文界面文案。

安装 Node.js 和 Chrome 后运行：

```sh
npm ci
npm test
```

测试使用 Playwright 和真实浏览器 Canvas，覆盖横图、竖图、小图、宽幅图、两档缩放、
五种样式、长文字、无 EXIF 上传、切换样式及 JPEG 下载。
可设置 `BROWSER_CHANNEL=msedge` 使用 Edge。测试截图保存在 `test-results/`。
页面仍使用原项目的 CDN 依赖，因此完整页面测试需要能访问这些 CDN。

## Known bugs
* Northeast hemisphere positioning support only
* Maximum 5MB limit in Safari

## 品牌图标

已接入参考项目的 20 个本地 SVG 图标，包括佳能、索尼、富士、华为、苹果、大疆、影石、徕卡等；同时保留原有一加和蔡司。通过「图标类型」选择，经典白框、圆角白框和文字内嵌会显示图标。资源位于 `assets/brand/`，映射集中在 `brand-logos.js`，无需远程加载。

品牌选择默认为「自动识别品牌（EXIF）」：优先读取 Make，再以 Model 兜底；识别失败不显示 Logo，也不会沿用上一张照片的品牌。可手动选择品牌或「无」。经典白框采用参考项目的 800px 基准布局：信息栏高 85px，Logo 高 39px，超出可用宽度时等比缩小；圆角白框 Logo 高 20px。

## 自动机型匹配

导入照片会自动查询本地机型库，命中后显示商品名称；未命中或数据库加载失败则保留 EXIF 原始 Model，没有 Model 才显示 Unknown。无需点击「机型匹配」。厂商大小写和常见别名均兼容，连续导入不会串用旧照片的匹配结果。数据库更新范围与官方来源见 [机型库维护记录](docs/model-database.md)。
