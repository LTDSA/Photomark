// 使用真实 Chrome Canvas 验证尺寸、缩放、JPEG 编码与页面交互。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('@playwright/test');

async function main() {
    const root = path.resolve(__dirname, '..');
    const server = http.createServer((req, res) => {
        const name = decodeURIComponent(req.url.split('?')[0]);
        const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
        if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        fs.readFile(file, (error, content) => {
            if (error) { res.writeHead(404).end(); return; }
            const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
            res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
            res.end(content);
        });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
        const page = await browser.newPage({ locale: 'zh-CN' });
        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.waitForFunction(() => typeof WatermarkStyles !== 'undefined');
        // 每个参考品牌都实际解码、绘制并编码，防止 SVG 尺寸或资源路径导致导出失败。
        const detection = await page.evaluate(() => [
            detectPhotoBrand({Make:'SONY',Model:'ILCE-7M4'}),
            detectPhotoBrand({Make:'NIKON CORPORATION'}),
            detectPhotoBrand({Make:'Panasonic'}),
            detectPhotoBrand({Model:'iPhone 16 Pro'}),
            detectPhotoBrand({Make:'Canon',LensMake:'ZEISS'}),
            detectPhotoBrand({Make:'Unknown'}), detectPhotoBrand({})
        ]);
        assert.deepEqual(detection, ['sony','nikon','lumix','apple','canon','none','none']);
        const brandCount = await page.evaluate(async () => {
            const keys = Object.keys(logoList).filter(key => logoList[key]?.endsWith('.svg'));
            for (const key of keys) {
                const image = await loadPhoto(logoList[key]);
                if (!image.naturalWidth || !image.naturalHeight) throw new Error('Invalid logo: ' + key);
                const canvas = document.createElement('canvas');
                canvas.width = 160; canvas.height = 80;
                canvas.getContext('2d').drawImage(image, 0, 0, 160, 80);
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                if (!blob) throw new Error('Cannot export logo: ' + key);
                const photo = new Image(); photo.src = canvas.toDataURL(); await photo.decode();
                for (const style of ['classic', 'rounded', 'overlay']) {
                    const output = document.createElement('canvas');
                    const context = output.getContext('2d');
                    const original = context.drawImage.bind(context);
                    let dimensions;
                    context.drawImage = (...args) => {
                        if (args[0] === image) dimensions = args.slice(3, 5);
                        original(...args);
                    };
                    WatermarkStyles.render(output, photo, { style, zoom: 5, image, font: 'sans-serif',
                        data: { device: 'Camera', lens: '50mm f/1.4', time: '2026.11.05' } });
                    if (!dimensions || Math.abs(dimensions[0] / dimensions[1] - image.naturalWidth / image.naturalHeight) > 0.001) {
                        throw new Error('Distorted logo: ' + key + '/' + style);
                    }
                    if (key === 'canon' && style === 'classic' && Math.abs(dimensions[1] - 39) > 0.01) {
                        throw new Error('Wide wordmark incorrectly constrained to a square');
                    }
                }
            }
            return keys.length;
        });
        assert.equal(brandCount, 20);
        const results = await page.evaluate(async () => {
            const results = [];
            for (const [w, h] of [[800, 600], [600, 900], [160, 120], [1200, 180]]) {
                const source = document.createElement('canvas');
                source.width = w; source.height = h;
                const ctx = source.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, w, h);
                gradient.addColorStop(0, '#21465c'); gradient.addColorStop(1, '#d5ab76');
                ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
                const photo = new Image(); photo.src = source.toDataURL(); await photo.decode();
                for (const zoom of [1, 2]) {
                    for (const style of ['classic', 'rounded', 'overlay', 'vintage', 'watermark']) {
                        const canvas = document.createElement('canvas');
                        WatermarkStyles.render(canvas, photo, {
                            style, zoom, font: 'sans-serif', image: photo,
                            data: { device: '长机型名称 '.repeat(12), lens: '50mm f/1.4 1/250 ISO100',
                                time: '2026.11.05 15:30:00', location: '上海 · 外滩 '.repeat(10), watermark: '© 摄影作品' }
                        });
                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                        results.push({ style, w, h, zoom, width: canvas.width, height: canvas.height, type: blob.type });
                        if (w === 800 && zoom === 1) {
                            canvas.style.width = '400px'; canvas.dataset.style = style;
                            document.body.appendChild(canvas);
                        }
                    }
                }
            }
            return results;
        });
        for (const result of results) {
            const { w, h, zoom, style } = result;
            assert.equal(result.width, Math.round(w * zoom * (style === 'rounded' ? 1.06 : 1)));
            assert.equal(result.height, Math.round(h * zoom + w * zoom / 800 * (style === 'rounded' ? 168 : style === 'classic' ? 85 : 0)));
            assert.equal(result.type, 'image/jpeg');
        }
        fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
        for (const style of ['classic', 'rounded', 'overlay', 'vintage', 'watermark']) {
            await page.locator('canvas[data-style="' + style + '"]').screenshot({ path: path.join(root, 'test-results', style + '.png') });
        }
        // 通过实际上传入口验证无 EXIF 的 PNG 也能预览，并检测异步切换最终结果。
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const fileChooser = page.waitForEvent('filechooser');
        await page.locator('#photo-area').click();
        await (await fileChooser).setFiles(path.join(root, 'test-results', 'classic.png'));
        await page.waitForFunction(() => document.querySelector('#photo-preview').src.startsWith('blob:'));
        await page.selectOption('#logo-select', 'canon');
        await page.evaluate(() => drawImage(true));
        await page.selectOption('#style-select', 'watermark');
        assert.equal(await page.locator('#watermark-input').isVisible(), true);
        await page.fill('#watermark-input', '© 测试水印');
        await page.selectOption('#style-select', 'rounded');
        await page.selectOption('#style-select', 'overlay');
        await page.evaluate(() => drawImage(true));
        assert.equal(await page.locator('#watermark-input').isVisible(), false);
        const downloadEvent = page.waitForEvent('download');
        await page.locator('#save-btn').click();
        const download = await downloadEvent;
        const downloaded = await download.path();
        assert.equal(fs.readFileSync(downloaded).subarray(0, 2).toString('hex'), 'ffd8');
        // 用受控 EXIF 输入验证真实导入流程会自动匹配，无须点击机型匹配按钮。
        for (const [make, model, expected] of [
            ['SONY', 'ILCE-1M2', 'SONY Alpha 1 II'],
            ['SONY', 'UNLISTED-CAMERA', 'UNLISTED-CAMERA']
        ]) {
            await page.evaluate(async ({ make, model }) => {
                const original = exifr.parse;
                exifr.parse = async () => ({ Make: make, Model: model });
                const blob = await (await fetch('/test-results/classic.png')).blob();
                readImage(new File([blob], 'model-test.png', { type: 'image/png' }));
                // 恢复放在测试端等待导入完成后进行。
                window.restoreTestExif = () => { exifr.parse = original; };
            }, { make, model });
            await page.waitForFunction(expected => document.querySelector('#device-input').value === expected, expected);
            await page.evaluate(() => window.restoreTestExif());
        }
        assert.deepEqual(errors, []);
        console.log('PASS: 40 render cases, five visual samples, upload, style switching and JPEG download.');
    } finally {
        if (browser) await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
