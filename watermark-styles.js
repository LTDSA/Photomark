/* 水印绘制模块：只负责 Canvas 排版，预览和导出共用同一入口。 */
const WatermarkStyles = (() => {
    'use strict';

    /** 在固定宽度内绘制单行文字，避免长机型、地点覆盖相邻区域。 */
    function text(ctx, value, x, y, width, size, color, font, align = 'left') {
        if (!value || width <= 0) return;
        ctx.font = `${size}px ${font}`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        // 超长文本截断加省略号，避免 Canvas 的 maxWidth 将字形横向压扁。
        let label = String(value);
        if (ctx.measureText(label).width > width) {
            const characters = Array.from(label);
            let low = 0;
            let high = characters.length;
            while (low < high) {
                const middle = Math.ceil((low + high) / 2);
                if (ctx.measureText(characters.slice(0, middle).join('') + '…').width <= width) {
                    low = middle;
                } else {
                    high = middle - 1;
                }
            }
            label = characters.slice(0, low).join('') + '…';
        }
        ctx.fillText(label, x, y);
    }

    /** 以参考项目的高度为基准计算宽度，横向字标只在超过可用宽度时缩小。 */
    function logoSize(image, height, maxWidth) {
        if (!image) return { width: 0, height: 0 };
        const ratio = Math.min(height / image.naturalHeight, maxWidth / image.naturalWidth);
        return { width: image.naturalWidth * ratio, height: image.naturalHeight * ratio };
    }

    /** 按指定区域居中绘制，返回实际占用宽度供相邻文字避让。 */
    function logo(ctx, image, x, y, height, maxWidth) {
        if (!image) return 0;
        const size = logoSize(image, height, maxWidth);
        ctx.drawImage(image, x, y + (height - size.height) / 2, size.width, size.height);
        return size.width;
    }

    /** 复现参考信息栏：20px 留白、39px 高 Logo、按右侧文字动态分配空间。 */
    function classic(ctx, w, h, data, image, font) {
        const s = w / 800;
        const pad = 20 * s;
        const hasRight = !!(data.lens || data.location);
        ctx.font = (18 * s) + 'px ' + font;
        const lensWidth = ctx.measureText(data.lens || '').width;
        ctx.font = (14 * s) + 'px ' + font;
        const rightWidth = hasRight ? Math.min(Math.max(lensWidth, ctx.measureText(data.location || '').width), w * 0.44) : 0;
        const gap = hasRight ? (image ? 26 : 4) * s : 0;
        const leftWidth = w - pad * 2 - rightWidth - gap;
        const size = logoSize(image, 39 * s, leftWidth * 0.45);
        const middle = h + 42.5 * s;
        const textWidth = leftWidth - size.width - 10 * s;
        logo(ctx, image, pad + leftWidth - size.width, middle - 19.5 * s, 39 * s, leftWidth * 0.45);
        text(ctx, data.device, pad + 2 * s, middle - 7 * s, textWidth, 18 * s, '#171717', font);
        text(ctx, data.time, pad + 2 * s, middle + 10 * s, textWidth, 14 * s, '#aaaaaa', font);
        if (hasRight) {
            const right = w - pad - rightWidth;
            text(ctx, data.lens, right, middle - 7 * s, rightWidth, 18 * s, '#171717', font);
            text(ctx, data.location, right, middle + 10 * s, rightWidth, 14 * s, '#aaaaaa', font);
            if (image) {
                ctx.fillStyle = '#cccccc';
                ctx.fillRect(right - 14 * s, middle - 19.5 * s, 2 * s, 39 * s);
            }
        }
    }

    /** 圆角白框：完整保留照片比例，底部集中展示品牌和拍摄信息。 */
    function rounded(ctx, photo, w, h, data, image, font) {
        const s = w / 800;
        const pad = 24 * s;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pad, pad, w, h, Math.min(18 * s, h / 2));
        ctx.clip();
        ctx.drawImage(photo, pad, pad, w, h);
        ctx.restore();
        const center = w / 2 + pad;
        const top = h + pad;
        const size = logoSize(image, 20 * s, w - 48 * s);
        logo(ctx, image, center - size.width / 2, top + 22 * s, 20 * s, w - 48 * s);
        text(ctx, data.device, center, top + 66 * s, w - 48 * s, 20 * s, '#222222', font, 'center');
        text(ctx, data.lens, center, top + 94 * s, w - 48 * s, 14 * s, '#666666', font, 'center');
        text(ctx, [data.time, data.location].filter(Boolean).join(' · '), center, top + 120 * s,
            w - 48 * s, 12 * s, '#999999', font, 'center');
    }

    /** 文字内嵌：半透明深色信息板提高亮背景上的可读性，不扩展画布。 */
    function overlay(ctx, w, h, data, image, font) {
        const s = Math.min(w / 800, h / 240);
        const pad = 24 * s;
        const y = h - 126 * s;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(pad, y, w - pad * 2, 102 * s);
        const logoWidth = logo(ctx, image, pad * 2, y + 31 * s, 40 * s, w * 0.3);
        const x = image ? pad * 2 + logoWidth + 18 * s : pad * 2;
        const width = w - x - pad * 2;
        text(ctx, data.device, x, y + 27 * s, width, 21 * s, '#ffffff', font);
        text(ctx, data.lens, x, y + 54 * s, width, 15 * s, '#ffffff', font);
        text(ctx, [data.time, data.location].filter(Boolean).join(' · '), x, y + 78 * s,
            width, 12 * s, '#dddddd', font);
    }

    /** 复古时间戳：仅使用用户填写的时间，模拟胶片相机的橙色日期印字。 */
    function vintage(ctx, w, h, data) {
        const s = Math.min(w / 800, h / 160);
        ctx.save();
        ctx.shadowColor = '#512000';
        ctx.shadowBlur = 3 * s;
        ctx.shadowOffsetY = s;
        text(ctx, data.time, w - 32 * s, h - 32 * s, w - 64 * s,
            28 * s, '#ffad56', 'monospace', 'right');
        ctx.restore();
    }

    /** 重复水印：绕画布中心旋转后平铺，按对角线覆盖所有边角。 */
    function watermark(ctx, w, h, data, image, font) {
        if (!data.watermark) return;
        const s = w / 800;
        const extent = Math.hypot(w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.globalAlpha = 0.22;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 2 * s;
        for (let y = -extent / 2; y < extent / 2; y += 120 * s) {
            for (let x = -extent / 2; x < extent / 2; x += 270 * s) {
                text(ctx, data.watermark, x, y, 230 * s, 22 * s, '#ffffff', font);
            }
        }
        ctx.restore();
    }

    /** 根据样式设置成品尺寸；缩放同时作用于照片、边框和文字。 */
    function render(canvas, photo, options) {
        const { style, data, image, font, zoom } = options;
        const w = photo.naturalWidth * zoom;
        const h = photo.naturalHeight * zoom;
        const s = w / 800;
        canvas.width = Math.round(w + (style === 'rounded' ? 48 * s : 0));
        canvas.height = Math.round(h + (style === 'rounded' ? 168 * s : style === 'classic' ? 85 * s : 0));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (style === 'rounded') {
            rounded(ctx, photo, w, h, data, image, font);
            return;
        }
        ctx.drawImage(photo, 0, 0, w, h);
        const painters = { classic, overlay, vintage, watermark };
        (painters[style] || classic)(ctx, w, h, data, image, font);
    }

    return { render };
})();
