# Changelog

All notable changes to Mercur will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.2] - 2026-02-04

### Release 1.5.2

#### Storefront

https://github.com/mercurjs/b2c-marketplace-storefront

- Fixed missing validation when submitting a non-existing email in Forgot password flow
- Added missing close (×) icon in Reset password link modal
- Improved validation and error handling in authentication-related views
- Minor UI consistency fixes across customer-facing forms

#### Admin Panel

https://github.com/mercurjs/admin-panel

- Fixed error state when using Create Product Attribute
- Added missing validation feedback during product attribute creation
- Fixed pagination issues affecting multiple admin views
- Improved stability and UX consistency across admin lists and forms
- Minor UI and error-handling fixes

#### Vendor Panel

https://github.com/mercurjs/vendor-panel

- Fixed pagination and listing issues in vendor views
- Improved form validation and error feedback
- Minor UI and UX consistency improvements
- General bug fixes improving day-to-day vendor operations

#### Other/Platform

- General bug fixes and internal stability improvements
- Minor UI polish across shared components
- Technical refinements not directly visible to end users

## [1.5.1] - 2026-01-19

### Release 1.5.1

#### Admin Panel

https://github.com/mercurjs/admin-panel

**Fixed**

- Resolved issues with order filtering not returning correct results.
- Fixed errors occurring when creating reservations.
- Corrected promotion behavior where campaigns were not activated at their start date.
- Prevented unintended creation of duplicate metadata when editing existing entries.
- Fixed inability to remove metadata values from product attributes.
- Corrected incorrect default selection of Tax Inclusive Pricing under specific conditions.
- Fixed error triggered by clicking Create Fulfillment.
- Resolved UI issues in Return Reasons and after sorting + delete actions.
- Fixed issue where Allocations options were visible for Free Shipping promotions.
- Resolved issue preventing approval of Product Categories.
- Fixed incorrect visibility of Edit Prices option when products are not assigned to a price list.

**Improved**

- Improved error messaging on Create Fulfillment view.
- Updated tables to use index instead of internal IDs for improved consistency and UX.

#### Vendor Panel

https://github.com/mercurjs/vendor-panel

**Fixed**

- Resolved issues preventing vendor registration.
- Fixed errors when connecting Stripe.
- Fixed missing or incorrect price lists despite successful creation.
- Resolved multiple issues with product filtering, sorting, and searching, including:
- Tag-based filtering
- Collection view filtering
- Promotions view filtering and sorting
- Fixed multiple 500 errors when sorting price lists by title or status.
- Corrected inconsistent order return status shown in different views.
- Fixed errors when:
- Saving campaign additional attributes
- Adding products to promotion conditions
- Editing shipping profiles
- Fixed incorrect values being applied in promotion conditions.
- Resolved inventory-related UI issues, including incorrect toast behavior.
- Fixed UI/UX issues for stock location titles.
- Addressed unknown errors in returns flow.

**Improved**

- Added stronger password validation during vendor registration.
- Added missing validation rules in Promotions.
- Improved overall stability and UX of Inventory, Promotions, and Products views.

#### Storefront

https://github.com/mercurjs/b2c-marketplace-storefront

**Fixed**

- Fixed missing order confirmation email after placing an order.
- Fixed wishlist page rendering as empty instead of showing products.
- Corrected promotion logic where:
- Free shipping was not reducing shipping cost to zero
- Percentage-off product discounts were calculated incorrectly
- Fixed incorrect cart calculations for promotions applied at checkout.

**Improved**

- Stabilized shared storefront components to prevent rendering issues across pages.

## [1.5.0] - 2025-12-18

### Release 1.5.0

Version 1.5.0 is a stability and correctness-focused release, addressing a broad set of issues across Admin, Vendor, and Storefront applications. The changes improve reliability of promotions and pricing, reduce UI friction, and ensure a more predictable experience for both internal users and end customers.

#### Admin Panel

https://github.com/mercurjs/admin-panel

This release improves promotion management, data consistency, and overall stability of key admin workflows.

- Improved promotion conditions handling, including fixes for missing or incorrectly selectable attributes.

- Resolved multiple issues in promotion creation and editing flows to ensure all conditions and values are properly displayed and selectable.

- Fixed validation and UI inconsistencies in promotion rules that could lead to incorrect configuration or blocked workflows.

- Addressed problems with redundant or missing data in admin forms, improving reliability and predictability of configuration screens.

- Improved error handling and feedback in cases where invalid or incomplete data was submitted.

- Minor UI and usability fixes across admin views to reduce friction during daily operations.

#### Vendor Panel

https://github.com/mercurjs/vendor-panel

This release focuses on improving price management, product configuration, and reducing disruptive UI behavior.

- Fixed issues with missing or incorrect price data when adding products to price lists.

- Improved handling of product attribute changes to prevent redundant confirmation modals.

- Ensured current prices and attributes are consistently visible and correctly applied during product and price list management.

- Resolved UI inconsistencies that could cause confusion or unnecessary interruptions when editing vendor data.

- General stability improvements in vendor-facing forms and flows.

#### Storefront

https://github.com/mercurjs/b2c-marketplace-storefront

This release brings multiple fixes that improve correctness, clarity, and user experience for end customers.

- Fixed pricing and promotion-related issues to ensure correct values are displayed and applied during shopping flows.

- Improved consistency of product and promotion data shown to customers.

- Addressed UI and text inconsistencies to make the storefront experience clearer and less error-prone.

- Resolved edge cases that could lead to incorrect behavior during browsing or checkout-related interactions.

- General bug fixes and stability improvements across storefront views.

## [1.4.6] - 2025-12-16

### Release 1.4.6

#### Infrastructure

- **Docker support and improved seeding**

  Added Docker configuration for the backend service and improved the seeding process.

- **SSL connection for PostgreSQL database**

  Fixed database connection to enable SSL for PostgreSQL, ensuring secure connections in production environments.

- **Simplified Dockerfile CMD**

  Refactored the CMD instruction in the backend Dockerfile for cleaner execution.

- **Environment example updates**

  Updated `.env.example` with correct configuration values.

## [1.4.5] - 2025-12-10

### Release 1.4.5

#### Storefront

- **Clearer promotion field in cart**

  Updated the label in the cart from “Promotion codes” to “Promotion code”, matching the actual behaviour where only one code can be applied at a time.

- **Shipping address no longer resets when changing quantity**

  Fixed an issue on checkout where changing the quantity of a product caused the selected shipping address to be cleared. The selected address now stays intact.

- **Category hover behaviour aligned with design**

  Restored the category hover interaction on the main page so that the extended category panel appears according to the design specification.

- **Product listing shows all products, not just 20**

  Removed the hard limit of 20 items on the product listing page. Users can now scroll through the full product list without hidden items disappearing.

- **Stronger validation on registration form**

  Added basic validation rules to the customer registration form (length and format checks for name, email, phone and password), preventing unrealistic or malformed input.

- **Improved login error feedback**

  Adjusted login validation so users receive clear, visually highlighted error states rather than a generic error message, making it easier to understand what went wrong.

- **More understandable wording in order confirmation emails**

  Replaced the ambiguous “Amount” label in order confirmation emails with clearer wording related to price, making price details easier to read and understand.

- **Session expiration messaging**

  When a session expires, customers now see a clear message instead of silent failures, reducing confusion and guiding them to log in again.

#### Vendor Panel

- **Product creation unblocked**

  Fixed a bug that prevented vendors from finishing product creation on the Variants step and displayed a “This feature is disabled” message. Vendors can now complete the flow without issues.

- **Organize view: dropdowns can be cleared**

  In the product “Organize” step, vendors can now clear previously selected Type, Collection and Category values instead of being locked into the initial choice.

- **Stronger password rules for vendor registration**

  Introduced validation for the password field in vendor registration so very weak passwords (e.g. two characters) are no longer accepted.

- **Removed images no longer appear on the storefront**

  Fixed a bug where deleting a product image in the Vendor Panel did not remove it from the storefront product view. The storefront now reflects the latest vendor-side changes.

- **Stable search on Product Types view**

  Resolved an error that appeared when typing into the search field on the Product Types settings view. Searching now works as expected without error screens.

- **Country conditions can be removed from promotions**

  Corrected the promotions editor so vendors can remove country conditions using either the “X” icon or the “Clear all” action.

- **Session expiration messaging for vendors**

  Added dedicated messaging for expired sessions in the Vendor Panel, so vendors immediately see what happened and can log back in.

#### Admin Panel

##### Configuration & Settings

- **Locations & Shipping settings improvements**
  - The Locations & Shipping view now shows a correct count of results that matches the actual number of entries.

  - Fixed inappropriate pagination behaviour so that navigation between pages correctly updates the list of locations and shipping settings.

- **Shipping option creation fixes**
  - Re-enabled selection of “Shipping option type” when creating shipping options, so admins can complete the setup.

  - Resolved CORS-related issues when fetching shipping option types, so the list loads correctly both locally and on test/stage environments.

##### Admin Flows & UX

- **Price list creation – working pagination**

  Fixed pagination on the product selection step during price list creation so switching pages updates the product list as expected.

- **Activation emails for new sellers**

  Ensured that when a new seller completes the registration flow, the appropriate activation email is sent as part of the onboarding process.

- **Readable commission values**

  Limited the number of decimal places shown in the commission “Value” column so values are displayed in a clean, human-readable format instead of very long fractional numbers.

- **Session expiration messaging for admins**

  Added explicit messaging when an admin session expires, helping admins quickly understand why they need to log in again.

#### Backend & Developer Experience

- **Shared Prettier configuration for frontend**

  Introduced a shared Prettier configuration for frontend code (including the Admin Panel), standardizing formatting across the codebase and reducing friction in code reviews.

- **Admin TypeScript errors cleanup (part 1 & 2)**

  Carried out a broader TypeScript cleanup in the admin panel, resolving a large set of type errors. This improves developer experience, reduces runtime risk and makes the codebase easier to maintain.

#### Automated Testing & QA

- **Improved test data and identifiers for automation**

  To support faster and more reliable regression testing, we introduced several internal updates to our test data and UI identifiers:
  - Added standardized test data records used by automated end-to-end tests.

  - Extended the use of consistent data-testid attributes across key UI components in the Admin Panel, Vendor Panel and Storefront.

  - Aligned these attributes with our QA tooling to make automated checks more stable and easier to maintain.

  These changes do not alter everyday user flows but significantly improve the quality and speed of our internal QA process and give us higher confidence in each release.

## [1.4.4] - 2025-11-27

### Release 1.4.4

Mercur 1.4.4 focuses on smoother day-to-day operations across the Admin Panel, Vendor Panel,
and Storefront. This release includes dozens of fixes and refinements that improve product
management, checkout behaviour, promotions, and UI flows across the entire stack.

### What's fixed

#### Admin Panel

##### General fixes & improvements

- **Improved stability within Commission Rules and Commission Lines, resolving validation issues and several view crashes.**
- **Fixed loading problems in Shipping Option Types that previously showed an error instead of loading.**
- **Corrected the behaviour of the "Buy X Get Y" promotion type.**
- **Standardised numerical formatting in the In stock fields.**
- **Added missing validation for the Product Attributes → Description field.**
- **Restored the missing Message component across multiple Admin screens.**

##### Modules updated

- **Sellers module updated and refined.**
- **Promotions module adjusted for more consistent behaviour.**
- **The Products & Inventory module has improved for better reliability.**

##### Authentication

- **Updated the login flow and UI, including an improved automated-testing structure.**

#### Vendor Panel

##### Product & inventory

- **Inventory Items now display correctly when switching between product variants.**
- **Vendors can remove collections again.**
- **Fixed errors that occurred when editing collections.**
- **Corrected issues when managing product tags.**
- **Products can now be added to price lists even if pricing fields were previously missing.**
- **Fixed sorting issues on the vendor category view.**

##### Campaigns

- **Campaigns are now correctly visible in the vendor panel.**

##### UX / flow

- **Removed an unnecessary warning pop-up that appeared after saving changes on the product detail page.**
- **Fixed incorrect URL parsing that caused inconsistent navigation.**

#### Storefront

##### Cart & checkout

- **Fixed empty-cart issues that occurred after adding products to the cart.**
- **Corrected problems when removing products from the cart.**
- **Prevented checkout from starting when the cart is empty.**

##### PDP / PLP / UI

- **Fixed the search icon so it properly triggers the search action.**
- **Corrected the responsive behaviour of the seller logo on product pages.**
- **Restored previously empty "More from this seller" sections.**
- **Fixed issues where multiple products on listing pages could not be opened.**

##### Other fixes - Shared Frontend / System-Level

- **Improved shared UI components and error states.**
- **Various frontend stability improvements across modules.**

## [1.4.3] - 2025-11-13

### Release 1.4.3

This release focuses on stability improvements across the Vendor Panel, Storefront checkout flow, product management, attributes, and internal TypeScript consistency. It also includes several UI and build-pipeline refinements to improve reliability and day-to-day operations.

### Fixed

#### Checkout & Storefront

- **Fixed an issue where shipping options were incorrectly displayed as returns**
- **Resolved a problem requiring users to re-select a payment method even if one had already been chosen** (@itariv)
- **Fixed an error triggered when selecting certain delivery options during checkout** (@AlanJanicki)
- **Thumbnail images on the product listing page now display correctly** (@mikolvj)

#### Vendor Panel

- **Updated Medusa version to 2.10.2 in order to achieve improved sorting and filtering logic** (@tomaszdworniczak)
- **Updated default order sorting to show the oldest orders first** (@itariv)
- **Fixed validation errors when managing products** (@mikolvj)
- **Restored the ability to remove a location from a product** (@itariv)
- **Fixed duplicate product titles in order details** (@mikolvj)
- **Resolved issues preventing users from adding reviews to their orders** (@itariv)
- **Fixed an error displayed when opening the order edit view**
- **Corrected display issues where all shipping methods appeared simultaneously** (@mikolvj)
- **Fixed shipping-option pricing not being saved correctly** (@mikolvj)
- **Resolved an error in the Customer Group edit view** (@itariv)
- **Fixed an error when adding conditions related to promotion item targeting** (@itariv)

#### Attributes & Admin

- **Improved clarity of possible attribute values during editing**
- **Updated toast notifications for both existing and newly created attributes for consistency and clarity**

#### Product Listing (PLP)

- **Ensured product information updates correctly on the PLP without requiring manual refresh**

#### TypeScript & Code Quality

- **Completed a set of TypeScript cleanups improving code clarity and stability across the app** (@sylwia-werner)

## [1.4.2] - 2025-11-03

### Release 1.4.2 - B2C Marketplace

### Changed

- **Improved add-to-cart load time on Storefront** (@AlanJanicki)

### Fixed

#### Vendor Panel

- **Vendors can now see the correct list of products (Issue [#173])** (@katPanek, @AlanJanicki)
- **Vendors can now see the current product price during price list creation** (@AlanJanicki)
- **Vendors can now see correct order item prices on the order details page** (@AlanJanicki)
- **Vendors can now edit shipping options without issues** (@katPanek, @AlanJanicki)
- **Vendors can now edit product attributes without issues (Issue [#380])** (@itariv, @AlanJanicki)
- **Vendors can now edit additional product attributes without issues** (@kilias07)
- **Vendors can now manage inventory item locations without issues** (@AlanJanicki)
- **Fixed UI issue with suspended account** (@AlanJanicki)
- **Fixed price lists table item status** (@katPanek)
- **Fixed product variant edit drawer** (@katPanek)

#### Admin Panel

- **Admin can now manage refund reasons without issues (Issue [#440])** (@mikolvj)
- **Fixed UI issue in the seller edition drawer** (@sylwia-werner)
- **Fixed sellers table pagination** (@sylwia-werner)
- **Fixed user invitation email issues** (@jakub-borek)

#### Storefront

- **Storefront listings now display new products without issues** (@itariv)
- **Fixed UI issue on the review details page** (@AlanJanicki)
- **Fixed UI issue with the product reviews section** (@AlanJanicki)
- **Fixed cart first step saving issues** (@AlanJanicki)
- **Fixed product carousel on the product details page** (@AlanJanicki)

#### Other

- **Fixed link targets in the order confirmation email template** (@itariv, @AlanJanicki)

## [1.4.1] - 2025-10-29

### Fixed

- **Fixed incorrect migration script (Issue [#439])**

## [1.4.0] - 2025-10-27

### Release 1.4.0 - B2C Marketplace

### Added

- **Added Stripe connection trigger** (@vholik)

### Changed

- **Extracted Admin Panel into a separate repository** (@mikolvj)

### Fixed

- **Vendors can now see correct inventory on product details pages (Issue [#175])** (@AlanJanicki)
- **Vendors can now edit stock locations without issues** (@AlanJanicki)
- **Storefront now displays correct delivery amount for each order** (@AlanJanicki)
- **Storefront now displays full product names and selected variants at checkout** (@Si3r4dz)
- **Storefront now displays promotion codes correctly in the cart** (@Si3r4dz)
- **Storefront now validates product stock levels and prevents adding out-of-stock products to cart** (@AlanJanicki, @pfulara)
- **Improved product quantity selection in cart** (@Si3r4dz)
- **Improved variant selection on storefront product pages** (@AlanJanicki)
- **Product listing price filter now works correctly on storefront** (@AlanJanicki)
- **Fixed blinking error messages at checkout** (@AlanJanicki)
- **Fixed errors on message page in Admin Panel** (@AlanJanicki)
- **Fixed screen swiping issues in product detail page specific section** (@Si3r4dz)

## [1.3.0] 2025-10-15

### Release 1.3.0 - B2C Marketplace

### Changed

- **Mercur v1.3.0 introduces a fundamental architectural shift to a plugin-based system, transforming how Mercur is installed and maintained.**
- **Cleaner separation between Medusa core and Mercur extensions**
- **Easier updates and maintenance through modular architecture**
- **Independent versioning for different components
  Details: divide Mercur into plugins by @rigbyms in https://github.com/mercurjs/mercur/pull/410
  Read more in our [docs page](https://docs.mercurjs.com/components/backend).**

### Enhanced CLI tooling:

- **New Mercur CLI (https://www.npmjs.com/package/mercur-cli) for automated setup**
- **Handles Medusa instance creation**
- **Automatic Mercur integration**
- **Simplified configuration process**

### Others:

- **Fix: Link tax regions to system tax provider by @NicolasGorga in https://github.com/mercurjs/mercur/pull/405**

## [1.1.0] - 2025-09-19

### Release 1.1.0 - B2C Marketplace

### Added

- **Allowed marking attributes as required**

### Changed

- **Refactored the Attributes section in the Admin Panel**
- **Updated the Vendor Panel so products can have required attributes filled**

### Fixed

- **Fixed an issue where editing products in the Vendor Panel would wipe attributes on save**

## [1.0.1] - 2025-07-30

### Release 1.0.1 - B2C Marketplace

### Changed

- **Modules were refactored and moved to separate packages in order to maintain a modular structure** ([#323](https://github.com/mercurjs/mercur/pull/323) @slusarczykmichal)
- **Docs: OpenAPI specifications are now completed for the entire API** ([#326](https://github.com/mercurjs/mercur/pull/326) @slusarczykmichal)
- **Medusa version was updated to [version 2.8.6](https://github.com/medusajs/medusa/releases/tag/v2.8.6)** ([#333](https://github.com/mercurjs/mercur/pull/333) @slusarczykmichal)

### Fixed

- **Marketplace administrators can now review vendors' product updates before publishing them** ([#340](https://github.com/mercurjs/mercur/pull/340) @WojciechPlodzien)
- **The vendor details page was fixed as it was not loading properly in rare cases** ([#359](https://github.com/mercurjs/mercur/pull/359) @slusarczykmichal)
- **Fixed vendor reviews query to prevent query errors** ([#361](https://github.com/mercurjs/mercur/pull/361) @slusarczykmichal)

## [1.0.0] - 2025-06-23

### Release 1.0 - B2C Marketplace

This release marks the official 1.0 version of Mercur, with significant improvements to the marketplace platform including enhanced seller management, product features, and numerous bug fixes.

### Added

- **Product Attributes** ([#316](https://github.com/mercurjs/mercur/pull/316) @slusarczykmichal)
- **Seller Management API** ([#259](https://github.com/mercurjs/mercur/pull/259) @slusarczykmichal)
- **Invite Seller to Platform** ([#257](https://github.com/mercurjs/mercur/pull/257) @slusarczykmichal)
- **Vendor Panel UI Notifications** ([#284](https://github.com/mercurjs/mercur/pull/284) @slusarczykmichal)
- **Order Sets List** ([#252](https://github.com/mercurjs/mercur/pull/252), [#262](https://github.com/mercurjs/mercur/pull/262) @slusarczykmichal, @WojciechPlodzien)
- **Enable Filtering Order Set by Order ID** ([#256](https://github.com/mercurjs/mercur/pull/256) @slusarczykmichal)
- **Customer Returns List** ([#306](https://github.com/mercurjs/mercur/pull/306) @slusarczykmichal)
- **Commissions API & Admin Dashboard** ([#298](https://github.com/mercurjs/mercur/pull/298) @slusarczykmichal)
- **Seed Default Configuration Rules** ([#267](https://github.com/mercurjs/mercur/pull/267) @slusarczykmichal)
- **Seller Suspension Logic** ([#266](https://github.com/mercurjs/mercur/pull/266) @slusarczykmichal)
- **Remove Shipping Methods from Cart** ([#247](https://github.com/mercurjs/mercur/pull/247) @slusarczykmichal)

### Changed

- **Password Reset Emails Refactoring** ([#278](https://github.com/mercurjs/mercur/pull/278) @slusarczykmichal)
- **Orders Format Change** ([#277](https://github.com/mercurjs/mercur/pull/277) @slusarczykmichal)
- **Notification Cleanup** ([#276](https://github.com/mercurjs/mercur/pull/276) @slusarczykmichal)
- **Remove HTTP Client** ([#313](https://github.com/mercurjs/mercur/pull/313) @slusarczykmichal)
- **Change Supported Countries** ([#265](https://github.com/mercurjs/mercur/pull/265) @slusarczykmichal)
- **Update README** ([#318](https://github.com/mercurjs/mercur/pull/318) @slusarczykmichal)

### Fixed

- **Product Search and Filters** ([#255](https://github.com/mercurjs/mercur/pull/255) @NicolasGorga)
- **More Information on Requests Page** ([#254](https://github.com/mercurjs/mercur/pull/254) @slusarczykmichal)
- **Show Only Current Seller Product When Creating Promotion** ([#253](https://github.com/mercurjs/mercur/pull/253), [#264](https://github.com/mercurjs/mercur/pull/264) @slusarczykmichal, @WojciechPlodzien)
- **Stripe Provider** ([#251](https://github.com/mercurjs/mercur/pull/251) @slusarczykmichal)
- **Create Additional Subscribers** ([#249](https://github.com/mercurjs/mercur/pull/249) @slusarczykmichal)
- **Vendor Update Price List** ([#245](https://github.com/mercurjs/mercur/pull/245) @slusarczykmichal)
- **Add Rules to Shipping Options** ([#243](https://github.com/mercurjs/mercur/pull/243) @slusarczykmichal)
- **Filter Out Deleted Linked Entities** ([#286](https://github.com/mercurjs/mercur/pull/286) @slusarczykmichal)
- **Update Configuration Module Import in Seed-Functions** ([#279](https://github.com/mercurjs/mercur/pull/279) @cesarve77)
- **One Review Per Order** ([#273](https://github.com/mercurjs/mercur/pull/273) @slusarczykmichal)
- **Filter Customer Groups in Promotions** ([#260](https://github.com/mercurjs/mercur/pull/260) @slusarczykmichal)
- **Duplicate Order Return Requests** ([#314](https://github.com/mercurjs/mercur/pull/314) @slusarczykmichal)
- **Create Payout Reversal** ([#312](https://github.com/mercurjs/mercur/pull/312) @slusarczykmichal)
- **Stripe Connect Updates** ([#311](https://github.com/mercurjs/mercur/pull/311) @slusarczykmichal)
- **Seller Return Shipping Options** ([#308](https://github.com/mercurjs/mercur/pull/308) @slusarczykmichal)
- **Provide Statuses with Order Sets** ([#307](https://github.com/mercurjs/mercur/pull/307) @slusarczykmichal)
- **Mark Order as Completed After Shipping is Created** ([#304](https://github.com/mercurjs/mercur/pull/304) @slusarczykmichal)
- **If No Seller Email Provided Use Member Email** ([#303](https://github.com/mercurjs/mercur/pull/303) @slusarczykmichal)
- **Notifications** ([#297](https://github.com/mercurjs/mercur/pull/297) @slusarczykmichal)
- **Outstanding Amount** ([#291](https://github.com/mercurjs/mercur/pull/291) @slusarczykmichal)
- **Do Not Show Admin Notifications from Seller Feed** ([#289](https://github.com/mercurjs/mercur/pull/289) @slusarczykmichal)
- **Trigger Algolia Update After Modifying Inventory Items** ([#288](https://github.com/mercurjs/mercur/pull/288) @slusarczykmichal)

## Contributors

Thanks to all contributors:

@pfulara, @slusarczykmichal, @WojciechPlodzien, @NicolasGorga, @cesarve77

## [0.9.0] - 2025-05-23

### Initial Release - Marketplace Platform

This is the first major release of Mercur, an open-source marketplace platform built on Medusa.js 2.0. Version 0.9.0 includes most features planned for the 1.0 MVP release but is currently under heavy testing and bug fixing.

### Added

- **Initial Medusa API Setup** ([#1](https://github.com/mercurjs/mercur/pull/1) @vholik)
- **Seller Registration & Onboarding** ([#92](https://github.com/mercurjs/mercur/pull/92) @slusarczykmichal, [#38](https://github.com/mercurjs/mercur/pull/38) @mjaskot)
- **Team Management System** with member invitations and role-based access
- **Commission System** ([#40](https://github.com/mercurjs/mercur/pull/40) @slusarczykmichal)
- **Stripe Connect Integration** ([#36](https://github.com/mercurjs/mercur/pull/36) @vholik)
- **Multi-vendor Order Processing** ([#34](https://github.com/mercurjs/mercur/pull/34) @slusarczykmichal)
- **Vendor Panel Orders** ([#42](https://github.com/mercurjs/mercur/pull/42) @vholik)
- **Vendor Fulfillments** ([#148](https://github.com/mercurjs/mercur/pull/148) @slusarczykmichal)
- **Order Return Request** ([#49](https://github.com/mercurjs/mercur/pull/49) @slusarczykmichal)
- **Vendor Return Management** ([#124](https://github.com/mercurjs/mercur/pull/124) @slusarczykmichal)
- **Product Categories & Collections**
- **Brand Entity & Management** ([#87](https://github.com/mercurjs/mercur/pull/87) @slusarczykmichal)
- **Inventory Management** ([#33](https://github.com/mercurjs/mercur/pull/33) @slusarczykmichal)
- **Batch Stock Editing** ([#187](https://github.com/mercurjs/mercur/pull/187) @slusarczykmichal)
- **Product Tags/Types** ([#105](https://github.com/mercurjs/mercur/pull/105) @slusarczykmichal)
- **Variant/Options Management** ([#106](https://github.com/mercurjs/mercur/pull/106) @slusarczykmichal)
- **Product Draft Mode** ([#185](https://github.com/mercurjs/mercur/pull/185) @slusarczykmichal)
- **Product Import/Export** ([#134](https://github.com/mercurjs/mercur/pull/134) @slusarczykmichal)
- **Algolia Search Integration** ([#81](https://github.com/mercurjs/mercur/pull/81) @slusarczykmichal)
- **Wishlist Module** ([#177](https://github.com/mercurjs/mercur/pull/177) @mwestrjs)
- **Resend Email Integration** ([#73](https://github.com/mercurjs/mercur/pull/73) @slusarczykmichal, [#35](https://github.com/mercurjs/mercur/pull/35) @mjaskot)
- **TalkJS Conversation Endpoint** ([#196](https://github.com/mercurjs/mercur/pull/196) @slusarczykmichal)
- **Stripe Tax Provider** ([#53](https://github.com/mercurjs/mercur/pull/53) @slusarczykmichal)
- **Seller/Product Review System** ([#57](https://github.com/mercurjs/mercur/pull/57) @slusarczykmichal)
- **Request & Approval System** ([#48](https://github.com/mercurjs/mercur/pull/48) @slusarczykmichal)
- **Edit Request System** ([#184](https://github.com/mercurjs/mercur/pull/184) @slusarczykmichal)
- **Requests Admin Panel** ([#69](https://github.com/mercurjs/mercur/pull/69) @slusarczykmichal)
- **Customer Groups Management** ([#136](https://github.com/mercurjs/mercur/pull/136) @slusarczykmichal)
- **Vendor Promotions** ([#103](https://github.com/mercurjs/mercur/pull/103), [#164](https://github.com/mercurjs/mercur/pull/164) @slusarczykmichal)
- **Vendor Campaigns** ([#111](https://github.com/mercurjs/mercur/pull/111) @slusarczykmichal)
- **Vendor Price Lists** ([#109](https://github.com/mercurjs/mercur/pull/109) @slusarczykmichal)
- **Reservation Management** ([#112](https://github.com/mercurjs/mercur/pull/112) @slusarczykmichal, [#190](https://github.com/mercurjs/mercur/pull/190) @slusarczykmichal)
- **Global Product Catalog** ([#64](https://github.com/mercurjs/mercur/pull/64) @slusarczykmichal)
- **Admin Product Catalog Settings** ([#52](https://github.com/mercurjs/mercur/pull/52) @slusarczykmichal)
- **Charts Data Endpoint** ([#113](https://github.com/mercurjs/mercur/pull/113) @slusarczykmichal)
- **Sales Channels Route** ([#93](https://github.com/mercurjs/mercur/pull/93) @slusarczykmichal)
- **Team Member Email** ([#77](https://github.com/mercurjs/mercur/pull/77) @slusarczykmichal)
- **Vendor File Uploads** ([#107](https://github.com/mercurjs/mercur/pull/107) @slusarczykmichal)
- **Extended Seller Info** ([#110](https://github.com/mercurjs/mercur/pull/110) @slusarczykmichal, [#91](https://github.com/mercurjs/mercur/pull/91) @slusarczykmichal)
- **Seed Script** ([#160](https://github.com/mercurjs/mercur/pull/160) @slusarczykmichal)

### Changed

- **Medusa Upgrade to 2.7.0** ([#159](https://github.com/mercurjs/mercur/pull/159) @slusarczykmichal)
- **Medusa Upgrade to 2.6.1** ([#122](https://github.com/mercurjs/mercur/pull/122) @slusarczykmichal)
- **Medusa Upgrade to 2.4.0** ([#115](https://github.com/mercurjs/mercur/pull/115) @slusarczykmichal)
- **Enhanced Algolia Data** ([#199](https://github.com/mercurjs/mercur/pull/199) @slusarczykmichal)
- **Product Request Refactoring** ([#149](https://github.com/mercurjs/mercur/pull/149) @slusarczykmichal, [#137](https://github.com/mercurjs/mercur/pull/137) @slusarczykmichal)
- **Dashboard Layout Improvements** ([#166](https://github.com/mercurjs/mercur/pull/166) @slusarczykmichal)
- **Documentation Updates** ([#70](https://github.com/mercurjs/mercur/pull/70) @slusarczykmichal, [#18](https://github.com/mercurjs/mercur/pull/18) @haf)

### Fixed

- **Zero Percent Commission Support** ([#235](https://github.com/mercurjs/mercur/pull/235), [#228](https://github.com/mercurjs/mercur/pull/228))
- **Default Values in Commission Editor** ([#234](https://github.com/mercurjs/mercur/pull/234), [#230](https://github.com/mercurjs/mercur/pull/230))
- **Commission Hook Mounting** ([#213](https://github.com/mercurjs/mercur/pull/213))
- **Commission in Order Payouts** ([#217](https://github.com/mercurjs/mercur/pull/217))
- **Commission Calculation Step** ([#121](https://github.com/mercurjs/mercur/pull/121))
- **Order Query in Payout Workflow** ([#123](https://github.com/mercurjs/mercur/pull/123))
- **Stripe Payout Account** ([#119](https://github.com/mercurjs/mercur/pull/119))
- **Customer Selection with Groups** ([#233](https://github.com/mercurjs/mercur/pull/233), [#227](https://github.com/mercurjs/mercur/pull/227))
- **Promotions in Cart Splitting** ([#215](https://github.com/mercurjs/mercur/pull/215))
- **Service Zone Editing** ([#223](https://github.com/mercurjs/mercur/pull/223))
- **Invalid Promotion Rule Attributes** ([#202](https://github.com/mercurjs/mercur/pull/202))
- **Shipping Options List** ([#170](https://github.com/mercurjs/mercur/pull/170))
- **Promotion Rules Batch Actions** ([#139](https://github.com/mercurjs/mercur/pull/139))
- **Multi-vendor Cart Completion** ([#89](https://github.com/mercurjs/mercur/pull/89))
- **Product Import Request Creation** ([#224](https://github.com/mercurjs/mercur/pull/224))
- **Batch Location Level Acceptance** ([#211](https://github.com/mercurjs/mercur/pull/211))
- **Price List Product Fetching** ([#207](https://github.com/mercurjs/mercur/pull/207))
- **Default Shipping Profile Assignment** ([#204](https://github.com/mercurjs/mercur/pull/204))
- **Inventory Item Seller Link** ([#200](https://github.com/mercurjs/mercur/pull/200))
- **Seller Stock Locations** ([#188](https://github.com/mercurjs/mercur/pull/188))
- **Algolia Upsert Logic** ([#146](https://github.com/mercurjs/mercur/pull/146))
- **Additional Data in Product Flows** ([#145](https://github.com/mercurjs/mercur/pull/145), [#140](https://github.com/mercurjs/mercur/pull/140))
- **Algolia Product Updates** ([#95](https://github.com/mercurjs/mercur/pull/95))
- **Product Variants Formatting** ([#90](https://github.com/mercurjs/mercur/pull/90))
- **Product Default Options** ([#61](https://github.com/mercurjs/mercur/pull/61))
- **HTTP Client Query Parameters** ([#191](https://github.com/mercurjs/mercur/pull/191)) - Thanks to Nicolas Gorga for this contribution
- **Unrecognized Field Error** ([#172](https://github.com/mercurjs/mercur/pull/172))
- **Query Parameters for Vendor Categories** ([#171](https://github.com/mercurjs/mercur/pull/171))
- **OAS Documentation** ([#201](https://github.com/mercurjs/mercur/pull/201))
- **File Paths** ([#154](https://github.com/mercurjs/mercur/pull/154))
- **Type Errors** ([#131](https://github.com/mercurjs/mercur/pull/131))
- **Type Problems and Unnecessary Checks** ([#126](https://github.com/mercurjs/mercur/pull/126))
- **Wrong API Route File Name** ([#85](https://github.com/mercurjs/mercur/pull/85))
- **Min/Max OAS Constraints Syntax** ([#83](https://github.com/mercurjs/mercur/pull/83))
- **Custom OAS Fixes** ([#80](https://github.com/mercurjs/mercur/pull/80))
- **Shipping Options OAS Route** ([#78](https://github.com/mercurjs/mercur/pull/78))
- **HTTP Client** ([#46](https://github.com/mercurjs/mercur/pull/46))
- **Request Info Background Color** ([#179](https://github.com/mercurjs/mercur/pull/179))
- **Seller ID Fetching** ([#68](https://github.com/mercurjs/mercur/pull/68))
- **CORS Configuration** ([#7](https://github.com/mercurjs/mercur/pull/7))

## Contributors

Thanks to all contributors:

@pfulara, @slusarczykmichal, @vholik, @NicolasGorga, @WojciechPlodzien, @dominicrathbone, @haf, @LukaszMielczarek, @mjaskot, @mwestrjs

### Current Limitations

⚠️ **Beta Status**: This release is under heavy testing and may contain bugs

- Edge cases in multi-vendor order processing requiring additional refinement
- Commission calculation in specific currency scenarios needs further testing
- Some API endpoints need additional input validation

### Coming Soon (v1.0)

- Enhanced seller management in Admin panel
- Extended documentation
