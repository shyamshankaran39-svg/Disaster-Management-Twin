import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Play, Pause } from "lucide-react";
import { initBaseMap, addAreaMarkers, addWaterMarkers } from "../data/simulatedData";

const STEPS = ["Now", "+6h", "+12h", "+24h", "+48h"];

const STEP_STATS = [
  { coverage: "5.2%",  pop: "12,000",  urgency: "MONITORING",         urgent: false },
  { coverage: "17.8%", pop: "57,000",  urgency: "WATCH",               urgent: false },
  { coverage: "31.4%", pop: "142,000", urgency: "WARNING — ACT NOW",   urgent: true  },
  { coverage: "48.6%", pop: "280,000", urgency: "SEVERE — EVACUATE",   urgent: true  },
  { coverage: "61.9%", pop: "420,000", urgency: "CRITICAL EMERGENCY",  urgent: true  },
];

const HOTSPOTS: { center: [number,number]; risk: number; fromStep: number }[] = [
  { center: [12.9750, 80.2200], risk: 0.92, fromStep: 0 },
  { center: [12.9430, 80.2120], risk: 0.96, fromStep: 0 },
  { center: [13.0067, 80.2206], risk: 0.55, fromStep: 1 },
  { center: [12.9617, 80.2467], risk: 0.81, fromStep: 1 },
  { center: [13.0067, 80.2570], risk: 0.68, fromStep: 2 },
  { center: [12.9010, 80.2279], risk: 0.74, fromStep: 2 },
  { center: [12.9229, 80.1275], risk: 0.78, fromStep: 3 },
  { center: [13.0418, 80.2341], risk: 0.49, fromStep: 4 },
  { center: [13.0382, 80.1565], risk: 0.62, fromStep: 3 },
  { center: [13.0850, 80.2101], risk: 0.38, fromStep: 4 },
];

function buildPolys(map: L.Map, stepIdx: number): L.Polygon[] {
  const scale = 1 + stepIdx * 0.25;
  return HOTSPOTS
    .filter(h => stepIdx >= h.fromStep)
    .map(h => {
      const [lat, lng] = h.center;
      const sz = 0.02 * scale * h.risk;
      const opacity = Math.min(0.5, 0.12 + (stepIdx - h.fromStep) * 0.09 + h.risk * 0.1);
      const depth = Math.round(h.risk * 2.8 * scale * 10) / 10;
      return L.polygon(
        [
          [lat - sz,       lng - sz * 1.5],
          [lat + sz,       lng - sz],
          [lat + sz * 1.3, lng + sz * 1.3],
          [lat - sz * 0.5, lng + sz * 1.8],
          [lat - sz * 1.5, lng + sz * 0.5],
        ] as [number, number][],
        {
          color: "#1a8cff",
          fillColor: stepIdx >= 3 ? "#0050ff" : "#00f0ff",
          fillOpacity: opacity,
          weight: 1.5,
        }
      )
        .addTo(map)
        .bindPopup(`<b>Flood Zone</b><br>Time: ${STEPS[stepIdx]}<br>Depth: ${depth} m<br>Step: ${stepIdx + 1} / 5`);
    });
}

export default function TimelinePlaybackTab() {
  const mapDivRef  = useRef<HTMLDivElement>(null);
  const mapRef     = useRef<L.Map | null>(null);
  const polysRef   = useRef<L.Polygon[]>([]);
  const [step,    setStep]    = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    if (!mapDivRef.current) return;
    const map = initBaseMap(mapDivRef.current, 11);
    addAreaMarkers(map, true);
    addWaterMarkers(map);
    mapRef.current = map;
    setReady(true);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    polysRef.current.forEach(p => mapRef.current!.removeLayer(p));
    polysRef.current = buildPolys(mapRef.current, step);
  }, [step, ready]);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setStep(s => {
        if (s >= STEPS.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 2200);
    return () => clearInterval(iv);
  }, [playing]);

  const st = STEP_STATS[step];

  return (
    <div className="w-full h-full relative">
      <div ref={mapDivRef} className="absolute inset-0" style={{ background: "#02101e" }} />

      <div className="float absolute top-3 right-3 z-[500] glass p-4" style={{ width: 280 }}>
        <div className="flex justify-between items-center border-b pb-3 mb-3" style={{ borderColor: "rgba(80,170,255,.18)" }}>
          <span style={{ fontSize: 11, color: "#7da3c9", textTransform: "uppercase", letterSpacing: 1 }}>Time Step</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#00f0ff", fontFamily: "monospace" }}>{STEPS[step]}</span>
        </div>
        <div className="kpi mb-2" style={{ minWidth: 0 }}>
          <div className="label">Flood Coverage</div>
          <div className="val" style={{ color: step >= 3 ? "#ff3b5c" : "#00f0ff" }}>{st.coverage}</div>
        </div>
        <div className="kpi mb-3" style={{ minWidth: 0 }}>
          <div className="label">Population Affected</div>
          <div className="val" style={{ color: "#ffb020" }}>{st.pop}</div>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            background: st.urgent ? "rgba(255,59,92,.18)" : "rgba(34,227,154,.12)",
            color: st.urgent ? "#ff3b5c" : "#22e39a",
            border: `1px solid ${st.urgent ? "rgba(255,59,92,.4)" : "rgba(34,227,154,.3)"}`,
            animation: st.urgent ? "pulse-dot 1.4s infinite" : "none",
          }}
        >
          {st.urgency}
        </div>
      </div>

      <div className="float absolute bottom-3 left-1/2 z-[500] glass p-4 rounded-xl"
        style={{ transform: "translateX(-50%)", width: 640 }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (step >= STEPS.length - 1) setStep(0);
              setPlaying(p => !p);
            }}
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(90deg,#1a8cff,#00f0ff)",
              border: "none", cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(0,240,255,.4)",
            }}
          >
            {playing
              ? <Pause size={20} style={{ color: "#001", fill: "#001" }} />
              : <Play  size={20} style={{ color: "#001", fill: "#001", marginLeft: 2 }} />}
          </button>

          <div style={{ flex: 1 }}>
            <div className="flex justify-between px-1 mb-2">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  onClick={() => { setStep(i); setPlaying(false); }}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    color: step === i ? "#00f0ff" : "#7da3c9",
                    transform: step === i ? "scale(1.15)" : "none",
                    transition: "color .2s, transform .2s",
                    display: "inline-block",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            <div
              style={{ position: "relative", height: 10, background: "rgba(54,214,255,.15)", borderRadius: 5, cursor: "pointer" }}
              onClick={e => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const pct  = (e.clientX - rect.left) / rect.width;
                setStep(Math.round(pct * (STEPS.length - 1)));
                setPlaying(false);
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, height: "100%",
                width: `${(step / (STEPS.length - 1)) * 100}%`,
                background: "linear-gradient(90deg,#1a8cff,#00f0ff)",
                borderRadius: 5,
                boxShadow: "0 0 10px rgba(0,240,255,.6)",
                transition: playing ? "width 2.2s linear" : "width .3s ease",
              }} />
              <div style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)",
                left: `calc(${(step / (STEPS.length - 1)) * 100}% - 7px)`,
                width: 14, height: 14, borderRadius: "50%",
                background: "#02101e", border: "2px solid #00f0ff",
                boxShadow: "0 0 10px #00f0ff",
                transition: playing ? "left 2.2s linear" : "left .3s ease",
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="float absolute bottom-3 left-3 z-[500] glass p-2 text-[11.5px]">
        <b style={{ color: "#36d6ff" }}>DEPTH</b>&nbsp;
        <span style={{ background: "#1a3a5c", padding: "1px 6px", borderRadius: 4 }}>&lt;0.5m</span>&nbsp;
        <span style={{ background: "#1a8cff66", padding: "1px 6px", borderRadius: 4 }}>0.5–1.5m</span>&nbsp;
        <span style={{ background: "#00f0ffaa", padding: "1px 6px", borderRadius: 4 }}>&gt;1.5m</span>
      </div>
    </div>
  );
}
