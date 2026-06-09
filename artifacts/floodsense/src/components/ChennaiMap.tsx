import { useEffect, useRef, useState } from "react";
import L from "leaflet";

export default function ChennaiMap({ children }: { children?: React.ReactNode }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    const m = L.map(mapRef.current, {
      center: [13.0827, 80.2707],
      zoom: 11,
      zoomControl: false,
    });
    
    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB'
    });
    
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM'
    });
    
    cartoDark.addTo(m);
    
    L.control.layers({
      "Dark Mode": cartoDark,
      "Street": osm
    }).addTo(m);
    
    setMap(m);
    
    return () => {
      m.remove();
    };
  }, []);

  return (
    <div ref={mapRef} className="w-full h-full relative z-0">
      {map && children}
    </div>
  );
}
