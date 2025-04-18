import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, GeoJSON, FeatureGroup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// Khởi tạo icon marker do vấn đề với Leaflet và React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapComponent = ({ onSelectLocation, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition || [10.7769, 106.7009]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [populationData, setPopulationData] = useState(null);
  const [landUseData, setLandUseData] = useState(null);
  const [transportData, setTransportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapLayers, setMapLayers] = useState({
    population: true,
    transport: false,
    landUse: false
  });

  // Hàm giả lập lấy dữ liệu từ API
  const fetchLocationData = async (latlng) => {
    setLoading(true);
    setError(null);
    
    try {
      // Giả lập API calls - trong thực tế bạn sẽ gọi các API thật
      const responses = await Promise.all([
        mockApiCall(latlng, 'population'),
        mockApiCall(latlng, 'transport'),
        mockApiCall(latlng, 'landUse')
      ]);
      
      setPopulationData(responses[0]);
      setTransportData(responses[1]);
      setLandUseData(responses[2]);
      
      // Giả lập dữ liệu GeoJSON cho các lớp bản đồ
      if (mapLayers.population) {
        setPopulationData(generateMockGeoJSON(latlng, 'population'));
      }
      if (mapLayers.transport) {
        setTransportData(generateMockGeoJSON(latlng, 'transport'));
      }
      if (mapLayers.landUse) {
        setLandUseData(generateMockGeoJSON(latlng, 'landUse'));
      }
      
    } catch (err) {
      setError("Không thể tải dữ liệu vị trí. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm giả lập API
  const mockApiCall = (latlng, dataType) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = {
          coordinates: latlng,
          timestamp: new Date().toISOString()
        };
        
        switch(dataType) {
          case 'population':
            mockData.density = Math.floor(Math.random() * 50000) + 1000;
            mockData.ageDistribution = {
              '0-18': Math.floor(Math.random() * 30) + 10,
              '19-35': Math.floor(Math.random() * 40) + 20,
              '36-60': Math.floor(Math.random() * 40) + 20,
              '60+': Math.floor(Math.random() * 20) + 5
            };
            break;
          case 'transport':
            mockData.stations = Math.floor(Math.random() * 10) + 1;
            mockData.roads = Math.floor(Math.random() * 5) + 1;
            break;
          case 'landUse':
            mockData.types = {
              residential: Math.floor(Math.random() * 70) + 10,
              commercial: Math.floor(Math.random() * 50) + 5,
              industrial: Math.floor(Math.random() * 30) + 5,
              green: Math.floor(Math.random() * 40) + 10
            };
            break;
        }
        
        resolve(mockData);
      }, 800);
    });
  };

  // Tạo dữ liệu GeoJSON giả lập
  const generateMockGeoJSON = (center, layerType) => {
    const features = [];
    const numFeatures = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numFeatures; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.02;
      const offsetLng = (Math.random() - 0.5) * 0.02;
      
      let properties = {};
      let geometry = {};
      
      switch(layerType) {
        case 'population':
          properties = {
            density: Math.floor(Math.random() * 50000) + 1000,
            name: `Khu vực ${i+1}`
          };
          geometry = {
            type: "Point",
            coordinates: [center.lng + offsetLng, center.lat + offsetLat]
          };
          break;
        case 'transport':
          properties = {
            type: Math.random() > 0.5 ? "Trạm xe buýt" : "Tuyến đường",
            name: `Giao thông ${i+1}`
          };
          geometry = {
            type: Math.random() > 0.5 ? "Point" : "LineString",
            coordinates: Math.random() > 0.5 
              ? [center.lng + offsetLng, center.lat + offsetLat]
              : [
                  [center.lng + offsetLng, center.lat + offsetLat],
                  [center.lng + offsetLng * 1.2, center.lat + offsetLat * 1.2]
                ]
          };
          break;
        case 'landUse':
          properties = {
            type: ["Khu dân cư", "Thương mại", "Công nghiệp", "Cây xanh"][Math.floor(Math.random() * 4)],
            area: Math.floor(Math.random() * 50000) + 5000
          };
          geometry = {
            type: "Polygon",
            coordinates: [[
              [center.lng + offsetLng, center.lat + offsetLat],
              [center.lng + offsetLng + 0.01, center.lat + offsetLat],
              [center.lng + offsetLng + 0.01, center.lat + offsetLat + 0.01],
              [center.lng + offsetLng, center.lat + offsetLat + 0.01],
              [center.lng + offsetLng, center.lat + offsetLat]
            ]]
          };
          break;
      }
      
      features.push({
        type: "Feature",
        properties,
        geometry
      });
    }
    
    return {
      type: "FeatureCollection",
      features
    };
  };

  // Xử lý khi người dùng click vào bản đồ
  const handleMapClick = (e) => {
    const clickedLocation = e.latlng;
    setSelectedLocation(clickedLocation);
    
    // Kiểm tra trước khi gọi
    if (typeof onSelectLocation === 'function') {
      onSelectLocation(clickedLocation);
    } else {
      console.warn("onSelectLocation không phải là hàm");
    }
    
    fetchLocationData(clickedLocation);
  };

  // Xử lý thay đổi lớp bản đồ
  const toggleLayer = (layer) => {
    setMapLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
    
    if (!selectedLocation) return;
    
    // Tải lại dữ liệu khi bật lớp
    if (!mapLayers[layer]) {
      fetchLocationData(selectedLocation);
    }
  };

  // Style cho GeoJSON
  const getLayerStyle = (feature) => {
    switch(feature.properties.type) {
      case 'Khu dân cư':
        return { color: '#ff7800', weight: 1, opacity: 1, fillOpacity: 0.7 };
      case 'Thương mại':
        return { color: '#00ff78', weight: 1, opacity: 1, fillOpacity: 0.7 };
      case 'Công nghiệp':
        return { color: '#7800ff', weight: 1, opacity: 1, fillOpacity: 0.7 };
      case 'Cây xanh':
        return { color: '#007800', weight: 1, opacity: 1, fillOpacity: 0.7 };
      case 'Trạm xe buýt':
        return { color: '#0000ff', radius: 8 };
      case 'Tuyến đường':
        return { color: '#ff0000', weight: 3 };
      default:
        if (feature.properties.density) {
          const density = feature.properties.density;
          const intensity = Math.min(1, density / 50000);
          return {
            radius: 6,
            fillColor: `rgb(${Math.floor(255 * intensity)}, 0, 0)`,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          };
        }
        return { color: '#3388ff', weight: 1 };
    }
  };

  // Render popup cho GeoJSON features
  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      let popupContent = `<div><strong>${feature.properties.name || feature.properties.type}</strong>`;
      
      if (feature.properties.density) {
        popupContent += `<br/>Mật độ dân số: ${feature.properties.density.toLocaleString()} người/km²`;
      }
      if (feature.properties.area) {
        popupContent += `<br/>Diện tích: ${feature.properties.area.toLocaleString()} m²`;
      }
      
      popupContent += `</div>`;
      layer.bindPopup(popupContent);
    }
  };


  // Component xử lý sự kiện click bản đồ
  const MapClickHandler = () => {
    useMapEvents({
      click: handleMapClick
    });
    return null;
  };

  return (
    <div className="gis-map-container" style={{ position: 'relative' }}>
      {/* Panel điều khiển */}
      <div className="map-controls" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Lớp bản đồ</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>
            <input 
              type="checkbox" 
              checked={mapLayers.population} 
              onChange={() => toggleLayer('population')} 
            /> Mật độ dân cư
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={mapLayers.transport} 
              onChange={() => toggleLayer('transport')} 
            /> Giao thông
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={mapLayers.landUse} 
              onChange={() => toggleLayer('landUse')} 
            /> Sử dụng đất
          </label>
        </div>
      </div>
      
      {/* Thông tin vị trí */}
      {selectedLocation && (
        <div className="location-info" style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          maxWidth: '300px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h4 style={{ marginTop: 0 }}>Thông tin vị trí</h4>
          <p><strong>Vĩ độ:</strong> {selectedLocation.lat.toFixed(4)}</p>
          <p><strong>Kinh độ:</strong> {selectedLocation.lng.toFixed(4)}</p>
          
          {loading && <p>Đang tải dữ liệu...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {populationData && !loading && (
            <div>
              <h5>Dân cư</h5>
              <p>Mật độ: {populationData.density.toLocaleString()} người/km²</p>
              <div>
                <p>Phân bố tuổi:</p>
                <ul style={{ marginTop: 0 }}>
                  {Object.entries(populationData.ageDistribution).map(([range, percent]) => (
                    <li key={range}>{range}: {percent}%</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {transportData && !loading && mapLayers.transport && (
            <div>
              <h5>Giao thông</h5>
              <p>Số trạm: {transportData.stations}</p>
              <p>Số tuyến đường: {transportData.roads}</p>
            </div>
          )}
          
          {landUseData && !loading && mapLayers.landUse && (
            <div>
              <h5>Sử dụng đất</h5>
              <div>
                {Object.entries(landUseData.types).map(([type, percent]) => (
                  <p key={type}>
                    {type === 'residential' ? 'Dân cư' : 
                     type === 'commercial' ? 'Thương mại' : 
                     type === 'industrial' ? 'Công nghiệp' : 'Cây xanh'}: {percent}%
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Bản đồ chính */}
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: "600px", width: "100%", borderRadius: '8px' }}
        zoomControl={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Bản đồ tiêu chuẩn">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Bản đồ vệ tinh">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* Các lớp dữ liệu */}
        {mapLayers.population && populationData && (
          <GeoJSON 
            data={populationData} 
            pointToLayer={(feature, latlng) => L.circleMarker(latlng, getLayerStyle(feature))}
            style={getLayerStyle}
            onEachFeature={onEachFeature}
          />
        )}
        
        {mapLayers.transport && transportData && (
          <GeoJSON 
            data={transportData} 
            pointToLayer={(feature, latlng) => {
              return feature.geometry.type === 'Point' 
                ? L.circleMarker(latlng, getLayerStyle(feature))
                : L.polyline(feature.geometry.coordinates, getLayerStyle(feature));
            }}
            style={getLayerStyle}
            onEachFeature={onEachFeature}
          />
        )}
        
        {mapLayers.landUse && landUseData && (
          <GeoJSON 
            data={landUseData} 
            style={getLayerStyle}
            onEachFeature={onEachFeature}
          />
        )}
        
        {/* Marker vị trí được chọn */}
        {selectedLocation && (
          <FeatureGroup>
            <Marker position={selectedLocation}>
              <Popup>
                <div>
                  <h4 style={{ marginTop: 0 }}>Vị trí đã chọn</h4>
                  <p>Vĩ độ: {selectedLocation.lat.toFixed(4)}</p>
                  <p>Kinh độ: {selectedLocation.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          </FeatureGroup>
        )}
        
        <MapClickHandler />
      </MapContainer>
    </div>
  );
};

export default MapComponent;