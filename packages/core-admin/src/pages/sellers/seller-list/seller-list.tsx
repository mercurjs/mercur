import { useMemo, useState } from "react";

import { PencilSquare, User } from "@medusajs/icons";
import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui";

import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

import type { VendorSeller } from "@custom-types/seller";

import { ActionsButton } from "@components/common/actions-button";
import { _DataTable } from "@components/table/data-table";

import {
  useInviteSeller,
  useSellers,
  useUpdateSeller,
} from "@hooks/api/sellers";
import { useSellersTableColumns } from "@hooks/table/columns/use-seller-table-columns";
import { useSellersTableQuery } from "@hooks/table/query";
import { useDataTable } from "@hooks/use-data-table";

import { validateEmail } from "@lib/validate-email";

const PAGE_SIZE = 10;

type SellersProps = VendorSeller & { store_status: string };

export const SellersList = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { searchParams, raw } = useSellersTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { sellers, count, isLoading } = useSellers(
    {
      fields: "id,email,name,created_at,store_status",
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const { mutateAsync: inviteSeller } = useInviteSeller();

  const columns = useColumns();

  const { table } = useDataTable({
    data: sellers ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
  });

  const handleInvite = async () => {
    try {
      const isValid = validateEmail(email);
      if (!isValid) {
        return;
      }

      await inviteSeller({ email });
      toast.success("Invited!");
      setOpen(false);
      setEmail("");
    } catch {
      toast.error("Error!");
    }
  };

  return (
    <Container data-testid="seller-list-container">
      <div className="flex items-center justify-between" data-testid="seller-list-header">
        <div>
          <Heading data-testid="seller-list-heading">Sellers</Heading>
        </div>
        <Drawer
          open={open}
          onOpenChange={(openChanged) => setOpen(openChanged)}
          data-testid="seller-list-invite-drawer"
        >
          <Drawer.Trigger
            onClick={() => {
              setOpen(true);
            }}
            asChild
          >
            <Button data-testid="seller-list-invite-button">Invite</Button>
          </Drawer.Trigger>
          <Drawer.Content data-testid="seller-list-invite-drawer-content">
            <Drawer.Header data-testid="seller-list-invite-drawer-header" />
            <Drawer.Body data-testid="seller-list-invite-drawer-body">
              <Heading data-testid="seller-list-invite-drawer-title">Invite Seller</Heading>
              <Text className="text-ui-fg-subtle" size="small" data-testid="seller-list-invite-drawer-description">
                Invite a new seller to your store
              </Text>
              <div className="mt-6 flex flex-col gap-2" data-testid="seller-list-invite-drawer-email-field">
                <Label data-testid="seller-list-invite-drawer-email-label">Email</Label>
                <Input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="seller-list-invite-drawer-email-input"
                />
              </div>
              <div className="flex justify-end" data-testid="seller-list-invite-drawer-footer">
                <Button className="mt-6" onClick={handleInvite} data-testid="seller-list-invite-drawer-submit-button">
                  Invite
                </Button>
              </div>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>
      <div className="flex size-full flex-col overflow-hidden">
        <_DataTable
          table={table}
          columns={columns}
          count={count ?? 0}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          queryObject={raw}
          search
          pagination
          navigateTo={(row) => `/sellers/${row.id}`}
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

const columnHelper = createColumnHelper<VendorSeller>();

const useColumns = () => {
  const dialog = usePrompt();

  const navigate = useNavigate();

  const { mutateAsync: suspendSeller } = useUpdateSeller();

  const handleSuspend = async (seller: SellersProps) => {
    const res = await dialog({
      title:
        seller.store_status === "SUSPENDED"
          ? "Activate account"
          : "Suspend account",
      description:
        seller.store_status === "SUSPENDED"
          ? "Are you sure you want to activate this account?"
          : "Are you sure you want to suspend this account?",
      verificationText: seller.email || seller.name || "",
    });

    if (!res) {
      return;
    }

    if (seller.store_status === "SUSPENDED") {
      await suspendSeller({ id: seller.id, data: { store_status: "ACTIVE" } });
    } else {
      await suspendSeller({
        id: seller.id,
        data: { store_status: "SUSPENDED" },
      });
    }
  };

  const base = useSellersTableColumns();

  const columns = useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return (
            <ActionsButton
              data-testid={`seller-list-row-actions-${row.original.id}`}
              actions={[
                {
                  label: "Edit",
                  onClick: () => navigate(`/sellers/${row.original.id}/edit`),
                  icon: <PencilSquare />,
                },
                {
                  label:
                    row.original.store_status === "SUSPENDED"
                      ? "Activate account"
                      : "Suspend account",
                  onClick: () => handleSuspend(row.original as SellersProps),
                  icon: <User />,
                },
              ]}
            />
          );
        },
      }),
    ],
    [base],
  );

  return columns;
};
