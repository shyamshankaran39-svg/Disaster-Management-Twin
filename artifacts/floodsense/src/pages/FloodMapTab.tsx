import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { initBaseMap, addAreaMarkers, addWaterMarkers, clipToLand } from "../data/simulatedData";

const STEPS = ["Now", "+6h", "+12h", "+24h", "+48h"];

const STEP_DATA = [
  { depth: "1.4", velocity: "0.8", risk: "8.2", pop: "320k", color: "#36d6ff" },
  { depth: "1.8", velocity: "1.1", risk: "8.8", pop: "410k", color: "#36d6ff" },
  { depth: "2.3", velocity: "1.4", risk: "9.1", pop: "530k", color: "#ffb020" },
  { depth: "2.9", velocity: "1.7", risk: "9.5", pop: "710k", color: "#ff8a3d" },
  { depth: "3.4", velocity: "2.0", risk: "9.8", pop: "940k", color: "#ff3b5c" },
];

/* ── Precipitation heatmap grid (12 points over Chennai) ───────────────────
   Open-Meteo current weather — current=precipitation — free, no key needed. */
const PRECIP_GRID: [number, number][] = [
  [13.15, 80.10], [13.15, 80.18], [13.15, 80.25],
  [13.07, 80.10], [13.07, 80.18], [13.07, 80.25],
  [12.99, 80.10], [12.99, 80.18], [12.99, 80.24],
  [12.91, 80.12], [12.91, 80.18], [12.91, 80.22],
];

function precipColor(mm: number): string {
  if (mm <= 0)   return "rgba(0,120,255,0)";
  if (mm < 1)    return "rgba(0,120,255,0.15)";
  if (mm < 5)    return "rgba(0,100,220,0.30)";
  if (mm < 15)   return "rgba(0,60,200,0.42)";
  if (mm < 30)   return "rgba(80,0,200,0.52)";
  return           "rgba(180,0,255,0.62)";
}

async function fetchPrecipGrid(): Promise<{ ll: [number, number]; mm: number }[]> {
  const results = await Promise.all(
    PRECIP_GRID.map(async ([lat, lng]) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation&timezone=Asia%2FKolkata&forecast_days=1`;
        const json = await (await fetch(url)).json();
        return { ll: [lat, lng] as [number, number], mm: json.current?.precipitation ?? 0 };
      } catch {
        return { ll: [lat, lng] as [number, number], mm: 0 };
      }
    }),
  );
  return results;
}

function buildPolys(map: L.Map, stepIdx: number): L.Polygon[] {
  const scale = 1 + stepIdx * 0.22;
  const hotspots: { center: [number, number]; risk: number; fromStep: number }[] = [
    { center: [12.9750, 80.2200], risk: 0.92, fromStep: 0 },
    { center: [12.9430, 80.2120], risk: 0.96, fromStep: 0 },
    { center: [13.0067, 80.2206], risk: 0.55, fromStep: 1 },
    { center: [12.9617, 80.2467], risk: 0.81, fromStep: 1 },
    { center: [13.0067, 80.2570], risk: 0.68, fromStep: 2 },
    { center: [12.9010, 80.2279], risk: 0.74, fromStep: 2 },
    { center: [12.9229, 80.1275], risk: 0.78, fromStep: 3 },
    { center: [13.0418, 80.2341], risk: 0.49, fromStep: 4 },
  ];

  return hotspots
    .filter(h => stepIdx >= h.fromStep)
    .map(h => {
      const [lat, lng] = h.center;
      const sz = 0.017 * scale * h.risk;
      const opacity = Math.min(0.45, 0.12 + (stepIdx - h.fromStep) * 0.08 + h.risk * 0.12);
      const raw: [number, number][] = [
        [lat - sz,       lng - sz * 1.5],
        [lat + sz,       lng - sz],
        [lat + sz * 1.3, lng + sz * 1.3],
        [lat - sz * 0.5, lng + sz * 1.8],
        [lat - sz * 1.5, lng + sz * 0.5],
      ];
      return L.polygon(clipToLand(raw), { color: "#1a8cff", fillColor: "#00f0ff", fillOpacity: opacity, weight: 1.5 })
        .addTo(map)
        .bindPopup(`<b>Flood Zone</b><br>Depth: ${(h.risk * 2.8 * scale).toFixed(1)} m`);
    });
}

export default function FloodMapTab() {
  const mapDivRef   = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<L.Map | null>(null);
  const polysRef    = useRef<L.Polygon[]>([]);
  const precipRef   = useRef<L.Circle[]>([]);
  const [step, setStep]         = useState(0);
  const [ready, setReady]       = useState(false);
  const [precipOn, setPrecipOn] = useState(false);
  const [precipLoading, setPrecipLoading] = useState(false);
  const [precipMax, setPrecipMax]         = useState(0);

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 11);
    addAreaMarkers(map, true);
    addWaterMarkers(map);
    mapRef.current = map;
    setReady(true);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* flood polygons */
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    polysRef.current.forEach(p => mapRef.current!.removeLayer(p));
    polysRef.current = buildPolys(mapRef.current, step);
  }, [step, ready]);

  /* precipitation heatmap */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!precipOn) {
      precipRef.current.forEach(c => map.removeLayer(c));
      precipRef.current = [];
      return;
    }

    let alive = true;
    async function load() {
      setPrecipLoading(true);
      const pts = await fetchPrecipGrid();
      if (!alive || !mapRef.current) return;
      precipRef.current.forEach(c => mapRef.current!.removeLayer(c));
      const maxMm = Math.max(...pts.map(p => p.mm), 0.01);
      setPrecipMax(Math.round(maxMm * 10) / 10);
      precipRef.current = pts.map(({ ll, mm }) =>
        L.circle(ll, {
          radius: 6500,
          color: "transparent",
          fillColor: precipColor(mm),
          fillOpacity: 1,
          interactive: false,
        })
          .addTo(mapRef.current!)
          .bindTooltip(`${mm.toFixed(1)} mm/hr`, { permanent: false }),
      );
      setPrecipLoading(false);
    }

    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(iv); };
  }, [precipOn, ready]);

  const d = STEP_DATA[step];

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* FULL MAP */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0, background: "#02101e" }} />

        {/* Top-left: LIVE badge */}
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 500,
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(6,26,46,.88)", border: "1px solid rgba(54,214,255,.35)",
          padding: "5px 12px", borderRadius: 8,
        }}>
          <span className="badge-ai">LIVE</span>
          <span style={{ color: "#22e39a", fontSize: 12 }}>● Streaming flood progression</span>
        </div>

        {/* Bottom-left: depth legend + precip legend */}
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 500,
          background: "rgba(6,26,46,.88)", border: "1px solid rgba(80,170,255,.2)",
          padding: "8px 12px", borderRadius: 10, fontSize: 11.5, minWidth: 150,
        }}>
          <b style={{ color: "#36d6ff" }}>DEPTH LEGEND</b>
          {[
            ["#1a3a5c", "< 0.5m"],
            ["#1a8cff66", "0.5–1.5m"],
            ["#00f0ff66", "1.5–2.5m"],
            ["#00f0ffaa", "> 2.5m"],
          ].map(([bg, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <span style={{ width: 16, height: 12, background: bg, display: "inline-block", borderRadius: 3 }}></span>
              {label}
            </div>
          ))}

          {precipOn && (
            <>
              <div style={{ borderTop: "1px solid rgba(80,170,255,.2)", marginTop: 8, paddingTop: 8 }}>
                <b style={{ color: "#36d6ff" }}>RAINFALL (mm/hr)</b>
              </div>
              {[
                ["rgba(0,120,255,0.15)", "< 1 mm"],
                ["rgba(0,100,220,0.40)", "1–5 mm"],
                ["rgba(0,60,200,0.55)", "5–15 mm"],
                ["rgba(80,0,200,0.65)", "15–30 mm"],
                ["rgba(180,0,255,0.70)", "> 30 mm"],
              ].map(([bg, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  <span style={{ width: 16, height: 12, background: bg, display: "inline-block", borderRadius: 3, border: "1px solid rgba(80,170,255,.2)" }}></span>
                  {label}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* RIGHT CONTROL PANEL */}
      <div style={{
        width: 300, flexShrink: 0,
        background: "rgba(6,26,46,0.92)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", gap: 0, overflowY: "auto", padding: 16,
      }} className="scrollbar-thin">

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#36d6ff", textTransform: "uppercase", marginBottom: 4 }}>
            Interactive Flood Map
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#dbeaff", margin: 0 }}>Timeline Control</h2>
        </div>

        {/* Time step display */}
        <div style={{
          background: "rgba(0,240,255,.07)", border: "1px solid rgba(0,240,255,.25)",
          borderRadius: 12, padding: "14px 16px", textAlign: "center", marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Current Time Step</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#00f0ff", fontFamily: "monospace" }}>{STEPS[step]}</div>
          <div style={{
            marginTop: 8, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
            color: step >= 3 ? "#ff3b5c" : step >= 2 ? "#ffb020" : "#22e39a",
          }}>
            {step >= 3 ? "⚠ SEVERE FLOOD RISK" : step >= 2 ? "⚡ ELEVATED RISK" : "✓ MONITORING"}
          </div>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            {STEPS.map((s, i) => (
              <span
                key={s}
                onClick={() => setStep(i)}
                style={{
                  fontSize: 10, fontWeight: 700, cursor: "pointer",
                  color: step === i ? "#00f0ff" : "#7da3c9",
                  textTransform: "uppercase",
                  transform: step === i ? "scale(1.1)" : "none",
                  display: "inline-block", transition: "color .2s",
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <input
            type="range" min={0} max={4} step={1} value={step}
            onChange={e => setStep(+e.target.value)}
            style={{ width: "100%", accentColor: "#00f0ff", marginTop: 4 }}
          />
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Water Depth",   val: d.depth + " m",    color: d.color },
            { label: "Flow Velocity", val: d.velocity + " m/s", color: "#00f0ff" },
            { label: "Risk Score",    val: d.risk + "/10",    color: d.color },
            { label: "Pop. Exposed",  val: d.pop,             color: "#ff8a3d" },
          ].map(k => (
            <div key={k.label} className="kpi" style={{ minWidth: 0 }}>
              <div className="label">{k.label}</div>
              <div className="val" style={{ color: k.color, fontSize: 17 }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Layer toggles */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Map Layers</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Flood Polygons", "Hotspots", "Population", "Drainage"].map(label => (
              <span key={label} className="chip on" style={{ fontSize: 11, cursor: "pointer" }}>{label}</span>
            ))}
            <span
              onClick={() => setPrecipOn(v => !v)}
              className={`chip ${precipOn ? "on" : ""}`}
              style={{ fontSize: 11, cursor: "pointer", border: "1px solid rgba(80,170,255,.35)" }}
            >
              {precipLoading ? "⟳ " : "🌧 "}Rainfall
            </span>
          </div>
        </div>

        {/* Precipitation info bar */}
        {precipOn && (
          <div style={{
            background: "rgba(0,100,255,.10)", border: "1px solid rgba(0,150,255,.3)",
            borderRadius: 10, padding: "10px 12px", marginBottom: 14,
            fontSize: 11,
          }}>
            <div style={{ color: "#36d6ff", fontWeight: 700, marginBottom: 4 }}>
              🌧 Live Precipitation Heatmap
            </div>
            {precipLoading ? (
              <div style={{ color: "#7da3c9" }}>Fetching from Open-Meteo…</div>
            ) : (
              <>
                <div style={{ color: "#dbeaff" }}>
                  Peak intensity: <b style={{ color: precipMax > 15 ? "#ff3b5c" : precipMax > 5 ? "#ffb020" : "#22e39a" }}>{precipMax} mm/hr</b>
                </div>
                <div style={{ color: "#7da3c9", marginTop: 3 }}>12-point grid · updates every 5 min</div>
              </>
            )}
          </div>
        )}

        {/* Zone Status */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Zone Status</div>
          {[
            { zone: "Pallikaranai", status: "CRITICAL", color: "#ff3b5c", show: step >= 0 },
            { zone: "Velachery",    status: "SEVERE",   color: "#ff3b5c", show: step >= 0 },
            { zone: "Perungudi",    status: "HIGH",     color: "#ffb020", show: step >= 1 },
            { zone: "Guindy",       status: "MODERATE", color: "#ffb020", show: step >= 1 },
            { zone: "Tambaram",     status: "HIGH",     color: "#ff8a3d", show: step >= 2 },
            { zone: "Sholinganallur",status:"ELEVATED", color: "#ffb020", show: step >= 2 },
            { zone: "Anna Nagar",   status: "WATCH",    color: "#36d6ff", show: step >= 3 },
            { zone: "T.Nagar",      status: "WATCH",    color: "#36d6ff", show: step >= 4 },
          ].filter(z => z.show).map(z => (
            <div key={z.zone} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 10px", marginBottom: 5, borderRadius: 8,
              background: `${z.color}14`, border: `1px solid ${z.color}33`,
              fontSize: 12,
            }}>
              <span style={{ color: "#dbeaff" }}>{z.zone}</span>
              <span style={{ color: z.color, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>{z.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
