import { RouteFocusModal } from "../../../components/modals";

import { StoreBulkEditForm } from "./components/store-bulk-edit-form";

const Root = () => (
  <RouteFocusModal>
    <StoreBulkEditForm />
  </RouteFocusModal>
);

export const StoreBulkEditPage = Object.assign(Root, {
  Form: StoreBulkEditForm,
});

export const Component = Root;
