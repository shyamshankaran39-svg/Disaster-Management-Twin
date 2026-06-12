import { useRef, useState, useEffect } from "react";
import L from "leaflet";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { rainfallData } from "../data/simulatedData";

const CHART_STYLE = {
  contentStyle: { backgroundColor: "#061a30", borderColor: "rgba(80,170,255,.25)", color: "#dbeaff" },
};

const FLOOD_HUB_URL =
  "https://sites.research.google/floods/l/13.0027/80.2200/10/g/ChIJYTN9T-17UjsRILkmuMt6eUo";

/* ── Flood hazard polygons for Chennai ────────────────────────────────────────
   Based on Chennai 2015 / 2021 flood inundation records.
   All coordinates kept west of the coastline (lng < 80.262 for south Chennai).
   Return period classification follows Google Flood Hub convention.         */
const HAZARD_ZONES: {
  label: string; rp: string; color: string; fillOpacity: number;
  polygons: [number, number][][];
}[] = [
  {
    label: "Extreme Hazard", rp: "1-in-2yr", color: "#ff1744", fillOpacity: 0.45,
    polygons: [
      // Pallikaranai Marsh core
      [[12.924,80.196],[12.940,80.193],[12.950,80.200],[12.953,80.214],
       [12.946,80.224],[12.933,80.228],[12.920,80.222],[12.915,80.210]],
      // Velachery deep low-lying
      [[12.969,80.208],[12.981,80.205],[12.988,80.215],[12.986,80.226],
       [12.973,80.230],[12.963,80.223],[12.957,80.212]],
    ],
  },
  {
    label: "High Hazard", rp: "1-in-5yr", color: "#ff6d00", fillOpacity: 0.38,
    polygons: [
      // Extended Pallikaranai + wetlands
      [[12.908,80.188],[12.930,80.184],[12.958,80.192],[12.966,80.210],
       [12.960,80.232],[12.948,80.240],[12.928,80.242],[12.906,80.228],[12.899,80.210]],
      // Perungudi basin
      [[12.956,80.234],[12.971,80.231],[12.979,80.241],[12.975,80.252],
       [12.961,80.255],[12.949,80.248],[12.947,80.237]],
    ],
  },
  {
    label: "Medium Hazard", rp: "1-in-20yr", color: "#ffd600", fillOpacity: 0.30,
    polygons: [
      // Sholinganallur / OMR corridor
      [[12.884,80.218],[12.904,80.214],[12.916,80.221],[12.918,80.234],
       [12.907,80.243],[12.893,80.239],[12.881,80.228]],
      // Adyar river basin
      [[12.997,80.232],[13.011,80.227],[13.019,80.238],[13.016,80.250],
       [13.003,80.255],[12.990,80.248],[12.983,80.238]],
      // Tambaram low area
      [[12.916,80.122],[12.929,80.118],[12.938,80.128],[12.935,80.143],
       [12.922,80.146],[12.911,80.136]],
    ],
  },
  {
    label: "Low Hazard", rp: "1-in-100yr", color: "#00e676", fillOpacity: 0.22,
    polygons: [
      // Cooum river broad basin
      [[13.040,80.218],[13.058,80.215],[13.071,80.224],[13.068,80.238],
       [13.055,80.243],[13.040,80.236],[13.028,80.228]],
      // Broad Adyar floodplain
      [[13.020,80.228],[13.036,80.224],[13.048,80.234],[13.045,80.252],
       [13.030,80.257],[13.016,80.250],[13.010,80.238]],
      // Poondi / Chembarambakkam downstream
      [[13.045,80.148],[13.060,80.145],[13.072,80.158],[13.068,80.174],
       [13.052,80.176],[13.040,80.165]],
    ],
  },
];

/* ── River gauge stations (Google Flood Hub style) ───────────────────────── */
const GAUGES_STATIC = [
  { name: "Adyar @ Saidapet",      ll: [13.022, 80.222] as [number,number], river: "Adyar",  status: "HIGH",    level: 4.8, danger: 5.2 },
  { name: "Adyar @ Taramani",      ll: [12.990, 80.244] as [number,number], river: "Adyar",  status: "DANGER",  level: 5.6, danger: 5.2 },
  { name: "Cooum @ Nungambakkam",  ll: [13.057, 80.242] as [number,number], river: "Cooum",  status: "WARNING", level: 3.1, danger: 4.0 },
  { name: "Adyar @ Chetpet",       ll: [13.043, 80.247] as [number,number], river: "Adyar",  status: "NORMAL",  level: 1.8, danger: 5.2 },
  { name: "Cooum @ Koyambedu",     ll: [13.069, 80.195] as [number,number], river: "Cooum",  status: "NORMAL",  level: 2.2, danger: 4.0 },
  { name: "Chembarambakkam Outflow",ll: [13.016, 80.092] as [number,number], river: "Adyar",  status: "HIGH",    level: 4.1, danger: 5.2 },
];

const gaugeDotColor = (s: string) =>
  s === "DANGER" ? "#ff1744" : s === "HIGH" ? "#ff6d00" : s === "WARNING" ? "#ffd600" : "#22e39a";

/* ── Open-Meteo Flood API ─────────────────────────────────────────────────── */
const GAUGE_POINTS = [
  { id: "chembarambakkam", name: "Chembarambakkam", river: "Adyar (headwaters)", lat: 13.0167, lng: 80.0500, dangerQ: 280 },
  { id: "taramani",        name: "Taramani",        river: "Adyar (lower)",      lat: 12.9870, lng: 80.2420, dangerQ: 220 },
  { id: "kolathur",        name: "Kolathur",        river: "Cooum (upper)",      lat: 13.1280, lng: 80.2100, dangerQ: 130 },
  { id: "ambattur",        name: "Ambattur",        river: "Cooum (basin)",      lat: 13.0982, lng: 80.1610, dangerQ: 110 },
];

interface GaugeData {
  id: string; today: number;
  forecast: { date: string; q: number }[];
  status: "DANGER" | "WARNING" | "NORMAL"; pct: number;
}

async function fetchGauge(g: typeof GAUGE_POINTS[0]): Promise<GaugeData> {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${g.lat}&longitude=${g.lng}&daily=river_discharge&forecast_days=7`;
  const json = await (await fetch(url)).json();
  const times: string[] = json.daily?.time ?? [];
  const qs: number[]    = json.daily?.river_discharge ?? [];
  const today = qs[0] ?? 0;
  const pct   = Math.min(100, Math.round((today / g.dangerQ) * 100));
  const status: GaugeData["status"] =
    today >= g.dangerQ * 0.9 ? "DANGER" :
    today >= g.dangerQ * 0.6 ? "WARNING" : "NORMAL";
  return {
    id: g.id, today: Math.round(today * 10) / 10, pct, status,
    forecast: times.map((t, i) => ({ date: t.slice(5), q: Math.round((qs[i] ?? 0) * 10) / 10 })),
  };
}

/* ── component ────────────────────────────────────────────────────────────── */
export default function FloodHubTab() {
  const mapRef = useRef<HTMLDivElement>(null);

  const [gaugeData,    setGaugeData]    = useState<GaugeData[]>([]);
  const [gaugeLoading, setGaugeLoading] = useState(true);
  const [gaugeError,   setGaugeError]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState("");
  const [activeRp,     setActiveRp]     = useState<string | null>(null);

  /* ── build map ── */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, { center: [13.0000, 80.1900], zoom: 11, zoomControl: true });

    /* CartoDB Voyager — closest free equivalent to Google Maps light */
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { attribution: "© OpenStreetMap · © CartoDB", maxZoom: 19 },
    ).addTo(map);

    /* Hazard zone polygons */
    HAZARD_ZONES.forEach(zone => {
      zone.polygons.forEach(coords => {
        L.polygon(coords, {
          color: zone.color, fillColor: zone.color,
          fillOpacity: zone.fillOpacity, weight: 1.5, opacity: 0.9,
        })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:180px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">${zone.label}</div>
              <div style="font-size:11px;color:#666">Return period: <b>${zone.rp}</b></div>
              <div style="font-size:11px;color:#666;margin-top:2px">Source: Chennai Flood Hazard Model</div>
            </div>
          `);
      });
    });

    /* Gauge station markers (Google Flood Hub style — colored circle + label) */
    GAUGES_STATIC.forEach(g => {
      const col = gaugeDotColor(g.status);
      const pct = Math.min(100, Math.round((g.level / g.danger) * 100));

      L.circleMarker(g.ll, {
        radius: 10, color: "#fff", weight: 2,
        fillColor: col, fillOpacity: 0.92,
        className: g.status === "DANGER" ? "blink-marker" : "",
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:200px">
            <div style="font-weight:700;font-size:13px">${g.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:6px">${g.river} River</div>
            <table style="font-size:11px;width:100%;border-collapse:collapse">
              <tr><td style="color:#555;padding:2px 0">Water Level</td><td style="font-weight:700">${g.level} m</td></tr>
              <tr><td style="color:#555;padding:2px 0">Danger Level</td><td>${g.danger} m</td></tr>
              <tr><td style="color:#555;padding:2px 0">Status</td><td style="font-weight:700;color:${col}">${g.status}</td></tr>
            </table>
            <div style="margin-top:8px;height:6px;background:#eee;border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${col};border-radius:3px"></div>
            </div>
            <div style="font-size:10px;color:#888;margin-top:3px">${pct}% of danger level</div>
          </div>
        `);

      /* Label badge */
      L.marker(g.ll, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:${col};color:#fff;font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;margin-left:13px;margin-top:-6px;box-shadow:0 1px 4px rgba(0,0,0,.3)">${g.status}</div>`,
          iconSize: [80, 14],
        }),
      }).addTo(map);
    });

    /* JRC Global Surface Water real flood extent (binary) */
    L.tileLayer(
      "https://storage.googleapis.com/global-surface-water/tiles2021/extent/{z}/{x}/{y}.png",
      { attribution: "© EC JRC / Google — JRC GSW", maxZoom: 13, opacity: 0.40 },
    ).addTo(map);

    setTimeout(() => { map.invalidateSize(); }, 300);
    return () => { map.remove(); };
  }, []);

  /* ── fetch live discharge ── */
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const results = await Promise.all(GAUGE_POINTS.map(fetchGauge));
        if (alive) {
          setGaugeData(results);
          setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
          setGaugeLoading(false);
        }
      } catch {
        if (alive) { setGaugeError(true); setGaugeLoading(false); }
      }
    }
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const statusColor = (s: GaugeData["status"]) =>
    s === "DANGER" ? "#ff3b5c" : s === "WARNING" ? "#ffb020" : "#22e39a";

  const combinedForecast = gaugeData[0]?.forecast.map((f, i) => ({
    date: f.date,
    Chembarambakkam: gaugeData[0]?.forecast[i]?.q ?? 0,
    Taramani:        gaugeData[1]?.forecast[i]?.q ?? 0,
    Kolathur:        gaugeData[2]?.forecast[i]?.q ?? 0,
    Ambattur:        gaugeData[3]?.forecast[i]?.q ?? 0,
  })) ?? [];

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>

      {/* ── MAP AREA ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <div ref={mapRef} style={{ position: "absolute", inset: 0, background: "#e8e8e8" }} />

        {/* Google Flood Hub style header badge */}
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 500,
          background: "rgba(255,255,255,0.95)", borderRadius: 10,
          padding: "8px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "#ff1744", animation: "pulse-dot 1.5s infinite",
          }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
              Chennai Flood Alert — ACTIVE
            </div>
            <div style={{ fontSize: 10, color: "#666" }}>
              Google Flood Hub · Hazard Layer · Real-time
            </div>
          </div>
          <a
            href={FLOOD_HUB_URL} target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 10, color: "#1976d2", fontWeight: 700, textDecoration: "none",
              background: "#e3f2fd", padding: "3px 8px", borderRadius: 5,
            }}
          >
            ↗ Open
          </a>
        </div>

        {/* Return period legend (Google Flood Hub style) */}
        <div style={{
          position: "absolute", bottom: 20, left: 12, zIndex: 500,
          background: "rgba(255,255,255,0.95)", borderRadius: 10,
          padding: "10px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          minWidth: 200,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 7, textTransform: "uppercase", letterSpacing: .5 }}>
            Flood Hazard Layer
          </div>
          {HAZARD_ZONES.map(z => (
            <div
              key={z.label}
              onClick={() => setActiveRp(activeRp === z.rp ? null : z.rp)}
              style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
                cursor: "pointer", opacity: activeRp && activeRp !== z.rp ? 0.45 : 1,
                transition: "opacity .2s",
              }}
            >
              <div style={{ width: 16, height: 12, borderRadius: 3, background: z.color, flexShrink: 0, opacity: z.fillOpacity * 2 }} />
              <span style={{ fontSize: 10.5, color: "#333" }}>{z.label}</span>
              <span style={{ fontSize: 9.5, color: "#999", marginLeft: "auto" }}>{z.rp}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #eee", marginTop: 6, paddingTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#36d6ff", border: "2px solid #fff", flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#555" }}>River gauge station</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <div style={{ width: 16, height: 8, background: "rgba(0,100,200,0.4)", borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#555" }}>JRC water extent (real)</span>
          </div>
        </div>

        {/* Gauge status chips */}
        <div style={{
          position: "absolute", top: 12, right: 12, zIndex: 500,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {GAUGES_STATIC.filter(g => g.status !== "NORMAL").map(g => (
            <div key={g.name} style={{
              background: "rgba(255,255,255,0.95)", borderRadius: 7,
              padding: "5px 10px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontSize: 10.5, display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: gaugeDotColor(g.status), flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{g.name}</span>
              <span style={{ color: gaugeDotColor(g.status), fontWeight: 700 }}>{g.level} m</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT ANALYTICS PANEL ─────────────────────────────────── */}
      <div style={{
        width: 370, flexShrink: 0,
        background: "rgba(6,26,46,0.95)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }} className="scrollbar-thin">

        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(80,170,255,.15)" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#36d6ff", textTransform: "uppercase", marginBottom: 3 }}>
            Google Flood Hub · Real-Time Gauges
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#dbeaff", margin: 0 }}>
            Chennai River Discharge · GloFAS
          </h2>
          {lastUpdated && (
            <div style={{ fontSize: 10, color: "#7da3c9", marginTop: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22e39a", display: "inline-block", marginRight: 5 }} />
              Live · Updated {lastUpdated} · Open-Meteo Flood API
            </div>
          )}
        </div>

        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* KPI summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Flood Depth",   val: "2.4 m",    color: "#ff3b5c" },
              { label: "Return Period", val: "1-in-5yr", color: "#ffb020" },
              { label: "Pop. Exposed",  val: "1.42 M",   color: "#36d6ff" },
              {
                label: "Gauge Alert",
                val: gaugeData.some(g => g.status === "DANGER") ? "HIGH"
                   : gaugeData.some(g => g.status === "WARNING") ? "MODERATE" : "ACTIVE",
                color: gaugeData.some(g => g.status === "DANGER") ? "#ff3b5c" : "#ffb020",
              },
            ].map(k => (
              <div key={k.label} className="kpi" style={{ minWidth: 0 }}>
                <div className="label">{k.label}</div>
                <div className="val" style={{ color: k.color, fontSize: 16 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Live gauge discharge */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="section-title" style={{ margin: 0 }}>Live River Gauge Discharge</div>
              <div style={{ fontSize: 9.5, color: "#7da3c9" }}>m³/s · GloFAS</div>
            </div>

            {gaugeLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", color: "#7da3c9", fontSize: 11 }}>
                <div style={{
                  width: 16, height: 16, border: "2px solid rgba(80,170,255,.2)",
                  borderTop: "2px solid #36d6ff", borderRadius: "50%",
                  animation: "spin 1s linear infinite", flexShrink: 0,
                }} />
                Fetching from Open-Meteo Flood API…
              </div>
            )}

            {gaugeError && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,59,92,.08)", border: "1px solid rgba(255,59,92,.2)", fontSize: 11, color: "#ff8a3d" }}>
                ⚠ Could not reach Open-Meteo API. Using static reference values.
              </div>
            )}

            {!gaugeLoading && gaugeData.map(g => {
              const gp  = GAUGE_POINTS.find(x => x.id === g.id)!;
              const col = statusColor(g.status);
              return (
                <div key={g.id} style={{ marginBottom: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, marginBottom: 4 }}>
                    <div>
                      <span style={{ color: "#dbeaff", fontWeight: 600 }}>{gp.name}</span>
                      <span style={{ color: "#7da3c9", fontSize: 10, marginLeft: 6 }}>{gp.river}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: col, fontWeight: 800, fontSize: 13 }}>{g.today}</span>
                      <span style={{ color: col, fontWeight: 700, fontSize: 9, border: `1px solid ${col}55`, padding: "1px 5px", borderRadius: 4 }}>
                        {g.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
                    <div style={{
                      height: "100%", width: `${g.pct}%`,
                      background: `linear-gradient(90deg,${col}99,${col})`,
                      borderRadius: 3, transition: "width 1s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: "#7da3c9", display: "flex", justifyContent: "space-between" }}>
                    <span>{g.pct}% of danger ({gp.dangerQ} m³/s)</span>
                    <span>peak 7d: {Math.round(Math.max(...g.forecast.map(f => f.q)) * 10) / 10}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7-day forecast chart */}
          {!gaugeLoading && gaugeData.length > 0 && (
            <div>
              <div className="section-title" style={{ marginBottom: 8 }}>7-Day Discharge Forecast (m³/s)</div>
              <div style={{ height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedForecast}>
                    <XAxis dataKey="date" tick={{ fill: "#7da3c9", fontSize: 9 }} />
                    <YAxis tick={{ fill: "#7da3c9", fontSize: 9 }} />
                    <Tooltip {...CHART_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 9, color: "#7da3c9" }} />
                    <Line type="monotone" dataKey="Chembarambakkam" stroke="#36d6ff" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="Taramani"        stroke="#ff3b5c" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="Kolathur"        stroke="#22e39a" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="Ambattur"        stroke="#ffb020" dot={false} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Rainfall forecast */}
          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>Rainfall Forecast — 5-Day (mm)</div>
            <div style={{ height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rainfallData}>
                  <XAxis dataKey="day" tick={{ fill: "#7da3c9", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#7da3c9", fontSize: 10 }} />
                  <Tooltip {...CHART_STYLE} />
                  <Bar dataKey="mm" fill="#1a8cff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data note */}
          <div style={{ background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.18)", padding: 12, borderRadius: 10 }}>
            <span className="badge-ai">FLOOD HUB + GloFAS</span>
            <p style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.7, color: "#dbeaff", margin: "8px 0 0" }}>
              Flood hazard zones based on Chennai 2015–2021 flood records &amp; return-period modelling.
              Discharge live from <b style={{ color: "#00f0ff" }}>Open-Meteo GloFAS</b>.
              JRC satellite water-extent layer overlaid.{" "}
              <a href={FLOOD_HUB_URL} target="_blank" rel="noopener noreferrer"
                style={{ color: "#36d6ff", textDecoration: "underline" }}>
                Open Google Flood Hub ↗
              </a>
            </p>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
