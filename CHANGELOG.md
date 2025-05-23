# Changelog

All notable changes to Mercur will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2025-05-23

### Initial Release - Marketplace Platform

This is the first major release of Mercur, an open-source marketplace platform built on Medusa.js 2.0. Version 0.9.0 includes most features planned for the 1.0 MVP release but is currently under heavy testing and bug fixing.

### Added

- **Initial Medusa API Setup** ([#1](https://github.com/mercurjs/mercur/pull/1))
- **Seller Registration & Onboarding** ([#92](https://github.com/mercurjs/mercur/pull/92), [#38](https://github.com/mercurjs/mercur/pull/38))
- **Team Management System** with member invitations and role-based access
- **Commission System** ([#40](https://github.com/mercurjs/mercur/pull/40))
- **Stripe Connect Integration** ([#36](https://github.com/mercurjs/mercur/pull/36))
- **Multi-vendor Order Processing** ([#34](https://github.com/mercurjs/mercur/pull/34))
- **Vendor Panel Orders** ([#42](https://github.com/mercurjs/mercur/pull/42))
- **Vendor Fulfillments** ([#148](https://github.com/mercurjs/mercur/pull/148))
- **Order Return Request** ([#49](https://github.com/mercurjs/mercur/pull/49))
- **Vendor Return Management** ([#124](https://github.com/mercurjs/mercur/pull/124))
- **Product Categories & Collections**
- **Brand Entity & Management** ([#87](https://github.com/mercurjs/mercur/pull/87))
- **Inventory Management** ([#33](https://github.com/mercurjs/mercur/pull/33))
- **Batch Stock Editing** ([#187](https://github.com/mercurjs/mercur/pull/187))
- **Product Tags/Types** ([#105](https://github.com/mercurjs/mercur/pull/105))
- **Variant/Options Management** ([#106](https://github.com/mercurjs/mercur/pull/106))
- **Product Draft Mode** ([#185](https://github.com/mercurjs/mercur/pull/185))
- **Product Import/Export** ([#134](https://github.com/mercurjs/mercur/pull/134))
- **Algolia Search Integration** ([#81](https://github.com/mercurjs/mercur/pull/81))
- **Wishlist Module** ([#177](https://github.com/mercurjs/mercur/pull/177))
- **Resend Email Integration** ([#73](https://github.com/mercurjs/mercur/pull/73), [#35](https://github.com/mercurjs/mercur/pull/35))
- **TalkJS Conversation Endpoint** ([#196](https://github.com/mercurjs/mercur/pull/196))
- **Stripe Tax Provider** ([#53](https://github.com/mercurjs/mercur/pull/53))
- **Seller/Product Review System** ([#57](https://github.com/mercurjs/mercur/pull/57))
- **Request & Approval System** ([#48](https://github.com/mercurjs/mercur/pull/48))
- **Edit Request System** ([#184](https://github.com/mercurjs/mercur/pull/184))
- **Requests Admin Panel** ([#69](https://github.com/mercurjs/mercur/pull/69))
- **Customer Groups Management** ([#136](https://github.com/mercurjs/mercur/pull/136))
- **Vendor Promotions** ([#103](https://github.com/mercurjs/mercur/pull/103), [#164](https://github.com/mercurjs/mercur/pull/164))
- **Vendor Campaigns** ([#111](https://github.com/mercurjs/mercur/pull/111))
- **Vendor Price Lists** ([#109](https://github.com/mercurjs/mercur/pull/109))
- **Reservation Management** ([#112](https://github.com/mercurjs/mercur/pull/112), [#190](https://github.com/mercurjs/mercur/pull/190))
- **Global Product Catalog** ([#64](https://github.com/mercurjs/mercur/pull/64))
- **Admin Product Catalog Settings** ([#52](https://github.com/mercurjs/mercur/pull/52))
- **Charts Data Endpoint** ([#113](https://github.com/mercurjs/mercur/pull/113))
- **Sales Channels Route** ([#93](https://github.com/mercurjs/mercur/pull/93))
- **Team Member Email** ([#77](https://github.com/mercurjs/mercur/pull/77))
- **Vendor File Uploads** ([#107](https://github.com/mercurjs/mercur/pull/107))
- **Extended Seller Info** ([#110](https://github.com/mercurjs/mercur/pull/110), [#91](https://github.com/mercurjs/mercur/pull/91))
- **Seed Script** ([#160](https://github.com/mercurjs/mercur/pull/160))

### Changed

- **Medusa Upgrade to 2.7.0** ([#159](https://github.com/mercurjs/mercur/pull/159))
- **Medusa Upgrade to 2.6.1** ([#122](https://github.com/mercurjs/mercur/pull/122))
- **Medusa Upgrade to 2.4.0** ([#115](https://github.com/mercurjs/mercur/pull/115))
- **Enhanced Algolia Data** ([#199](https://github.com/mercurjs/mercur/pull/199))
- **Product Request Refactoring** ([#149](https://github.com/mercurjs/mercur/pull/149), [#137](https://github.com/mercurjs/mercur/pull/137))
- **Dashboard Layout Improvements** ([#166](https://github.com/mercurjs/mercur/pull/166))
- **Documentation Updates** ([#70](https://github.com/mercurjs/mercur/pull/70), [#18](https://github.com/mercurjs/mercur/pull/18))

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

### Current Limitations

⚠️ **Beta Status**: This release is under heavy testing and may contain bugs

- Edge cases in multi-vendor order processing requiring additional refinement
- Commission calculation in specific currency scenarios needs further testing
- Some API endpoints need additional input validation

### Coming Soon (v1.0)

- Enhanced seller management in Admin panel
- Extended documentation
