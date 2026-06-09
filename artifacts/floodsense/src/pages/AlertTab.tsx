import { useState, useEffect } from "react";
import { AlertCircle, Smartphone, PhoneCall, Users } from "lucide-react";

export default function AlertTab() {
  const [counts, setCounts] = useState({ sms: 0, wa: 0, ivrs: 0, shg: 0 });

  const increment = (type: keyof typeof counts) => {
    setCounts(prev => ({ ...prev, [type]: prev[type] + Math.floor(Math.random() * 100) + 50 }));
  };

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden p-6 gap-6">
      <div className="w-full bg-destructive/20 border border-destructive rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-destructive animate-pulse" />
          <div>
            <h1 className="text-2xl font-bold text-destructive uppercase tracking-widest glow-text">Emergency Alert Dispatch</h1>
            <p className="text-sm text-destructive/80">Command center direct communication interface</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">System Status</div>
          <div className="text-emerald-500 font-bold uppercase tracking-wider flex items-center justify-end gap-2">
            <div className="status-dot"></div> Ready to Dispatch
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "SMS Gateway", icon: Smartphone, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", key: "sms" },
          { label: "WhatsApp API", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", key: "wa" },
          { label: "IVRS Calls", icon: PhoneCall, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", key: "ivrs" },
          { label: "SHG Network", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", key: "shg" },
        ].map((btn) => {
          const Icon = btn.icon;
          // Use any for MessageSquare placeholder
          const IconComp = Icon as any;
          return (
            <div key={btn.key} className={`glass-panel rounded-lg p-5 flex flex-col gap-4 border ${btn.border}`}>
              <div className="flex justify-between items-start">
                <IconComp className={`w-6 h-6 ${btn.color}`} />
                <span className="text-2xl font-mono font-bold text-foreground">
                  {counts[btn.key as keyof typeof counts].toLocaleString()}
                </span>
              </div>
              <div className="text-sm font-medium text-muted-foreground">{btn.label}</div>
              <button 
                onClick={() => increment(btn.key as keyof typeof counts)}
                className={`w-full py-2 rounded font-bold uppercase text-xs tracking-wider transition-all hover:brightness-125 ${btn.bg} ${btn.color} border ${btn.border}`}
              >
                Dispatch Alert
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex-1 glass-panel border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-card/50">
          <h3 className="font-semibold text-primary uppercase tracking-wider">Target Regions Queue</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-background/90 sticky top-0">
              <tr>
                <th className="p-4 font-medium">Region</th>
                <th className="p-4 font-medium">Current Flood</th>
                <th className="p-4 font-medium">Predicted Flood</th>
                <th className="p-4 font-medium">ETA</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { region: "Velachery", cur: "85%", pred: "95%", eta: "NOW", status: "Critical", color: "text-destructive", bg: "bg-destructive/10" },
                { region: "Pallikaranai", cur: "78%", pred: "90%", eta: "NOW", status: "Critical", color: "text-destructive", bg: "bg-destructive/10" },
                { region: "Guindy", cur: "45%", pred: "80%", eta: "2h", status: "Warning", color: "text-amber-500", bg: "bg-amber-500/10" },
                { region: "Adyar", cur: "30%", pred: "75%", eta: "3.5h", status: "Warning", color: "text-amber-500", bg: "bg-amber-500/10" },
                { region: "T Nagar", cur: "10%", pred: "40%", eta: "6h", status: "Watch", color: "text-yellow-500", bg: "bg-yellow-500/10" },
                { region: "Anna Nagar", cur: "5%", pred: "25%", eta: "8h", status: "Watch", color: "text-yellow-500", bg: "bg-yellow-500/10" },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-border/50 hover:bg-card/50 transition-colors ${row.bg}`}>
                  <td className="p-4 font-medium text-foreground">{row.region}</td>
                  <td className="p-4 font-mono">{row.cur}</td>
                  <td className="p-4 font-mono font-bold">{row.pred}</td>
                  <td className="p-4">{row.eta}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-current ${row.color}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-xs bg-primary/20 text-primary px-3 py-1 rounded hover:bg-primary/30 transition-colors">
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Dummy icon for MessageSquare missing from lucide imports in this file snippet
function MessageSquare(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}
