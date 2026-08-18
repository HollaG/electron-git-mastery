import { Box } from "@mantine/core";
import { flushSync } from "react-dom";

type ResizeHandleProps = {
  width: number;
  min: number;
  /** Evaluated when a drag starts, so window resizes cannot leave it stale. */
  max: () => number;
  cssVars: string[];
  invert?: boolean;
  onChange: (width: number) => void;
};

export const ResizeHandle = ({
  width,
  min,
  max,
  cssVars,
  invert = false,
  onChange,
}: ResizeHandleProps) => {
  return (
    <Box
      pos="absolute"
      top={0}
      {...(invert ? { left: 0 } : { right: 0 })}
      h="100%"
      w={6}
      style={{ cursor: "col-resize", zIndex: 100 }}
      onMouseDown={(e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = width;
        const maxWidth = Math.max(min, max());
        let current = startWidth;
        let raf = 0;

        const apply = (next: number) => {
          const value = `${next}px`;
          for (const name of cssVars) {
            document.documentElement.style.setProperty(name, value);
          }
        };

        const onMove = (ev: MouseEvent) => {
          const dx = invert ? startX - ev.clientX : ev.clientX - startX;
          current = Math.min(maxWidth, Math.max(min, startWidth + dx));
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            apply(current);
          });
        };

        const onUp = () => {
          cancelAnimationFrame(raf);
          apply(current);
          flushSync(() => onChange(current));
          for (const name of cssVars) {
            document.documentElement.style.removeProperty(name);
          }
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      }}
    />
  );
};
