import { CalendarMini, EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons";
import {
  Container,
  DropdownMenu,
  Heading,
  IconButton,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { DataTable } from "@components/data-table/data-table";
import { NoRecords } from "@components/common/empty-table-content";
import { useDate } from "../../../../hooks/use-date";
import { useUpdateSeller } from "@hooks/api";
import { HttpTypes } from "@mercurjs/types";

type TimeOffEntry = {
  id: string;
  closed_from: Date;
  closed_to: Date | null;
  note: string | null;
};

type StoreTimeOffSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const StoreTimeOffSection = ({ seller }: StoreTimeOffSectionProps) => {
  const { t } = useTranslation();
  const { getFullDate } = useDate();
  const prompt = usePrompt();
  const { mutateAsync: updateSeller } = useUpdateSeller(seller.id);

  const data: TimeOffEntry[] = useMemo(() => {
    if (!seller.closed_from) return [];
    return [
      {
        id: "closure",
        closed_from: new Date(seller.closed_from),
        closed_to: seller.closed_to ? new Date(seller.closed_to) : null,
        note: seller.closure_note ?? null,
      },
    ];
  }, [seller.closed_from, seller.closed_to, seller.closure_note]);

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("store.timeOff.deleteConfirm.title"),
      description: t("store.timeOff.deleteConfirm.description"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!confirmed) return;

    await updateSeller(
      { closed_from: null, closed_to: null, closure_note: null },
      {
        onSuccess: () => {
          toast.success(t("store.timeOff.deleteSuccess"));
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "closed_from",
        header: t("store.timeOff.columns.firstDay"),
        accessorFn: (row: TimeOffEntry) =>
          getFullDate({ date: row.closed_from }),
      },
      {
        id: "closed_to",
        header: t("store.timeOff.columns.lastDay"),
        accessorFn: (row: TimeOffEntry) =>
          row.closed_to ? getFullDate({ date: row.closed_to }) : "-",
      },
      {
        id: "note",
        header: t("store.timeOff.columns.note"),
        accessorFn: (row: TimeOffEntry) => row.note || "-",
        cell: ({ row }: { row: { original: TimeOffEntry } }) => (
          <span
            className="block max-w-[240px] truncate"
            title={row.original.note ?? undefined}
          >
            {row.original.note || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: () => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton variant="transparent" size="small">
                  <EllipsisHorizontal />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item asChild>
                  <Link to="store-closure">
                    <PencilSquare className="mr-2" />
                    {t("actions.edit")}
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onClick={handleDelete}>
                  <Trash className="mr-2" />
                  {t("actions.delete")}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        ),
        meta: {
          className: "w-[1%]",
        },
      },
    ],
    /* oxlint-disable react-hooks/exhaustive-deps */
    [
	t,
	getFullDate,
	handleDelete
]
    /* oxlint-enable react-hooks/exhaustive-deps */
  );

  if (data.length === 0) {
    return (
      <Container className="flex flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">{t("store.timeOff.header")}</Heading>
        </div>
        <NoRecords
          icon={<CalendarMini className="text-ui-fg-subtle" />}
          title={t("store.timeOff.empty.title")}
          message={t("store.timeOff.empty.message")}
          action={{
            to: "store-closure",
            label: t("store.timeOff.empty.action"),
          }}
          className="h-[300px]"
        />
      </Container>
    );
  }

  return (
    <Container className="flex flex-col overflow-hidden p-0">
      <DataTable
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        rowCount={data.length}
        heading={t("store.timeOff.header")}
        enableSearch={false}
        enablePagination={false}
      />
    </Container>
  );
};
