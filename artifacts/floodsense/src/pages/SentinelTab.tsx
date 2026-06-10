import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CHENNAI, addAreaMarkers, addWaterMarkers, addFloodPolys } from "../data/simulatedData";

/* ── tile URL factories ─────────────────────────────── */
function cartoDark() {
  return L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "© CartoDB", maxZoom: 19 },
  );
}
function esriSatellite() {
  return L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "© Esri", maxZoom: 19 },
  );
}
function esriLabels() {
  return L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { attribution: "© Esri", maxZoom: 19, opacity: 0.75 },
  );
}

/* ── inundation polygons per mode ───────────────────── */
const FLOOD_POLY_BASE: [number, number][][] = [
  [[12.98,80.21],[12.96,80.21],[12.95,80.23],[12.97,80.245],[12.99,80.235]],
  [[12.955,80.215],[12.935,80.21],[12.92,80.225],[12.94,80.245],[12.96,80.24]],
  [[13.00,80.22],[12.985,80.22],[12.975,80.24],[12.99,80.255],[13.01,80.24]],
  [[12.97,80.24],[12.95,80.245],[12.945,80.265],[12.965,80.27],[12.98,80.258]],
  [[13.015,80.255],[12.995,80.25],[12.99,80.27],[13.01,80.275],[13.02,80.265]],
];

/* SAR-only zones (dark-water backscatter detects these, cloud hides optical) */
const SAR_ONLY: [number, number][][] = [
  [[12.925,80.215],[12.91,80.21],[12.905,80.23],[12.92,80.235]],
  [[13.005,80.27],[12.99,80.268],[12.988,80.285],[13.005,80.29]],
];
/* Optical-only zones (cloud-free but shadow obscures SAR) */
const OPT_ONLY: [number, number][][] = [
  [[13.04,80.225],[13.025,80.22],[13.02,80.24],[13.04,80.245]],
];

type Mode = "sar" | "optical";
type Timeline = "24h" | "48h" | "72h";

const CHART_STYLE = {
  contentStyle: { backgroundColor: "#061a30", borderColor: "rgba(80,170,255,.25)", color: "#dbeaff" },
  labelStyle: { color: "#7da3c9" },
};

const sarData = [
  { area: "Pallikaranai", sar: 34, optical: 28 },
  { area: "Velachery",    sar: 26, optical: 22 },
  { area: "Perungudi",    sar: 18, optical: 15 },
  { area: "Sholinganallur",sar:14, optical: 12 },
  { area: "Tambaram",     sar: 10, optical: 8  },
];

const TIMELINE_SCALE: Record<Timeline, number> = { "24h": 1.0, "48h": 1.3, "72h": 1.7 };

/* ─── helpers ─────────────────────────────────────── */
function addOverlays(
  map: L.Map,
  mode: Mode,
  isAfter: boolean,
  scale: number,
): L.Layer[] {
  const layers: L.Layer[] = [];

  if (isAfter) {
    const baseOpacity = mode === "optical" ? 0.35 : 0.22;
    const baseColor   = mode === "optical" ? "#00c8ff" : "#00f0ff";
    // main flood polys
    FLOOD_POLY_BASE.forEach(coords => {
      const scaled = coords.map(([lat, lng]) => {
        const clat = lat + (lat - 13.0) * (scale - 1) * 0.6;
        const clng = lng + (lng - 80.25) * (scale - 1) * 0.6;
        return [clat, clng] as [number, number];
      });
      const p = L.polygon(scaled, {
        color: baseColor, fillColor: baseColor,
        fillOpacity: baseOpacity, weight: 1.5,
      }).addTo(map).bindPopup(`<b>Inundation Zone</b><br>Mode: ${mode.toUpperCase()}<br>Detection confidence: ${mode==="sar"?"94%":"81%"}`);
      layers.push(p);
    });
    // SAR-only difference layer
    if (mode === "sar") {
      SAR_ONLY.forEach(coords => {
        const p = L.polygon(coords, {
          color: "#ff00ff", fillColor: "#ff00ff",
          fillOpacity: 0.28, weight: 2, dashArray: "6 4",
        }).addTo(map).bindPopup("<b>SAR-only Detection</b><br>Cloud cover hides this from optical.<br>Backscatter confirms standing water.");
        layers.push(p);
      });
    }
    // Optical-only difference layer
    if (mode === "optical") {
      OPT_ONLY.forEach(coords => {
        const p = L.polygon(coords, {
          color: "#ffb020", fillColor: "#ffb020",
          fillOpacity: 0.28, weight: 2, dashArray: "6 4",
        }).addTo(map).bindPopup("<b>Optical-only Detection</b><br>SAR shadow prevented backscatter detection.<br>RGB analysis confirms surface water.");
        layers.push(p);
      });
    }
    // Cloud cover mask (optical only)
    if (mode === "optical") {
      const cloud = L.polygon(
        [[13.1,80.18],[13.08,80.16],[13.06,80.19],[13.08,80.22],[13.11,80.21]] as [number,number][],
        { color: "#fff", fillColor: "#fff", fillOpacity: 0.12, weight: 1, dashArray: "3 5" },
      ).addTo(map).bindPopup("☁ Cloud Cover — partial obscuration");
      layers.push(cloud);
    }
  }
  return layers;
}

function makeLabelBadge(text: string, color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:rgba(6,26,46,.9);color:${color};
      padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;
      border:1px solid ${color};white-space:nowrap;letter-spacing:.5px
    ">${text}</div>`,
    iconSize: [180, 20],
    iconAnchor: [0, 0],
  });
}

/* ─── component ───────────────────────────────────── */
export default function SentinelTab() {
  const [mode, setMode]         = useState<Mode>("sar");
  const [timeline, setTimeline] = useState<Timeline>("24h");
  const [showDiff, setShowDiff] = useState(true);

  const beforeDivRef   = useRef<HTMLDivElement>(null);
  const afterDivRef    = useRef<HTMLDivElement>(null);
  const mapBeforeRef   = useRef<L.Map | null>(null);
  const mapAfterRef    = useRef<L.Map | null>(null);
  const tileBeforeRef  = useRef<L.TileLayer | null>(null);
  const tileAfterRef   = useRef<L.TileLayer | null>(null);
  const labelBeforeRef = useRef<L.Marker | null>(null);
  const labelAfterRef  = useRef<L.Marker | null>(null);
  const overlaysRef    = useRef<L.Layer[]>([]);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  /* ── init maps once ─────────────────────────── */
  useEffect(() => {
    if (!beforeDivRef.current || !afterDivRef.current) return;

    const before = L.map(beforeDivRef.current, { center: CHENNAI, zoom: 11, zoomControl: true });
    const after  = L.map(afterDivRef.current,  { center: CHENNAI, zoom: 11, zoomControl: false });
    mapBeforeRef.current = before;
    mapAfterRef.current  = after;

    // sync pan/zoom
    before.on("move", () => after.setView(before.getCenter(), before.getZoom(), { animate: false }));
    after.on("move",  () => before.setView(after.getCenter(),  after.getZoom(),  { animate: false }));

    // initial tiles
    const tb = cartoDark().addTo(before);
    const ta = cartoDark().addTo(after);
    tileBeforeRef.current = tb;
    tileAfterRef.current  = ta;

    addAreaMarkers(before);
    addWaterMarkers(before);
    addAreaMarkers(after, true);
    addWaterMarkers(after);
    addFloodPolys(after, 1.0);

    // label markers
    labelBeforeRef.current = L.marker(CHENNAI, { icon: makeLabelBadge("SAR · PRE-FLOOD", "#7da3c9"), zIndexOffset: 1000 }).addTo(before);
    labelAfterRef.current  = L.marker(CHENNAI, { icon: makeLabelBadge("SAR · POST-FLOOD · 24h", "#36d6ff"), zIndexOffset: 1000 }).addTo(after);

    setTimeout(() => { before.invalidateSize(); after.invalidateSize(); before.setView(CHENNAI, 11); after.setView(CHENNAI, 11); }, 300);

    return () => { before.remove(); after.remove(); };
  }, []);

  /* ── switch mode / timeline ─────────────────── */
  useEffect(() => {
    const before = mapBeforeRef.current;
    const after  = mapAfterRef.current;
    if (!before || !after) return;

    // swap tile layers
    if (tileBeforeRef.current) before.removeLayer(tileBeforeRef.current);
    if (tileAfterRef.current)  after.removeLayer(tileAfterRef.current);
    if (labelsLayerRef.current) { before.removeLayer(labelsLayerRef.current); after.removeLayer(labelsLayerRef.current); }

    if (mode === "optical") {
      tileBeforeRef.current = esriSatellite().addTo(before);
      tileAfterRef.current  = esriSatellite().addTo(after);
      const lbl1 = esriLabels(); lbl1.addTo(before);
      const lbl2 = esriLabels(); lbl2.addTo(after);
      labelsLayerRef.current = lbl1; // just store one ref for cleanup
    } else {
      tileBeforeRef.current = cartoDark().addTo(before);
      tileAfterRef.current  = cartoDark().addTo(after);
      labelsLayerRef.current = null;
    }

    // update label badges
    if (labelBeforeRef.current) {
      labelBeforeRef.current.setIcon(makeLabelBadge(
        mode === "sar" ? "SAR · PRE-FLOOD" : "OPTICAL · PRE-FLOOD",
        "#7da3c9",
      ));
    }
    if (labelAfterRef.current) {
      labelAfterRef.current.setIcon(makeLabelBadge(
        `${mode === "sar" ? "SAR" : "OPTICAL"} · POST-FLOOD · ${timeline}`,
        mode === "sar" ? "#36d6ff" : "#22e39a",
      ));
    }

    // clear and re-add overlays
    overlaysRef.current.forEach(l => after.removeLayer(l));
    const scale = TIMELINE_SCALE[timeline];
    overlaysRef.current = showDiff ? addOverlays(after, mode, true, scale) : [];

  }, [mode, timeline, showDiff]);

  /* ── stats per mode ─────────────────────────── */
  const isOptical = mode === "optical";
  const metrics = [
    { label: "Flooded Area",        val: isOptical ? "156 km²" : "187 km²",  color: "#36d6ff" },
    { label: "SAR-Only Zones",      val: isOptical ? "—"       : "31 km²",   color: "#ff00ff" },
    { label: "Cloud-Obscured",      val: isOptical ? "22 km²"  : "—",        color: "#ffb020" },
    { label: "Detection Accuracy",  val: isOptical ? "81%"     : "94%",      color: isOptical ? "#ffb020" : "#22e39a" },
    { label: "Buildings Impacted",  val: isOptical ? "10,200"  : "12,408",   color: "#ff3b5c" },
    { label: "Roads Impacted",      val: isOptical ? "178 km"  : "214 km",   color: "#ff3b5c" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>

      {/* ── TOOLBAR ─────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
        padding: "10px 18px", background: "rgba(6,26,46,.92)",
        borderBottom: "1px solid rgba(80,170,255,.18)",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#36d6ff", textTransform: "uppercase", fontWeight: 600 }}>
          Sentinel-1 SAR Flood Detection
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 1, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(80,170,255,.25)", marginLeft: 8 }}>
          {(["sar", "optical"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
                background: mode === m
                  ? (m === "sar" ? "linear-gradient(90deg,#1a8cff,#00f0ff)" : "linear-gradient(90deg,#22e39a,#1a8cff)")
                  : "rgba(6,26,46,.8)",
                color: mode === m ? "#001" : "#7da3c9",
                transition: ".2s", letterSpacing: .5, textTransform: "uppercase",
              }}
            >
              {m === "sar" ? "⚡ SAR Backscatter" : "🛰 Optical RGB"}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ display: "flex", gap: 6, marginLeft: 4 }}>
          {(["24h","48h","72h"] as Timeline[]).map(t => (
            <button
              key={t}
              onClick={() => setTimeline(t)}
              className={`chip cursor-pointer ${t === timeline ? "on" : ""}`}
              style={{ fontSize: 11 }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Diff toggle */}
        <button
          onClick={() => setShowDiff(s => !s)}
          style={{
            padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(80,170,255,.3)",
            borderRadius: 8, background: showDiff ? "rgba(0,240,255,.15)" : "transparent",
            color: showDiff ? "#00f0ff" : "#7da3c9", letterSpacing: .5, transition: ".2s",
          }}
        >
          {showDiff ? "✓ DIFF LAYER ON" : "DIFF LAYER OFF"}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#7da3c9" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22e39a", display: "inline-block", animation: "pulse-dot 2s infinite" }}></span>
          Pass: <b style={{ color: "#dbeaff" }}>12 Jun 05:47 UTC</b>
        </div>
      </div>

      {/* ── MAPS + PANEL ────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Before map */}
        <div style={{ flex: 1, position: "relative", borderRight: "1px solid rgba(80,170,255,.2)" }}>
          <div ref={beforeDivRef} style={{ position: "absolute", inset: 0, background: "#02101e" }} />
          <div style={{
            position: "absolute", top: 10, left: 10, zIndex: 500,
            background: "rgba(6,26,46,.9)", border: "1px solid rgba(80,170,255,.3)",
            padding: "4px 10px", borderRadius: 6, fontSize: 11, color: "#7da3c9", fontWeight: 700,
          }}>
            {mode === "sar" ? "SAR · PRE-FLOOD" : "OPTICAL · PRE-FLOOD"}
          </div>
          <div style={{
            position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 500,
            background: "rgba(6,26,46,.85)", border: "1px solid rgba(80,170,255,.18)",
            padding: "4px 12px", borderRadius: 6, fontSize: 10, color: "#7da3c9",
          }}>
            {mode === "sar" ? "C-band 5.6 GHz · VV/VH polarization" : "10m resolution · 13-band multispectral"}
          </div>
        </div>

        {/* After map */}
        <div style={{ flex: 1, position: "relative", borderRight: "1px solid rgba(80,170,255,.2)" }}>
          <div ref={afterDivRef} style={{ position: "absolute", inset: 0, background: "#02101e" }} />
          <div style={{
            position: "absolute", top: 10, left: 10, zIndex: 500,
            background: mode === "sar" ? "rgba(26,140,255,.25)" : "rgba(34,227,154,.2)",
            border: `1px solid ${mode === "sar" ? "#36d6ff55" : "#22e39a55"}`,
            padding: "4px 10px", borderRadius: 6, fontSize: 11,
            color: mode === "sar" ? "#36d6ff" : "#22e39a", fontWeight: 700,
          }}>
            {mode === "sar" ? "SAR" : "OPTICAL"} · POST-FLOOD · {timeline}
          </div>

          {/* Diff legend (show when diff layer is on) */}
          {showDiff && (
            <div style={{
              position: "absolute", bottom: 10, left: 10, zIndex: 500,
              background: "rgba(6,26,46,.9)", border: "1px solid rgba(80,170,255,.2)",
              padding: "8px 12px", borderRadius: 8, fontSize: 10.5,
            }}>
              <b style={{ color: "#36d6ff" }}>DETECTION</b>
              <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 24, height: 3, background: mode === "sar" ? "#00f0ff" : "#00c8ff", display: "inline-block", borderRadius: 2 }}></span>
                  {mode === "sar" ? "SAR-detected water" : "Optical water pixels"}
                </div>
                {mode === "sar" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 24, height: 3, display: "inline-block", borderRadius: 2, borderTop: "2px dashed #ff00ff", background: "transparent" }}></span>
                    SAR-only (cloud-hidden)
                  </div>
                )}
                {mode === "optical" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 24, height: 3, background: "#ffb020", display: "inline-block", borderRadius: 2 }}></span>
                      Optical-only zone
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 24, height: 3, background: "rgba(255,255,255,.5)", display: "inline-block", borderRadius: 2 }}></span>
                      Cloud cover mask
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right analytics panel */}
        <div style={{
          width: 290, flexShrink: 0,
          background: "rgba(6,26,46,.92)", borderLeft: "1px solid rgba(80,170,255,.2)",
          display: "flex", flexDirection: "column", overflowY: "auto", padding: 16,
        }} className="scrollbar-thin">

          {/* Mode info banner */}
          <div style={{
            padding: "10px 12px", borderRadius: 10, marginBottom: 14,
            background: isOptical ? "rgba(34,227,154,.08)" : "rgba(0,240,255,.08)",
            border: `1px solid ${isOptical ? "rgba(34,227,154,.3)" : "rgba(0,240,255,.25)"}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isOptical ? "#22e39a" : "#00f0ff", marginBottom: 4 }}>
              {isOptical ? "🛰 Sentinel-2 Optical Mode" : "⚡ Sentinel-1 SAR Mode"}
            </div>
            <div style={{ fontSize: 11, color: "#7da3c9", lineHeight: 1.5 }}>
              {isOptical
                ? "True-color RGB composite with NDWI water index. Cloud mask applied. Partial coverage due to overcast conditions."
                : "C-band microwave backscatter analysis. All-weather, day-night. Water appears dark due to specular reflection."}
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {metrics.map(k => (
              <div key={k.label} className="kpi" style={{ minWidth: 0 }}>
                <div className="label" style={{ fontSize: 9.5 }}>{k.label}</div>
                <div className="val" style={{ color: k.color, fontSize: 15 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Comparison chart */}
          <div style={{ fontSize: 11, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            Area Comparison (km²)
          </div>
          <div style={{ height: 160, marginBottom: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sarData} barSize={10}>
                <XAxis dataKey="area" tick={{ fill: "#7da3c9", fontSize: 8 }} />
                <YAxis tick={{ fill: "#7da3c9", fontSize: 8 }} />
                <Tooltip {...CHART_STYLE} />
                <Legend wrapperStyle={{ fontSize: 10, color: "#7da3c9" }} />
                <Bar dataKey="sar"     name="SAR"     fill="#00f0ff" radius={[3,3,0,0]} />
                <Bar dataKey="optical" name="Optical" fill="#22e39a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy gauge */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
              Detection Accuracy
            </div>
            {[
              { label: "SAR",             pct: 94, color: "#00f0ff" },
              { label: "Optical (clear)", pct: 88, color: "#22e39a" },
              { label: "Optical (cloudy)",pct: 61, color: "#ffb020" },
            ].map(({ label, pct, color }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "#dbeaff" }}>{label}</span>
                  <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`, background: color,
                    borderRadius: 3, boxShadow: `0 0 6px ${color}`,
                    transition: "width .8s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* AI analysis */}
          <div style={{ background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.18)", padding: "10px 12px", borderRadius: 10 }}>
            <span className="badge-ai">AI ANALYSIS</span>
            <p style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.6, color: "#dbeaff", margin: "8px 0 0" }}>
              {isOptical
                ? <>NDWI threshold (0.3) identifies <b style={{ color: "#22e39a" }}>156 km²</b> of surface water. Cloud cover obscures <b style={{ color: "#ffb020" }}>22 km²</b> — fusing with SAR closes the gap. CNN segmentation F1 = <b style={{ color: "#00f0ff" }}>0.87</b>.</>
                : <>Backscatter delta confirms standing water across Pallikaranai marsh. U-Net segmentation IoU = <b style={{ color: "#00f0ff" }}>0.91</b>. SAR detects <b style={{ color: "#ff00ff" }}>31 km²</b> invisible to optical due to cloud cover.</>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
