# PABS ministerial demo v2

Separate design-review demo, created 24 October 2026. The original app, minister brief and published site are unchanged.

To preview, serve the repository root from a local web server and open `/demo-v2/` and `/demo-v2/video-graphics/`.

## Included

- Ministerial briefing with four national-interest measures
- Consistent package comparisons and three horizons
- Seven simplified interactive sample controls
- Transparent fictional calculation assumptions
- Browser-local draft saving and complete JSON snapshots
- Presentation mode and print styling
- Eight 1920x1080 video graphics in PNG and editable SVG, with original AI illustrations and prompts

All numerical inputs and outputs are fictional. Pakistan is a display context. This is an interaction prototype, not the rebuilt validated simulation; the existing clause-level engine is not connected.

## Files

`index.html`, `demo.css`, `demo.mjs`: interface.
`model.mjs`: deterministic, explicitly fictional model and snapshot schema.
`model-checks.mjs`: input-space invariants, horizon monotonicity and snapshot validation.
`video-graphics/`: browsable finished graphics.

## Checks

Run `node model-checks.mjs` for the model checks. Browser checks verified package changes, editing, draft restoration, horizon changes, comparison context and presentation keyboard focus. The native browser download event check stalled; automated download/reopen verification is incomplete. JSON serialization and parsing passed local roundtrip and malformed-input tests.

No network dependencies, third-party fonts, accounts or analytics are used by the demo. Local storage is readable by other code served from the same origin; downloaded snapshots are readable JSON and contain no personal notes.

Keep the stable version and backup until this demo has been reviewed. Do not publish it as a validated model.
