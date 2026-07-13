import React from "react";

// Strip animation-specific props so tests get plain HTML elements
function createMotionComponent(tag: string) {
  return React.forwardRef<HTMLElement, Record<string, unknown>>(
    (props, ref) => {
      const {
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        whileInView,
        viewport,
        variants,
        layout,
        ...rest
      } = props as Record<string, unknown> & {
        initial?: unknown;
        animate?: unknown;
        exit?: unknown;
        transition?: unknown;
        whileHover?: unknown;
        whileTap?: unknown;
        whileInView?: unknown;
        viewport?: unknown;
        variants?: unknown;
        layout?: unknown;
      };
      return React.createElement(tag, { ...rest, ref });
    },
  );
}

export const motion = {
  div: createMotionComponent("div"),
  nav: createMotionComponent("nav"),
  span: createMotionComponent("span"),
  img: createMotionComponent("img"),
  p: createMotionComponent("p"),
  h2: createMotionComponent("h2"),
  h3: createMotionComponent("h3"),
};

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}
