# FoodLens 海外上架准备清单

状态日期：2026年10月15日。第一阶段完成文档正文和网页生成流程；还需真实运营者信息才能定稿公开。当前未提交 App Store 或 Google Play，也没有启用订阅。

## 协议和审核资料

- [x] 按源代码梳理照片、OCR、本机偏好、历史缩略图和防滥用计数的数据流。
- [x] 英文 Privacy Policy、Terms of Use、Support 页面正文。
- [x] 后续订阅条款草案和会员后端接入说明。
- [x] Apple / Google 数据披露填写依据、英文审核员说明和商店文案。
- [x] 无需登录的 HTML 页面生成流程；缺少身份或联系方式时阻止发布。
- [ ] 填写运营者法定名称、公开邮箱、首发国家、生效日期；确认邮箱可用及权利请求处理流程。
- [ ] 依据首发地区定稿：例如 EEA/UK 需核实控制者联系方式、合法处理依据、跨境机制、必要的地区代表/联系信息、权利请求期限；不能仅因英文页面存在就宣称符合所有地区法律。
- [ ] 确认 Cloudflare 服务关系、DPA 适用性、日志/留存和分包商处理，落实所需保护；正文不能替代服务商配置和合同。参考：[Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/)。
- [ ] 发布三个消费者 HTML 页面并验证手机访问；将正式 URL 放进商店和应用内。
- [ ] 对照最终生产包填写商店隐私和健康声明；RevenueCat、账号、客服 SDK 加入后再更新。

## 应用和服务

- [ ] 英文界面、权限文案、营养单位和提示；当前消费者界面主要为中文。
- [ ] 加入易找的隐私/条款/支持入口和停止云端处理的操作；当前清除本地数据会重置云端同意，但也清除偏好。
- [ ] 核查英文标签、小字、反光、缺失营养值和过敏原的真实识别；没有严重过敏安全保证或临床准确率声明。
- [ ] iOS/Android 真机权限拒绝、照片选择、裁剪、上传、离线、后台恢复、字体放大和安全区验证。
- [ ] 最终 Android Manifest 不申请不必要的广泛媒体、麦克风、定位权限；优先系统照片选择。SDK 的默认权限也要核查。
- [ ] iOS Privacy Manifest、Required Reason API 声明和所需 SDK 签名由最终原生构建验证。
- [ ] 提升并测量生产识别容量、延迟及成本，保障审核员能使用真实云端功能；当前共享25次/日预算不能作为付费产品容量。

## 开发者和商店

- [ ] Apple Developer / Google Play Console 的账号、实名认证、发行身份、税务/收款与相关协议。
- [ ] 核实健康相关产品是否要求组织发行账号；不能一概认定营养提醒一定可按个人账号发布。根据真实功能类别选择，必要时准备 D-U-N-S。参考：[Google 开发者账号要求](https://support.google.com/googleplay/android-developer/answer/13634885?hl=en)、[Apple Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)。
- [ ] 确认品牌及应用标识 `app.foodlens.mobile`，安全备份正式签名，避免发布后再换包名。
- [ ] Android 生产 AAB 和 iOS 签名生产构建；体验 APK 不是 Google Play 提交产物。
- [ ] TestFlight 和 Google 测试轨道；若为适用的新个人 Google 账号，需满足12名测试者连续选择加入14天等生产权限申请要求，不是等待14天便自动通过。参考：[Google 测试要求](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)。
- [ ] 应用商店截图、分类、内容分级、目标年龄、支持 URL、版权和发布地区。非儿童定位不等于可任意填写商店分级。
- [ ] EEA 等地区的发行者/trader 身份和联系信息要求，在开放相关销售地区前处理。

## 订阅版另外完成

按 [subscription-terms-draft.md](subscription-terms-draft.md) 和 [subscription-architecture.md](subscription-architecture.md) 落实商品、价格/额度、付费身份验证、购买/恢复/管理、退款/到期/续费校验、数据披露。免费版本可先发布；后续收费需要明确的商品与功能，不能把文档准备误当作支付接入已完成。
