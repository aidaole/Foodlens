# FoodLens Cloudflare 识别后端

App 裁剪后发送 JPEG → Worker 校验会话和图片 → Workers AI 读取标签 → 字段与原文校验 → 换算单位 → App 显示结果并本地保存。

## 当前状态

用户授权后已部署到 `https://foodlens-recognition.aidaole.workers.dev`，当前版本0.4.0，`MODEL_ENABLED=true`，模型为 `@cf/google/gemma-4-26b-a4b-it`。中文标签和英文液体标签线上识别成功，非食品备忘录返回422补拍。保留Workers Free计划，没有升级或绑定付费服务。Root提供同一MVP的静态网页版，原生连接失败时可通过浏览器尝试。

## 配置

使用 Node22.13+，在本目录安装依赖并登录：

```sh
npm ci
npx wrangler login
npm run check
npm run bundle
```

Wrangler 凭据留在本机或系统钥匙串。App 中只包含公开 Worker 地址，没有 Cloudflare API token。匿名一小时会话使用服务端 HMAC 签名。

创建随机 SESSION_SECRET 并通过 `wrangler secret put SESSION_SECRET` 写入 Worker，不要提交或输出秘密。Gemma 4 由Cloudflare托管，模型使用Apache2.0许可；无需向App分发权重。设置MODEL_ENABLED后部署，首次部署先关闭，再验证模型后开启。

```sh
npm run deploy
```

把部署得到的 HTTPS 地址写入 App 根目录 `.env.local`：

```text
EXPO_PUBLIC_RECOGNITION_URL=https://foodlens-recognition.aidaole.workers.dev
```

重启Expo并重新生成APK，环境变量在打包时内置。手机不依赖本地开发服务器。部署前先从App根目录执行 `npm run build`，生成ASSETS绑定使用的dist；其中只包含公开前端代码与资源，禁止放入后端凭据或用户照片。ALLOWED_ORIGINS配置了localhost和Worker自身Origin；仍允许无Origin的原生客户端，拒绝其他网页来源。

## API

- GET /health：版本和准备状态，无模型调用。
- POST /v1/session：获取签名的匿名会话，一小时有效。
- POST /v1/recognize：Authorization: Bearer <会话>；JSON `{ image: "data:image/jpeg;base64,..." }`。图片最多2MB，整个请求最多2.8MB；只允许内嵌JPEG，不能用任意外部URL抓取。
- 成功：`{ food: ... }`，数值归一至每100g或每100mL，kJ转kcal、g钠转mg；缺失值为null。
- 401：会话过期，客户端只刷新一次。
- 422：标签不清晰或字段无法校验，请重拍。
- 429：短时频率或每日额度限制。
- 503：模型繁忙、未启用或其他临时错误。

## 额度和数据

SQLite Durable Object通过事务在所有请求间执行全局每日25次上限，匿名会话及来源摘要每日16次；UTC日界限更新。0.3.3将原8次来源限制改为16次，以免开发测试消耗影响真机复测；全局仍25次。新建会话不能绕过来源和全局限制。Cloudflare Rate Limiting另限同来源5次/分钟（会话与识别各一次请求会消耗2次短时额度）。失败模型调用也占每日次数，防止失败重试持续消耗推理额度。每日次数不是Neurons额度的换算保证，正式测试后应测量实际消耗；不自动升级付费计划。

Worker不保存或记录照片、OCR正文或饮食偏好。限流持久记录仅含最近一个请求日的计数、随机会话ID和按日HMAC摘要；新日首次请求替换旧日计数。Cloudflare自身按服务条款处理推理输入，参见官方数据使用说明。

模型输入是未信任内容，提示明确禁止执行包装内指令；模型只能提取标签，不生成医疗建议。归一化和提醒在确定性代码内完成。与自转录原文匹配不能证明模型读对像素，真实中文包装、反光、极小字号仍需实测。

模型使用messages内的image_url数据URI，JSON模式，关闭思考，最多3200输出token，store=false。只接受完整stop响应；截断、拒绝、工具调用及非JSON不能成为结果。

来源：
- https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/data-usage/
- https://developers.cloudflare.com/durable-objects/platform/pricing/

Gemma 4许可：https://ai.google.dev/gemma/apache_2

早期候选Llama3.2已在用户授权后接受许可；中文校验图出现未标注数值补全和非JSON输出，被程序拒绝。最终服务不使用Llama。临时模型启用Worker已删除。
