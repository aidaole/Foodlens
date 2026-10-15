# FoodLens 海外发布协议和审核材料

已按当前 0.4.3 的实际数据流完成中英文隐私政策、用户协议、客服帮助及健康信息说明，以及订阅条款草案、商店数据披露、英文商店描述和审核员说明。运营者法定名称、公开邮箱与首发地区尚待确认，因此目前是可审阅的草案，尚未发布为生效协议或提交商店。

## 文件

| 文件 | 用途 |
| --- | --- |
| [privacy-policy.md](privacy-policy.md) | 英文隐私政策，覆盖照片云处理、本机设置和缩略图、限流标识、留存、删除与权利 |
| [terms-of-use.md](terms-of-use.md) | 英文使用条款与医疗/过敏原识别限制，当前版本无付费 |
| [support.md](support.md) | 英文支持页面，含故障反馈、本地删除和隐私请求方法 |
| [subscription-terms-draft.md](subscription-terms-draft.md) | 后续付费版本的续费、试用、恢复、取消、退款条款及接入清单 |
| [store-disclosures.md](store-disclosures.md) | Apple App Privacy / Google Data safety 填写依据和必须复核的提供商信息 |
| [review-notes.md](review-notes.md) | 英文审核员操作说明，无账号登录要求 |
| [store-listing.md](store-listing.md) | 英文应用名称、副标题、描述与医疗提示 |
| [subscription-architecture.md](subscription-architecture.md) | RevenueCat、登录与 Cloudflare 会员验证的职责和建议 |
| [launch-checklist.md](launch-checklist.md) | 从本次文档准备到海外上架的剩余事项 |

## 定稿和公开网页

公开信息统一配置在 [operator.json](operator.json)。请填写真实运营者名、可公开并有人处理的 privacyEmail/supportEmail、实际生效日期、首发国家。邮箱可以相同。配置文件只保存需要公开的信息，不得填 API key、密码或证件号。

填好后核实运营者身份与商店发行者对应，确认所选市场的适用条款、客服及权利请求流程，再把 `publicationReady` 设为 `true`。本次按当前功能准备的英文基础文本不等于各地区均已完成法律评估；开放 EEA/UK 等地区前补齐相关地区要求。

在项目根目录执行：

```sh
npm run legal:preview
```

预览输出到 `.tools/legal-preview/`，有明显 Draft 标识，可用浏览器打开 index.html。订阅草案和内部审核说明不生成消费者网页。

满足定稿条件后执行：

```sh
npm run legal:publish
npm run build
```

发布命令会先验证全部必填配置；缺少真实运营者、有效邮箱、日期、市场或 publicationReady 会直接失败，不写入 `public/`。成功后生成 `public/legal/index.html`、`privacy.html`、`terms.html`、`support.html`；Expo 静态导出后，按现有部署流程将 HTML 一起部署到 Cloudflare。验证线上200状态、手机阅读、链接和无需登录访问后，才使用以下正式地址：

- `https://foodlens-recognition.aidaole.workers.dev/legal/privacy.html`
- `https://foodlens-recognition.aidaole.workers.dev/legal/terms.html`
- `https://foodlens-recognition.aidaole.workers.dev/legal/support.html`

这些是计划发布路径，当前不保证已存在。长期可迁移到自有域名并保留原链接跳转。不要把有 Draft 标识的预览地址填进商店。

## 应用内阅读与确认

0.4.3 已加入「我的 → 协议与隐私」、关于页面、引导页和首次云端上传提示的协议入口。中英文全文随包保存在设备，可离线阅读。当前运营信息未齐时明确展示草案，不提供虚构邮箱或失效邮件链接。草案阅读确认不代表同意未来正式条款。

完成引导后先显示阅读确认页；旧版升级也需确认新文档，已有记录和偏好保留。云端照片处理仍单独征求同意，可在我的页面关闭后续授权；关闭不删除历史，也不撤回已发送请求。清除本地数据会重置协议确认。

正文源文件位于本目录；`.zh.md` 为中文版本，无语言后缀的文档为英文版本。运行 `npm run legal:sync` 同步为 `src/content/legal-documents.json`。同一份源文件用于应用和公开 HTML，避免内容分叉。新增或变更正文及运营信息会改变修订标识，应用下次启动重新提示。`npm run build`、原生打包脚本和类型检查会自动同步。

正式启用前核对中英文一致性和实际市场要求，再按上述流程发布公开 HTML；应用内全文不替代商店要求的公开政策网址。订阅草案不展示为当前生效的付费条款。
