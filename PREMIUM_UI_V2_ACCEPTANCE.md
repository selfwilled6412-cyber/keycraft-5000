# KEY CRAFT 5000 — Premium Game UI v2 Acceptance Criteria

This branch is rebuilt from the stable B-type candidate. It must not be merged into production until the visual/product review passes.

## Human-eye review gate

A first-time viewer should understand within roughly three seconds that this is a polished game, not a styled web form.

The screen must visibly contain:

- a dense, believable town/settlement scene;
- distinct buildings with readable purpose and labels;
- visible people/crew/hero presence;
- environmental atmosphere such as snow, fire, light, depth and motion;
- strong resource/status HUD hierarchy;
- mission, reward and progression surfaces that feel like a commercial mobile strategy game;
- no placeholder-looking line-art scene as the main visual.

## Progression gate

Player progress must visibly change the world. A viewer should be able to compare an early and later state and immediately see more buildings, crew, lights, districts and unlocked content.

## Hero / crew gate

Provide a hero/crew roster surface with cards, role icon, rarity/state, level/progress and locked/unlocked states. The roster must make the world feel populated and collectible rather than decorative.

## Deliverables gate — highest priority

The deliverables page is not a report page. It must create products worth saving and showing to a delivery destination.

At minimum provide downloadable PNG outputs for:

1. Current Settlement Poster — high-impact current town view with player/district/progress metadata.
2. Mission Clear Card — completed mission, unlocked craft/building and reward presentation.
3. District Progress Board — current district development with unlocked buildings/crew.
4. Hero/Crew Collection Board — currently unlocked crew and progress.

The output must look good when opened as an image without the app around it.

## Data gate

- Keep current D1 progress/save model intact.
- Preserve existing 5,000 phrases and mission identifiers.
- Preserve recording functionality.
- Staging review must load the seeded `minako` progress correctly before visual sign-off.

## Release gate

- CI must pass.
- Browser review must pass at desktop size used in the facility.
- Deliverable PNG exports must be visually reviewed.
- Production `main` is untouched until explicit approval.

## Implementation checkpoint — 2026-08-20

- [x] Premium strategy-game command screen implemented with real CC0 game art rather than procedural line-art.
- [x] Isometric settlement uses distinct building assets, labels, locked/unlocked progression, snow, roads, central beacon/fire and crew markers.
- [x] Hero/crew collection screen implemented with detailed character art, rarity, level, stars and locked/unlocked progression.
- [x] Four dedicated 1600×900 PNG product generators implemented for settlement poster, mission clear card, district development board and hero/crew collection board.
- [x] Staging bootstrap automatically prefers the seeded `minako` player instead of stale localStorage.
- [x] Staging deployment script is isolated from production and copies only `minako` via read-only production queries.
- [x] Content validation / lint / TypeScript / tests / production build / Wrangler dry-run / smoke test passed at the implementation checkpoint.
- [ ] Browser visual review on staging.
- [ ] PNG export visual review on staging.
- [ ] Explicit human approval before any production merge.
