import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function DisseminationTab() {
  const areaData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    alerts: Math.floor(Math.random() * 5000 + (i > 12 ? 8000 : 1000))
  }));

  const pieData = [
    { name: "WhatsApp", value: 18450, color: "#10b981" },
    { name: "SMS", value: 24100, color: "#3b82f6" },
    { name: "IVRS", value: 5741, color: "#f59e0b" }
  ];

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6 bg-background overflow-y-auto">
      <h2 className="text-2xl font-bold text-primary glow-text uppercase tracking-widest">Data Dissemination Analytics</h2>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="glass-panel border border-border rounded-lg p-5 flex flex-col gap-1">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">Alerts Sent</span>
          <span className="text-3xl font-bold text-foreground">48,291</span>
        </div>
        <div className="glass-panel border border-border rounded-lg p-5 flex flex-col gap-1">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">Citizens Reached</span>
          <span className="text-3xl font-bold text-primary">1.2M</span>
        </div>
        <div className="glass-panel border border-border rounded-lg p-5 flex flex-col gap-1">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">Authorities Notified</span>
          <span className="text-3xl font-bold text-amber-500">156</span>
        </div>
        <div className="glass-panel border border-border rounded-lg p-5 flex flex-col gap-1">
          <span className="text-sm text-muted-foreground uppercase tracking-wider">SHGs Mobilized</span>
          <span className="text-3xl font-bold text-emerald-500">89</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Network Diagram */}
        <div className="col-span-2 glass-panel border border-border rounded-lg p-6 flex flex-col relative overflow-hidden">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Communication Network</h3>
          <div className="flex-1 w-full h-full flex items-center justify-center relative">
            <svg className="w-full h-full" viewBox="0 0 800 400">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              
              {/* Lines */}
              <line x1="400" y1="200" x2="200" y2="100" stroke="url(#lineGrad)" strokeWidth="2" className="animate-flow" />
              <line x1="400" y1="200" x2="600" y2="100" stroke="url(#lineGrad)" strokeWidth="2" className="animate-flow" />
              <line x1="400" y1="200" x2="200" y2="300" stroke="url(#lineGrad)" strokeWidth="2" className="animate-flow" />
              <line x1="400" y1="200" x2="600" y2="300" stroke="url(#lineGrad)" strokeWidth="2" className="animate-flow" />
              <line x1="400" y1="200" x2="400" y2="50" stroke="url(#lineGrad)" strokeWidth="2" className="animate-flow" />

              {/* Central Node */}
              <circle cx="400" cy="200" r="40" fill="#050d1a" stroke="#0ea5e9" strokeWidth="4" />
              <text x="400" y="205" textAnchor="middle" fill="#0ea5e9" className="text-xs font-bold font-mono">CORE</text>
              
              {/* Target Nodes */}
              <circle cx="200" cy="100" r="30" fill="#050d1a" stroke="#10b981" strokeWidth="2" />
              <text x="200" y="105" textAnchor="middle" fill="#10b981" className="text-[10px] font-bold">WhatsApp</text>

              <circle cx="600" cy="100" r="30" fill="#050d1a" stroke="#3b82f6" strokeWidth="2" />
              <text x="600" y="105" textAnchor="middle" fill="#3b82f6" className="text-[10px] font-bold">SMS API</text>

              <circle cx="200" cy="300" r="30" fill="#050d1a" stroke="#f59e0b" strokeWidth="2" />
              <text x="200" y="305" textAnchor="middle" fill="#f59e0b" className="text-[10px] font-bold">IVRS</text>

              <circle cx="600" cy="300" r="30" fill="#050d1a" stroke="#a855f7" strokeWidth="2" />
              <text x="600" y="305" textAnchor="middle" fill="#a855f7" className="text-[10px] font-bold">SHG App</text>

              <circle cx="400" cy="50" r="30" fill="#050d1a" stroke="#ef4444" strokeWidth="2" />
              <text x="400" y="55" textAnchor="middle" fill="#ef4444" className="text-[10px] font-bold">Gov Portals</text>

              {/* Data Packets (Animated) */}
              <circle cx="400" cy="200" r="4" fill="#0ea5e9">
                <animate attributeName="cx" values="400;200" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="200;100" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="400" cy="200" r="4" fill="#0ea5e9">
                <animate attributeName="cx" values="400;600" dur="2s" repeatCount="indefinite" />
                <animate attributeName="cy" values="200;100" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>

        {/* Charts Column */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="flex-1 glass-panel border border-border rounded-lg p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">Alert Volume (24h)</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#050d1a', borderColor: '#1e293b' }} />
                  <Area type="monotone" dataKey="alerts" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorAlerts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex-1 glass-panel border border-border rounded-lg p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">Channel Distribution</h3>
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#050d1a', borderColor: '#1e293b' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-foreground">78%</span>
                <span className="text-[10px] text-muted-foreground uppercase">Response</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
