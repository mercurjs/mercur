import { assetUrl } from "../../utils/asset-url";

export const WizardPreview = () => {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden">
      <img
        src={assetUrl("/onboarding/illustration.svg")}
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );
};
