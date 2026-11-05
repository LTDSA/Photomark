# 机型库维护记录

更新日期：2026-11-05。原库 157 条，本次新增 11 条，总计 168 条；这是有来源核实的增量更新，不代表覆盖市场上所有机型。

## 新增条目及来源

- Sony：ILCE-1、ILCE-1M2、ILCE-7M5、ILCE-7RM6、ILME-FX2、ILME-FX3、ILME-FX3A、ILME-FX30、ZV-E10M2。
  来源：[Sony Monitor & Control 官方帮助，第 10 页](https://helpguide.sony.net/promobile/mc/v1/en/print.pdf)。Alpha 为 α 的文字写法，显示名称沿用项目现有风格。
- Xiaomi：24030PN60G → Xiaomi 14 Ultra。
  来源：[小米官方用户指南](https://gl123.alsgp0.mi-fds.com/gl123/XIAOMI/Xiaomi%2014%20Ultra/%E9%87%8F%E4%BA%A7/1850201001717A%20N1_%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97_%E8%8B%B1%E6%B3%B0%E7%89%88_A_20240123_TH%20EN.pdf)。
- Xiaomi：25010PN30G → Xiaomi 15 Ultra。
  来源：[小米官方设备资料](https://cdn.alsgp0.fds.api.mi-img.com/phone-pads/Xiaomi_15_Ultra.pdf)。

仅加入已核实的地区型号，不把国际版编号推断成国行编号。原有条目保留，本次未逐条重新核验历史数据。

## 匹配规则

导入图片自动读取 EXIF Make/Model，在本地 model.json 中查找。匹配忽略大小写、重复空白和空字符，保留型号标点；已知厂商别名归一化，同厂商的 Sony/SONY 分组均可查找。不同厂商之间不交叉猜测，歧义不自动选择。

未命中、缺少厂商、数据库超时或读取失败时，原样使用 EXIF Model；Model 也缺失才显示 Unknown。匹配结果只改变界面和水印，不修改原图的 EXIF。手动「机型匹配」复用同一规则。

维护时在 model.json 对应厂商中增加“EXIF 型号 → 展示名称”，附上官方来源，运行 npm test。未知型号先保留原文，避免错误标注。
