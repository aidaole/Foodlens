# FoodLens Privacy Policy

Effective date: {{effectiveDate}}

FoodLens is operated by {{operatorName}} ("we", "us", or "our"). Contact us about privacy or your information at [{{privacyEmail}}](mailto:{{privacyEmail}}).

FoodLens helps you read food packaging, ingredients, and nutrition labels. This policy covers the FoodLens mobile app and its recognition service. The current version does not require an account and does not offer paid subscriptions.

## Photos and cloud recognition

When you choose to scan a label, the app lets you crop your selected photo and compresses it before uploading. The cropped, compressed image is sent over HTTPS to our recognition service on Cloudflare Workers and processed by Cloudflare Workers AI to extract label text and nutrition information. Cloudflare hosts the vision model; we do not send your photos to a separate Google AI API.

Before the first upload, the app explains this processing and asks you to agree. You can decline and use the example results. Camera or photo-library permission alone is not your agreement to cloud recognition. Please crop out faces, receipts, addresses, and other personal information, and only upload images you are entitled to use.

Our application server does not store photos, extracted text, or recognition results in a database or write them to application logs. They are processed to answer your request and returned to your device. Cloudflare also processes network and operational information to provide and protect its services. Its infrastructure practices are described in its [Privacy Policy](https://www.cloudflare.com/privacypolicy/) and [Workers AI data usage documentation](https://developers.cloudflare.com/workers-ai/platform/data-usage/).

We do not use your photos or results for advertising or model training. Cloudflare states that it does not use Workers AI customer content to train models or improve its services without explicit consent. We have not enabled storage of recognition content in a Cloudflare storage product.

## Information saved on your device

The app saves your selected nutrition interests, dietary concerns, and allergy preferences on your device. These settings are used locally to organize results and display reminders and are not included in recognition requests.

Recognition history, extracted label text, nutrition results, compressed label thumbnails, favorites, the onboarding status, and your cloud-consent setting are also saved locally. The app retains up to 50 history entries and up to 50 recognized foods with their thumbnails; older entries are replaced as new entries are added. There is no FoodLens cloud backup or synchronization of this history.

Local app storage is not separately encrypted by FoodLens. Device security, operating-system backups, and temporary photo files are controlled by your device and operating system. Other people with access to an unlocked or shared device may be able to view your saved information.

## Service security and usage limits

Requests to our service include a source IP address and standard network information needed to deliver them. Our service uses the IP address to derive a daily keyed summary for rate limiting. It stores the summary, a random session ID, a UTC request date, and request counts to prevent abuse and enforce service limits. A keyed summary is pseudonymous information, not a guarantee of anonymity. Our application database does not store the raw IP address.

Session tokens expire after one hour. The usage-counter record for the current request day is replaced on the first recognition reservation on a later UTC day. If the service is idle, the previous counter record can remain until another request replaces it. Cloudflare may process or retain infrastructure and security information under its own applicable terms. We do not claim that all infrastructure information is deleted when a recognition response is delivered.

The app does not request location, contacts, or microphone access. It has no advertising or analytics SDK and does not use advertising identifiers, sell personal information, or share it for cross-context behavioral advertising. FoodLens does not connect to Apple HealthKit or Android Health Connect.

## Support messages

If you email us, we receive your email address and the information you choose to include. We use it to answer your request, investigate problems, and meet applicable legal obligations. You do not need to include a photo, a diagnosis, or detailed health information to contact support. Email is processed by the mailbox service we use; do not send passwords, payment-card details, or identity documents.

We keep support correspondence only as long as needed to resolve the request, handle a related dispute, or meet a legal retention requirement. You may ask us to delete it, subject to those requirements.

## Service providers and disclosures

Cloudflare provides hosting, network security, cloud inference, and usage-counter storage. It processes information to operate these services. We may also disclose information when required by applicable law, to respond to a valid legal request, or to protect users and the service. If the service is transferred to another operator, the information involved remains subject to applicable privacy protections and users will be notified of material changes.

We do not provide your locally stored dietary settings or history to a service provider through the recognition API. Opening an external reference website or your email app is subject to that service's privacy practices.

## Your choices and deletion

You can deny camera permission and use the photo picker, deny image access and use the examples, or decline the cloud-recognition prompt. You can change permissions in your device settings at any time.

In the app, open My (我的), select Clear local data (清除本地数据), and confirm. This removes saved history, recognized foods, thumbnails, favorites, and dietary preferences from the app's saved state, and resets cloud consent. It keeps the onboarding-completed flag. The app will ask for agreement again before another cloud upload. Stop submitting photos if you want to stop cloud processing. Clearing local data does not retract a completed request, delete usage counters on our server, or necessarily delete operating-system photo caches or backups.

There is currently no FoodLens account to delete. We cannot read or remotely recover history stored only on your device. To request access to or deletion of information we hold, contact [{{privacyEmail}}](mailto:{{privacyEmail}}). We may ask for the minimum information needed to verify and locate your request; we do not need your account password or identity-document number. Because we do not maintain a named account database, we may not be able to associate a request with a particular usage counter without additional information.

Depending on the laws that apply to you, you may have rights to access, correct, delete, or receive your personal information, restrict or object to certain processing, withdraw consent, or complain to the relevant privacy authority. We handle requests within the deadlines required by applicable law and do not discriminate against you for exercising applicable privacy rights. Withdrawing consent does not affect processing that already occurred lawfully.

## International processing

Cloudflare operates a distributed network, and information sent to the recognition service may be processed outside your country. We do not promise that recognition runs in a particular country. Where applicable law requires safeguards for international transfers, those safeguards must apply to the relevant provider relationship and processing. Contact us for information about safeguards applicable to your request.

## Children

FoodLens is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has submitted personal information, contact us so we can investigate and address information we hold. Local minimum-age and parental-consent requirements may also apply.

## Security and changes

We use HTTPS for recognition requests, signed short-lived session tokens, server-side validation, and usage limits. No system can guarantee absolute security; use your device's screen lock and review images before sending them.

We will update this policy when our practices change and update the effective date. Material changes, such as adding accounts, subscriptions, analytics, or cloud history, will be explained before the new processing begins, with consent where required. The current policy does not describe a RevenueCat or payment integration because it is not active in this version.

## Contact

Operator: {{operatorName}}

Privacy: [{{privacyEmail}}](mailto:{{privacyEmail}})

Support: [{{supportEmail}}](mailto:{{supportEmail}})
