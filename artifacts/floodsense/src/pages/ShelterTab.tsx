import { useEffect, useRef } from "react";
import L from "leaflet";
import { initBaseMap } from "../data/simulatedData";

const SHELTERS = [
  { name: "Anna University Main Hall",      ll: [13.0116, 80.2347] as [number,number], type: "Institution",    cap: 1500, occ: 45,  score: 98 },
  { name: "Velachery Corp School",          ll: [12.9780, 80.2180] as [number,number], type: "School",         cap: 800,  occ: 92,  score: 85 },
  { name: "Guindy Community Centre",        ll: [13.0090, 80.2050] as [number,number], type: "Community Hall", cap: 500,  occ: 12,  score: 91 },
  { name: "Saidapet Temple Trust",          ll: [13.0220, 80.2280] as [number,number], type: "Temple",         cap: 1200, occ: 88,  score: 76 },
  { name: "Taramani Mahal",                 ll: [12.9870, 80.2420] as [number,number], type: "Marriage Hall",  cap: 2000, occ: 5,   score: 95 },
  { name: "T Nagar Govt School",            ll: [13.0418, 80.2341] as [number,number], type: "School",         cap: 600,  occ: 70,  score: 79 },
  { name: "Ambattur Kalyana Mahal",         ll: [13.0982, 80.1610] as [number,number], type: "Marriage Hall",  cap: 1800, occ: 20,  score: 88 },
  { name: "Pallikaranai Welfare Centre",    ll: [12.9390, 80.2070] as [number,number], type: "Community Hall", cap: 700,  occ: 55,  score: 82 },
  { name: "Sholinganallur Community Hall",  ll: [12.9010, 80.2279] as [number,number], type: "Community Hall", cap: 900,  occ: 38,  score: 86 },
  { name: "Perungudi Corp Hall",            ll: [12.9617, 80.2467] as [number,number], type: "Community Hall", cap: 600,  occ: 62,  score: 78 },
  { name: "Tambaram Municipality Hall",     ll: [12.9229, 80.1275] as [number,number], type: "Institution",    cap: 1100, occ: 30,  score: 90 },
  { name: "Chromepet Sai Kalyana Hall",     ll: [12.9510, 80.1440] as [number,number], type: "Marriage Hall",  cap: 1500, occ: 15,  score: 93 },
  { name: "Adyar Lions Club Hall",          ll: [13.0067, 80.2570] as [number,number], type: "Community Hall", cap: 400,  occ: 80,  score: 72 },
  { name: "Mylapore Tank Complex",          ll: [13.0330, 80.2694] as [number,number], type: "Temple",         cap: 800,  occ: 25,  score: 84 },
  { name: "Royapettah Govt Hospital Hall",  ll: [13.0550, 80.2620] as [number,number], type: "Institution",    cap: 1000, occ: 50,  score: 87 },
  { name: "Egmore AGS Colony Hall",         ll: [13.0732, 80.2609] as [number,number], type: "Community Hall", cap: 500,  occ: 60,  score: 75 },
  { name: "Vyasarpadi School",              ll: [13.1200, 80.2500] as [number,number], type: "School",         cap: 700,  occ: 10,  score: 92 },
  { name: "Kolathur Corp School",           ll: [13.1280, 80.2100] as [number,number], type: "School",         cap: 850,  occ: 22,  score: 89 },
  { name: "Tondiarpet Hall",                ll: [13.1100, 80.2900] as [number,number], type: "Community Hall", cap: 600,  occ: 35,  score: 83 },
  { name: "Thiruvottiyur Temple Ground",    ll: [13.1560, 80.3010] as [number,number], type: "Temple",         cap: 2000, occ: 8,   score: 94 },
  { name: "Manali Welfare Centre",          ll: [13.1640, 80.2620] as [number,number], type: "Community Hall", cap: 900,  occ: 18,  score: 91 },
  { name: "Ennore Port Recreation Hall",    ll: [13.2100, 80.3200] as [number,number], type: "Institution",    cap: 1200, occ: 5,   score: 96 },
  { name: "Avadi Municipal Hall",           ll: [13.1140, 80.1020] as [number,number], type: "Community Hall", cap: 1400, occ: 28,  score: 88 },
  { name: "Poonamallee Corp School",        ll: [13.0481, 80.1159] as [number,number], type: "School",         cap: 750,  occ: 45,  score: 80 },
  { name: "Maduravoyal Community Hall",     ll: [13.0700, 80.1600] as [number,number], type: "Community Hall", cap: 600,  occ: 55,  score: 77 },
  { name: "Porur Govt Hospital Wing",       ll: [13.0382, 80.1565] as [number,number], type: "Institution",    cap: 800,  occ: 40,  score: 85 },
  { name: "Valasaravakkam School",          ll: [13.0520, 80.1840] as [number,number], type: "School",         cap: 650,  occ: 58,  score: 78 },
  { name: "Kodambakkam Marriage Hall",      ll: [13.0500, 80.2250] as [number,number], type: "Marriage Hall",  cap: 1600, occ: 12,  score: 92 },
  { name: "Nungambakkam Corp Hall",         ll: [13.0575, 80.2435] as [number,number], type: "Community Hall", cap: 500,  occ: 68,  score: 74 },
  { name: "Anna Nagar Sports Complex",      ll: [13.0850, 80.2101] as [number,number], type: "Institution",    cap: 2500, occ: 20,  score: 97 },
  { name: "Villivakkam Mahal",              ll: [13.1017, 80.2102] as [number,number], type: "Marriage Hall",  cap: 1200, occ: 30,  score: 86 },
  { name: "Perambur Corp School",           ll: [13.1040, 80.2450] as [number,number], type: "School",         cap: 750,  occ: 48,  score: 81 },
  { name: "Otteri Community Hall",          ll: [13.0900, 80.2600] as [number,number], type: "Community Hall", cap: 450,  occ: 72,  score: 70 },
  { name: "Sholinganallur IT Hall",         ll: [12.8900, 80.2270] as [number,number], type: "Institution",    cap: 3000, occ: 10,  score: 99 },
  { name: "Medavakkam Corp Hall",           ll: [12.9250, 80.1940] as [number,number], type: "Community Hall", cap: 700,  occ: 44,  score: 82 },
];

const typeColor: Record<string, string> = {
  "Institution":    "#1a8cff",
  "School":         "#36d6ff",
  "Community Hall": "#22e39a",
  "Temple":         "#ff8a3d",
  "Marriage Hall":  "#b266ff",
};

export default function ShelterTab() {
  const mapDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 11);

    SHELTERS.forEach(s => {
      const col = typeColor[s.type] || "#36d6ff";
      const radius = 7 + Math.round((100 - s.occ) / 20);

      L.circleMarker(s.ll, {
        radius,
        color: col,
        fillColor: col,
        fillOpacity: 0.72,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px">
            <b style="font-size:13px">${s.name}</b><br/>
            <span style="color:#888;font-size:11px">${s.type}</span><br/><br/>
            <table style="font-size:11px;border-collapse:collapse;width:100%">
              <tr><td style="padding:2px 0;color:#555">Capacity</td><td style="font-weight:700">${s.cap.toLocaleString()}</td></tr>
              <tr><td style="padding:2px 0;color:#555">Occupancy</td><td style="font-weight:700;color:${s.occ > 80 ? "#e53935" : "#2e7d32"}">${s.occ}%</td></tr>
              <tr><td style="padding:2px 0;color:#555">Available</td><td style="font-weight:700;color:${s.occ < 80 ? "#2e7d32" : "#e53935"}">${s.occ < 80 ? "✓ YES" : "⚠ NEAR FULL"}</td></tr>
              <tr><td style="padding:2px 0;color:#555">AI Suitability</td><td style="font-weight:700;color:${col}">${s.score}/100</td></tr>
            </table>
          </div>
        `);
    });

    return () => { map.remove(); };
  }, []);

  const sorted = [...SHELTERS].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative">
        <div ref={mapDivRef} className="absolute inset-0" style={{ background: "#02101e" }} />

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 20, left: 12, zIndex: 500,
          background: "rgba(6,26,46,.92)", border: "1px solid rgba(80,170,255,.2)",
          padding: "10px 14px", borderRadius: 10, fontSize: 11,
        }}>
          <div style={{ color: "#36d6ff", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>Shelter Type</div>
          {Object.entries(typeColor).map(([t, c]) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: c, flexShrink: 0 }} />
              <span style={{ color: "#dbeaff" }}>{t}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(80,170,255,.15)", marginTop: 8, paddingTop: 7, color: "#7da3c9", fontSize: 10.5 }}>
            Circle size = availability
          </div>
        </div>

        <div className="absolute top-3 right-3 z-[500]" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="badge-ai">AI ROUTING</span>
          <span style={{ fontSize: 12, color: "#22e39a" }}>{SHELTERS.length} shelters active</span>
        </div>
      </div>

      <div className="w-80 flex flex-col border-l border-border shrink-0 overflow-y-auto scrollbar-thin"
        style={{ background: "rgba(6,26,46,.9)" }}>
        <div className="p-4 border-b border-border">
          <div className="section-title mb-1">Recommended Shelters</div>
          <p style={{ fontSize: 11, color: "#7da3c9" }}>
            AI-ranked by elevation, capacity &amp; route viability · {SHELTERS.filter(s => s.occ < 80).length} available now
          </p>
        </div>

        <div className="p-3 flex flex-col gap-3">
          {sorted.map((s, i) => {
            const col = typeColor[s.type] || "#36d6ff";
            return (
              <div key={s.name} className="glass p-3 rounded-xl" style={{ border: `1px solid ${col}33` }}>
                <div className="flex justify-between items-start mb-2">
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: "#dbeaff", flex: 1, paddingRight: 8 }}>{s.name}</div>
                  <span style={{ background: "rgba(0,240,255,.15)", color: "#00f0ff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>
                    #{i + 1}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px", fontSize: 11, marginBottom: 8 }}>
                  {[
                    { l: "Type",        v: s.type },
                    { l: "Capacity",    v: s.cap.toLocaleString() },
                    { l: "Occupancy",   v: s.occ + "%" },
                    { l: "Available",   v: s.occ < 80 ? "✓ Yes" : "⚠ Near Full" },
                    { l: "SHG Cover",   v: "Active" },
                    { l: "Suitability", v: s.score + "/100" },
                  ].map(kv => (
                    <div key={kv.l}>
                      <div style={{ color: "#7da3c9", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{kv.l}</div>
                      <div style={{
                        color: kv.l === "Suitability" ? col
                          : kv.l === "Available" ? (s.occ < 80 ? "#22e39a" : "#ff8a3d")
                          : "#dbeaff",
                        fontWeight: kv.l === "Suitability" ? 700 : 400,
                      }}>{kv.v}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-neo" style={{ width: "100%", padding: "6px", fontSize: 12, borderRadius: 8 }}>
                  Select &amp; Route
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
