import React from "react";

const InfoPanel = ({ location, details }) => {
  if (!location) return <p>Chọn vị trí trên bản đồ để xem thông tin.</p>;
  
  return (
    <div className="info-panel">
      <h3>Thông tin địa điểm</h3>
      <p><strong>Vĩ độ:</strong> {location.lat}</p>
      <p><strong>Kinh độ:</strong> {location.lng}</p>
      {details && (
        <>
          <p><strong>Mật độ dân số:</strong> {details.population_density} người/km²</p>
          <p><strong>Số lượng cửa hàng cạnh tranh:</strong> {details.competitors}</p>
          <p><strong>Chi phí thuê:</strong> {details.rent_cost} VNĐ/m²</p>
          <p><strong>Khả năng tiếp cận:</strong> {details.accessibility}</p>
          <p><strong>Tính pháp lý:</strong> {details.legal_status}</p>
        </>
      )}
    </div>
  );
};

export default InfoPanel;