import { TriangleRightMini } from "@medusajs/icons";
import { Avatar, Container, Heading } from "@medusajs/ui";
import { SellerDTO } from "@mercurjs/types";
import { Link } from "react-router-dom";

type ProductSellerSectionProps = {
  seller?: SellerDTO | null;
};

export const ProductSellerSection = ({ seller }: ProductSellerSectionProps) => {
  if (!seller) {
    return null;
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Associated Seller</Heading>
      </div>
      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        <Link
          to={`/sellers/${seller.id}`}
          className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
        >
          <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar
                src={seller.logo ?? undefined}
                fallback={seller.name.charAt(0).toUpperCase()}
              />
              <div className="flex flex-1 flex-col">
                <span className="text-ui-fg-base font-medium">
                  {seller.name}
                </span>
              </div>
              <div className="size-7 flex items-center justify-center">
                <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </Container>
  );
};
