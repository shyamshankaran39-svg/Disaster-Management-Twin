import { useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";

export default function UrbanDrainageTwinTab() {
  const [rainfall, setRainfall] = useState(100);

  const capacity = Math.max(0, 85 - (rainfall / 300) * 80);
  const blockage = Math.min(100, 12 + (rainfall / 300) * 50);
  const risk = rainfall > 200 ? "Severe" : rainfall > 100 ? "Moderate" : "Low";

  return (
    <div className="flex flex-col w-full h-full bg-background p-6 gap-6 overflow-hidden">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-3 gap-6 shrink-0">
        <div className="glass-panel border border-border rounded-lg p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Network Capacity</span>
            <span className="text-4xl font-mono font-bold text-primary">{capacity.toFixed(0)}%</span>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-secondary flex items-center justify-center border-t-primary border-r-primary transform rotate-45"></div>
        </div>
        <div className="glass-panel border border-border rounded-lg p-6 flex flex-col gap-2 justify-center">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">System Blockage</span>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-mono font-bold text-destructive">{blockage.toFixed(0)}%</span>
            <div className="flex-1 h-2 bg-secondary rounded overflow-hidden">
              <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${blockage}%` }}></div>
            </div>
          </div>
        </div>
        <div className="glass-panel border border-border rounded-lg p-6 flex flex-col gap-1 justify-center items-end text-right">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">Flood Risk Level</span>
          <div className={`px-4 py-1 border rounded text-2xl font-bold uppercase tracking-widest ${rainfall > 200 ? 'bg-destructive/20 text-destructive border-destructive' : rainfall > 100 ? 'bg-amber-500/20 text-amber-500 border-amber-500' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500'}`}>
            {risk}
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-1 gap-6 min-h-0">
        <div className="flex-1 glass-panel border border-border rounded-lg p-6 relative flex flex-col">
          <h2 className="text-lg font-bold text-foreground uppercase tracking-wider mb-4">Underground Cross-Section</h2>
          <div className="flex-1 border border-border/50 bg-card/30 rounded relative overflow-hidden flex items-center justify-center p-8">
            <svg className="w-full h-full" viewBox="0 0 800 400">
              {/* Ground level */}
              <rect x="0" y="0" width="800" height="40" fill="#1e293b" />
              <rect x="0" y="40" width="800" height="360" fill="#0f172a" />
              
              {/* Pipes */}
              <path d="M 0 200 L 300 200 L 300 300 L 800 300" fill="none" stroke="#334155" strokeWidth="60" />
              <path d="M 400 100 L 400 300" fill="none" stroke="#334155" strokeWidth="40" />
              
              {/* Flow Animations */}
              <path d="M 0 200 L 300 200 L 300 300 L 800 300" fill="none" stroke="#0ea5e9" strokeWidth={capacity * 0.4} strokeLinecap="round" strokeDasharray="10 20" className="animate-flow" />
              
              {/* Blockage Indicator */}
              <circle cx="300" cy="200" r={blockage * 0.4} fill="#ef4444" fillOpacity="0.8" className={blockage > 30 ? "animate-pulse" : ""} />
              {blockage > 30 && (
                <text x="300" y="150" textAnchor="middle" fill="#ef4444" className="text-sm font-bold font-mono">CRITICAL BLOCKAGE</text>
              )}
            </svg>
          </div>
          
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>Simulated Rainfall: {rainfall} mm</span>
            </div>
            <input 
              type="range" min="0" max="300" value={rainfall}
              onChange={e => setRainfall(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        <div className="w-[350px] flex flex-col gap-6 shrink-0">
          <div className="flex-1 glass-panel border border-border rounded-lg p-5 flex flex-col overflow-hidden">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Maintenance Queue
            </h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 scrollbar-thin">
              {[
                { zone: "Velachery T-1", score: 94 },
                { zone: "T Nagar M-2", score: 88 },
                { periodic: true, zone: "Adyar Outfall", score: 76 },
                { zone: "Guindy Sector", score: 65 },
                { zone: "OMR IT Corridor", score: 52 },
              ].map((task, i) => (
                <div key={i} className="p-3 bg-card border border-border rounded flex flex-col gap-2 hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground flex items-center gap-2"><MapPin className="w-3 h-3 text-muted-foreground"/> {task.zone}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${task.score > 80 ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'}`}>
                      {task.score} Pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button className="w-full py-3 bg-primary/20 text-primary border border-primary/50 rounded font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all">
              Dispatch Maint. Team
            </button>
            <button className="w-full py-3 bg-amber-500/20 text-amber-500 border border-amber-500/50 rounded font-bold uppercase tracking-wider hover:bg-amber-500 hover:text-amber-950 transition-all">
              Alert Ward Office
            </button>
            <button className="w-full py-3 bg-destructive/20 text-destructive border border-destructive/50 rounded font-bold uppercase tracking-wider hover:bg-destructive hover:text-destructive-foreground transition-all">
              Flag Emergency
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
