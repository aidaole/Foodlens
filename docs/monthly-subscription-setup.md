# FoodLens 月会员配置与测试

用户选择：人民币参考价 9.90 元/月；匿名免费身份累计三次成功识别；有效月订阅每个周期五十次成功识别。示例不计次，失败或重拍不扣次，未用次数不结转。周期取商店核验后的本期购买时间，成功续订才重置，不以自然月或客户端时钟重置。

## 当前状态

0.4.4 已加入会员页、剩余额度、月订阅条款、原生 RevenueCat SDK 和购买/恢复/管理代码，Cloudflare 已部署签名使用身份、累计免费额度及会员核验逻辑。当前没有配置商店商品或 RevenueCat 密钥，真实购买保持关闭。三次免费识别已在新版 v2 接口生效；真实付款及商店恢复测试未完成。

购买按钮必须同时满足：正式协议信息完整、原生平台 SDK 公钥和购买开关已配置、后台购买已开放、商店能返回一个月周期的有效商品。网页预览不开通商店购买。付款状态未确认时，不显示会员成功，也不允许重复点击购买。SDK 成功后仍以后台验证结果决定识别权益。

## 商店和 RevenueCat

1. 完成 Apple Developer / Google Play Console 的发行账号、收款税务资料和相应协议。包标识保留 app.foodlens.mobile；正式生产签名另行准备，体验签名不直接作为生产发布依据。
2. Apple 建立一个订阅组及一月自动续订商品；Google 建立订阅及一个月自动续订 base plan。两家商品 ID 统一为 foodlens_pro_monthly，Google base plan 建议 monthly。不要配置年付或试用优惠。人民币 9.90 为参考，首发海外地区的实际价格需在商店中选择，并核对应用读取的本地价格。
3. RevenueCat 创建 FoodLens 项目，关联两家应用及所需商店凭据，把月商品绑定 pro entitlement；current offering 的 monthly package 指向该商品。配置并测试恢复/转移规则。
4. 客户端仅配置 EXPO_PUBLIC_REVENUECAT_ANDROID_KEY / EXPO_PUBLIC_REVENUECAT_IOS_KEY 的平台公开 SDK key。私密 API key、Apple p8、Google 服务账号文件不可放入 EXPO_PUBLIC、GitHub 或聊天。
5. 服务端使用 Wrangler Secret 配置 REVENUECAT_SECRET_API_KEY，使用支持 v1 Customer Info 查询的授权配置。后台每次识别都查询核验，不接受客户端 Pro 标志或自报用户 ID。
6. 在独立测试配置中开启沙盒支持，分别验证实际商店响应字段、购买、等待审批、取消、恢复、续订、退款、宽限和到期；生产默认拒绝沙盒交易。普通侧载 APK 不能替代 Google Play 测试轨道和商店账号测试。

## 后台身份和额度

服务器生成 UUID 及带 installation 域标签的 HMAC 凭证，调用者不能选择收费身份。原生凭证放在 Expo SecureStore，网页凭证放在浏览器存储；清除本地识别记录不清除此凭证。没有 FoodLens 注册登录，跨平台身份同步未提供。

免费额度按匿名身份累计；匿名身份丢失或新安装可能产生新身份，防滥用还依靠来源限流及全局预算。这不是已验证的“每位自然人三次”机制，若需严格按人限定，增加可验证账号或设备证明。

会员使用后台 RevenueCat Customer Info 的权益和商店交易核验，不以匿名 ID 或客户端缓存作为付款证明。有效交易的额度按商店交易标识的 HMAC 摘要对应到 Durable Object，恢复或转移到新安装不会重复获得同一期五十次。订阅数据不可用时返回核验错误，不把已知核验失败视为购买成功。

每个使用身份/付费周期一次只预约一个识别，失败释放，成功提交，重复提交不重复计数；遗留预约十分钟后失效。套餐次数以服务端完成为准，手机在途取消或断网仍可能计一次，页面及条款已披露。全局模型预算限制失败不扣套餐次数，但已调用模型的失败可能消耗提供方资源预算。

## 开放真实购买前

- operator.json 补齐真实运营主体、公开邮箱、首发地区、生效日期；核对并发布隐私、用户及订阅条款。现有免费版本措辞需要随正式收费启用同步定稿；SDK 数据披露、Apple App Privacy / Google Data safety 和原生隐私清单按生产包核对。
- 当前全站每日模型预算仍为 25，须测量延迟、成本、容量和付费服务保障，配置足够容量后才销售会员；不能宣称无限识别。
- 完成上述商店测试后，再将服务端 BILLING_ENABLED 和原生 EXPO_PUBLIC_BILLING_ENABLED 设为 true，重新构建生产包。生产 ALLOW_SANDBOX_SUBSCRIPTIONS 保持 false。
- 收费开启时旧 v1 识别接口自动返回更新提示，避免通过旧短期会话绕过新套餐额度。此前为兼容旧体验包而保留 v1 免费预览接口。

依据：[RevenueCat Expo](https://www.revenuecat.com/docs/getting-started/installation/expo)、[Customer Info API](https://www.revenuecat.com/docs/api-v1/customers)、[Apple 月订阅](https://developer.apple.com/app-store/subscriptions/)、[Google 订阅配置](https://support.google.com/googleplay/android-developer/answer/140504?hl=en)。
