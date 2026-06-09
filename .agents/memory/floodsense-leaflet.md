---
name: FloodSense Leaflet Patterns
description: Key patterns for Leaflet map initialization in FloodSense (React+Vite). Prevents wrong-location/zero-size bugs.
---

## Rule
All tabs with Leaflet maps must use lazy mounting and absolute-inset-0 containers.

**Why:** Mounting all 14 tab components at once causes 14 Leaflet maps to initialize simultaneously. Hidden maps (opacity:0) still have zero or conflicting heights, causing `map.invalidateSize()` to compute wrong tile coordinates, resulting in the map showing the wrong location (e.g. Kolar Gold Fields instead of Chennai).

## How to apply
1. **Lazy mounting in App.tsx**: Use a `mountedTabs` Set. Only add a tab's index when it is first activated. Render `null` for unmounted tabs.
2. **Map container layout**: Use `position:absolute;inset:0;display:flex` for each tab's root div (not `h-full w-full` which requires chain of explicit heights up to the root).
3. **initBaseMap**: Call `setTimeout(() => { map.invalidateSize(); map.setView(CHENNAI, zoom); }, 300)` after map creation to handle any layout reflow.
4. **Right panel in split layouts**: Use `width: 360; flexShrink: 0` with inline styles rather than Tailwind `w-[360px]` to avoid dynamic-class purging issues.
