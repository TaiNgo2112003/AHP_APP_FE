import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(250);
  const sidebarRef = useRef(null);
  const isResized = useRef(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add('with-sidebar');
        mainContent.classList.remove('without-sidebar');
      } else {
        mainContent.classList.add('without-sidebar');
        mainContent.classList.remove('with-sidebar');
      }
    }
  }, [isOpen]);

  // Xử lý resize
  useEffect(() => {
    const sidebar = sidebarRef.current;

    const handleMouseDown = (e) => {
      if (e.target.classList.contains('resize-handle')) {
        isResized.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseMove = (e) => {
      if (!isResized.current) return;

      const newWidth = e.clientX;
      if (newWidth < 200) return; // Giới hạn chiều rộng tối thiểu
      if (newWidth > 400) return; // Giới hạn chiều rộng tối đa

      setWidth(newWidth);
      document.querySelector('.main-content').style.paddingLeft = `${newWidth}px`;
    };

    const handleMouseUp = () => {
      isResized.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    sidebar.addEventListener('mousedown', handleMouseDown);

    return () => {
      sidebar.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      ref={sidebarRef}
      style={{ width: isOpen ? `${width}px` : '50px' }}
    >
      <button
        onClick={toggleSidebar}
        className="external-toggle-btn"
        style={{ left: isOpen ? `${width}px` : '0' }}
      >
        {isOpen ? '◄' : '►'}
      </button>
      {isOpen && <div className="resize-handle" />}
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link to="/">
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/tools">
              <span>Tools</span>
            </Link>
          </li>
          <li>
            <Link to="/chat-ai">
              <span>Chat AI</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;