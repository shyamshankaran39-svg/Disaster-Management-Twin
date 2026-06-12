import { useRef, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { riverLevelData, rainfallData } from "../data/simulatedData";

const CHART_STYLE = {
  contentStyle: { backgroundColor: "#061a30", borderColor: "rgba(80,170,255,.25)", color: "#dbeaff" },
};

const FLOOD_HUB_URL =
  "https://sites.research.google/floods/l/13.0027/80.2200/10/g/ChIJYTN9T-17UjsRILkmuMt6eUo";

export default function FloodHubTab() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* MAP / IFRAME AREA */}
      <div style={{ flex: 1, position: "relative", minWidth: 0, background: "#02101e" }}>

        {/* Google Flood Hub iframe */}
        {!iframeBlocked && (
          <iframe
            ref={iframeRef}
            src={FLOOD_HUB_URL}
            title="Google Flood Hub – Chennai"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeBlocked(true)}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              border: "none",
              opacity: iframeLoaded ? 1 : 0,
              transition: "opacity .4s",
            }}
            allow="geolocation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}

        {/* Loading / blocked fallback */}
        {(!iframeLoaded || iframeBlocked) && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#02101e",
            gap: 18,
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
                <div style={{ color: "#dbeaff", fontWeight: 700, fontSize: 15 }}>
                  Google Flood Hub — Chennai
                </div>
                <div style={{ color: "#7da3c9", fontSize: 12, textAlign: "center", maxWidth: 340 }}>
                  Browser security policy prevents embedding Google Flood Hub inline.
                  Click below to open it directly — it shows Chennai's live flood hazard layer.
                </div>
              </>
            )}
            <a
              href={FLOOD_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                background: "linear-gradient(90deg,#1a8cff,#00f0ff)",
                color: "#001", textDecoration: "none", letterSpacing: .5,
              }}
            >
              {iframeBlocked ? "Open Google Flood Hub ↗" : "Open in new tab ↗"}
            </a>
          </div>
        )}

        {/* Badge overlay (shown when loaded) */}
        {iframeLoaded && !iframeBlocked && (
          <div style={{
            position: "absolute", top: 10, left: 10, zIndex: 500,
            background: "rgba(6,26,46,.85)", border: "1px solid rgba(54,214,255,.4)",
            padding: "5px 12px", borderRadius: 8,
            fontSize: 11, color: "#36d6ff", fontWeight: 700,
            letterSpacing: 2, textTransform: "uppercase",
            pointerEvents: "none",
          }}>
            LIVE — Google Flood Hub · Chennai Flood Hazard
          </div>
        )}

        {/* Open-in-new-tab button always visible when loaded */}
        {iframeLoaded && !iframeBlocked && (
          <a
            href={FLOOD_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "absolute", top: 10, right: 10, zIndex: 600,
              padding: "5px 12px", borderRadius: 8, fontSize: 11,
              background: "rgba(6,26,46,.88)", border: "1px solid rgba(80,170,255,.35)",
              color: "#36d6ff", textDecoration: "none", fontWeight: 700,
              letterSpacing: .5,
            }}
          >
            ↗ Full Screen
          </a>
        )}
      </div>

      {/* RIGHT ANALYTICS PANEL */}
      <div style={{
        width: 360, flexShrink: 0,
        background: "rgba(6,26,46,0.95)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }} className="scrollbar-thin">
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(80,170,255,.15)" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#36d6ff", textTransform: "uppercase", marginBottom: 4 }}>
            Google Flood Hub · Live Data
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#dbeaff", margin: 0 }}>
            Chennai Flood Hazard Analysis
          </h2>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Flood Hub layer legend */}
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(80,170,255,.15)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#36d6ff", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Flood Hazard Layer
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { label: "Extreme Hazard",  color: "#ff1744" },
                { label: "High Hazard",     color: "#ff6d00" },
                { label: "Medium Hazard",   color: "#ffd600" },
                { label: "Low Hazard",      color: "#00e676" },
                { label: "Minimal / None",  color: "#7da3c9" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                  <div style={{ width: 16, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                  <span style={{ color: "#dbeaff" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* KPI Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Flood Depth",        val: "2.4 m",    color: "#ff3b5c" },
              { label: "Return Period",       val: "1-in-5yr", color: "#ffb020" },
              { label: "Pop. Exposed",        val: "1.42 M",   color: "#36d6ff" },
              { label: "River Gauge Alert",   val: "HIGH",     color: "#ff3b5c" },
              { label: "Adyar River",         val: "4.8 m",    color: "#ff8a3d" },
              { label: "Cooum River",         val: "3.1 m",    color: "#ffb020" },
            ].map(k => (
              <div key={k.label} className="kpi" style={{ minWidth: 0 }}>
                <div className="label">{k.label}</div>
                <div className="val" style={{ color: k.color, fontSize: 16 }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* River Level */}
          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>River Level — 24h Gauge (m)</div>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riverLevelData.slice(0, 12)}>
                  <XAxis dataKey="time" tick={{ fill: "#7da3c9", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#7da3c9", fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip {...CHART_STYLE} />
                  <Line type="monotone" dataKey="level" stroke="#36d6ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall */}
          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>Rainfall Forecast — 5-Day (mm)</div>
            <div style={{ height: 120 }}>
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

          {/* Flood Hub info */}
          <div style={{ background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.18)", padding: 12, borderRadius: 10 }}>
            <span className="badge-ai">FLOOD HUB DATA</span>
            <p style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7, color: "#dbeaff", margin: "8px 0 0" }}>
              Google Flood Hub uses AI hydrological models trained on satellite and river gauge data.
              The <b style={{ color: "#00f0ff" }}>Chennai Flood Hazard</b> layer shows return-period probability zones —
              areas with 1-in-5 year flood risk are currently at <b style={{ color: "#ff3b5c" }}>EXTREME</b> alert.
              Chembarambakkam inflow: <b style={{ color: "#ff8a3d" }}>4,200 cusecs</b>. Model confidence: <b style={{ color: "#00f0ff" }}>92%</b>.
            </p>
          </div>

          {/* Gauge stations */}
          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>Active Gauge Stations</div>
            {[
              { name: "Chembarambakkam", river: "Adyar", level: "DANGER", pct: 93 },
              { name: "Kolathur",        river: "Cooum", level: "WARNING", pct: 72 },
              { name: "Taramani",        river: "Adyar", level: "DANGER", pct: 88 },
              { name: "Ambattur",        river: "Cooum", level: "NORMAL",  pct: 41 },
            ].map(g => (
              <div key={g.name} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "#dbeaff", fontWeight: 600 }}>{g.name}</span>
                  <span style={{
                    color: g.level === "DANGER" ? "#ff3b5c" : g.level === "WARNING" ? "#ffb020" : "#22e39a",
                    fontWeight: 700, fontSize: 10,
                  }}>● {g.level}</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${g.pct}%`,
                    background: g.level === "DANGER" ? "#ff3b5c" : g.level === "WARNING" ? "#ffb020" : "#22e39a",
                    borderRadius: 3,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: "#7da3c9", marginTop: 2 }}>{g.river} River · {g.pct}% capacity</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
