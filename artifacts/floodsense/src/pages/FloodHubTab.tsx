import { useRef, useState, useEffect } from "react";
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

/* ── Open-Meteo Flood API gauges ────────────────────────────────────────────
   GloFAS (Global Flood Awareness System) river discharge forecasts.
   Free, no API key required.                                               */
const GAUGES = [
  { id: "chembarambakkam", name: "Chembarambakkam", river: "Adyar (headwaters)", lat: 13.0167, lng: 80.0500, dangerQ: 280 },
  { id: "taramani",        name: "Taramani",        river: "Adyar (lower)",      lat: 12.9870, lng: 80.2420, dangerQ: 220 },
  { id: "kolathur",        name: "Kolathur",        river: "Cooum (upper)",      lat: 13.1280, lng: 80.2100, dangerQ: 130 },
  { id: "ambattur",        name: "Ambattur",        river: "Cooum (basin)",      lat: 13.0982, lng: 80.1610, dangerQ: 110 },
];

interface GaugeData {
  id: string;
  today: number;
  forecast: { date: string; q: number }[];
  status: "DANGER" | "WARNING" | "NORMAL";
  pct: number;
}

async function fetchGaugeDischarge(gauge: typeof GAUGES[0]): Promise<GaugeData> {
  const url =
    `https://flood-api.open-meteo.com/v1/flood` +
    `?latitude=${gauge.lat}&longitude=${gauge.lng}` +
    `&daily=river_discharge&forecast_days=7&ensemble=false`;
  const res  = await fetch(url);
  const json = await res.json();
  const times: string[]  = json.daily?.time           ?? [];
  const qs:    number[]  = json.daily?.river_discharge ?? [];
  const today = qs[0] ?? 0;
  const pct   = Math.min(100, Math.round((today / gauge.dangerQ) * 100));
  const status: GaugeData["status"] =
    today >= gauge.dangerQ * 0.9 ? "DANGER" :
    today >= gauge.dangerQ * 0.6 ? "WARNING" : "NORMAL";
  const forecast = times.map((t, i) => ({
    date: t.slice(5),
    q:    Math.round((qs[i] ?? 0) * 10) / 10,
  }));
  return { id: gauge.id, today: Math.round(today * 10) / 10, forecast, status, pct };
}

/* ── component ────────────────────────────────────────────────────────────── */
export default function FloodHubTab() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeLoaded, setIframeLoaded]   = useState(false);

  const [gaugeData, setGaugeData]   = useState<GaugeData[]>([]);
  const [gaugeLoading, setGaugeLoading] = useState(true);
  const [gaugeError,   setGaugeError]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<string>("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const results = await Promise.all(GAUGES.map(fetchGaugeDischarge));
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

      {/* ── IFRAME AREA ─────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", minWidth: 0, background: "#02101e" }}>
        {!iframeBlocked && (
          <iframe
            ref={iframeRef}
            src={FLOOD_HUB_URL}
            title="Google Flood Hub – Chennai"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeBlocked(true)}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              border: "none", opacity: iframeLoaded ? 1 : 0, transition: "opacity .4s",
            }}
            allow="geolocation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}

        {(!iframeLoaded || iframeBlocked) && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: "#02101e", gap: 18,
          }}>
            {!iframeBlocked ? (
              <>
                <div style={{
                  width: 44, height: 44, border: "3px solid rgba(80,170,255,.2)",
                  borderTop: "3px solid #36d6ff", borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                <div style={{ color: "#7da3c9", fontSize: 13 }}>Loading Google Flood Hub…</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36 }}>🌊</div>
                <div style={{ color: "#dbeaff", fontWeight: 700, fontSize: 15 }}>Google Flood Hub — Chennai</div>
                <div style={{ color: "#7da3c9", fontSize: 12, textAlign: "center", maxWidth: 340 }}>
                  Browser security policy prevents embedding Google Flood Hub inline.
                  Click below to open it with the Chennai flood hazard layer active.
                </div>
              </>
            )}
            <a href={FLOOD_HUB_URL} target="_blank" rel="noopener noreferrer" style={{
              padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13,
              background: "linear-gradient(90deg,#1a8cff,#00f0ff)",
              color: "#001", textDecoration: "none", letterSpacing: .5,
            }}>
              {iframeBlocked ? "Open Google Flood Hub ↗" : "Open in new tab ↗"}
            </a>
          </div>
        )}

        {iframeLoaded && !iframeBlocked && (
          <>
            <div style={{
              position: "absolute", top: 10, left: 10, zIndex: 500,
              background: "rgba(6,26,46,.85)", border: "1px solid rgba(54,214,255,.4)",
              padding: "5px 12px", borderRadius: 8,
              fontSize: 11, color: "#36d6ff", fontWeight: 700, letterSpacing: 2,
              textTransform: "uppercase", pointerEvents: "none",
            }}>
              LIVE — Google Flood Hub · Chennai Flood Hazard
            </div>
            <a href={FLOOD_HUB_URL} target="_blank" rel="noopener noreferrer" style={{
              position: "absolute", top: 10, right: 10, zIndex: 600,
              padding: "5px 12px", borderRadius: 8, fontSize: 11,
              background: "rgba(6,26,46,.88)", border: "1px solid rgba(80,170,255,.35)",
              color: "#36d6ff", textDecoration: "none", fontWeight: 700, letterSpacing: .5,
            }}>↗ Full Screen</a>
          </>
        )}
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────── */}
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

          {/* Flood hazard legend */}
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(80,170,255,.15)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#36d6ff", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>
              Flood Hazard Layer Legend
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "Extreme Hazard — 1-in-2yr", color: "#ff1744" },
                { label: "High Hazard — 1-in-5yr",    color: "#ff6d00" },
                { label: "Medium Hazard — 1-in-20yr", color: "#ffd600" },
                { label: "Low Hazard — 1-in-100yr",   color: "#00e676" },
                { label: "Minimal / No Hazard",        color: "#7da3c9" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10.5 }}>
                  <div style={{ width: 14, height: 9, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                  <span style={{ color: "#dbeaff" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── GAUGE STATIONS — real Open-Meteo data ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="section-title" style={{ margin: 0 }}>Live River Gauge Discharge</div>
              <div style={{ fontSize: 9.5, color: "#7da3c9" }}>m³/s · GloFAS model</div>
            </div>

            {gaugeLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "#7da3c9", fontSize: 12 }}>
                <div style={{
                  width: 18, height: 18, border: "2px solid rgba(80,170,255,.2)",
                  borderTop: "2px solid #36d6ff", borderRadius: "50%",
                  animation: "spin 1s linear infinite", flexShrink: 0,
                }} />
                Fetching real-time discharge from Open-Meteo…
              </div>
            )}

            {gaugeError && (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,59,92,.1)", border: "1px solid rgba(255,59,92,.25)", fontSize: 11, color: "#ff8a3d" }}>
                ⚠ Could not reach Open-Meteo API. Check connection. Showing static reference values below.
              </div>
            )}

            {!gaugeLoading && gaugeData.map(g => {
              const gauge = GAUGES.find(x => x.id === g.id)!;
              const col   = statusColor(g.status);
              return (
                <div key={g.id} style={{ marginBottom: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, marginBottom: 4 }}>
                    <div>
                      <span style={{ color: "#dbeaff", fontWeight: 600 }}>{g.id === "chembarambakkam" ? "Chembarambakkam" : gauge.name}</span>
                      <span style={{ color: "#7da3c9", fontSize: 10, marginLeft: 6 }}>{gauge.river}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: col, fontWeight: 800, fontSize: 13 }}>{g.today}</span>
                      <span style={{ color: col, fontWeight: 700, fontSize: 9, letterSpacing: 1, border: `1px solid ${col}55`, padding: "1px 5px", borderRadius: 4 }}>
                        ● {g.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,.07)", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
                    <div style={{
                      height: "100%", width: `${g.pct}%`,
                      background: `linear-gradient(90deg, ${col}99, ${col})`,
                      borderRadius: 3, transition: "width 1s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: "#7da3c9", display: "flex", justifyContent: "space-between" }}>
                    <span>{g.pct}% of danger threshold ({gauge.dangerQ} m³/s)</span>
                    <span>7-day peak: {Math.round(Math.max(...g.forecast.map(f => f.q)) * 10) / 10} m³/s</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7-day discharge forecast chart */}
          {!gaugeLoading && gaugeData.length > 0 && (
            <div>
              <div className="section-title" style={{ marginBottom: 8 }}>7-Day River Discharge Forecast (m³/s)</div>
              <div style={{ height: 140 }}>
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

          {/* KPI grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Flood Depth",      val: "2.4 m",    color: "#ff3b5c" },
              { label: "Return Period",    val: "1-in-5yr", color: "#ffb020" },
              { label: "Pop. Exposed",     val: "1.42 M",   color: "#36d6ff" },
              { label: "Gauge Alert",      val: gaugeData.some(g => g.status === "DANGER") ? "HIGH" : "MODERATE", color: gaugeData.some(g => g.status === "DANGER") ? "#ff3b5c" : "#ffb020" },
            ].map(k => (
              <div key={k.label} className="kpi" style={{ minWidth: 0 }}>
                <div className="label">{k.label}</div>
                <div className="val" style={{ color: k.color, fontSize: 16 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Rainfall */}
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

          {/* Flood Hub data note */}
          <div style={{ background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.18)", padding: 12, borderRadius: 10 }}>
            <span className="badge-ai">FLOOD HUB + GloFAS</span>
            <p style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.7, color: "#dbeaff", margin: "8px 0 0" }}>
              River discharge data is fetched live from <b style={{ color: "#00f0ff" }}>Open-Meteo Flood API</b> (GloFAS model).
              Google Flood Hub combines this with AI hazard probability maps.
              Areas with discharge &gt;90% of danger threshold are at{" "}
              <b style={{ color: "#ff3b5c" }}>IMMEDIATE EVACUATION</b> risk.
            </p>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
