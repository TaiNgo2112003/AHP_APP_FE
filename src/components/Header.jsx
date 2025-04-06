import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3); // Giả lập thông báo
  const navigate = useNavigate();

  const handleModeToggle = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLoginClick = () => {
    // Logic đăng nhập
    navigate("/login");
  };

  const handleLogout = () => {
    // Logic đăng xuất
    alert("Đăng xuất thành công");
    setShowUserMenu(false);
  };

  const handleNotificationClick = () => {
    // Logic thông báo
    setNotifications(0);
    navigate("/notifications");
  };

  const handleSettingsClick = () => {
    // Logic cài đặt
    navigate("/settings");
  };

  const handleHelpClick = () => {
    // Logic trợ giúp
    navigate("/help");
  };

  return (
    <header className={`header ${darkMode ? "dark" : ""}`}>
      <div className="header-left">
        <h1 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          AHP Location Decision System
        </h1>
      </div>
      <div className="header-center">
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button className="search-btn">
            <i className="search-icon">🔍</i>
          </button>
        </div>
      </div>
      <div className="header-right">
        <button onClick={handleHelpClick} className="header-btn help-btn" title="Trợ giúp">
          ❓
        </button>
        
        <button 
          onClick={handleNotificationClick} 
          className="header-btn notification-btn"
          title="Thông báo"
        >
          🔔
          {notifications > 0 && (
            <span className="notification-badge">{notifications}</span>
          )}
        </button>
        
        <button onClick={handleSettingsClick} className="header-btn settings-btn" title="Cài đặt">
          ⚙️
        </button>
        
        <button onClick={handleModeToggle} className="header-btn mode-toggle" title="Chế độ tối/sáng">
          {darkMode ? "🌞" : "🌙"}
        </button>
        
        <div className="user-menu-container">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)} 
            className="user-avatar"
            title="Tài khoản"
          >
            👤
          </button>
          
          {showUserMenu && (
            <div className="user-menu">
              <button onClick={handleLoginClick} className="user-menu-item">
                Đăng nhập
              </button>
              <button onClick={handleSettingsClick} className="user-menu-item">
                Cài đặt tài khoản
              </button>
              <button onClick={handleLogout} className="user-menu-item">
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;