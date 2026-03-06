1. View Product Attributes
   As a vendor

I want to see all attributes assigned to a product so that I understand its characteristics.

Acceptance Criteria

Attribute card lists all product attributes in a table-like layout.

Admin attributes display first; vendor attributes display below them.

Each attribute row shows:

Attribute name

Values (comma-separated or as pills)

Overflow menu with relevant actions (Edit/Delete depending on type).

“Add” button is visible at the top right of the Attributes card.

Vendor Attributes (Custom)
Vendor attributes = created by the vendor for this product only.

2. Add a New Attribute (Vendor Attribute)
   As a vendor

I want to add a new attribute to the product so that I can describe the product beyond admin-defined fields.

Acceptance Criteria

Clicking Add opens “Add Attribute” modal with fields:

Attribute title

Values (text input, comma-separated)

Use for variations toggle (off by default)

Vendor can add multiple values separated by commas.

Saving creates the attribute and adds it to the Attributes list.

Closing modal via Cancel discards changes.

Success toast displayed: “Attribute was successfully updated.”

3. Edit a Vendor Attribute
   As a vendor

I want to edit a custom attribute so that I can correct its name or values.

Acceptance Criteria

Clicking Edit on a vendor attribute opens “Edit Attribute” modal.

Editable fields:

Attribute title

Values (shown as removable pills or comma-separated input)

Use for variations toggle (can be turned on/off)

Saving updates the attribute.

Changes appear instantly in the Attributes list after save.

Approved-changes flow triggers toast: “Attribute was successfully updated.”

4. Delete a Vendor Attribute
   As a vendor

I want to delete a custom attribute so that it no longer appears for this product.

Acceptance Criteria

Delete is available only for vendor attributes (not admin attributes).

Delete action is accessed through the row overflow menu.

Confirmation modal optional (based on system conventions).

After deletion, attribute is removed from the list and variants tied to it remain unaffected unless variation logic is applied elsewhere.

Admin Attributes
Admin attributes = defined globally by platform admin; vendor cannot delete them.

5. View and Edit Admin Attributes
   As a vendor

I want to edit the values of admin-defined attributes so that the product meets the structure expected by the platform.

Acceptance Criteria

Admin attributes appear together in the Attributes section.

Edit action opens “Edit Attribute” modal.

Only values are editable; title is locked.

“Use for variations” toggle may appear depending on attribute type.

Save updates the values for this product only (attribute definition stays global).

Vendor cannot delete admin attributes.

Variation-Generating Attributes
These attributes create variants when “Use for variations” is toggled on.

6. Enable “Use for variations” on an Attribute
   As a vendor

I want to mark an attribute as variation-generating so that the system creates product variants for every selected value.

Acceptance Criteria

Toggle available in both Add and Edit modals.

If toggled on:

Attribute must contain at least one value.

On save, the system flags the attribute for use in the “Create Variants” step.

If toggled off:

Attribute stops generating variants (existing variants remain until removed manually).

System shows explanatory text:

“If checked, we will create variants with this attribute. You can define them in the next step.”

7. Add New Values to a Variation Attribute
   As a vendor

I want to add additional values to a variation attribute so that new variant combinations can be created.

Acceptance Criteria

Editing values on a variation-enabled attribute updates its values.

On save:

System may require variant regeneration or update flow (depending on project rules).

UI displays all updated values immediately.

Success Feedback 8. Attribute Update Success State
As a vendor

I want clear feedback after updating an attribute so that I know the change has been submitted.

Acceptance Criteria

After any Save action:

Toast notification appears, e.g.

“Attribute was successfully updated.”

Updated values appear in the Attributes list.

Approval requirements apply for published products (toast:

“Product update was successfully requested…”).
