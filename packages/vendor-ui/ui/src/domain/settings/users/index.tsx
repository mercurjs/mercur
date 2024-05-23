import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExclamationCircle, Spinner } from "@medusajs/icons";
import { User } from "@medusajs/medusa";
import {
  Button,
  clx,
  Container,
  Heading,
  Table,
  Text,
  useToggleState,
} from "@medusajs/ui";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import Spacer from "../../../components/atoms/spacer";
import { useDebouncedSearchParam } from "../../../hooks/use-debounced-search-param";
import { useSearchParamsState } from "../../../utils/use-search-params-state";

import { useUserTableColumns } from "./columns";
import { useAdminUsers } from "./use-admin-users";
import BackButton from "../../../components/atoms/back-button";
import InviteModal from "../../../components/organisms/invite-modal";

const PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 10;

const emptyArray: User[] = [];

const UserTable = () => {
  const { debouncedQuery } = useDebouncedSearchParam();
  const [page_, setPage] = useSearchParamsState("page");
  const navigate = useNavigate();

  const {
    state: inviteModalState,
    open: openInviteModal,
    close: closeInviteModal,
  } = useToggleState();

  const page = Number(page_) || 1;

  const { users, count, isLoading, isError } = useAdminUsers({
    q: debouncedQuery,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const columns = useUserTableColumns();

  const table = useReactTable<User>({
    data: users ?? emptyArray,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const totalPagesCount = Math.ceil((count ?? 0) / PAGE_SIZE);
  const canNextPage = page < totalPagesCount;
  const canPreviousPage = page > 1;

  const paginate = (index: 1 | -1) => {
    if (index === 1 && canNextPage) {
      setPage(String(page + 1));
    } else if (index === -1 && canPreviousPage) {
      const prediction = page - 1;

      if (prediction === 1) {
        setPage(null);
      } else {
        setPage(String(prediction));
      }
    }
  };

  const getTableHeight = useCallback((count: number) => {
    if (count < MIN_PAGE_SIZE) {
      return (MIN_PAGE_SIZE + 1) * 48;
    }

    if (count < PAGE_SIZE) {
      return (count + 1) * 48;
    }

    return (PAGE_SIZE + 1) * 48;
  }, []);

  if (isLoading) {
    return (
      <Container
        style={{
          height: 600,
        }}
        className="flex items-center justify-center"
      >
        <Spinner className="text-ui-fg-subtle animate-spin" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-x-2">
          <ExclamationCircle className="text-ui-fg-base" />
          <Text className="text-ui-fg-subtle">
            Error occured while loading user. Reload the page and try again. If
            the issue persists, try again later.
          </Text>
        </div>
      </Container>
    );
  }

  return (
    <>
      <BackButton
        path="/a/settings"
        label="Back to Settings"
        className="mb-xsmall"
      />
      {inviteModalState && <InviteModal handleClose={closeInviteModal} />}
      <div className="flex flex-col gap-y-2">
        <Container className="overflow-hidden p-0">
          <div className="flex flex-wrap gap-2 items-center justify-between px-8 pt-6 pb-4">
            <Heading>Users</Heading>
            <div className="flex items-center gap-x-2">
              <Button variant="secondary" onClick={openInviteModal}>
                Invite to the team
              </Button>
            </div>
          </div>
          <div
            style={{
              height: getTableHeight(users!.length),
            }}
          >
            <Table>
              <Table.Header>
                {table.getHeaderGroups().map((headerGroup) => {
                  return (
                    <Table.Row key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <Table.HeaderCell key={header.id}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </Table.HeaderCell>
                        );
                      })}
                    </Table.Row>
                  );
                })}
              </Table.Header>
              <Table.Body className="border-b-0">
                {table.getRowModel().rows.map((row) => (
                  <Table.Row
                    key={row.id}
                    onClick={() => navigate(`/a/settings/team/${row.id}`)}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          <Table.Pagination
            count={count ?? 0}
            canNextPage={canNextPage}
            canPreviousPage={canPreviousPage}
            nextPage={() => paginate(1)}
            previousPage={() => paginate(-1)}
            pageIndex={page - 1}
            pageCount={totalPagesCount}
            pageSize={PAGE_SIZE}
          />
        </Container>
      </div>
      <Spacer />
    </>
  );
};

export default UserTable;
