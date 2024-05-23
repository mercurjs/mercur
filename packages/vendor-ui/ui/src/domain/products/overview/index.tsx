import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Fade from "../../../components/atoms/fade-wrapper";
import Spacer from "../../../components/atoms/spacer";
import WidgetContainer from "../../../components/extensions/widget-container";
import Button from "../../../components/fundamentals/button";
import PlusIcon from "../../../components/fundamentals/icons/plus-icon";
import BodyCard from "../../../components/organisms/body-card";
import TableViewHeader from "../../../components/organisms/custom-table-header";
import ProductTable from "../../../components/templates/product-table";
import useToggleState from "../../../hooks/use-toggle-state";
import { useWidgets } from "../../../providers/widget-provider";
import NewProduct from "../new";

const VIEWS = ["products"];

const Overview = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [view, setView] = useState("products");
  const {
    state: createProductState,
    close: closeProductCreate,
    open: openProductCreate,
  } = useToggleState(
    !location.search.includes("view=collections") &&
      location.search.includes("modal=new")
  );

  const { getWidgets } = useWidgets();

  useEffect(() => {
    if (location.search.includes("?view=collections")) {
      setView("collections");
    }
  }, [location]);

  useEffect(() => {
    location.search = "";
  }, [view]);

  const CurrentAction = () => {
    return (
      <div className="flex space-x-2">
        <Button variant="secondary" size="small" onClick={openProductCreate}>
          <PlusIcon size={20} />
          {t("overview-new-product", "New Product")}
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="gap-y-xsmall flex h-full grow flex-col">
        {getWidgets("product.list.before").map((w, i) => {
          return (
            <WidgetContainer
              key={i}
              injectionZone={"product.list.before"}
              widget={w}
              entity={undefined}
            />
          );
        })}
        <div className="flex w-full grow flex-col">
          <BodyCard
            forceDropdown={false}
            customActionable={CurrentAction()}
            customHeader={
              <TableViewHeader
                views={VIEWS}
                setActiveView={setView}
                activeView={view}
              />
            }
            className="h-fit"
          >
            <ProductTable />
          </BodyCard>
          <Spacer />
        </div>
        {getWidgets("product.list.after").map((w, i) => {
          return (
            <WidgetContainer
              key={i}
              injectionZone={"product.list.after"}
              widget={w}
              entity={undefined}
            />
          );
        })}
      </div>
      <Fade isVisible={createProductState} isFullScreen={true}>
        <NewProduct onClose={closeProductCreate} />
      </Fade>
    </>
  );
};

export default Overview;
