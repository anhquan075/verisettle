export const VERI_EASE = [0.23, 1, 0.32, 1] as const;
export const VERI_EASE_ENTER = [0.16, 1, 0.3, 1] as const;

export const revealViewport = {
  once: true,
  amount: 0.16,
  margin: "0px 0px -6% 0px",
} as const;

export function heroEnter(reduce: boolean) {
  return reduce ? false : { opacity: 0, y: 28, filter: "blur(12px)" };
}

export function cardEnter(reduce: boolean) {
  return reduce ? false : { opacity: 0, y: 18, filter: "blur(8px)" };
}

export function canvasEnter(reduce: boolean) {
  return reduce ? false : { opacity: 0, y: 22, scale: 0.975, filter: "blur(10px)" };
}

export function motionRest() {
  return { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
}

export function staggerDelay(reduce: boolean, index: number, step = 0.08, base = 0) {
  return reduce ? 0 : base + index * step;
}

export function enterTransition(reduce: boolean, delay = 0, duration = 0.56) {
  return {
    duration: reduce ? 0 : duration,
    delay: reduce ? 0 : delay,
    ease: VERI_EASE_ENTER,
  };
}

export function pageFade(leaving: boolean, reduce: boolean) {
  return {
    animate: leaving
      ? { opacity: 0, y: -14, filter: "blur(6px)" }
      : { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: reduce ? 0 : 0.22, ease: VERI_EASE },
  };
}
