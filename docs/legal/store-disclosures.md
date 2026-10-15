# FoodLens 商店隐私与审核填写说明

基线：2026年10月15日的 0.4.1 代码。适用于当前无账号、无付费、无广告、无分析 SDK 的版本。正式提交时必须对照最终原生包、Cloudflare 的实际设置和 Console 当时的字段重新核实；本文件不代表已提交或通过审核。

## 实际数据流

| 数据 | 去向与用途 | 保存情况 | 代码依据 |
| --- | --- | --- | --- |
| 裁剪压缩后的 JPEG | Cloudflare Worker → Workers AI；提取标签 | 自建服务只处理请求，不写照片/结果库或正文日志；提供商自身的基础设施处理另行核实 | `src/lib/recognize.ts`、`worker/src/handler.ts`、`worker/src/model-input.ts` |
| 模型输出的标签文本和营养数值 | Worker 校验后返回设备 | 本机最多50个识别食品；服务器不保存正文 | `src/lib/recognition-schema.ts`、`src/lib/store.tsx` |
| 饮食关注项、已知过敏原、营养兴趣 | 仅本机生成提醒、调整展示 | 本地保存；不随识别上传 | `src/lib/store.tsx`、`src/lib/recognize.ts` |
| 记录、收藏、压缩缩略图 | 仅当前设备 | 最多50条历史及50个识别食品缩略图；清除本地数据会清除这些信息 | `src/lib/persisted-state.ts`、`src/lib/history-thumbnail.ts` |
| IP、按日 HMAC 摘要、随机会话 ID、请求日期和计数 | Cloudflare 网络处理、防滥用与额度限制 | 应用数据库保存摘要/ID/计数，不保存原始 IP；下一 UTC 日首次成功预留调用时替换旧日记录，闲置时可能保留更久 | `worker/src/auth.ts`、`worker/src/budget.ts`、`worker/src/index.ts` |
| 客服邮件与附件 | 用户主动打开邮箱联系；邮箱服务接收 | 客服邮箱和留存流程需要运营者确认 | 未来支持渠道，无应用内自动上传 |

HMAC 摘要和随机 ID 应按假名化信息处理，不能因没有姓名便认定完全匿名。HTTPS 是传输加密，不是让服务商无法读取照片的端到端加密。本机 AsyncStorage 也不是专门加密的健康信息库。

## Google Play Data safety 草案

Google 将离开设备的传输计入 collection；即使满足 ephemeral processing，仍需在表单回答。仅本机处理的数据可不列为云端收集。第三方作为受指示的服务提供商处理可适用 sharing 的例外，但隐私政策仍须披露 Cloudflare。不要因为服务不写照片库就勾选完全不收集。依据：[Google Data safety 定义](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)。

| 表单项 | 当前建议填写和复核点 |
| --- | --- |
| Photos | 收集，用于 App functionality；用户可拒绝上传、使用示例。仅在确认服务端和 Cloudflare 整条链路符合临时处理条件后，选择 processed ephemerally。不能仅凭 `store:false` 判断。 |
| Device or other IDs | 申报用于 Fraud prevention, security and compliance 的随机会话 ID 和来源摘要；不按即时处理豁免。它们并非硬件 ID，但应核对该分类涵盖的标识信息。云端功能请求会生成。 |
| IP 对应分类 | IP 仅用于安全、不在应用代码中推导地理位置。核实 Cloudflare 实际处理；若派生或保存位置等数据，增加对应分类，不能自动称完全不涉及位置。 |
| Health and fitness | 饮食/疾病关注设置仅本机，不作为当前云端健康信息收集申报；若用户照片意外含健康信息或今后上传设置，应重新评估。 |
| App activity / Diagnostics | 没有分析 SDK。核实提供商是否保存逐次请求活动或诊断信息，并据实际内容增加字段；计数使用安全目的。 |
| Shared | 先核实 Cloudflare 的服务商条款及配置是否符合 service provider exception。符合才填写对应不分享；这不等于照片从未交给第三方。 |
| Encrypted in transit | 识别 API 只使用 HTTPS；正式原生包和所有新 SDK 都验证后勾选。 |
| Deletion | 说明本地清除路径和隐私邮箱。服务计数的替换周期与客服邮件删除分别处理；没有账号，不虚构账号删除界面。 |
| Purchases / Contact info | 当前没有购买 SDK 或应用内联系表单。加入 RevenueCat/账号或内置客服后更新申报；外部邮箱支持按 Console 的适用范围核对。 |

## Apple App Privacy 草案

Apple 的 collection 定义关注离开设备后是否可访问超过实时请求所需的时间，与 Google 不完全相同。只在有依据确认提供商也不超出实时处理后，才将照片/提取文本按即时处理排除；当前不要直接提交 Data Not Collected。假名化标识保存用于防滥用，需要按其定义评估是否关联用户。依据：[Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/)。

建议准备的字段：保存的随机会话 ID 和 HMAC 来源摘要，评估 Identifiers 中适用的 ID 类型或 Other Data；用途为 App Functionality（包含安全、防滥用）。在照片需要申报时使用 User Content → Photos or Videos，标签正文根据实际处理映射 Other User Content。不用于广告、第三方广告或跨应用 tracking。无姓名登录不代表自动满足 Data Not Linked to You，关联性需要逐项判断。仅本机饮食设置及历史不作为服务器收集申报。网络/诊断数据由提供商实际处理决定是否增列。

Privacy Manifest、Required Reason APIs 和依赖 SDK 签名要从最终 iOS 包检查，不能用本 Markdown 替代构建中的声明。尚无签名 iOS 生产包。

## 健康与 AI 声明

Google 的 Health apps declaration 将营养相关功能包含在范围内，建议按 Nutrition and Weight Management 的实际功能描述填写；不宣称医疗器械认证、疾病诊断或治疗。商店类别与健康声明不是同一件事。依据：[Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)。

商店描述和应用说明应明确：FoodLens is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Consult a qualified healthcare professional for medical advice, diagnosis, or treatment. 避免声称“糖尿病可以放心吃”“检测食物是否安全”“准确识别全部过敏原”。当前模型测试已发现可能漏读小字和过敏原，不能声明已临床验证。

首次照片上传前须明确 Cloudflare Workers AI 是接收方，说明照片、用途、保存范围并独立征得同意。相机系统权限不能替代这一步。隐私政策须有公开、无需登录、不限制地区的 HTML URL，且在应用里可访问。依据：[Apple 5.1.1 与 5.1.2](https://developer.apple.com/app-store/review/guidelines/)、[Google Health and Medical Apps 政策](https://support.google.com/googleplay/android-developer/answer/18258653?hl=en)。

当前 AI 仅提取标签字段，后续规则生成提醒。应按提交时的 Generative AI content 政策核对其适用范围，不把普通 OCR 与聊天生成产品混为一谈。无论是否适用该专项规则，都应提供明确的结果错误反馈渠道。

## 加入订阅或账号后

重新声明 RevenueCat、Apple/Google 购买记录、购买标识、订阅状态、SDK 网络信息，以及所选身份服务处理的数据。当前材料不涵盖尚未接入的 SDK。账户创建一旦开放，应实现应用内删除和 Google 要求的外部删除入口，并说明取消订阅要在商店单独操作。
