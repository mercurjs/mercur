import { Region } from "@medusajs/medusa";

import RadioGroup from "../../../../components/organisms/radio-group";

type Props = {
  region: Region;
};

const RegionCard = ({ region }: Props) => {
  return (
    <RadioGroup.Item
      value={region.id}
      label={region.name}
      sublabel={
        region.countries && region.countries.length
          ? `(${region.countries.map((c) => c.display_name).join(", ")})`
          : undefined
      }
    ></RadioGroup.Item>
  );
};

export default RegionCard;
