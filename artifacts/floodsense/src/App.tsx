import { useState, useEffect } from "react";
import { Globe, Satellite, MessageSquare, Brain, Bell, Map, Radio, Database, Navigation, Droplet, Shield, Box, Layers, Play } from "lucide-react";
import FloodHubTab from "./pages/FloodHubTab";
import SentinelTab from "./pages/SentinelTab";
import CitizenTab from "./pages/CitizenTab";
import RiskScoringTab from "./pages/RiskScoringTab";
import AlertTab from "./pages/AlertTab";
import FloodMapTab from "./pages/FloodMapTab";
import DisseminationTab from "./pages/DisseminationTab";
import DamMonitorTab from "./pages/DamMonitorTab";
import WaterArrivalTab from "./pages/WaterArrivalTab";
import DrainageTab from "./pages/DrainageTab";
import ShelterTab from "./pages/ShelterTab";
import ReservoirTwinTab from "./pages/ReservoirTwinTab";
import UrbanDrainageTwinTab from "./pages/UrbanDrainageTwinTab";
import TimelinePlaybackTab from "./pages/TimelinePlaybackTab";

const TICKER_MSG =
  "SEVERE WARNING · Pallikaranai 92% inundated \u00a0|\u00a0 " +
  "EVACUATE · Velachery Wards 170-182 \u00a0|\u00a0 " +
  "Chembarambakkam release scheduled 04:00 IST · 5,200 cusecs \u00a0|\u00a0 " +
  "Sentinel-1 pass confirmed 187 km\u00b2 inundation \u00a0|\u00a0 " +
  "24 shelters activated · 18,420 occupants \u00a0|\u00a0 " +
  "Drainage failure detected · Perungudi sector 4 \u00a0|\u00a0 " +
  "AI confidence 94% on next-24h forecast \u00a0|\u00a0 " +
  "IVRS broadcast to 38,910 households complete \u00a0|\u00a0 " +
  "Puzhal Lake at 82% storage · monitor closely \u00a0|\u00a0 " +
  "NDRF Team-3 deployed to Velachery \u00a0|\u00a0 " +
  "Anna University shelter at 45% capacity \u00a0|\u00a0 ";

const TABS = [
  { icon: Globe,         label: "Flood Hub",      group: "Intelligence",  comp: FloodHubTab        },
  { icon: Satellite,     label: "Sentinel-1",     group: "Intelligence",  comp: SentinelTab        },
  { icon: MessageSquare, label: "Citizen Intel",  group: "Intelligence",  comp: CitizenTab         },
  { icon: Brain,         label: "AI Risk",        group: "Intelligence",  comp: RiskScoringTab     },
  { icon: Bell,          label: "Alert Gen",      group: "Operations",    comp: AlertTab           },
  { icon: Map,           label: "Flood Map",      group: "Operations",    comp: FloodMapTab        },
  { icon: Radio,         label: "Dissemination",  group: "Operations",    comp: DisseminationTab   },
  { icon: Database,      label: "Dam Monitor",    group: "Hydrology",     comp: DamMonitorTab      },
  { icon: Navigation,    label: "Water Arrival",  group: "Hydrology",     comp: WaterArrivalTab    },
  { icon: Droplet,       label: "Drainage",       group: "Hydrology",     comp: DrainageTab        },
  { icon: Shield,        label: "Shelters",       group: "Response",      comp: ShelterTab         },
  { icon: Box,           label: "Reservoir Twin", group: "Digital Twins", comp: ReservoirTwinTab   },
  { icon: Layers,        label: "Urban Drainage", group: "Digital Twins", comp: UrbanDrainageTwinTab },
  { icon: Play,          label: "Timeline Play",  group: "Digital Twins", comp: TimelinePlaybackTab },
];

function groupTabs() {
  const groups: Record<string, typeof TABS> = {};
  TABS.forEach(t => {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  });
  return groups;
}

export default function App() {
  const [activeTab, setActiveTab]     = useState(0);
  const [mountedTabs, setMountedTabs] = useState<Set<number>>(new Set([0]));
  const [time, setTime]               = useState(new Date());
  const groups = groupTabs();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function activateTab(i: number) {
    setActiveTab(i);
    setMountedTabs(prev => { const next = new Set(prev); next.add(i); return next; });
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw",
      gap: 8, padding: 8, boxSizing: "border-box",
      background: "radial-gradient(1200px 600px at 20% -10%,#0a2a4d 0,#04101f 60%,#020812 100%)",
      overflow: "hidden",
    }}>

      {/* TOP BAR */}
      <header className="glass neon" style={{ height: 50, flexShrink: 0, display: "flex", alignItems: "center", gap: 14, padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, letterSpacing: .5 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "conic-gradient(from 0deg,#00f0ff,#1a8cff,#0a2a4d,#00f0ff)",
            display: "grid", placeItems: "center",
            boxShadow: "0 0 16px rgba(0,240,255,.5)",
          }}>
            <Droplet size={18} style={{ color: "#001" }} />
          </div>
          <div>
            <div style={{ color: "#dbeaff" }}>FLOODSENSE <span style={{ color: "#00f0ff" }}>AI</span></div>
            <div style={{ fontSize: 10, color: "#7da3c9", letterSpacing: 2 }}>CHENNAI · WATER COMMAND CENTER</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,59,92,.15)", border: "1px solid rgba(255,59,92,.5)", display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 999, fontSize: 12, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3b5c", display: "inline-block", animation: "pulse-dot 1.4s infinite" }}></span>
          <b style={{ color: "#ff3b5c" }}>SEVERE WARNING</b> · Pallikaranai · Velachery
        </div>

        <div style={{ flex: 1, overflow: "hidden", marginLeft: 8, marginRight: 8, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,59,92,.1)", border: "1px solid rgba(255,59,92,.3)", borderRadius: 6, padding: "3px 12px", overflow: "hidden" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#ff3b5c", whiteSpace: "nowrap", letterSpacing: 1 }}>LIVE</span>
            <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
              <div className="ticker-inner" style={{ fontSize: 11, color: "#cfe6ff", fontWeight: 600, letterSpacing: .5 }}>
                {TICKER_MSG + TICKER_MSG}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#dbeaff", background: "rgba(34,227,154,.1)", border: "1px solid rgba(34,227,154,.3)", padding: "3px 10px", borderRadius: 999 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22e39a", display: "inline-block", animation: "pulse-dot 2s infinite" }}></span>
            System <b style={{ color: "#22e39a" }}>98.4%</b>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#36d6ff", fontWeight: 700, minWidth: 80, textAlign: "right" }}>
            {time.toLocaleTimeString("en-IN", { hour12: false })}
          </div>
        </div>
      </header>

      {/* MAIN AREA — fills remaining vertical space */}
      <div style={{ flex: 1, display: "flex", gap: 8, minHeight: 0 }}>

        {/* SIDEBAR */}
        <aside className="glass scroll-thin" style={{ width: 240, flexShrink: 0, padding: 10, overflowY: "auto" }}>
          {Object.entries(groups).map(([group, tabs]) => (
            <div key={group}>
              <div style={{ fontSize: 11, letterSpacing: "1.5px", color: "#7da3c9", textTransform: "uppercase", margin: "12px 8px 6px", fontWeight: 600 }}>
                {group}
              </div>
              {tabs.map(tab => {
                const i = TABS.indexOf(tab);
                const Icon = tab.icon;
                const active = activeTab === i;
                return (
                  <div
                    key={i}
                    onClick={() => activateTab(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                      cursor: "pointer", color: active ? "#dbeaff" : "#7da3c9", fontSize: 13.5,
                      border: `1px solid ${active ? "rgba(54,214,255,.5)" : "transparent"}`,
                      background: active ? "linear-gradient(90deg,rgba(26,140,255,.25),rgba(0,240,255,.05))" : "transparent",
                      boxShadow: active ? "inset 0 0 18px rgba(0,240,255,.15)" : "none",
                      marginBottom: 2, transition: ".2s",
                    }}
                  >
                    <div style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 8, background: "rgba(54,214,255,.12)", color: "#36d6ff", flexShrink: 0 }}>
                      <Icon size={15} />
                    </div>
                    {tab.label}
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: 16, padding: "8px 10px", fontSize: 11, color: "#7da3c9", borderTop: "1px solid rgba(80,170,255,.12)" }}>
            {[["Uptime", "99.997%"], ["AI Models", "7 / 7 online"], ["Sensors", "1,284 active"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>{k}</span><span style={{ color: "#36d6ff" }}>{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="glass" style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0 }}>
          {TABS.map((tab, i) => {
            if (!mountedTabs.has(i)) return null;
            const Component = tab.comp;
            return (
              <div
                key={i}
                style={{
                  position: "absolute", inset: 0,
                  opacity: activeTab === i ? 1 : 0,
                  pointerEvents: activeTab === i ? "auto" : "none",
                  transition: "opacity .3s ease",
                  zIndex: activeTab === i ? 1 : 0,
                }}
              >
                <Component />
              </div>
            );
          })}
        </main>
      </div>

      {/* EMERGENCY TICKER BOTTOM */}
      <div style={{
        height: 28, flexShrink: 0, display: "flex", alignItems: "center", gap: 14, padding: "0 10px",
        fontSize: 12, color: "#cfe6ff",
        background: "linear-gradient(90deg,rgba(255,59,92,.25),rgba(255,176,32,.15),rgba(54,214,255,.15))",
        borderTop: "1px solid rgba(80,170,255,.18)",
        overflow: "hidden", whiteSpace: "nowrap", borderRadius: 8,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#ff3b5c", letterSpacing: 1, flexShrink: 0 }}>EMERGENCY</span>
        <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
          <div className="ticker-inner" style={{ fontSize: 11, color: "#cfe6ff" }}>
            {TICKER_MSG + TICKER_MSG}
          </div>
        </div>
      </div>

    </div>
  );
}
