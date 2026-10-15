# FoodLens Subscription Terms Draft

Status: planned subscription version only. Do not publish or show as active terms in version 0.4.1. Prices, benefits, recognition limits, launch territories, and store product IDs have not been selected.

## Offer details required before purchase

The purchase screen must name the plan, show the actual localized store price and currency, state the billing period, and list the benefits and recognition allowance for that period. An annual total must be shown prominently even if a monthly equivalent is also displayed. Any daily or monthly usage limit, reset schedule, unused-allowance policy, and outage remedy must be clear before confirmation.

Proposed structure: one FoodLens Pro entitlement with a monthly option and an annual option. This is a configuration proposal, not an approved offer. Do not advertise unlimited recognition under the current shared 25-request daily server budget. Define and implement paid capacity before selling it.

## Customer subscription text

The following clauses are intended for the purchase-enabled release, after the operator and offer details are finalized.

FoodLens subscriptions are optional. The store purchase confirmation displays your plan's price, billing period, and any eligible introductory offer before you approve payment. Payment is processed by Apple or Google using your store account. FoodLens does not receive your full payment-card details.

Your subscription renews automatically unless canceled through the store before its applicable renewal deadline. Your store confirmation and subscription settings show the renewal date and price. Price changes and any required consent or notice are handled under the store's rules and applicable law.

If a trial or introductory offer is available, its eligibility, length, initial charge, and the price and billing period after the offer will be shown before purchase. There is no trial unless the purchase screen explicitly offers one. Cancel before the applicable store deadline to avoid the next charge.

Manage or cancel an iOS subscription in your Apple account's subscription settings. Manage or cancel an Android subscription in Google Play's Payments and subscriptions settings. FoodLens will provide a Manage subscription button for the relevant store. Cancellation generally stops the next renewal, with access lasting for the paid period subject to the store's trial, refund, and subscription rules.

Removing FoodLens, clearing local data, or deleting a future FoodLens account does not cancel a store subscription. Cancel it separately through the store. You can use Restore purchases with the same store account on the original purchase platform, subject to the configured restoration rules. Anonymous purchases do not automatically carry from Android to iOS or vice versa. We will state any supported cross-platform access and the account requirement before purchase.

For refund requests, use [Apple's refund request service](https://support.apple.com/118223) or [Google Play's refund process](https://support.google.com/googleplay/answer/2479637?hl=en). Refund eligibility is determined by the store and applicable consumer law. Contact FoodLens support if the app did not deliver a promised feature. These terms do not remove mandatory refund or consumer rights.

Paid features retain the same recognition and medical limitations as free features. A subscription does not make a result clinically validated, guarantee allergen safety, or provide medical advice. Refer to the Terms of Use and Privacy Policy linked on the purchase screen.

## Future privacy addendum

Before adding RevenueCat, accounts, or payment features, update the active Privacy Policy and both store disclosures. Identify the subscription provider and any identity provider; describe the app user ID, store transactions and purchase tokens/receipts, entitlement and renewal/refund status, device/SDK information actually sent, retention, deletion, and support access. Record the providers' actual settings and SDK disclosure guidance. Never send label photos or dietary concerns as RevenueCat customer attributes.

An anonymous subscription ID is still an identifier. It must not be described as no data collected. Explain how subscription records remain necessary for service delivery, restoration, fraud prevention, and legal obligations, including which records cannot be deleted on request.

## Implementation and validation

- Configure production store apps, agreements, payout/tax information, subscription products, prices, and sale territories before enabling real purchase buttons.
- In App Store Connect, use a subscription group with monthly and annual products at the same intended entitlement level. In Google Play, configure subscriptions, base plans, and optional offers.
- Connect both apps to RevenueCat and map products to the same intended Pro entitlement. Choose and test restoration/transfer behavior rather than accepting it without review.
- Use native development/store test builds. Expo Go uses mock purchase APIs and cannot prove real billing works. See [RevenueCat's Expo setup](https://www.revenuecat.com/docs/getting-started/installation/expo).
- Implement the purchase screen, restore action, manage action, pending/canceled/failed payment states, and accessible links to privacy and terms.
- Protect the cloud-recognition API with a verifiable identity and backend checks of entitlement and usage allowance. Do not trust a client-supplied Pro flag, a public SDK key, or an arbitrary RevenueCat app user ID as authentication.
- Verify server notifications/webhooks, duplicates, delayed renewals, refunds, cancellations, grace periods, and entitlement revocation. Define who can resolve a missing-access complaint.
- Test purchase, restore after reinstall, upgrade/downgrade, store-account changes, offline use, and provider outage in each store's test environment. Confirm that refund and expiry stop paid cloud allowances as designed.
- Add account deletion in the app and the required web deletion route if account creation is introduced. Explain subscription cancellation separately.

Sources: [Apple subscriptions](https://developer.apple.com/app-store/subscriptions/), [RevenueCat restore purchases](https://www.revenuecat.com/docs/getting-started/restoring-purchases), [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/).
