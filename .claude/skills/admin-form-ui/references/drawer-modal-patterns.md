# RouteDrawer & RouteFocusModal Form Patterns

## RouteDrawer — Full Edit Form Example

Based on: `pages/customers/customer-edit/`

```tsx
// customer-edit.tsx — outer wrapper
export const CustomerEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { customer, isLoading, isError, error } = useCustomer(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("customers.edit.header")}</Heading>
      </RouteDrawer.Header>
      {!isLoading && customer && <EditCustomerForm customer={customer} />}
    </RouteDrawer>
  )
}
```

```tsx
// edit-customer-form.tsx — form component
type EditCustomerFormProps = {
  customer: HttpTypes.AdminCustomer
}

const EditCustomerFormSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
})

export const EditCustomerForm = ({ customer }: EditCustomerFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof EditCustomerFormSchema>>({
    defaultValues: {
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      email: customer.email,
      phone: customer.phone || "",
      company_name: customer.company_name || "",
    },
    resolver: zodResolver(EditCustomerFormSchema),
  })

  const { mutateAsync, isPending } = useUpdateCustomer(customer.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => {
        toast.success(t("customers.edit.successToast"))
        handleSuccess()
      },
    })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Form.Field
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("fields.firstName")}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("fields.lastName")}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.email")}</Form.Label>
                <Form.Control>
                  <Input {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
```

## RouteFocusModal — Full Create Form Example

Based on: `pages/customers/customer-create/`

```tsx
// customer-create.tsx — outer wrapper
export const CustomerCreate = () => {
  return (
    <RouteFocusModal>
      <CreateCustomerForm />
    </RouteFocusModal>
  )
}
```

```tsx
// create-customer-form.tsx — form component
export const CreateCustomerForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof CreateCustomerFormSchema>>({
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      company_name: "",
    },
    resolver: zodResolver(CreateCustomerFormSchema),
  })

  const { mutateAsync, isPending } = useCreateCustomer()

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ customer }) => {
        toast.success(t("customers.create.successToast"))
        handleSuccess(`/customers/${customer.id}`)
      },
    })
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto py-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div>
              <Heading>{t("customers.create.header")}</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {t("customers.create.hint")}
              </Text>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t("fields.firstName")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              {/* ... more fields ... */}
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
```

## Key Differences: Drawer vs Modal

| Aspect | RouteDrawer | RouteFocusModal |
|--------|-------------|-----------------|
| Use case | Edit existing resource | Create new resource |
| Size | Side panel | Full-screen centered |
| Header | `<Heading>` inside `RouteDrawer.Header` | Auto-generated `RouteFocusModal.Header />` |
| Body | `RouteDrawer.Body` (direct fields) | `RouteFocusModal.Body` with centered `max-w-[720px]` layout |
| Page heading | None (drawer header serves as title) | `<Heading>` + `<Text>` inside body |
| Success | `handleSuccess()` (closes drawer) | `handleSuccess("/path/to/new")` (navigates) |
| Save button text | `t("actions.save")` | `t("actions.create")` |

## Footer Pattern (same for both)

```tsx
<div className="flex items-center justify-end gap-x-2">
  <XxxDrawerOrModal.Close asChild>
    <Button variant="secondary" size="small">
      {t("actions.cancel")}
    </Button>
  </XxxDrawerOrModal.Close>
  <Button
    type="submit"
    variant="primary"
    size="small"
    isLoading={isPending}
  >
    {t("actions.save")}
  </Button>
</div>
```

## Form Setup Pattern

```tsx
const form = useForm<z.infer<typeof Schema>>({
  defaultValues: { ... },
  resolver: zodResolver(Schema),
})

const { mutateAsync, isPending } = useMutation(id)

const handleSubmit = form.handleSubmit(async (data) => {
  await mutateAsync(data, {
    onSuccess: (response) => {
      toast.success(t("scope.successToast"))
      handleSuccess()  // or handleSuccess(`/path/${response.id}`)
    },
  })
})
```
