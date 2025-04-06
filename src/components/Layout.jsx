// src/components/Layout.jsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar'; // Import Sidebar component
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import '../styles/Sidebar.css'; // Import CSS cho Sidebar

// Layout.jsx
const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <div className="main-content">
        <Sidebar />
        <div className="content">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
