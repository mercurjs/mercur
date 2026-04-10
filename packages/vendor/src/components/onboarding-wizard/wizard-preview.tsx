import { useEffect } from "react";

type WizardPreviewProps = {
  currentStep: number;
};

const STEP_IMAGES: Record<number, string> = {
  0: "/onboarding/1.png",
  1: "/onboarding/2.png",
  2: "/onboarding/3.png",
  3: "/onboarding/4.png",
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
      style={{ backgroundImage: "url(/onboarding/bg.svg)", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <img
        src={image}
        alt=""
        className="w-[75%] max-h-[75%] object-contain"
      />
    </div>
  );
};
