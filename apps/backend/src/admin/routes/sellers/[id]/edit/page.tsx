import { RouteDrawer } from "../../../../components/route-drawer/RouteDrawer";
import { useNavigate, useParams } from "react-router-dom";
import SellerDetailPage from "../seller-details-page";
import { Button, Input, Label } from "@medusajs/ui";
import { useSeller } from "../../../../hooks/api/seller";
import { useForm } from "react-hook-form";

const SellerEditPage = () => {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isLoading } = useSeller(params.id!);

  const form = useForm({
    defaultValues: {
      name: data?.seller?.name,
      email: data?.seller?.email,
      phone: data?.seller?.phone,
    },
  });

  const onSubmit = (data: any) => {
    console.log(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log(data.seller)
    
  return (
    <>
      <SellerDetailPage />
      <RouteDrawer 
        header="Edit seller" 
        onClose={(open: boolean) => !open && navigate(-1)}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Label>Name <Input {...form.register("name")}  placeholder="Name" className="mt-2" /></Label>
          <Label>Email <Input {...form.register("email")} placeholder="Email" className="mt-2" /></Label>
          <Label>Phone <Input {...form.register("phone")} placeholder="Phone" className="mt-2" /></Label>
          <Button type="submit">Save</Button>
        </form>
      </RouteDrawer>
    </>
  );
};

export default SellerEditPage;