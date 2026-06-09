import { useEffect, useRef } from "react";
import L from "leaflet";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { initBaseMap, addAreaMarkers, addWaterMarkers, addFloodPolys, riverLevelData, rainfallData } from "../data/simulatedData";

const CHART_STYLE = {
  contentStyle: { backgroundColor: "#061a30", borderColor: "rgba(80,170,255,.25)", color: "#dbeaff" },
};

export default function FloodHubTab() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = initBaseMap(mapRef.current, 11);
    addAreaMarkers(map, true);
    addWaterMarkers(map);
    addFloodPolys(map, 1.1);
    return () => { map.remove(); };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* MAP */}
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
        <div ref={mapRef} style={{ position: "absolute", inset: 0, background: "#02101e" }} />
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 500,
          background: "rgba(6,26,46,.85)", border: "1px solid rgba(54,214,255,.4)",
          padding: "5px 12px", borderRadius: 8,
          fontSize: 11, color: "#36d6ff", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
        }}>
          LIVE — Chennai Flood Intelligence
        </div>
      </div>

      {/* RIGHT ANALYTICS PANEL */}
      <div style={{
        width: 360, flexShrink: 0,
        background: "rgba(6,26,46,0.92)", borderLeft: "1px solid rgba(80,170,255,.2)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }} className="scrollbar-thin">
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(80,170,255,.15)" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#36d6ff", textTransform: "uppercase", marginBottom: 4 }}>
            Google Flood Hub
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#dbeaff", margin: 0 }}>Flood Hub Analysis</h2>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Flood Depth",       val: "2.4 m",    color: "#ff3b5c" },
              { label: "Risk Score",        val: "87/100",   color: "#ffb020" },
              { label: "Pop. Exposed",      val: "142,000",  color: "#36d6ff" },
              { label: "Villages Affected", val: "34",       color: "#36d6ff" },
            ].map(k => (
              <div key={k.label} className="kpi" style={{ minWidth: 0 }}>
                <div className="label">{k.label}</div>
                <div className="val" style={{ color: k.color, fontSize: 18 }}>{k.val}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>River Level (24h)</div>
            <div style={{ height: 130 }}>
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

          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>Rainfall Forecast (5-Day)</div>
            <div style={{ height: 130 }}>
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

          <div style={{ background: "rgba(0,240,255,.06)", border: "1px solid rgba(0,240,255,.18)", padding: 12, borderRadius: 10 }}>
            <span className="badge-ai">AI SUMMARY</span>
            <p style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "#dbeaff", margin: "8px 0 0" }}>
              Critical levels breached at Velachery &amp; Pallikaranai. Chembarambakkam inflow
              at 4,200 cusecs. AI Model Confidence: <b style={{ color: "#00f0ff" }}>92%</b>.
              Suggest immediate evacuation of low-lying Wards 170–182.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
