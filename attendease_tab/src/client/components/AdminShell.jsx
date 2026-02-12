import React, { useState } from 'react';
import {
  makeStyles,
  shorthands,
  Text,
} from '@fluentui/react-components';
import {
  People24Regular,
  BookOpen24Regular,
  Grid24Regular,
  ClipboardTaskListLtr24Regular,
  DocumentBulletList24Regular,
  Settings24Regular,
  Dismiss24Regular,
  ArrowLeft24Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { setAdminSession } from '../utils/auth';

/* ------------------------------------------------------------------ */
/*  Sidebar navigation items                                          */
/* ------------------------------------------------------------------ */
const NAV_ITEMS = [
  { title: 'Dashboard', icon: <Grid24Regular />, path: '/admin', color: '#6366f1' },
  { title: 'Manage Users', icon: <People24Regular />, path: '/admin/users', color: '#3b82f6' },
  { title: 'Manage Courses', icon: <BookOpen24Regular />, path: '/admin/courses', color: '#8b5cf6' },
  { title: 'Manage Sections', icon: <Grid24Regular />, path: '/admin/sections', color: '#06b6d4' },
  { title: 'Manage Programs', icon: <BookOpen24Regular />, path: '/admin/programs', color: '#10b981' },
  { title: 'Activity Logs', icon: <ClipboardTaskListLtr24Regular />, path: '/admin/logs', color: '#f59e0b' },
  { title: 'View Reports', icon: <DocumentBulletList24Regular />, path: '/admin/reports', color: '#ef4444' },
  { title: 'System Settings', icon: <Settings24Regular />, path: '/admin/settings', color: '#6366f1' },
];

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  /* Layout shell */
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(135deg, #294972 35%, #ffba08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },

  /* ---- Top bar ---- */
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    ...shorthands.padding('15px', '30px'),
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    '@media (max-width: 768px)': {
      ...shorthands.padding('12px', '20px'),
    },
  },
  logo: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#244670',
    cursor: 'default',
    '@media (max-width: 768px)': { fontSize: '24px' },
  },
  logoHighlight: { color: '#FFB900' },
  hamburgerButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    fontSize: '24px',
    color: '#244670',
    '&:hover': { backgroundColor: '#f3f2f1', borderRadius: '4px' },
  },

  /* ---- Slide-in sidebar overlay ---- */
  menuBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
    animation: 'fadeIn 300ms ease-in-out',
  },
  menuPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '280px',
    backgroundColor: '#ffffff',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 300ms ease-in-out',
    '@media (max-width: 768px)': { width: '260px' },
  },
  menuHeader: {
    ...shorthands.padding('20px'),
    ...shorthands.borderBottom('1px', 'solid', '#e1e4e8'),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuTitle: { fontSize: '18px', fontWeight: '600', color: '#244670' },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    borderRadius: '4px',
    '&:hover': { backgroundColor: '#f3f2f1' },
  },
  menuItems: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('10px'),
    flex: 1,
    overflowY: 'auto',
  },
  menuItem: {
    ...shorthands.padding('14px', '16px'),
    cursor: 'pointer',
    fontSize: '15px',
    color: '#323130',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    borderRadius: '4px',
    textAlign: 'left',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    '&:hover': { backgroundColor: '#f3f2f1' },
  },
  menuDivider: {
    ...shorthands.margin('10px', '0'),
    borderTop: '1px solid #e1e4e8',
  },

  /* ---- Content area ---- */
  contentArea: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('40px', '20px'),
    flex: 1,
    '@media (max-width: 768px)': {
      ...shorthands.padding('24px', '15px'),
    },
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    ...shorthands.padding('32px'),
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
    '@media (max-width: 768px)': {
      ...shorthands.padding('20px'),
    },
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    ...shorthands.padding('8px', '14px'),
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      color: '#334155',
    },
    transitionProperty: 'background-color, color',
    transitionDuration: '150ms',
  },
});

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function AdminShell({ children, showBack = true }) {
  const styles = useStyles();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setAdminSession(false);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.logo}>
          Attend<span className={styles.logoHighlight}>Ease</span>
        </div>
        <button
          className={styles.hamburgerButton}
          onClick={() => setIsMenuOpen(true)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>

      {/* Sidebar */}
      {isMenuOpen && (
        <>
          <div className={styles.menuBackdrop} onClick={() => setIsMenuOpen(false)} />
          <div className={styles.menuPanel}>
            <div className={styles.menuHeader}>
              <Text className={styles.menuTitle}>Admin Menu</Text>
              <button className={styles.closeButton} onClick={() => setIsMenuOpen(false)} aria-label="Close">
                <Dismiss24Regular />
              </button>
            </div>
            <div className={styles.menuItems}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.title}
                  className={styles.menuItem}
                  onClick={() => { setIsMenuOpen(false); navigate(item.path); }}
                >
                  {React.cloneElement(item.icon, { style: { color: item.color, flexShrink: 0 } })}
                  {item.title}
                </button>
              ))}
              <div className={styles.menuDivider} />
              <button className={styles.menuItem} onClick={handleLogout} style={{ color: '#dc2626' }}>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Content Area */}
      <div className={styles.contentArea}>
        <div className={styles.contentCard}>
          {showBack && (
            <button
              className={styles.backLink}
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft24Regular style={{ width: 18, height: 18 }} />
              Back to Dashboard
            </button>
          )}
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
