# VeriSettle Motion Design

## Intent

Motion is used to communicate **protocol state**, not to decorate the interface. The landing background will render a slow, low-contrast proof-orbit treatment; the authenticated workspace will use short state transitions for record creation, receipt confirmation, and proof-stage changes. The system will not use parallax, auto-playing video, or large moving surfaces.

## Accessibility and Performance

The existing `framer-motion` dependency is Motion for React. The app-level Motion configuration will use `reducedMotion="user"`; bespoke background motion will additionally use `useReducedMotion` and become static when the operating system asks for reduced motion. Motion’s documentation describes this configuration as disabling transform and layout animation while preserving opacity/background-color animation. [1]

All animation is limited to opacity and transform, with a 180–300 ms interface-transition range. Motion components use declarative `animate`, `whileHover`, `whileTap`, and `layout` behavior that avoids React render-loop animation. [2]

## Visual System

The background motif is an abstract **attestation orbit**: three faint points move around a proof boundary, linked by a contained cyan path. It reinforces the source → proof → settlement system without imitating an exchange chart, a token price, or a wallet UI. The effect remains behind content, receives no pointer events, and uses no sensitive data.

## Verification

The landing page and the real `Funded` user draft `2w8_iT1aNogY1b` were reviewed at `1280 × 720` and `375 × 812`. At both breakpoints, the orbit remained subordinate to copy and controls; the funding receipt, terms commitment, proof action, and replay boundary stayed legible. The production build, strict TypeScript check, and thirteen-test Vitest suite passed after the motion implementation.

## References

[1]: [Motion accessibility guide](https://motion.dev/docs/react-accessibility)
[2]: [Motion React component guide](https://motion.dev/docs/react-motion-component)
