# VeriSettle Landing Motion Direction

The landing upgrade uses Motion as an **evidence-navigation system**, not as decorative animation. Official Motion guidance distinguishes scroll-triggered reveals from scroll-linked state and supports both through performant viewport and scroll APIs.[1] The implementation will therefore use a small scroll-progress cue, a staged hero entrance, and once-only evidence-card reveals instead of continuous large-scale parallax or auto-playing effects.

| Motion pattern | VeriSettle use | Reduced-motion fallback |
|---|---|---|
| Hero stagger | Establish the proof-to-release hierarchy in a short initial sequence | Immediate content with opacity only |
| Scroll progress | Communicate progress through the public evidence narrative | Static hidden indicator |
| In-view reveal | Introduce receipt and policy checkpoints once, as a reader reaches them | Opacity-only reveal |
| Hover/press feedback | Confirm interactive cards and action links | Color and border response without transforms |

Motion’s accessibility guidance recommends preserving educational transitions while replacing large transforms with opacity, disabling parallax, and respecting user reduced-motion preferences through `MotionConfig` or `useReducedMotion`.[2] The landing page will retain its existing reduced-motion safeguards and extend them to all new effects.

## References

[1]: https://motion.dev/docs/react-scroll-animations "Motion for React — scroll-triggered and scroll-linked animations"
[2]: https://motion.dev/docs/react-accessibility "Motion for React — accessible animation guidance"
