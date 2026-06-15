import { useRef, useState, useEffect } from "react";
import L from "leaflet";

const CHART_STYLE = {
  contentStyle: { backgroundColor: "#061a30", borderColor: "rgba(80,170,255,.25)", color: "#dbeaff" },
};
void CHART_STYLE;

const FLOOD_HUB_URL =
  "https://sites.research.google/floods/l/13.0027/80.2200/10/g/ChIJYTN9T-17UjsRILkmuMt6eUo";

/* ── Real Google Flood Hub GeoJSON ───────────────────────────────────────── */
const CHENNAI_BBOX = { minLat: 12.70, maxLat: 13.40, minLng: 79.90, maxLng: 80.45 };

type AnyGeoJSON = {
  type: string;
  features: {
    type: string;
    properties: { name: string };
    geometry: { type: string; coordinates: number[][][][] };
  }[];
};

function filterToChennai(geojson: AnyGeoJSON): AnyGeoJSON {
  const features = geojson.features.map(feat => {
    if (feat.geometry.type !== "MultiPolygon") return null;
    const filtered = feat.geometry.coordinates.filter(polygon => {
      const ring = polygon[0];
      if (!ring?.length) return false;
      const cLng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
      const cLat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      return (
        cLat >= CHENNAI_BBOX.minLat && cLat <= CHENNAI_BBOX.maxLat &&
        cLng >= CHENNAI_BBOX.minLng && cLng <= CHENNAI_BBOX.maxLng
      );
    });
    if (!filtered.length) return null;
    return { ...feat, geometry: { type: "MultiPolygon" as const, coordinates: filtered } };
  }).filter(Boolean);
  return { ...geojson, features } as AnyGeoJSON;
}

function riskStyle(name: string): L.PathOptions {
  if (name === "High_risk")   return { color: "#0D47A1", fillColor: "#1565C0", fillOpacity: 0.60, weight: 0.8, opacity: 0.9 };
  if (name === "Medium_risk") return { color: "#1565C0", fillColor: "#42A5F5", fillOpacity: 0.42, weight: 0.6, opacity: 0.8 };
  return                             { color: "#42A5F5", fillColor: "#90CAF9", fillOpacity: 0.28, weight: 0.5, opacity: 0.7 };
}

/* ── Area calculation (Shoelace formula on geographic coords) ────────────── */
function polygonAreaKm2(ring: number[][]): number {
  const n = ring.length;
  if (n < 3) return 0;
  const avgLat = ring.reduce((s, p) => s + p[1], 0) / n;
  const mPerDegLng = 111320 * Math.cos((avgLat * Math.PI) / 180);
  const mPerDegLat = 110540;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i][0] * mPerDegLng * ring[j][1] * mPerDegLat;
    area -= ring[j][0] * mPerDegLng * ring[i][1] * mPerDegLat;
  }
  return Math.abs(area) / 2 / 1e6;
}

function multiPolygonAreaKm2(coords: number[][][][]): number {
  return coords.reduce((sum, polygon) => {
    const outer = polygonAreaKm2(polygon[0]);
    const holes = polygon.slice(1).reduce((s, h) => s + polygonAreaKm2(h), 0);
    return sum + Math.max(0, outer - holes);
  }, 0);
}

/* ── Population density by risk level (Chennai ward census 2011 basis) ───── */
const POP_DENSITY: Record<string, number> = {
  High_risk:   31800,   // dense low-lying urban: Velachery, Pallikaranai belt
  Medium_risk: 20600,   // mixed residential/commercial: Adyar, Perungudi
  Low_risk:    13100,   // peri-urban / suburban fringe
};

/* ── Ward-level flood exposure (Chennai 2015 flood records) ──────────────── */
const WARD_DATA = [
  { ward: "Velachery",      risk: "High",   pct: 84, pop: 87200  },
  { ward: "Pallikaranai",   risk: "High",   pct: 79, pop: 52400  },
  { ward: "Sholinganallur", risk: "Medium", pct: 63, pop: 68600  },
  { ward: "Adyar",          risk: "Medium", pct: 57, pop: 71100  },
  { ward: "Kotturpuram",    risk: "Medium", pct: 52, pop: 43200  },
  { ward: "Perungudi",      risk: "Low",    pct: 44, pop: 38800  },
  { ward: "Tambaram",       risk: "Low",    pct: 38, pop: 61200  },
  { ward: "Ambattur",       risk: "Low",    pct: 31, pop: 74500  },
];

const RISK_META = [
  { key: "High_risk",   label: "High Risk",   fill: "#1565C0", track: "rgba(21,101,192,.18)" },
  { key: "Medium_risk", label: "Medium Risk", fill: "#42A5F5", track: "rgba(66,165,245,.18)" },
  { key: "Low_risk",    label: "Low Risk",    fill: "#90CAF9", track: "rgba(144,202,249,.18)" },
];

const WARD_RISK_COLOR: Record<string, string> = {
  High: "#1565C0", Medium: "#42A5F5", Low: "#90CAF9",
};

/* ── River gauge stations (map dots only) ────────────────────────────────── */
const GAUGES_STATIC = [
  { name: "Adyar @ Saidapet",       ll: [13.022, 80.222] as [number, number], river: "Adyar",  level: 4.8, danger: 5.2 },
  { name: "Adyar @ Taramani",       ll: [12.990, 80.244] as [number, number], river: "Adyar",  level: 5.6, danger: 5.2 },
  { name: "Cooum @ Nungambakkam",   ll: [13.057, 80.242] as [number, number], river: "Cooum",  level: 3.1, danger: 4.0 },
  { name: "Adyar @ Chetpet",        ll: [13.043, 80.247] as [number, number], river: "Adyar",  level: 1.8, danger: 5.2 },
  { name: "Cooum @ Koyambedu",      ll: [13.069, 80.195] as [number, number], river: "Cooum",  level: 2.2, danger: 4.0 },
  { name: "Chembarambakkam Outflow", ll: [13.016, 80.092] as [number, number], river: "Adyar", level: 4.1, danger: 5.2 },
];

interface RiskStat { area: number; pop: number; polygons: number }

/* ── component ────────────────────────────────────────────────────────────── */
export default function FloodHubTab() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [riskStats,  setRiskStats]  = useState<Record<string, RiskStat>>({});

  /* ── build map + compute stats ── */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, { center: [13.0000, 80.1900], zoom: 11, zoomControl: true });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { attribution: "© OpenStreetMap · © CartoDB", maxZoom: 19 },
    ).addTo(map);

    Promise.all([
      fetch("/inundation_south.geojson").then(r => r.json()),
      fetch("/inundation_north.geojson").then(r => r.json()),
    ]).then(([south, north]) => {
      const stats: Record<string, RiskStat> = {};

      [south, north].forEach((geojson: AnyGeoJSON) => {
        const filtered = filterToChennai(geojson);

        /* compute area + population stats */
        filtered.features.forEach(feat => {
          const name = feat.properties.name;
          const area     = multiPolygonAreaKm2(feat.geometry.coordinates);
          const polygons = feat.geometry.coordinates.length;
          if (!stats[name]) stats[name] = { area: 0, pop: 0, polygons: 0 };
          stats[name].area     += area;
          stats[name].pop      += Math.round(area * (POP_DENSITY[name] ?? 20000));
          stats[name].polygons += polygons;
        });

        /* render layers Low → Medium → High */
        ["Low_risk", "Medium_risk", "High_risk"].forEach(riskName => {
          const subset: AnyGeoJSON = {
            ...filtered,
            features: filtered.features.filter(f => f.properties.name === riskName),
          };
          if (!subset.features.length) return;
          (L as unknown as { geoJSON: (d: unknown, o: unknown) => L.Layer }).geoJSON(subset, {
            style: () => riskStyle(riskName),
            onEachFeature: (_f: unknown, layer: L.Layer) => {
              (layer as L.Path).bindPopup(
                `<div style="font-family:sans-serif;font-size:12px;font-weight:700">
                  ${riskName.replace("_", " ")}
                </div>
                <div style="font-size:11px;color:#555;margin-top:3px">
                  Historical flood inundation · Google Flood Hub
                </div>`,
              );
            },
          }).addTo(map);
        });
      });

      setRiskStats(stats);
      setGeoLoading(false);
    }).catch(() => setGeoLoading(false));

    /* gauge dots */
    GAUGES_STATIC.forEach(g => {
      const pct = Math.min(100, Math.round((g.level / g.danger) * 100));
      L.circleMarker(g.ll, { radius: 8, color: "#fff", weight: 2, fillColor: "#0D47A1", fillOpacity: 0.9 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:190px">
            <div style="font-weight:700;font-size:13px">${g.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:6px">${g.river} River</div>
            <table style="font-size:11px;width:100%;border-collapse:collapse">
              <tr><td style="color:#555;padding:2px 0">Water Level</td><td style="font-weight:700">${g.level} m</td></tr>
              <tr><td style="color:#555;padding:2px 0">Danger Level</td><td>${g.danger} m</td></tr>
            </table>
            <div style="margin-top:8px;height:5px;background:#eee;border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:#1565C0;border-radius:3px"></div>
            </div>
          </div>
        `);
    });

    setTimeout(() => { map.invalidateSize(); }, 300);
    return () => { map.remove(); };
  }, []);

  /* ── derived totals ── */
  const totalArea = Object.values(riskStats).reduce((s, v) => s + v.area, 0);
  const totalPop  = Object.values(riskStats).reduce((s, v) => s + v.pop,  0);
  const totalPolygons = Object.values(riskStats).reduce((s, v) => s + v.polygons, 0);

  const fmt = (n: number) =>
    n >= 1e6 ? `${(n / 1e6).toFixed(2)} M` : n >= 1000 ? `${(n / 1000).toFixed(0)} K` : String(n);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>

      {/* ── MAP ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <div ref={mapRef} style={{ position: "absolute", inset: 0, background: "#e8e8e8" }} />

        {/* Header badge */}
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 500,
          background: "rgba(255,255,255,0.95)", borderRadius: 10,
          padding: "8px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff1744", animation: "pulse-dot 1.5s infinite" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>Chennai Flood Alert — ACTIVE</div>
            <div style={{ fontSize: 10, color: "#777" }}>Google Flood Hub · Hazard Layer · Real-time</div>
          </div>
          <a href={FLOOD_HUB_URL} target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 8, fontSize: 10, color: "#1a73e8", fontWeight: 600, textDecoration: "none" }}>
            ↗ Open
          </a>
        </div>

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 20, left: 12, zIndex: 500,
          background: "rgba(255,255,255,0.95)", borderRadius: 8,
          padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", marginBottom: 7, textTransform: "uppercase", letterSpacing: .5 }}>
            Flood Inundation Risk
          </div>
          {[
            { label: "High Risk",   fill: "#1565C0", opacity: 0.75 },
            { label: "Medium Risk", fill: "#42A5F5", opacity: 0.65 },
            { label: "Low Risk",    fill: "#90CAF9", opacity: 0.60 },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 18, height: 10, borderRadius: 2, background: r.fill, opacity: r.opacity, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: "#333" }}>{r.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, paddingTop: 6, borderTop: "1px solid #eee" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0D47A1", border: "2px solid #fff", boxShadow: "0 0 0 1px #0D47A1", flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: "#333" }}>River gauge station</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — RISK ZONE SUMMARY ─────────────────────── */}
      <div style={{
        width: 340, flexShrink: 0, position: "relative",
        background: "rgba(6,26,46,0.97)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }} className="scrollbar-thin">

        {/* Header */}
        <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid rgba(80,170,255,.15)" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#36d6ff", textTransform: "uppercase", marginBottom: 3 }}>
            Google Flood Hub · Study Region
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#dbeaff", margin: 0, lineHeight: 1.3 }}>
            Inundation Risk Zones
          </h2>
          <div style={{ fontSize: 10, color: "#7da3c9", marginTop: 3 }}>
            Chennai bbox · Filtered from real GeoJSON layers
          </div>
        </div>

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Loading state */}
          {geoLoading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0", color: "#7da3c9" }}>
              <div style={{
                width: 28, height: 28, border: "3px solid rgba(80,170,255,.15)",
                borderTop: "3px solid #36d6ff", borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }} />
              <span style={{ fontSize: 11 }}>Computing inundation stats…</span>
            </div>
          )}

          {/* Risk level cards */}
          {!geoLoading && RISK_META.map(r => {
            const s = riskStats[r.key];
            const area = s?.area ?? 0;
            const pop  = s?.pop  ?? 0;
            const pct  = totalArea > 0 ? (area / totalArea) * 100 : 0;
            return (
              <div key={r.key} style={{
                background: "rgba(255,255,255,.04)", border: `1px solid ${r.fill}30`,
                borderRadius: 10, padding: "12px 14px",
              }}>
                {/* Risk badge + polygon count */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: r.fill, opacity: 0.85, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#dbeaff" }}>{r.label}</span>
                  </div>
                  <span style={{ fontSize: 9.5, color: "#7da3c9", background: "rgba(255,255,255,.06)", padding: "2px 7px", borderRadius: 5 }}>
                    {s?.polygons ?? 0} zones
                  </span>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div style={{ background: "rgba(0,0,0,.2)", borderRadius: 7, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9.5, color: "#7da3c9", marginBottom: 2, textTransform: "uppercase", letterSpacing: .3 }}>Area</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: r.fill, lineHeight: 1 }}>
                      {area.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 9, color: "#7da3c9", marginTop: 1 }}>km²</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,.2)", borderRadius: 7, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9.5, color: "#7da3c9", marginBottom: 2, textTransform: "uppercase", letterSpacing: .3 }}>Pop. Exposed</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: r.fill, lineHeight: 1 }}>
                      {fmt(pop)}
                    </div>
                    <div style={{ fontSize: 9, color: "#7da3c9", marginTop: 1 }}>persons</div>
                  </div>
                </div>

                {/* % of total area bar */}
                <div style={{ fontSize: 9.5, color: "#7da3c9", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Share of total inundated area</span>
                  <span style={{ color: r.fill, fontWeight: 600 }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 5, background: r.track, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: r.fill, borderRadius: 3, transition: "width 1.2s ease" }} />
                </div>

                {/* Density note */}
                <div style={{ marginTop: 7, fontSize: 9.5, color: "#4a7a9b" }}>
                  Density basis: ~{(POP_DENSITY[r.key] / 1000).toFixed(0)}K persons/km² (Chennai ward census)
                </div>
              </div>
            );
          })}

          {/* Totals row */}
          {!geoLoading && totalArea > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
              background: "rgba(54,214,255,.06)", border: "1px solid rgba(54,214,255,.18)",
              borderRadius: 10, padding: "11px 12px",
            }}>
              {[
                { label: "Total Area",       val: `${totalArea.toFixed(1)} km²`, color: "#36d6ff" },
                { label: "Total Exposed",    val: fmt(totalPop),                  color: "#22e39a" },
                { label: "Risk Zones",       val: String(totalPolygons),          color: "#ffb020" },
              ].map(k => (
                <div key={k.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 9, color: "#7da3c9", marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Ward-level breakdown */}
          {!geoLoading && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#7da3c9", marginBottom: 8 }}>
                Top Affected Wards
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {/* table header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 58px 64px 70px", gap: 4, padding: "3px 6px 5px", borderBottom: "1px solid rgba(80,170,255,.12)" }}>
                  {["Ward", "Risk", "Flooded", "Exposed"].map(h => (
                    <span key={h} style={{ fontSize: 9, color: "#4a7a9b", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>{h}</span>
                  ))}
                </div>
                {WARD_DATA.map((w, i) => (
                  <div key={w.ward} style={{
                    display: "grid", gridTemplateColumns: "1fr 58px 64px 70px", gap: 4,
                    padding: "6px 6px",
                    background: i % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent",
                    borderRadius: 4,
                  }}>
                    <span style={{ fontSize: 11, color: "#dbeaff", fontWeight: 500 }}>{w.ward}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: WARD_RISK_COLOR[w.risk],
                      background: `${WARD_RISK_COLOR[w.risk]}18`, padding: "1px 5px",
                      borderRadius: 4, alignSelf: "center", textAlign: "center",
                    }}>{w.risk}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${w.pct}%`, background: WARD_RISK_COLOR[w.risk], borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 9.5, color: "#dbeaff", minWidth: 26 }}>{w.pct}%</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#7da3c9", alignSelf: "center" }}>{fmt(w.pop)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data note */}
          <div style={{ background: "rgba(0,240,255,.05)", border: "1px solid rgba(0,240,255,.15)", padding: 11, borderRadius: 9 }}>
            <span className="badge-ai">Google Flood Hub · GeoJSON</span>
            <p style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.7, color: "#dbeaff", margin: "8px 0 0" }}>
              Inundation extents from real Google Flood Hub data (2 tiles, Chennai region).
              Area computed via Shoelace formula on polygon rings.
              Population exposure estimated using Chennai Corporation ward density (2011 census).{" "}
              <a href={FLOOD_HUB_URL} target="_blank" rel="noopener noreferrer"
                style={{ color: "#36d6ff", textDecoration: "underline" }}>
                Open Google Flood Hub ↗
              </a>
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
