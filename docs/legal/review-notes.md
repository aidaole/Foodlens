# FoodLens App Review Notes

Draft for the current free preview. Replace the version/build with the actual submitted build and verify the live endpoints before copying these notes into a store console. Do not claim that an English interface or subscription flow exists until included in that build.

## App purpose

FoodLens reads food packaging photos to extract ingredients and nutrition information. It is an educational label-reading tool, not a medical device. It does not diagnose, treat, cure, or prevent medical conditions, test the food, or certify allergen safety. Users are instructed to verify the original label and consult a healthcare professional for medical advice.

## Access and review steps

No FoodLens login or credentials are needed. The current preview interface is in Simplified Chinese.

1. Swipe or use Next through onboarding, optionally select nutrition interests, then choose Start taking photos (开始拍照). Skip (跳过) is available.
   A separate legal-document acknowledgment follows onboarding, including when Skip is used. Documents open without prior acknowledgment, include English text, and are bundled for offline reading. The current 0.4.3 preview labels them as drafts and records reading acknowledgment only. A store build must use verified active operator details and its final agreement wording. Upgrades preserve records but require acknowledgment when document content changes.
2. Open Camera (打开相机) or Upload from album (相册上传), select a clear food-label image, crop it, and confirm the crop.
3. On the first upload, a disclosure identifies Cloudflare Workers AI and asks permission. Agree and recognize (同意并识别) sends the image; Not now (先不发送) cancels cloud processing. No image is sent by granting camera permission alone.
4. The result presents extracted ingredients, nutrition values, source evidence, missing-data notices, and educational reminders. Check serving size and original packaging. Example products are fictional and labeled as examples.
5. History (记录) and My (我的) are bottom tabs. My → Agreements and privacy (协议与隐私) opens Terms, Privacy, Health Notice and Support. Turn off cloud recognition (关闭云端识别授权) stops future uploads without deleting history; the next upload asks again. Clear local data (清除本地数据) clears saved app data and resets cloud consent and legal acknowledgment, retaining onboarding completion.

If cloud recognition is unavailable, Try the examples (先体验示例) lets the reviewer inspect the result UI without a request. This is a clearly labeled demonstration, not a substitute for an available production backend. Before submission, provision sufficient real recognition capacity for reviewers; the current shared preview service is limited to 25 recognition reservations per UTC day and 16 per source summary/session per day. Reaching that limit can prevent review of the cloud feature.

## Data and permissions

Only a cropped, compressed photo is sent for inference, over HTTPS, after explicit agreement. The application server does not persist photos or result text. Random session IDs and daily keyed source summaries are used for security and request quotas. Cloudflare infrastructure processing is described in the Privacy Policy. Dietary/allergy settings, history, and thumbnails are stored locally and not included in recognition requests.

Camera and selected-photo access support label scanning. The app does not request microphone, contacts, or location access and does not integrate HealthKit or Health Connect. Validate these statements against the final native build's permissions before submission.

## Purchases

This submitted free-preview baseline has no in-app purchase or subscription. If the submitted version introduces purchases, replace this section with real product identifiers, entitlement descriptions, test steps, restore/manage purchase instructions, and any account access requirements. Do not submit notes describing a free app for a paid build.

## Submission fields

Operator/developer identity and reviewer contact are supplied in the store console by the publisher. Public privacy, terms, and support URLs will be generated from the verified operator configuration in `docs/legal/operator.json`. The reviewer contact need not be the public support email, but both must be reachable. Do not submit placeholder or draft URLs.
