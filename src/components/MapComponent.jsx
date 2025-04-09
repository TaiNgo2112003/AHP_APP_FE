import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ onSelectLocation }) => {
  const [position, setPosition] = useState(null);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setPosition(e.latlng);
        onSelectLocation(e.latlng);
      },
    });
    return null;
  };

  return (
    <MapContainer center={[10.7769, 106.7009]} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {position && <Marker position={position}><Popup>Vị trí đã chọn</Popup></Marker>}
      <MapClickHandler />
    </MapContainer>
  );
};

export default MapComponent;