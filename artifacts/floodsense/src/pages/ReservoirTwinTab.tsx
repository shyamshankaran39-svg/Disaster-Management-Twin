import { useState } from "react";

export default function ReservoirTwinTab() {
  const [rainfall, setRainfall] = useState(120);

  // Compute stats
  const lakeLevel = Math.min(100, 40 + rainfall * 0.2);
  const riverFlow = rainfall > 100 ? Math.min(100, rainfall * 0.4) : 20;
  const cusecs = rainfall < 100 ? 500 : rainfall < 180 ? 1200 : rainfall < 250 ? 2500 : 5000;
  const impact = rainfall < 100 ? "Minimal" : rainfall < 180 ? "Moderate" : rainfall < 250 ? "Severe" : "Critical";
  const impactColor = rainfall < 100 ? "text-emerald-500" : rainfall < 180 ? "text-amber-500" : rainfall < 250 ? "text-orange-500" : "text-destructive";

  return (
    <div className="flex w-full h-full bg-background p-6 gap-6">
      <div className="flex-1 glass-panel border border-border rounded-lg relative overflow-hidden flex flex-col p-6">
        <h2 className="text-xl font-bold text-primary uppercase tracking-widest glow-text absolute top-6 left-6 z-10">Reservoir Digital Twin</h2>
        
        {/* SVG Diagram */}
        <div className="flex-1 w-full h-full flex items-center justify-center pt-10">
          <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
              </linearGradient>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Paths */}
            <path d="M 200 150 C 400 150, 400 300, 600 300" fill="none" stroke="#1e293b" strokeWidth="40" strokeLinecap="round" />
            <path d="M 600 300 C 700 300, 700 450, 750 450" fill="none" stroke="#1e293b" strokeWidth="40" strokeLinecap="round" />
            <path d="M 600 300 C 600 400, 500 450, 450 450" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />

            {/* Flow Animations */}
            <path d="M 200 150 C 400 150, 400 300, 600 300" fill="none" stroke="url(#waterFlow)" strokeWidth={riverFlow * 0.4} strokeLinecap="round" strokeDasharray="20 20" className="animate-flow" />
            <path d="M 600 300 C 700 300, 700 450, 750 450" fill="none" stroke="url(#waterFlow)" strokeWidth={riverFlow * 0.4} strokeLinecap="round" strokeDasharray="20 20" className="animate-flow" />
            
            {/* Nodes */}
            {/* Chembarambakkam Lake */}
            <circle cx="150" cy="150" r="100" fill="#050d1a" stroke="#0ea5e9" strokeWidth="4" />
            <circle cx="150" cy="150" r={lakeLevel} fill="#0ea5e9" fillOpacity="0.3" className="transition-all duration-500" />
            <text x="150" y="140" textAnchor="middle" fill="#f8fafc" className="text-sm font-bold font-mono">CHEMBARAMBAKKAM</text>
            <text x="150" y="160" textAnchor="middle" fill="#0ea5e9" className="text-xl font-bold font-mono">{lakeLevel.toFixed(0)}%</text>

            {/* Adyar River Node */}
            <circle cx="600" cy="300" r="60" fill="#050d1a" stroke="#10b981" strokeWidth="4" />
            <text x="600" y="295" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">ADYAR RIVER</text>
            <text x="600" y="315" textAnchor="middle" fill="#10b981" className="text-sm font-bold font-mono">FLOW: {cusecs}</text>

            {/* Bay of Bengal */}
            <path d="M 700 400 Q 750 350 800 400 T 800 600 L 700 600 Z" fill="#0ea5e9" fillOpacity="0.2" />
            <text x="750" y="500" textAnchor="middle" fill="#0ea5e9" className="text-sm font-bold font-mono">BAY OF BENGAL</text>
          </svg>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-[350px] glass-panel border border-border rounded-lg p-6 flex flex-col shrink-0 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Simulation Parameters</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Rainfall Intensity</span>
              <span className="text-primary font-bold">{rainfall} mm</span>
            </div>
            <input 
              type="range" min="0" max="300" value={rainfall}
              onChange={e => setRainfall(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        <div className="w-full h-[1px] bg-border my-2"></div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div> AI Release Recommendation
          </h3>
          
          <div className="bg-card border border-border rounded p-4 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase">Computed Optimal Release</span>
            <span className="text-3xl font-mono font-bold text-primary">{cusecs.toLocaleString()} <span className="text-sm font-sans text-muted-foreground">cusecs</span></span>
          </div>

          <div className="bg-card border border-border rounded p-4 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase">Safe Release Window</span>
            <span className="text-lg font-mono font-bold text-emerald-500">04:00 - 08:00</span>
          </div>

          <div className="bg-card border border-border rounded p-4 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase">Expected Downstream Impact</span>
            <span className={`text-lg font-bold uppercase tracking-wider ${impactColor}`}>{impact}</span>
          </div>
        </div>

        <button className={`mt-auto w-full py-3 rounded font-bold uppercase tracking-widest transition-all ${rainfall > 200 ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
          AUTHORIZE RELEASE
        </button>
      </div>
    </div>
  );
}
