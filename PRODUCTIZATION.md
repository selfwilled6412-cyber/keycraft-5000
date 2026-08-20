# KEY CRAFT 5000 Productization v1

## Safety rule
- Production `main` and the current workers.dev deployment must remain unchanged while productization work is in progress.
- All productization changes start on `agent/productization-v1`.
- No merge to `main` and no production deploy until explicit approval after user testing.

## Goal
Turn the current working app into a sellable v1.0 product without breaking the existing environment used by B-type users.

## Phase 1: product readiness audit
- First-run usability: a new user can understand what to do without staff guidance.
- Resume flow: user can reliably return to existing progress.
- Error states: network/API failures show understandable recovery guidance.
- Device/browser checks: Windows/Chrome/Edge, Android Chrome, tablet layouts.
- Accessibility basics: readable contrast, keyboard focus, large enough touch targets.

## Phase 2: account and data operations
- Add a clear user-data deletion flow.
- Add an operator-safe recovery path for lost/duplicate user records.
- Define retention and backup/recovery expectations for D1 data.
- Keep destructive operations protected from accidental execution.

## Phase 3: commercial UX
- Add a first-time onboarding screen.
- Add a concise product description and value proposition.
- Prepare free-trial / full-version gating as a feature flag, not enabled in production yet.
- Add product/version information and support contact area.

## Phase 4: legal and support readiness
- Prepare privacy policy draft based on the actual stored fields.
- Prepare terms of use draft.
- Define inquiry/support process and incident response notes.

## Phase 5: beta test
- Use a separate preview/staging deployment.
- Run third-party user tests.
- Record confusion points, completion rate, resume success, and defects.
- Fix only on the productization branch/staging environment.

## Release gate for v1.0
Release only when all of the following pass:
1. Existing production behavior remains unchanged until release approval.
2. Automated tests pass.
3. First-time user test passes without developer assistance.
4. Resume/save/delete flows pass.
5. Terms/privacy/support pages are present.
6. Staging sign-off is complete.
7. Explicit approval is given to merge/deploy.

## Current action
The productization branch is isolated from `main`. Today’s B-type user test should use the existing production URL. Feedback from that session will be treated as beta evidence and fed into this branch only.
