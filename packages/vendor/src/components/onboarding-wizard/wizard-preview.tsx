import { useEffect } from "react";

import { assetUrl } from "../../utils/asset-url";

type WizardPreviewProps = {
  currentStep: number;
};

const STEP_IMAGES: Record<number, string> = {
  0: assetUrl("/onboarding/1.png"),
  1: assetUrl("/onboarding/2.png"),
  2: assetUrl("/onboarding/3.png"),
  3: assetUrl("/onboarding/4.png"),
};

const preloadImages = () => {
  Object.values(STEP_IMAGES).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

export const WizardPreview = ({ currentStep }: WizardPreviewProps) => {
  useEffect(preloadImages, []);

  const image = STEP_IMAGES[currentStep];

  return (
    <div
      className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
      style={{ backgroundImage: `url(${assetUrl("/onboarding/bg.svg")})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <img
        src={image}
        alt=""
        className="w-[75%] max-h-[75%] object-contain"
      />
    </div>
  );
};
