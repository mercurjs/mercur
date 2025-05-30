import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { useSellersTableQuery, validateEmail } from "./helpers";
import { useInviteSeller, useSellers } from "../../hooks/api/seller";
import { ActionsButton } from "../../common/ActionsButton";
import { PencilSquare, Shopping, User } from "@medusajs/icons";
import { useSellersTableColumns } from "./helpers/use-seller-table-columns";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { VendorSeller } from "@mercurjs/http-client";
import { useDataTable } from "../../hooks/table/use-data-table";
import { DataTable } from "../../components/table/data-table";

const PAGE_SIZE = 10

const SellersListPage = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { searchParams, raw } = useSellersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
  })
  
  const { sellers, isLoading } = useSellers({
    fields: "id,email,name,created_at,status"},
    undefined,
    {
      q: searchParams.q,
      order: searchParams.order
    });


  const { mutateAsync: inviteSeller } = useInviteSeller();


  const columns = useColumns()

  const { table } = useDataTable({
    data: sellers as VendorSeller[],
    columns: columns as ColumnDef<VendorSeller, any>[],
    count: sellers?.length || 0,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
  })


  const handleInvite = async () => {
    try {
      const isValid = validateEmail(email);
      if (!isValid) {
        return;
      }

      await inviteSeller(email);
      toast.success("Invited!");
      setOpen(false);
      setEmail("");
    } catch {
      toast.error("Error!");
    }
  };


  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Sellers</Heading>
        </div>
        <Drawer
          open={open}
          onOpenChange={(openChanged) => setOpen(openChanged)}
        >
          <Drawer.Trigger
            onClick={() => {
              setOpen(true);
            }}
            asChild
          >
            <Button>Invite</Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header />
            <Drawer.Body>
            <Heading>Invite Seller</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Invite a new seller to your store
            </Text>
            <div className="flex flex-col gap-2 mt-6">
              <Label>Email</Label>
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
              <div className="flex justify-end">
                <Button className="mt-6" onClick={handleInvite}>Invite</Button>
              </div>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>
      <div className="flex size-full flex-col overflow-hidden">
        <DataTable
          table={table}
          columns={columns as ColumnDef<VendorSeller, any>[]}
          count={sellers?.length || 0}
          pageSize={10}
          isLoading={isLoading}
          queryObject={raw}  
          search
          pagination
          navigateTo={(row) => `/admin/sellers/${row.id}`}
          orderBy={[
            { key: "email", label: "Email" },
            { key: "name", label: "Name" },
            { key: "created_at", label: "Created" },
          ]}
        />
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Sellers",
  icon: Shopping,
});

const columnHelper = createColumnHelper<VendorSeller>()

const useColumns = () => {
  const base = useSellersTableColumns()

  const columns = useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: () => {
          return (
          <ActionsButton
            actions={[
              {
                label: "View",
                onClick: () => null,
                icon: <PencilSquare />
              },
              {
                label: "Suspend account",
                onClick: () => null,
                icon: <User />
              }
              ]}
            />
          )
        },
      }),
    ],
    [base]
  )

  return columns
}
export default SellersListPage;
