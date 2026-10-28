# Retention

A personal study log for the way you actually work: time your study, write it down, then record the hours by day and subject.

[Open Retention](https://ajgamerx1.github.io/PhysicsGCA/)

## Orbit release

- Dark cyan workspace with daily history, batch logging, and a quiet study companion.
- Choose a date, add subject/hour/minute entries, and save them together. Undo the latest batch if needed.
- Inspect a day through the weekly chart; use Progress for the calendar and longer-term history.
- Optional Flowmodoro timer survives refresh and uses an absolute break deadline. Subject, topic, study type, and ratio are captured when focus starts. Overnight sessions belong to their starting date.
- Animated fox reads during focus, stretches on breaks, and briefly celebrates saved effort. Quiet mode and reduced-motion controls are available; system reduced-motion preferences are respected.
- Existing subjects, units, coursework, planning, other companions, earned unlocks, and backup/import tools remain available.

## Your data

Study data stays in browser storage under the existing `retentionApp_v3` key. This release migrates earlier saves additively and retains the existing GitHub Pages origin. Export a backup from Settings when moving browsers/devices. If storage fails, a warning stays visible and you can export the in-memory data.

`?demo=1` opens an explicitly labeled sample workspace with a separate storage key. It never replaces real study history.

## Development

`index.html` contains the application. `manifest.webmanifest` and `assets/icons/` supply the Orbit home-screen and browser icons. Keep these files together when hosting; no build step is required. The two original Physics module pages are preserved.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

With Node.js 22.13 or newer, run regression checks:

```sh
npm ci
npm test
```

Checks cover startup, demo isolation, historical batch logging and undo, validation, timer persistence and attribution, break recovery, legacy data, review deduplication, storage errors, keyboard behavior, and companion preferences. GitHub Actions runs them on pushes to main and pull requests.

GitHub Pages publishes the root of `main`.

The original cube-pet assets retain their inline Kenney CC0 attribution. The new fox is an original animated SVG rig.

## Original Physics resources

- [Module 1: Motion](Module1_Motion_StudyTool.html)
- [Module 2: Motion equations](Module2_MotionEqs_StudyTool.html)
- [Physics Quizlet folder](https://quizlet.com/user/ajgamerxminecrafter/folders/physics?i=5td2xm&x=1xqt)
