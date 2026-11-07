# Photomark

为照片添加品牌水印、拍摄信息与边框的浏览器工具。
A browser-based tool for adding brand watermarks, shooting information, and frames to photos.

[中文](#中文) | [English](#english)

## 中文

### 功能

- 提供五种水印样式、多种品牌 Logo 和字体，支持原始尺寸及两倍缩放、JPEG 导出质量选择。
- 照片在浏览器本地处理，不上传到服务器；页面依赖的 CDN 库仍需联网加载。
- 默认通过 EXIF 自动识别品牌、匹配机型，也可手动选择品牌。
- 预览与导出共用绘制逻辑，文字和边框随照片宽度缩放，超长文字自动省略。
- 提供中文和英文界面。

### 使用方法

1. 通过静态 HTTP 服务打开项目页面，点击选择照片或拖入照片。
2. 导入后自动读取 EXIF 并查询本地机型库。匹配成功显示商品名称；未命中或数据库加载失败时保留原始 EXIF 型号，没有型号才显示 `Unknown`。
3. 选择水印样式、品牌、字体、缩放比例和导出质量。时间可以手动编辑，重复水印支持自定义文字。
4. 查看自动更新的预览，点击「保存」下载 JPEG。

### 水印样式

| 样式 | 效果 |
| --- | --- |
| 经典白框 | 底部两列展示机型、时间、镜头参数及位置，支持品牌 Logo |
| 圆角白框 | 圆角照片、四周留白，品牌及拍摄信息居中 |
| 文字内嵌 | 照片内叠加半透明信息板，不额外增加边框尺寸 |
| 复古时间戳 | 右下角橙色胶片日期，使用「时间」字段的文字 |
| 重复水印 | 半透明斜向平铺自定义文字，清空文字可取消平铺 |

复古时间戳和重复水印不显示品牌 Logo。没有 EXIF 的图片仍可处理。

### 品牌与机型

已接入 20 个本地 SVG 图标，包括佳能、索尼、富士、华为、苹果、大疆、影石、徕卡等，同时保留原有一加和蔡司。

「自动识别品牌（EXIF）」优先读取 `Make`，再以 `Model` 兜底；识别失败不显示 Logo。可手动选择品牌或「无」。Logo 保持原始宽高比：以照片宽度 800px 为基准，经典白框的信息栏高 85px、Logo 高 39px，圆角白框 Logo 高 20px；超出可用宽度时等比缩小。

机型匹配兼容厂商大小写、常见别名及多余空白。未命中时保留原始型号，不跨厂商猜测。数据库目前包含 168 条映射；更新范围及官方来源见[机型库维护记录（中文）](docs/model-database.md)。

### 开发与测试

这是静态网页项目，通过任意静态 HTTP 服务访问项目目录即可，无需构建。

安装 Node.js 和 Chrome 后运行：

```sh
npm ci
npm test
```

测试使用 Playwright 和真实浏览器 Canvas，覆盖五种样式、横竖及宽幅照片、两档缩放、长文字、品牌 Logo 比例、无 EXIF 导入、机型匹配与失败回退、样式切换和 JPEG 下载。

可设置环境变量 `BROWSER_CHANNEL=msedge` 使用 Edge。测试截图位于 `test-results/`。完整页面测试需要访问项目使用的 CDN。

| 文件 | 用途 |
| --- | --- |
| `index.html` | 界面、照片导入、输入事件及预览/导出流程 |
| `watermark-styles.js` | 水印绘制、文字限宽和 Logo 等比布局，包含中文功能注释 |
| `brand-logos.js` / `assets/brand/` | 品牌识别、图标映射与本地 SVG 资源 |
| `model-matcher.js` / `model.json` | 机型查询、缓存、回退逻辑及型号数据库 |
| `zh-cn.json` / `en-us.json` | 中文与英文界面文案 |
| `tests/` | 机型匹配与浏览器回归测试 |

### 已知限制

- 原项目的定位格式仅支持东北半球，其他方向的坐标处理仍需完善。
- 原项目记录了 Safari 的 5MB 图片限制，大图片处理及保存可能受浏览器限制。
- 机型库并未覆盖所有设备和地区型号，未收录的设备使用 EXIF 原始型号。

## English

### Features

- Five watermark styles, multiple brand logos and fonts, original-size or 2× output, and selectable JPEG quality.
- Photos are processed locally in the browser and are not uploaded to a server. The page still needs network access to load its CDN libraries.
- Automatic brand detection and model-name matching from EXIF, with manual brand selection available.
- Preview and export share the same renderer. Text and frames scale with photo width, and long text is truncated with an ellipsis.
- Chinese and English interface translations.

### Usage

1. Serve the project through a static HTTP server, then click to select a photo or drag one onto the page.
2. Import automatically reads EXIF and queries the local model database. A match displays the product name; an unknown model or database-loading failure falls back to the original EXIF model. `Unknown` is shown only when no model is available.
3. Choose a watermark style, brand, font, output scale, and export quality. You can edit the time field and customize repeated watermark text.
4. Review the automatically updated preview, then click **Save** to download a JPEG.

### Watermark styles

| Style | Appearance |
| --- | --- |
| Classic border | A two-column footer with model, time, lens information, location, and an optional brand logo |
| Rounded frame | Rounded photo corners, white margins, and centered branding and shooting information |
| Text overlay | A translucent information panel inside the photo, without adding border dimensions |
| Vintage timestamp | An orange film-style date in the lower-right corner, using the time field |
| Repeated watermark | Custom text tiled diagonally with transparency; clear the text to remove the pattern |

Vintage timestamps and repeated watermarks do not display brand logos. Photos without EXIF can still be processed.

### Brands and model matching

The project includes 20 local SVG icons, including Canon, Sony, Fujifilm, Huawei, Apple, DJI, Insta360, and Leica. The original OnePlus and Zeiss logos are also retained.

**Auto-detect brand (EXIF)** checks `Make` first, then falls back to `Model`. No logo is shown if detection fails. You can select a brand manually or choose **None**. Logos retain their aspect ratio: at a reference photo width of 800px, the classic footer is 85px high with a 39px-high logo, while the rounded frame uses a 20px-high logo. Logos shrink proportionally when available width is limited.

Model matching handles manufacturer capitalization, common aliases, and extra whitespace. Unmatched models retain their original EXIF value; the matcher does not guess across manufacturers. The database currently contains 168 mappings. Update scope and official sources are documented in the [model database maintenance notes (Chinese)](docs/model-database.md).

### Development and testing

This is a static website. Serve the project directory with any static HTTP server; no build step is required.

With Node.js and Chrome installed, run:

```sh
npm ci
npm test
```

Tests use Playwright and a real browser Canvas. They cover all five styles, landscape/portrait/panoramic photos, both output scales, long text, logo proportions, import without EXIF, model matching and fallback, style switching, and JPEG downloads.

Set the `BROWSER_CHANNEL=msedge` environment variable to use Edge. Test screenshots are saved in `test-results/`. Full-page tests require access to the project's CDN dependencies.

| File | Purpose |
| --- | --- |
| `index.html` | Interface, photo import, input events, and preview/export flow |
| `watermark-styles.js` | Watermark rendering, text fitting, and proportional logo layout, with Chinese function comments |
| `brand-logos.js` / `assets/brand/` | Brand detection, logo mappings, and local SVG assets |
| `model-matcher.js` / `model.json` | Model lookup, caching, fallback behavior, and model database |
| `zh-cn.json` / `en-us.json` | Chinese and English interface strings |
| `tests/` | Model-matching and browser regression tests |

### Known limitations

- The original location formatter only supports the northeastern hemisphere; other coordinate directions still need improvement.
- The upstream project documents a 5MB image limit in Safari. Processing and saving large images may be limited by the browser.
- The model database does not cover every device or regional variant. Unlisted devices use the original EXIF model.

## License / 许可证

[GNU General Public License v3.0](LICENSE)
