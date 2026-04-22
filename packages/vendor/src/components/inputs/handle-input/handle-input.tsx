import { Input, Text } from "@medusajs/ui";
import {
  ComponentProps,
  ComponentType,
  CSSProperties,
  ElementRef,
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type HandleInputProps = ComponentProps<typeof Input> & {
  prefix?: string;
};

export const HandleInput: ComponentType<HandleInputProps> = forwardRef<
  ElementRef<typeof Input>,
  HandleInputProps
>(({ prefix = "/", style, ...props }, ref) => {
  const prefixRef = useRef<HTMLDivElement>(null);
  const [paddingLeft, setPaddingLeft] = useState<number>(
    prefix === "/" ? 40 : 0,
  );

  useLayoutEffect(() => {
    if (prefixRef.current) {
      setPaddingLeft(prefixRef.current.offsetWidth + 8);
    }
  }, [prefix]);

  const mergedStyle: CSSProperties = { ...style, paddingLeft };

  return (
    <div className="relative">
      <div
        ref={prefixRef}
        className="absolute inset-y-0 left-0 z-10 flex min-w-8 items-center justify-center border-r px-2.5"
      >
        <Text
          className="text-ui-fg-muted"
          size="small"
          leading="compact"
          weight="plus"
        >
          {prefix}
        </Text>
      </div>
      <Input ref={ref} {...props} style={mergedStyle} />
    </div>
  );
});
HandleInput.displayName = "HandleInput";
