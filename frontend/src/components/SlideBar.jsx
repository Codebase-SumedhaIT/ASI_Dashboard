import React from 'react';
import './SlideBar.css';

// Professional SVG Icons
const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  logs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
  ),
  qms: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4"></path>
      <path d="M21 12c-1 0-2.938-.5-4-1.547A12.566 12.566 0 0 1 12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c3.866 0 7.366-2.432 8.864-5.824"></path>
      <path d="M16 8h.01"></path>
    </svg>
  ),
  admin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  projectManagement: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16,17 21,12 16,7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
};

const navItems = [
  { id: 'project-management', label: 'Project Management', icon: Icons.projectManagement },
  { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
  { id: 'qms', label: 'QMS', icon: Icons.qms },
  { id: 'logs', label: 'Logs', icon: Icons.logs },
  { id: 'admin', label: 'Admin Panel', icon: Icons.admin }
];

const SlideBar = ({ activeView, onViewChange, user, open, setOpen, onLogout, onProfileClick }) => {
  // Only show admin/project-management for admin, and hide logs for Customer
  const filteredNav = navItems.filter(item => {
    if ((item.id === 'admin' || item.id === 'project-management') && user?.role_name !== 'Admin') return false;
    if (item.id === 'logs' && user?.role_name === 'Customer') return false;
    return true;
  });

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`sidebar-left${open ? ' open' : ' collapsed'}`}>  
      <div className="sidebar-toggle" onClick={() => setOpen(!open)}>
        {open ? Icons.close : Icons.menu}
      </div>
      
      {/* User Profile Section - Clickable */}
      {user && (
        <div className="sidebar-user-profile clickable" onClick={onProfileClick}>
          <div className="sidebar-user-avatar">
            {user?.profile_picture ? (
              <img 
                src={`http://localhost:5000${user.profile_picture}`} 
                alt="Profile" 
                className="sidebar-profile-picture"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="sidebar-profile-initials" style={{ display: user?.profile_picture ? 'none' : 'flex' }}>
              {getUserInitials(user.name)}
            </div>
          </div>
          {open && (
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role_name}</div>
            </div>
          )}
        </div>
      )}
      
      <div className="sidebar-nav">
        {filteredNav.map(item => (
          <button
            key={item.id}
            className={`sidebar-nav-btn${activeView === item.id ? ' active' : ''}`}
            onClick={() => onViewChange(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            {open && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
        
        {/* Logout Button */}
        <div className="sidebar-logout-section">
          <button
            className="sidebar-nav-btn logout-btn"
            onClick={onLogout}
            title="Logout"
          >
            <span className="nav-icon">{Icons.logout}</span>
            {open && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideBar; 