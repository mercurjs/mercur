import { Route, Routes, useNavigate } from "react-router-dom";

import Spacer from "../../components/atoms/spacer";
import RouteContainer from "../../components/extensions/route-container";
import WidgetContainer from "../../components/extensions/widget-container";
import BodyCard from "../../components/organisms/body-card";
import TableViewHeader from "../../components/organisms/custom-table-header";
import OrderTable from "../../components/templates/order-table";
import { useRoutes } from "../../providers/route-provider";
import { useWidgets } from "../../providers/widget-provider";
import Details from "./details";

const VIEWS = ["orders"];

const OrderIndex = () => {
  const view = "orders";

  const navigate = useNavigate();

  const { getWidgets } = useWidgets();

  return (
    <>
      <div className="gap-y-xsmall flex h-full grow flex-col">
        {getWidgets("order.list.before").map((w, i) => {
          return (
            <WidgetContainer
              key={i}
              injectionZone={"order.list.before"}
              widget={w}
              entity={undefined}
            />
          );
        })}
        <div className="flex w-full grow flex-col">
          <BodyCard
            customHeader={
              <TableViewHeader
                views={VIEWS}
                setActiveView={(v) => {
                  if (v === "drafts") {
                    navigate(`/a/draft-orders`);
                  }
                }}
                activeView={view}
              />
            }
            className="h-fit"
          >
            <OrderTable />
          </BodyCard>
        </div>
        {getWidgets("order.list.after").map((w, i) => {
          return (
            <WidgetContainer
              key={i}
              injectionZone={"order.list.after"}
              widget={w}
              entity={undefined}
            />
          );
        })}
        <Spacer />
      </div>
    </>
  );
};

const Orders = () => {
  const { getNestedRoutes } = useRoutes();

  const nestedRoutes = getNestedRoutes("/products");

  return (
    <Routes>
      <Route index element={<OrderIndex />} />
      <Route path="/:id" element={<Details />} />
      {nestedRoutes.map((r, i) => {
        return (
          <Route
            path={r.path}
            key={i}
            element={<RouteContainer route={r} previousPath={"/orders"} />}
          />
        );
      })}
    </Routes>
  );
};

export default Orders;
