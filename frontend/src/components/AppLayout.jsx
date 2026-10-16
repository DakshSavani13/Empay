import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NavConfig, PageTitles } from '../config/navigation';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const navItems = NavConfig[user?.role] || NavConfig.employee;
  const currentRoute = pathSegments[1] || navItems[0]?.id || 'dashboard';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const headerDate = new Date().toLocaleDateString('en-US', dateOpts);
  const pageTitle = PageTitles[currentRoute] || 'EmPay';

  const handleNavigate = (route) => {
    navigate(`/app/${route}`);
    setMobileOpen(false);
  };

  return (
    <div id="app" className="app-container">
      <div className="app-layout" style={{ width: '100%', height: '100%', display: 'flex' }}>
        {/* Sidebar */}
        <aside
          className={`sidebar glass-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
          id="sidebar"
        >
          <div className="sidebar-header">
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="sidebar-ep-logo">
                <span>EP</span>
              </div>
              <span className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                EmPay
              </span>
            </div>
          </div>
          <div className="sidebar-menu" id="sidebarNav">
            {navItems.map(item => (
              <div
                key={item.id}
                className={`nav-item ${currentRoute === item.id ? 'active' : ''}`}
                onClick={() => handleNavigate(item.id)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Topbar */}
          <header className="topbar glass-topbar" id="topbar">
            <div className="topbar-left">
              <button
                id="sidebarToggle"
                className="menu-toggle glass-btn"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <i className="fas fa-bars"></i>
              </button>
              <button
                id="mobileMenuBtn"
                className="menu-toggle glass-btn mobile-only"
                style={{ display: 'none' }}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <i className="fas fa-bars"></i>
              </button>
              <div className="page-title">{pageTitle}</div>
              <div
                className="header-date"
                style={{
                  marginLeft: '1rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fas fa-calendar-day"></i>
                <span>{headerDate}</span>
              </div>
            </div>

            <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                className="user-profile glass-pill"
                onClick={() => handleNavigate('profile')}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.35rem 0.35rem 0.35rem 1rem'
                }}
              >
                <div className="user-info" style={{ textAlign: 'right', lineHeight: 1.3 }}>
                  <div
                    className="name"
                    style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.name || 'Loading...'}
                  </div>
                  <div
                    className="role"
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.role?.replace('_', ' ') || '--'}
                  </div>
                </div>
                <div
                  className="user-avatar gradient-avatar"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: 'white',
                    flexShrink: 0
                  }}
                >
                  {initials}
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-icon glass-btn"
                style={{
                  color: 'var(--danger-color)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  flexShrink: 0
                }}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </header>

          {/* Dynamic Content Area */}
          <div className="content-area" id="contentArea">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
