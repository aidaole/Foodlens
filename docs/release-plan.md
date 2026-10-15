# 从 MVP 到商店发布

## 当前状态

React Native 0.86.3 + Expo SDK57 + React19.2.3 + TypeScript，共用代码覆盖 iOS、Android 与 Web。使用 Expo Router，原生目录由 Expo 生成。相机权限文案已配置；不请求麦克风或定位。EAS 已配置 preview / development / production。

包名 `app.foodlens.mobile` 是开发占位，发布前需确认品牌名称、包名、账号归属。不能把 JS bundle 导出视为签名安装包或商店审核完成。

## 原生体验

开发机需要 Node22.13+。同一网络运行 `npm start`，在 SDK57 兼容的 Expo Go 里打开；无法使用兼容Expo Go时，创建开发构建。相机要在有摄像头的真机测试。

下一阶段可登录 Expo 并执行：

```sh
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile development --platform ios
```

开发构建需要先使用 `npx expo install expo-dev-client` 加入模块。iOS 内部设备分发需要相应 Apple 签名与设备设置。这些账号、证书和构建尚未创建。

## 发布前剩余工作

海外发布的第一阶段资料已整理到 [协议和审核材料](legal/README.md)：英文隐私政策、使用条款、支持页、订阅条款草案、数据披露、审核说明及商店文案。真实运营者、公开联系邮箱和首发市场尚待确认；这些资料尚未生效、公开发布或提交审核。订阅及登录功能仍未接入。

1. Cloudflare真实识别已接通；继续扩大真实包装数据集，测量反光、小字和不同语言条件下的字段准确率、延迟和额度消耗。
2. iOS/Android 真机拍照、相册、权限拒绝、后台恢复、不同字体大小、安全区和离线场景。
3. 审查营养与疾病提示来源；按发布地区处理 DV/NRV、过敏原规则与翻译，避免误导性医疗声明。
4. 账号所属的开发者计划、最终标识、签名证书、测试版本分发。
5. 面向正式处理照片的隐私政策、商店数据披露、服务端防滥用；商店截图和描述。
6. 清理或更新当前上游依赖安全告警，重新运行检查与原生构建。
7. 核对发布时的 Apple/Google 要求，构建生产版本，再通过 EAS 或商店后台提交。

参考：[Expo EAS 文档](https://docs.expo.dev/eas/)、[Apple App Review](https://developer.apple.com/app-store/review/)、[Google Play Console](https://play.google.com/console/about/)。这里是后续开发安排，不代表已满足审核或发布政策。
