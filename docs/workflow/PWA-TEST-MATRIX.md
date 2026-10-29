# PWA Android: initial investigation and test matrix

Date: 2026-10-29
Owner: Specialized PWA diagnostics conversation
Issue: https://github.com/mckaren8089-stack/karen-rooznama/issues/2
Baseline commit: f84d3eb9924101cddc6e3b4d25617a8b115729d3
Status: investigation open; not an install fix.

| Verified evidence | Hypothesis | Test | Current outcome |
|---|---|---|---|
| Android 14 user-confirmed successful install | PWA can be installed in at least one Android environment | Preserve this baseline and retest after any future fix | Confirmed by user, no new device test |
| Android 15 user-confirmed failure: Could not open app, app absent | WebAPK packaging/installation failure or resource fetch problem | Live HTTP probe, then Chrome/WebAPK diagnostics on device | Root cause unknown |
| Android 16 Installing disappears with no icon | WebAPK provisioning or install failure | Live HTTP probe, then device-specific logging | Root cause unknown |
| Manifest id/start_url/scope are ./ | Bad URL scope | Resolve against Pages subpath | Static consistency passed |
| Manifest references 192/512 PNG and 512 maskable | Icons missing/malformed in deployment | Live PNG signatures, dimensions, MIME | Awaiting GitHub Actions result |
| Service worker precaches all listed icons and handles fallback | Cache install event fails due to missing resource | Live HTTP and browser SW lifecycle diagnostics | Unconfirmed |
| GitHub Actions runs icon generator before Pages upload | Deployed images differ from source | Probe real published image bytes | Awaiting GitHub Actions result |
| Desktop result unknown | Desktop browser installability differs from WebAPK | Chrome DevTools Application and installation test | Not run |

## First executed test
Static repository inspection: 10 of 10 structural checks passed (manifest parse, relative URL scope, standalone, three icon declarations, manifest HTML link, SW registration, SW cache entries, build-before-upload order). These are structural checks only, NOT a real live-install test.

## First repeatable external test
Run `python docs/workflow/pwa_live_probe.py` in GitHub Actions on the isolated PR branch. It checks published HTTP status/MIME, manifest URL resolution, decoded icon dimensions and PNG signatures, service-worker file, and app entry point. Any failure is a lead, not automatically the Android root cause. The workflow never clears caches, modifies user storage, installs a PWA, or changes production.

## Safety
No changes to production app, manifest ID, start_url, scope, notes key, or domain. No claims about an Already installed message on Android 15. Device diagnosis must rely on actual device evidence. No install verification from a desktop/cloud test.

## Next steps
1. Read GitHub Actions outcome and logs; compare deployed resources with source.
2. Use Chrome DevTools on desktop or Work browser (if available) for installability/SW lifecycle; capture errors.
3. On Android 15 and 16, collect OS-labelled Chrome/WebAPK diagnostics without clearing site data.
4. Propose reversible fix on separate branch only after causal evidence.

## Executed live test result — 2026-10-29
GitHub Actions run: https://github.com/mckaren8089-stack/karen-rooznama/actions/runs/40863748297
Result: SUCCESS. Job 123413170976 succeeded.
Published endpoint results: root 200 text/html (686 bytes); manifest 200 application/manifest+json (770 bytes); icons 192 (20464 bytes), 512 (60785 bytes), maskable 512 (65127 bytes), each 200 image/png with validated PNG signature and dimensions; sw.js 200 application/javascript (1489 bytes); app.js 200 application/javascript (14866 bytes).
Manifest id, start_url, scope resolve to Pages app root. Structural SW registration string exists. Existing Validate Rooznama CI run 40863748234 also succeeded.
Interpretation: Missing published icons, malformed PNG dimensions, incorrect manifest content type or plain HTTP 404 on tested files are not supported by this live test. This does NOT prove successful runtime SW installation, Chrome installability, WebAPK packaging or Android installation. Root cause remains unknown.

## Cross-app same-origin discovery — 2026-10-29 (priority HIGH)

Source code checked in `mckaren8089-stack/karen-fuse`:
- Karen Fuse manifest has `start_url: "./"`, `scope: "./"`, no explicit `id`; Rooznama manifest has `id: "./"`, `start_url: "./"`, `scope: "./"`. Both GitHub Pages project sites live on the exact HTTPS origin `mckaren8089-stack.github.io`, but under separate directory scopes. The URLs are not independent origins.
- User evidence: Karen Fuse appears in Android 15 `chrome://webapks`, Rooznama does NOT. This does not prove any "Already installed" message on Android 15.
- Chromium bug https://issues.chromium.org/issues/572287931 (2026-10-11, duplicate of 568841400) documents a regression in installing a second WebAPK under a different path on the SAME origin. The issue describes "already installed" on another environment, not necessarily the user's error. Treat as a plausible **Chrome-origin WebAPK collision**, not as a confirmed root cause or a device observation.
- Official Chrome guidance recommends **distinct origins** for independent PWAs; see https://web.dev/blog/building-multiple-pwas-on-the-same-domain (same-origin independent path pattern not recommended).
- **Independently confirmed code defect:** Karen Fuse `sw.js` originally removes every CacheStorage entry other than `karen-fuse-v0.4.2` in its activation. CacheStorage is shared per origin even with separate service-worker scopes, so it can delete Rooznama's cached assets. Reversible repair proposed in Karen Fuse draft PR https://github.com/mckaren8089-stack/karen-fuse/pull/7 . This cache defect is NOT proof of WebAPK minting failure.

### Root-cause discrimination test (requires actual Android 15)
Publish **exact same Rooznama code without PWA identity edits** on a separate free HTTPS origin using a separate GitHub Pages organization/owner; do NOT take down or redirect the existing deployment. Attempt Chrome WebAPK installation on Android 15 from this origin. Verify a separate entry in Android Settings > Apps and standalone launch (not a shortcut). Compare with current origin failure. If different-origin WebAPK succeeds, this strongly supports origin-level collision. If it fails, inspect on-device Chrome/WebAPK logs and runtime installability, and do not claim a fixed cause.

### Safety before any origin migration
Both applications' `localStorage` are scoped to the old origin. Create explicit JSON backups and a reviewed migration plan before moving user data or redirecting any URL. A test replica must not silently replace existing PWA identity or change the production `id`, `scope` or `start_url`. Keep Android 14 functioning.

### Blockers
GitHub connector available here has no create-organization/create-repository action, and ChatGPT Work's cloud browser cannot be launched from this conversational tool context. Requires owner-created destination GitHub organization/repo or Work mode, after which deployment can be automated from GitHub Actions. No real Android 15 installation has yet been executed by this assistant.
