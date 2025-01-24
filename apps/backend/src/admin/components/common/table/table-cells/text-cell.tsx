import { clx } from "@medusajs/ui";
import { PlaceholderCell } from "./placeholder-cell";

type CellProps = {
  text?: string | number;
  align?: "left" | "center" | "right";
  maxWidth?: number;
};

type HeaderProps = {
  text: string;
  align?: "left" | "center" | "right";
};

export const TextCell = ({
  text,
  align = "left",
  maxWidth = 220,
}: CellProps) => {
  if (!text) {
    return <PlaceholderCell />;
  }

  return (
    <div
      className={clx(
        "flex h-full w-full items-center gap-x-3 overflow-hidden",
        {
          "justify-start text-start": align === "left",
          "justify-center text-center": align === "center",
          "justify-end text-end": align === "right",
        }
      )}
      style={{
        maxWidth: maxWidth,
      }}
    >
      <span className="truncate">{text}</span>
    </div>
  );
};

export const TextHeader = ({ text, align = "left" }: HeaderProps) => {
  return (
    <div
      className={clx("flex h-full w-full items-center", {
        "justify-start text-start": align === "left",
        "justify-center text-center": align === "center",
        "justify-end text-end": align === "right",
      })}
    >
      <span className="truncate">{text}</span>
    </div>
  );
};
