# gallipoli-1915-webgl

Cinematic procedural Three.js tribute to the Battle of Gallipoli (Çanakkale, 18 March 1915) — **Build by GPT 5.6**.

One file. No build step. No bundler. No external art assets: every mesh, texture and shader is generated in code.

## What is actually in `index.html`

| Element | Implementation |
|---|---|
| Renderer | `THREE.WebGLRenderer`, PCF soft shadow maps, ACES Filmic tone mapping, sRGB output, pixel ratio capped at 1.7 |
| Terrain | 250 × 310 plane, 170 × 210 segments, displaced by a 5-octave value-noise fBm with a smoothstep shoreline mask; per-vertex colours blended between three palettes |
| Sea | Custom `ShaderMaterial` — three summed sine waves in the vertex stage, screen-space derivative normals, Fresnel term and a 38-exponent specular highlight, wired into Three's fog chunks |
| Sky | Back-side sphere shader interpolating dawn → day → zenith from a `uDay` uniform |
| Fortifications | 4 procedural forts, 18 coastal batteries, 4 sandbagged trench runs built along `CatmullRomCurve3` tubes |
| Settlement | 34 houses, 22 tents, 300 instanced trees (`InstancedMesh`) |
| Units | 12 capital ships, 18 boats, 40 mine-line buoys, 146 instanced soldiers |
| Effects | 280 smoke + 360 dust points with a canvas-generated radial sprite, 18 additive blast sprites, 34 shell tracers on parabolic arcs |
| Camera | Closed `CatmullRomCurve3` dolly with a separate look-at spline; `OrbitControls` with damping takes over on any pointer/wheel input |
| HUD | Turkish overlay: simulation clock (08:45 + a 150 s day cycle), 4 live metrics, 6 rotating event captions |

Dependency: `three@0.167.1`, loaded through an ES-module **importmap** from jsDelivr. Nothing is vendored, so the page needs network access on first load.

## Accessibility and honesty notes

- `prefers-reduced-motion: reduce` disables the automatic cinematic tour and the film-grain / loader animations; the scene stays fully orbit-controllable.
- The scene container carries an `aria-label`; `<noscript>` explains the JavaScript requirement.
- `webglcontextlost` is caught so a lost context does not throw.
- **This is not a historical reconstruction.** The in-page notice states it plainly: a stylised interpretation inspired by the geography and atmosphere of the period, containing no graphic violence. Ship, battery and unit counts are visual staging figures, not sourced orders of battle.

## Running it

```bash
python -m http.server 8000   # then open http://localhost:8000
```

Opening `index.html` straight from the filesystem also works in most browsers, but a local server is safer for ES modules.

GitHub Pages: enable **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**. `.nojekyll` is committed so the file is served verbatim.

## Related

[`canakkale-1915-webgl`](https://github.com/umutseve4/canakkale-1915-webgl) is an independent take on the same subject (Three.js r169, post-processing bloom, cached height-field terrain). The two are kept separate on purpose: different engines, different visual language, different authorship credit.

## License

[MIT](LICENSE) © 2026 Umut SEVER — code only. Historical names and events are, of course, not owned by anyone.
