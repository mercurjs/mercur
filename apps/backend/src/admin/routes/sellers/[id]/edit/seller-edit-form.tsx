import { Button, Heading, Input, Label, Textarea } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useUpdateSeller } from "../../../../hooks/api/seller";

export const SellerEditForm = ({ seller }: { seller: any }) => {

    const { mutate: updateSeller } = useUpdateSeller();
  const form = useForm({
    defaultValues: {
      name: seller?.name,
      email: seller?.email,
      phone: seller?.phone,
      description: seller?.description,
      address_line: seller?.address_line,
      city: seller?.city,
      state: seller?.state,
      country_code: seller?.country_code,
      postal_code: seller?.postal_code,
      tax_id: seller?.tax_id,
    },
  });

  const onSubmit = async(data: any) => {
    await updateSeller({ id: seller.id, data: { fields: data } })
    // console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <Heading>Edit seller</Heading>
        <Label>
          Name 
          <Input {...form.register("name")} placeholder="Name" className="my-2" />
        </Label>
        <Label>
          Email 
          <Input {...form.register("email")} placeholder="Email" className="my-2" />
        </Label>
        <Label>
          Phone 
          <Input {...form.register("phone")} placeholder="Phone" className="my-2" />
        </Label>
        <Label>
          Description 
          <Textarea {...form.register("description")} placeholder="Description" className="my-2" />
        </Label>
      </div>
      <div>
        <Heading>Address</Heading>
        <Label>
          Address 
          <Input {...form.register("address_line")} placeholder="Address" className="my-2" />
        </Label>
        <Label>
          Postal Code 
          <Input {...form.register("postal_code")} placeholder="Postal Code" className="my-2" />
        </Label>
        <Label>
          City 
          <Input {...form.register("city")} placeholder="City" className="my-2" />
        </Label>
        <Label>
          Country 
          <Input {...form.register("country_code")} placeholder="Country" className="my-2" />
        </Label>
        <Label>
          TaxID 
          <Input {...form.register("tax_id")} placeholder="TaxID" className="my-2" />
        </Label>
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
};