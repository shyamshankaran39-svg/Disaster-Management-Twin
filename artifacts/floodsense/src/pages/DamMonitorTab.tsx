import { useState } from "react";
import { Droplets, Activity, AlertTriangle, ShieldCheck } from "lucide-react";

export default function DamMonitorTab() {
  const [rainfall, setRainfall] = useState(150);

  const dams = [
    { name: "Chembarambakkam", baseStorage: 65, inflow: 1200, outflow: 800 },
    { name: "Puzhal", baseStorage: 55, inflow: 800, outflow: 500 },
    { name: "Poondi", baseStorage: 70, inflow: 1500, outflow: 1000 },
    { name: "Red Hills", baseStorage: 60, inflow: 900, outflow: 600 },
    { name: "Adyar", baseStorage: 40, inflow: 500, outflow: 500 },
    { name: "Cooum", baseStorage: 45, inflow: 600, outflow: 600 }
  ];

  const getStatus = (storage: number) => {
    if (storage > 90) return { label: "CRITICAL", color: "text-destructive", bg: "bg-destructive/10" };
    if (storage > 75) return { label: "RELEASE WATER", color: "text-orange-500", bg: "bg-orange-500/10" };
    if (storage > 60) return { label: "MONITOR", color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: "SAFE", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6 bg-background overflow-y-auto">
      <div className="glass-panel border border-border rounded-lg p-6 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary uppercase tracking-widest glow-text">Reservoir Monitoring & Control</h2>
          <div className="text-sm font-mono flex gap-4">
            <span className="text-muted-foreground">Catchment Rainfall:</span>
            <span className="font-bold text-primary">{rainfall} mm</span>
          </div>
        </div>
        
        <input 
          type="range" 
          min="0" 
          max="300" 
          value={rainfall} 
          onChange={(e) => setRainfall(Number(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1">
        {dams.map(dam => {
          // Calculate dynamic storage based on rainfall
          const storage = Math.min(100, dam.baseStorage + (rainfall / 300) * 40);
          const currentInflow = Math.floor(dam.inflow * (1 + rainfall/100));
          const status = getStatus(storage);

          return (
            <div key={dam.name} className={`glass-panel border rounded-lg p-6 flex flex-col gap-4 transition-colors duration-500 ${storage > 90 ? 'border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-border'}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground uppercase">{dam.name}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="10" />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="currentColor" 
                      className={storage > 90 ? 'text-destructive' : storage > 75 ? 'text-orange-500' : 'text-primary'}
                      strokeWidth="10" 
                      strokeDasharray={`${storage * 2.827} 282.7`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold font-mono">{storage.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Current Inflow</span>
                    <span className="text-lg font-mono font-bold text-amber-500">{currentInflow} <span className="text-xs font-sans text-muted-foreground">cusecs</span></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">Outflow (Release)</span>
                    <span className="text-lg font-mono font-bold text-emerald-500">{dam.outflow} <span className="text-xs font-sans text-muted-foreground">cusecs</span></span>
                  </div>
                </div>
              </div>

              <div className="w-full h-4 bg-secondary rounded overflow-hidden mt-2 relative">
                <div 
                  className={`h-full transition-all duration-500 ${storage > 90 ? 'bg-destructive' : storage > 75 ? 'bg-orange-500' : 'bg-primary'}`} 
                  style={{ width: `${storage}%` }}
                >
                  <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[pulse_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
