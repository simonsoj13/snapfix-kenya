import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Worker } from "@shared/schema";

// Fix for default marker icons in leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface WorkerMapViewProps {
  workers: Worker[];
  center?: [number, number];
  zoom?: number;
  onWorkerClick?: (worker: Worker) => void;
}

export default function WorkerMapView({
  workers,
  center = [40.7128, -74.006], // New York City default
  zoom = 12,
  onWorkerClick,
}: WorkerMapViewProps) {
  // Generate random coordinates near the center for demo purposes
  const getWorkerPosition = (index: number): [number, number] => {
    const lat = center[0] + (Math.random() - 0.5) * 0.1;
    const lng = center[1] + (Math.random() - 0.5) * 0.1;
    return [lat, lng];
  };

  return (
    <div className="w-full h-full min-h-[400px] rounded-md overflow-hidden" data-testid="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {workers.map((worker, index) => (
          <Marker
            key={worker.id}
            position={getWorkerPosition(index)}
            eventHandlers={{
              click: () => onWorkerClick?.(worker),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={worker.profileImage} alt={worker.name} />
                    <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">{worker.name}</h3>
                    <p className="text-xs text-muted-foreground">{worker.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-medium">{worker.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({worker.reviewCount})
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">${worker.hourlyRate}/hr</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {worker.distance.toFixed(1)} mi
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => onWorkerClick?.(worker)}
                >
                  View Profile
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
