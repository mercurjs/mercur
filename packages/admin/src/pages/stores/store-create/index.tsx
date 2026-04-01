import { RouteFocusModal } from "../../../components/modals";
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form";
import { StoreCreateForm } from "./components/store-create-form";
import { StoreCreateDetailsTab } from "./components/store-create-details-tab";
import { StoreCreateUsersTab } from "./components/store-create-users-tab";
import { CreateStoreSchema, CreateStoreSchemaType } from "./components/schema";

const Root = () => {
  return (
    <RouteFocusModal>
      <StoreCreateForm />
    </RouteFocusModal>
  );
};

export const StoreCreatePage = Object.assign(Root, {
  Form: StoreCreateForm,
  DetailsTab: StoreCreateDetailsTab,
  UsersTab: StoreCreateUsersTab,
  Tab: TabbedForm.Tab,
});

export type { CreateStoreSchemaType };
export { CreateStoreSchema };

export const Component = Root;
