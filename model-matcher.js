/* 机型匹配：缓存本地数据库，匹配失败始终返回 EXIF 原始 Model。 */
const ModelMatcher = (() => {
    let databasePromise;

    /** 忽略大小写、首尾空格及 EXIF 末尾空字符，不模糊删除型号中的连字符。 */
    function normalize(value) {
        return String(value || '').replace(/\0/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
    }

    /** 将已知厂商写法归一化；SONY/Sony 两个原有分组均可参与查找。 */
    function manufacturer(value) {
        const name = normalize(value);
        const aliases = {
            'sony corporation': 'sony', 'sony mobile communications': 'sony',
            'nikon corporation': 'nikon', 'canon inc.': 'canon',
            'xiaomi communications co., ltd.': 'xiaomi', 'panasonic corporation': 'panasonic'
        };
        return aliases[name] || name;
    }

    /** 只在同厂商内精确匹配型号；歧义或缺少厂商时不猜测。 */
    function lookup(database, exif = {}) {
        const fallback = typeof exif.Model === 'string' ? exif.Model : '';
        const make = manufacturer(exif.Make);
        const model = normalize(exif.Model);
        if (!make || !model) return { name: fallback, matched: false };
        const names = new Set();
        for (const [brand, models] of Object.entries(database)) {
            if (manufacturer(brand) !== make) continue;
            for (const [code, name] of Object.entries(models)) {
                if (normalize(code) === model && typeof name === 'string' && name.trim()) names.add(name);
            }
        }
        return names.size === 1
            ? { name: [...names][0], matched: true }
            : { name: fallback, matched: false };
    }

    /** 一次会话共享请求；超时、HTTP 错误或 JSON 错误后允许下次重试。 */
    function load() {
        if (!databasePromise) {
            databasePromise = (async () => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 4000);
                try {
                    const response = await fetch('./model.json', { signal: controller.signal, cache: 'no-cache' });
                    if (!response.ok) throw new Error('Model database HTTP ' + response.status);
                    return await response.json();
                } finally {
                    clearTimeout(timer);
                }
            })().catch(error => { databasePromise = undefined; throw error; });
        }
        return databasePromise;
    }

    /** 数据库不可用不阻塞照片处理，调用方可据 error 显示手动查询失败提示。 */
    async function resolve(exif = {}) {
        if (!exif.Make || !exif.Model) return lookup({}, exif);
        try {
            return lookup(await load(), exif);
        } catch (error) {
            return { ...lookup({}, exif), error: true };
        }
    }

    return { resolve, lookup };
})();
