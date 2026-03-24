# Roles and Permissions

Mercur uses a **role-based access control (RBAC)** system to govern what each [seller member](seller-members.md) can do within a seller account. This page describes the two-layer architecture, the default permission set, the built-in roles, and how role assignment works.

## Two-Layer Architecture

The RBAC system is built on two layers:

1. **Permissions** — Fine-grained capabilities defined at the platform level (e.g. "can edit products", "can view orders"). Permissions are atomic and cannot be subdivided further.
2. **Roles** — Named bundles of permissions that can be assigned to members. A role groups related permissions into a meaningful job function (e.g. "Inventory Management" bundles product and stock permissions together).

Members are never assigned permissions directly. Instead, they receive one or more **roles**, and their effective permissions are the union of all permissions across their assigned roles.

## Permissions

The platform ships with the following permissions:


| Permission          | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `seller_management` | Manage seller account settings, profile, and configuration |
| `member_management` | Add, remove, and manage members and their role assignments |
| `product_read`      | View products, variants, and associated data               |
| `product_write`     | Create, edit, and delete products and variants             |
| `inventory_read`    | View stock levels and inventory locations                  |
| `inventory_write`   | Update stock levels and manage inventory                   |
| `order_read`        | View orders, line items, and order history                 |
| `order_write`       | Process orders — fulfill, cancel, issue refunds            |
| `payout_read`       | View payout history and balance information                |
| `payout_write`      | Request payouts and manage payout settings                 |
| `customer_read`     | View customer information related to the seller's orders   |
| `support`           | Access and respond to customer inquiries and disputes      |


### Permissions Grow With Modules

The permissions listed above represent the **base set** shipped with the core platform. As additional modules are installed (e.g. promotions, analytics, messaging), new permissions are registered automatically. The RBAC system is designed to accommodate this growth without requiring changes to existing roles.

## Default Roles

Mercur includes **five default roles** that cover common team structures:


| Role                     | Permissions Included                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Store Administration** | `seller_management`, `member_management`, `product_read`, `product_write`, `inventory_read`, `inventory_write`, `order_read`, `order_write`, `payout_read`, `payout_write`, `customer_read`, `support` |
| **Inventory Management** | `product_read`, `product_write`, `inventory_read`, `inventory_write`                                                                                                                                   |
| **Order Management**     | `order_read`, `order_write`, `customer_read`, `support`                                                                                                                                                |
| **Accounting**           | `order_read`, `payout_read`, `payout_write`                                                                                                                                                            |
| **Support**              | `order_read`, `customer_read`, `support`                                                                                                                                                               |


### Default Roles Are Immutable

Default roles **cannot be edited or deleted**. They provide a consistent baseline across all seller accounts on the platform. This ensures that core job functions remain predictable regardless of customization elsewhere.

If the default roles do not match a seller's team structure, custom roles (see below) will address this in a future release.

## Role Assignment

Roles are assigned **per seller account**. When a [member](seller-members.md) is added to a seller account, they receive one or more roles that define their permissions within that specific store.

Key points:

- A member can hold **multiple roles** on the same seller account. Their effective permissions are the combined set of all assigned roles.
- The same user can have **different roles** on different seller accounts. For example, a user might be a Store Administrator on one store and limited to Order Management on another.
- Role assignment is managed by members with the `member_management` permission or by platform operators.

### Minimum Admin Requirement

Every seller account must have at least one member assigned the **Store Administration** role (or a role containing `member_management`). This prevents a seller account from becoming unmanageable — there must always be someone who can manage team access.

## Custom Roles (Phase 2)

A future release will introduce **custom roles**, allowing seller admins to define their own permission bundles tailored to their team's needs. Custom roles will:

- Be created and managed per seller account
- Combine any subset of available permissions
- Coexist alongside the immutable default roles

Until custom roles are available, sellers should use the default roles and assign multiple roles to members who need a specific combination of permissions.

## Relationship to Other Concepts

- **Members** are assigned roles through their [seller–member association](seller-members.md)
- **Seller accounts** define the scope in which roles apply (see [Seller](seller.md))
- **Subscriptions** are independent of RBAC — billing access is controlled by the `payout_read` / `payout_write` permissions within the Accounting role (see [Subscriptions](subscriptions.md))

