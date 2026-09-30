# FORM / FEEL

**Three forms. Infinite in-betweens.** A standalone, interactive motion-design study made entirely with HTML, CSS, and JavaScript.

## Open

Open `index.html` directly in a modern browser. No build, packages, server, fonts, assets, or network requests are required.

## Play

- Select **Orbit**, **Wave**, or **Bloom** to morph the same living sculpture into a new geometry.
- Move your pointer over the canvas to gently change its perspective.
- Adjust **Energy** to change the tempo.
- Use the circular pause/play control to freeze or resume the composition.
- **Change your perspective** advances to the next study.

## Direction

Editorial typography, warm paper, a near-black drawing space, and electric chartreuse. The hero enters with a staggered typographic reveal; the sculpture is a depth-sorted 3D lattice rendered with the Canvas 2D API. Form changes continuously interpolate the geometry instead of swapping disconnected animations. Pointer influence is damped and frame-rate independent.

## Accessibility and performance

Semantic landmarks and headings, native keyboard-operable buttons, labeled range control, pressed states, live study descriptions, visible focus indicators, and a responsive mobile composition. The system's reduced-motion preference starts the sculpture paused and removes entrance transitions; selecting a form updates immediately. You can opt back into motion with Play. The animation suspends while the document is hidden. Rendering resolution is capped at 2× device pixel ratio.

## Implementation

One portable `index.html`, embedded CSS and JavaScript, no libraries. JavaScript syntax and mocked DOM/Canvas runtime checks pass for shape selection, energy, pause/resume, reduced-motion behavior, hidden-tab suspension, single-frame-loop scheduling, and finite drawing coordinates. Browser visual verification was blocked by the execution environment’s browser/socket restrictions, so desktop/mobile rendering and keyboard behavior still need a real-browser check.
