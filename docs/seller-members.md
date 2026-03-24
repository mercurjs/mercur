# Seller Members

A **seller member** represents a user who has access to a seller account. Mercur supports **multi-user seller accounts** — multiple people can manage the same store — and **multi-seller users** — a single person can belong to more than one store. This page covers how members relate to sellers, how access is structured, and the rules governing team management.

## Concept

The relationship between users and sellers is **many-to-many**. A seller account can have several members (e.g. an owner, a warehouse manager, and a support agent), and a single user can be a member of multiple seller accounts (e.g. a consultant managing stores for different brands).

Each membership is a distinct association that carries its own [role assignment](roles-and-permissions.md). This means the same user can have different permissions on different stores.

## Member Data

Each member record holds the following information:

| Field | Description |
|---|---|
| `email` | The member's email address, used for login and notifications |
| `locale` | Preferred language/locale for the vendor portal UI |
| `status` | Whether the member is active or deactivated |

The member's identity is tied to their **email address**. Email addresses must be unique across all members within a single seller account but the same email can appear on different seller accounts.

## Member–Seller Association

When a member is added to a seller account, the association includes:

- A reference to the **seller account**
- A reference to the **member**
- One or more **roles** that define the member's permissions on that account

This association is the core of the access model. Removing the association revokes the member's access to that seller account entirely.

## Store Switcher

For users who belong to multiple seller accounts, the vendor portal provides a **store switcher**. Each store context is fully isolated — when a member switches stores, they see only the data (products, orders, payouts) belonging to that seller account, and their permissions are governed by the roles assigned on that specific account.

This isolation ensures that access to one store never leaks information from another, even when the same person manages both.

## Adding Members

Members can be added to a seller account by:

- **Operators** — via the admin dashboard, an operator can add members to any seller account
- **Seller admins** — members with the appropriate role (see [Roles and Permissions](roles-and-permissions.md)) can invite new members to their own seller account

When a new member is added, they receive an invitation to set up their access. If the email already belongs to an existing user in the system, the new seller association is linked to their existing account.

## Removing Members

Removing a member **deletes the association** between the user and the seller account. The user's account continues to exist — they simply lose access to that particular store.

Both **operators** and **seller admins** can remove members, subject to the constraint that a seller account must always retain at least one admin member.

## Deactivation vs. Deletion

Rather than removing a member entirely, a seller admin can **deactivate** a member. A deactivated member:

- Cannot log in to the seller account
- Retains their association and role assignments
- Can be reactivated later without re-invitation

This is useful for temporary access revocation — for example, when a seasonal worker is off-duty or when investigating a potential issue.

## Member Notifications

In the current implementation, **all members** of a seller account receive all notifications related to that account (order placed, payout settled, etc.). There is no per-member notification filtering — every member sees every event.

Future iterations may introduce notification preferences tied to roles or individual member settings.

## Business Rules

- A seller account must have **at least one member** with an admin role at all times
- **Email addresses** must be unique within a single seller account
- A member's **roles** are scoped to a specific seller account — the same user can hold different roles on different stores
- **Deactivation** preserves the member record; **removal** deletes the association entirely
- Members are managed through the [seller account lifecycle](seller.md) — if a seller is terminated, all member associations are effectively void
- Permissions are determined by the member's assigned roles (see [Roles and Permissions](roles-and-permissions.md))
