/** 参考项目的本地 SVG 品牌资源；同名品牌优先使用矢量图，保留原有其他品牌。 */
Object.assign(logoList, {
    apple: './assets/brand/apple.svg',
    canon: './assets/brand/canon.svg',
    dji: './assets/brand/dji.svg',
    fujifilm: './assets/brand/fujifilm.svg',
    hasselblad: './assets/brand/hasselblad.svg',
    huawei: './assets/brand/huawei.svg',
    insta360: './assets/brand/insta360.svg',
    kodak: './assets/brand/kodak.svg',
    konicaminolta: './assets/brand/konicaminolta.svg',
    leica: './assets/brand/leica.svg',
    lumix: './assets/brand/lumix.svg',
    mamiya: './assets/brand/mamiya.svg',
    nikon: './assets/brand/nikon.svg',
    olympus: './assets/brand/olympus.svg',
    pentax: './assets/brand/pentax.svg',
    phaseone: './assets/brand/phaseone.svg',
    rollei: './assets/brand/rollei.svg',
    sony: './assets/brand/sony.svg',
    unknow: './assets/brand/unknow.svg',
    xiaomi: './assets/brand/xiaomi.svg'
});

/** 先匹配 EXIF 厂商，再以机型兜底；不使用镜头厂商，避免副厂镜头误判机身。 */
function detectPhotoBrand(exif = {}) {
    const aliases = {
        apple: ['apple', 'iphone'], canon: ['canon'], dji: ['dji', 'hasselblad l1d'],
        fujifilm: ['fujifilm', 'fuji'], hasselblad: ['hasselblad'], huawei: ['huawei'],
        insta360: ['insta360', 'arashi'], kodak: ['kodak'], konicaminolta: ['konicaminolta', 'minolta'],
        leica: ['leica'], lumix: ['panasonic', 'lumix'], mamiya: ['mamiya'], nikon: ['nikon'],
        olympus: ['olympus', 'omdigital', 'omsystem'], pentax: ['pentax', 'ricoh'],
        phaseone: ['phaseone'], rollei: ['rollei'], sony: ['sony'], xiaomi: ['xiaomi', 'redmi'],
        oneplus: ['oneplus'], zeiss: ['zeiss']
    };
    for (const value of [exif.Make, exif.Model]) {
        const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const [brand, names] of Object.entries(aliases)) {
            if (names.some(name => normalized.includes(name.replace(/[^a-z0-9]/g, '')))) return brand;
        }
    }
    return 'none';
}
