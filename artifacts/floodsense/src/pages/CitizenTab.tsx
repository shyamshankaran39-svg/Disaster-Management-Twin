import { useEffect, useState } from "react";
import ChennaiMap from "../components/ChennaiMap";
import { MessageSquare, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function CitizenTab() {
  const [reports] = useState([
    { id: 1, name: "Karthik R.", ward: "Ward 142", text: "Water knee-deep near Velachery main road.", conf: 92, time: "2 min ago" },
    { id: 2, name: "Priya S.", ward: "Ward 178", text: "Drain blocked, water entering houses in Pallikaranai.", conf: 88, time: "5 min ago" },
    { id: 3, name: "Ramesh M.", ward: "Ward 121", text: "Tree fallen, blocking water flow.", conf: 76, time: "12 min ago" },
    { id: 4, name: "Anitha V.", ward: "Ward 190", text: "Continuous heavy rain, street is completely flooded.", conf: 95, time: "18 min ago" },
    { id: 5, name: "Muthu K.", ward: "Ward 134", text: "Need boat rescue for elderly residents.", conf: 99, time: "22 min ago" },
    { id: 6, name: "Lakshmi T.", ward: "Ward 156", text: "Power cut since morning, water level rising.", conf: 85, time: "30 min ago" },
    { id: 7, name: "Suresh P.", ward: "Ward 165", text: "Subway is completely submerged. Avoid.", conf: 91, time: "45 min ago" },
    { id: 8, name: "Divya N.", ward: "Ward 112", text: "Water stagnation in front of school.", conf: 82, time: "1 hr ago" },
  ]);

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 relative">
        <ChennaiMap />
      </div>
      <div className="w-[400px] glass-panel border-l border-border flex flex-col p-4 gap-4 overflow-hidden shrink-0 z-10 relative">
        <h2 className="text-xl font-semibold text-primary glow-text uppercase tracking-wider mb-2">Citizen Intel</h2>
        
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-3 bg-card border border-border rounded flex flex-col">
            <span className="text-xs text-muted-foreground">Total Reports</span>
            <span className="text-2xl font-bold text-primary">234</span>
          </div>
          <div className="p-3 bg-card border border-border rounded flex flex-col">
            <span className="text-xs text-muted-foreground">AI Confidence</span>
            <span className="text-2xl font-bold text-emerald-500">88%</span>
          </div>
          <div className="p-3 bg-card border border-border rounded flex flex-col">
            <span className="text-xs text-muted-foreground">Trust Score</span>
            <span className="text-2xl font-bold text-amber-500">4.2/5</span>
          </div>
          <div className="p-3 bg-card border border-border rounded flex flex-col">
            <span className="text-xs text-muted-foreground">SHGs Notified</span>
            <span className="text-2xl font-bold text-primary">18</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-3 shrink-0">
          <div className="text-xs text-muted-foreground mb-2">Validation Pipeline</div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-emerald-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 scrollbar-thin">
          <div className="text-xs font-semibold text-muted-foreground uppercase sticky top-0 bg-background/90 backdrop-blur py-1 z-10">Live WhatsApp Feed</div>
          {reports.map((r) => (
            <div key={r.id} className="p-3 bg-card border border-border rounded flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                    {r.name[0]}
                  </div>
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                </div>
                <div className="text-xs text-muted-foreground">{r.time}</div>
              </div>
              <div className="text-sm text-foreground bg-background/50 p-2 rounded border border-border/50">
                "{r.text}"
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs font-mono text-muted-foreground">{r.ward}</div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle2 className={`w-3 h-3 ${r.conf > 90 ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className={r.conf > 90 ? 'text-emerald-500' : 'text-amber-500'}>{r.conf}% Validated</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
