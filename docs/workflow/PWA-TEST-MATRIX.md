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
