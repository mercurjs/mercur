# Changelog

All notable changes to Mercur will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
