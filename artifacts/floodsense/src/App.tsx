import { useState, useEffect } from "react";
import { Activity, Map as MapIcon, Eye, Users, AlertTriangle, Bell, Share2, Database, Droplets, Droplet, Shield, Box, Share, Play } from "lucide-react";
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

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    document.documentElement.classList.add('dark');
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { icon: <MapIcon size={18} />, label: "Flood Hub", comp: FloodHubTab },
    { icon: <Eye size={18} />, label: "Sentinel-1", comp: SentinelTab },
    { icon: <Users size={18} />, label: "Citizen Intel", comp: CitizenTab },
    { icon: <AlertTriangle size={18} />, label: "Risk Scoring", comp: RiskScoringTab },
    { icon: <Bell size={18} />, label: "Alert Gen", comp: AlertTab },
    { icon: <MapIcon size={18} />, label: "Interactive Map", comp: FloodMapTab },
    { icon: <Share2 size={18} />, label: "Dissemination", comp: DisseminationTab },
    { icon: <Database size={18} />, label: "Dam Monitor", comp: DamMonitorTab },
    { icon: <Droplets size={18} />, label: "Water Arrival", comp: WaterArrivalTab },
    { icon: <Droplet size={18} />, label: "Drainage", comp: DrainageTab },
    { icon: <Shield size={18} />, label: "Shelters", comp: ShelterTab },
    { icon: <Box size={18} />, label: "Reservoir Twin", comp: ReservoirTwinTab },
    { icon: <Share size={18} />, label: "Urban Drainage", comp: UrbanDrainageTwinTab },
    { icon: <Play size={18} />, label: "Timeline Play", comp: TimelinePlaybackTab }
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      <header className="h-14 border-b border-border flex items-center px-4 justify-between bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
            <Activity className="w-5 h-5" />
            FLOODSENSE AI
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="status-dot"></div>
            <span className="text-xs text-emerald-500 font-mono uppercase">System Operational</span>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1 justify-center max-w-xl overflow-hidden">
          <div className="w-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded border border-destructive/20 whitespace-nowrap overflow-hidden text-ellipsis">
            EMERGENCY TICKER: Heavy rainfall predicted for Chennai South next 48h. Evacuation protocols active.
          </div>
        </div>
        <div className="font-mono text-sm text-primary tabular-nums">
          {time.toLocaleTimeString()}
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-border bg-card/50 flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${activeTab === i ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </aside>
        <main className="flex-1 relative overflow-hidden bg-background">
          {tabs.map((tab, i) => {
            const Component = tab.comp;
            return (
              <div 
                key={i} 
                className={`absolute inset-0 transition-opacity duration-300 ${activeTab === i ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
              >
                <Component />
              </div>
            )
          })}
        </main>
      </div>
    </div>
  );
}
