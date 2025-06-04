import { Button, Heading, Input, Label, Textarea, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useUpdateSeller } from "../../../../hooks/api/seller";
import { useNavigate } from "react-router-dom";

export const SellerEditForm = ({ seller }: { seller: any }) => {

  const { mutate: updateSeller } = useUpdateSeller();

  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: seller?.name || undefined,
      email: seller?.email || '',
      phone: seller?.phone || undefined,
      description: seller?.description || undefined,
      address_line: seller?.address_line || undefined,
      city: seller?.city || undefined,
      state: seller?.state || undefined,
      country_code: seller?.country_code || undefined,
      postal_code: seller?.postal_code || undefined,
      tax_id: seller?.tax_id || undefined,
    },
  });

  const onSubmit = async(data: any) => {
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Invalid email address");
      return;
    }
    await updateSeller({ id: seller.id, data })
    navigate(`/sellers/${seller.id}`)
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
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
        <div className="flex justify-end">
        <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  );
};