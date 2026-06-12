import L from "leaflet";

export const CHENNAI: [number, number] = [13.0827, 80.2707];

/* ── Sea boundary — latitude-dependent ───────────────────────────────────────
   Chennai's Bay of Bengal coastline (calibrated from satellite imagery):
     lat 12.85 → coast ≈ lng 80.249   (ECR / Neelankarai)
     lat 12.93 → coast ≈ lng 80.264   (Thiruvanmiyur / Besant Nagar)
     lat 13.00 → coast ≈ lng 80.277   (Santhome / Adyar river mouth)
     lat 13.07 → coast ≈ lng 80.290   (Marina Beach)
     lat 13.20 → coast ≈ lng 80.314   (Thiruvottiyur)
   Linear model: coast(lat) = 80.249 + (lat − 12.85) × 0.185
   Buffer: 0.005° (~550 m) inland — just enough to stay on land.          */
export function clipToLand(coords: [number, number][]): [number, number][] {
  return coords.map(([lat, lng]) => {
    const coast  = 80.249 + (lat - 12.85) * 0.185;
    const maxLng = coast - 0.005;                   // ~550 m inland buffer
    return [lat, Math.min(lng, maxLng)] as [number, number];
  });
}

export const areas = [
  { name: "Velachery",     ll: [12.9750, 80.2200] as [number, number], risk: 0.92 },
  { name: "Pallikaranai",  ll: [12.9430, 80.2120] as [number, number], risk: 0.96 },
  { name: "Tambaram",      ll: [12.9229, 80.1275] as [number, number], risk: 0.78 },
  { name: "Perungudi",     ll: [12.9617, 80.2467] as [number, number], risk: 0.81 },
  { name: "Sholinganallur",ll: [12.9010, 80.2279] as [number, number], risk: 0.74 },
  { name: "Guindy",        ll: [13.0067, 80.2206] as [number, number], risk: 0.55 },
  { name: "Porur",         ll: [13.0382, 80.1565] as [number, number], risk: 0.62 },
  { name: "Ambattur",      ll: [13.0982, 80.1610] as [number, number], risk: 0.41 },
  { name: "Anna Nagar",    ll: [13.0850, 80.2101] as [number, number], risk: 0.38 },
  { name: "T Nagar",       ll: [13.0418, 80.2341] as [number, number], risk: 0.49 },
  { name: "Adyar",         ll: [13.0067, 80.2570] as [number, number], risk: 0.68 },
];

export const waters = [
  { name: "Chembarambakkam Lake", ll: [13.0167, 80.0500] as [number, number], cap: 3645, fill: 78 },
  { name: "Puzhal Lake",          ll: [13.1700, 80.1900] as [number, number], cap: 3300, fill: 82 },
  { name: "Poondi Reservoir",     ll: [13.3500, 79.9000] as [number, number], cap: 3231, fill: 71 },
  { name: "Red Hills Lake",       ll: [13.1900, 80.1800] as [number, number], cap: 3300, fill: 80 },
  { name: "Adyar River Mouth",    ll: [13.0050, 80.2700] as [number, number], cap: 0,    fill: 0  },
  { name: "Cooum River Mouth",    ll: [13.0710, 80.2880] as [number, number], cap: 0,    fill: 0  },
  { name: "Buckingham Canal",     ll: [12.9500, 80.2400] as [number, number], cap: 0,    fill: 0  },
  { name: "Pallikaranai Marsh",   ll: [12.9450, 80.2150] as [number, number], cap: 0,    fill: 0  },
];

export function riskColor(r: number): string {
  if (r > 0.85) return "#ff3b5c";
  if (r > 0.65) return "#ff8a3d";
  if (r > 0.45) return "#ffd56a";
  return "#22e39a";
}

export function makeLayers() {
  return {
    "Carto Dark": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, attribution: "© CartoDB" }),
    "Street Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",            { maxZoom: 19, attribution: "© OSM" }),
    "Satellite":  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "© Esri" }),
  };
}

export function initBaseMap(el: HTMLDivElement, zoom = 11): L.Map {
  const map = L.map(el, { center: CHENNAI, zoom, zoomControl: true });
  const layers = makeLayers();
  layers["Carto Dark"].addTo(map);
  L.control.layers(layers, undefined, { position: "topright" }).addTo(map);
  setTimeout(() => { map.invalidateSize(); map.setView(CHENNAI, zoom); }, 300);
  return map;
}

export function addAreaMarkers(map: L.Map, colored = false): L.CircleMarker[] {
  return areas.map(a => {
    const color = colored ? riskColor(a.risk) : "#36d6ff";
    const r = colored ? 6 + a.risk * 12 : 7;
    const cm = L.circleMarker(a.ll, {
      radius: r, color, fillColor: color, fillOpacity: 0.5, weight: 2,
      className: a.risk > 0.8 ? "blink-marker" : "",
    })
      .addTo(map)
      .bindPopup(`<b>${a.name}</b><br>Risk Score: <b style="color:${riskColor(a.risk)}">${(a.risk * 100).toFixed(0)}%</b><br>Status: ${a.risk > 0.85 ? "⚠ EVACUATE" : a.risk > 0.65 ? "⚠ WARNING" : "WATCH"}`);
    L.marker(a.ll, {
      icon: L.divIcon({
        className: "",
        html: `<div style="color:#dbeaff;font-size:11px;font-weight:600;text-shadow:0 1px 4px #000;white-space:nowrap;transform:translate(10px,2px)">${a.name}</div>`,
        iconSize: [90, 14],
      }),
    }).addTo(map);
    return cm;
  });
}

export function addWaterMarkers(map: L.Map): void {
  waters.forEach(w => {
    L.marker(w.ll, {
      icon: L.divIcon({
        className: "",
        html: `<div style="background:#1a8cff;color:#001;font-size:10px;padding:2px 6px;border-radius:6px;font-weight:700;box-shadow:0 0 8px #00f0ff;white-space:nowrap">${w.name}</div>`,
        iconSize: [140, 16],
      }),
    })
      .addTo(map)
      .bindPopup(w.cap
        ? `<b>${w.name}</b><br>Capacity: ${w.cap} mcft<br>Fill: <b style="color:#36d6ff">${w.fill}%</b>`
        : `<b>${w.name}</b>`);
  });
}

export function addFloodPolys(map: L.Map, scale = 1): L.Polygon[] {
  const hotspots: { center: [number, number]; risk: number }[] = [
    { center: [12.9750, 80.2200], risk: 0.92 },
    { center: [12.9430, 80.2120], risk: 0.96 },
    { center: [12.9617, 80.2467], risk: 0.81 },
    { center: [12.9010, 80.2279], risk: 0.74 },
    { center: [12.9229, 80.1275], risk: 0.78 },
  ];
  return hotspots.map(h => {
    const [lat, lng] = h.center;
    const sz = 0.018 * scale * h.risk;
    const raw: [number, number][] = [
      [lat - sz,       lng - sz * 1.5],
      [lat + sz,       lng - sz],
      [lat + sz * 1.3, lng + sz * 1.3],
      [lat - sz * 0.5, lng + sz * 1.8],
      [lat - sz * 1.5, lng + sz * 0.5],
    ];
    return L.polygon(clipToLand(raw), {
        color: "#1a8cff",
        fillColor: "#00f0ff",
        fillOpacity: 0.15 + h.risk * 0.12,
        weight: 1.5,
      })
      .addTo(map)
      .bindPopup(`<b>Flood Zone</b><br>Depth: ${(h.risk * 2.8 * scale).toFixed(1)} m<br>Area risk: ${(h.risk * 100).toFixed(0)}%`);
  });
}

export const riverLevelData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  level: +(1.5 + Math.sin(i / 3) * 0.5 + (i > 14 ? 0.8 : 0.1) * Math.random()).toFixed(2),
}));

export const rainfallData = [
  { day: "Day 1", mm: 45 },
  { day: "Day 2", mm: 120 },
  { day: "Day 3", mm: 210 },
  { day: "Day 4", mm: 85 },
  { day: "Day 5", mm: 20 },
];

export const alertVolumeData = Array.from({ length: 8 }, (_, i) => ({
  time: ["6a","8a","10a","12p","2p","4p","6p","Now"][i],
  SMS: [8,22,46,74,110,160,200,238][i],
  WhatsApp: [4,14,30,52,80,110,138,164][i],
  IVRS: [1,4,10,16,24,32,36,40][i],
}));

export const responseData = [
  { name: "Acknowledged", value: 72, fill: "#22e39a" },
  { name: "Pending",      value: 18, fill: "#ffb020" },
  { name: "No Response",  value: 10, fill: "#ff3b5c" },
];

export const ackData = [
  { channel: "SMS",     pct: 68, fill: "#00f0ff" },
  { channel: "WA",      pct: 84, fill: "#22e39a" },
  { channel: "IVRS",    pct: 52, fill: "#ffb020" },
  { channel: "SHG",     pct: 93, fill: "#1a8cff" },
];

export const neighborhoods = areas;
export const waterBodies  = waters;
