import React, { useState } from 'react';
import {
  makeStyles,
  shorthands,
  Card,
  Text,
} from '@fluentui/react-components';
import {
  People24Regular,
  BookOpen24Regular,
  ClipboardTaskListLtr24Regular,
  DocumentBulletList24Regular,
  Settings24Regular,
  Dismiss24Regular,
  Grid24Regular,
  ArrowRight24Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { setAdminSession } from '../utils/auth';

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

  /* ---- Top bar (matches Student Portal) ---- */
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '@media (max-width: 768px)': {
      fontSize: '24px',
    },
  },
  logoHighlight: {
    color: '#FFB900',
  },
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
    '&:hover': {
      backgroundColor: '#f3f2f1',
      borderRadius: '4px',
    },
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
    '@media (max-width: 768px)': {
      width: '260px',
    },
  },
  menuHeader: {
    ...shorthands.padding('20px'),
    ...shorthands.borderBottom('1px', 'solid', '#e1e4e8'),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#244670',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
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
    '&:hover': {
      backgroundColor: '#f3f2f1',
    },
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '&:hover': {
      backgroundColor: '#f3f2f1',
    },
  },
  menuItemActive: {
    backgroundColor: '#e8f4f8',
    color: '#244670',
    fontWeight: '600',
  },
  menuDivider: {
    ...shorthands.margin('10px', '0'),
    borderTop: '1px solid #e1e4e8',
  },

  /* ---- Content area ---- */
  contentArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('40px', '20px'),
    flex: 1,
    '@media (max-width: 768px)': {
      ...shorthands.padding('24px', '15px'),
    },
  },
  welcomeSection: {
    textAlign: 'center',
    marginBottom: '36px',
    maxWidth: '700px',
  },
  welcomeTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '8px',
    lineHeight: '1.2',
    '@media (max-width: 768px)': {
      fontSize: '28px',
    },
  },
  welcomeSubtitle: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: '1.5',
  },

  /* ---- Card grid ---- */
  grid: {
    maxWidth: '1060px',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('20px'),
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },

  /* ---- Individual card ---- */
  card: {
    ...shorthands.padding('0'),
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
    },
  },
  cardAccent: {
    height: '4px',
    width: '100%',
  },
  cardBody: {
    ...shorthands.padding('24px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardArrow: {
    color: '#94a3b8',
    transitionProperty: 'transform, color',
    transitionDuration: '200ms',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#1e293b',
  },
  cardDescription: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
  },
});

/* ------------------------------------------------------------------ */
/*  Admin navigation data                                             */
/* ------------------------------------------------------------------ */
const adminActions = [
  {
    title: 'Manage Users',
    description: 'Administer students, professors, and admin accounts with role-based access.',
    icon: <People24Regular />,
    path: '/admin/users',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    title: 'Manage Courses',
    description: 'View and manage course offerings, codes, and unit assignments.',
    icon: <BookOpen24Regular />,
    path: '/admin/courses',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    title: 'Manage Sections',
    description: 'Organize and configure block sections for student groupings.',
    icon: <Grid24Regular />,
    path: '/admin/sections',
    color: '#06b6d4',
    bg: '#ecfeff',
  },
  {
    title: 'Manage Programs',
    description: 'Add, edit, and remove academic degree programs.',
    icon: <BookOpen24Regular />,
    path: '/admin/programs',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    title: 'Activity Logs',
    description: 'Review audit trail of logins, user changes, and system activity.',
    icon: <ClipboardTaskListLtr24Regular />,
    path: '/admin/logs',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    title: 'View Reports',
    description: 'Access attendance analytics, summaries, and export history.',
    icon: <DocumentBulletList24Regular />,
    path: '/admin/reports',
    color: '#ef4444',
    bg: '#fef2f2',
  },
  {
    title: 'System Settings',
    description: 'Configure integration settings and environment toggles.',
    icon: <Settings24Regular />,
    path: '/admin/settings',
    color: '#6366f1',
    bg: '#eef2ff',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
function AdminPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setAdminSession(false);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
  };

  /* ---- Render helpers ---- */
  const renderTopBar = () => (
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
  );

  const renderMenu = () => {
    if (!isMenuOpen) return null;
    return (
      <>
        <div className={styles.menuBackdrop} onClick={() => setIsMenuOpen(false)} />
        <div className={styles.menuPanel}>
          <div className={styles.menuHeader}>
            <Text className={styles.menuTitle}>Menu</Text>
            <button className={styles.closeButton} onClick={() => setIsMenuOpen(false)} aria-label="Close">
              <Dismiss24Regular />
            </button>
          </div>
          <div className={styles.menuItems}>
            {adminActions.map((action) => (
              <button
                key={action.title}
                className={styles.menuItem}
                onClick={() => { setIsMenuOpen(false); navigate(action.path); }}
              >
                {action.title}
              </button>
            ))}
            <div className={styles.menuDivider} />
            <button className={styles.menuItem} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderCards = () => (
    <div className={styles.grid}>
      {adminActions.map((action) => (
        <Card
          key={action.title}
          className={styles.card}
          onClick={() => navigate(action.path)}
        >
          <div className={styles.cardAccent} style={{ backgroundColor: action.color }} />
          <div className={styles.cardBody}>
            <div className={styles.cardTop}>
              <div className={styles.iconWrapper} style={{ backgroundColor: action.bg }}>
                {React.cloneElement(action.icon, { style: { color: action.color, width: 24, height: 24 } })}
              </div>
              <ArrowRight24Regular className={styles.cardArrow} />
            </div>
            <Text className={styles.cardTitle}>{action.title}</Text>
            <Text className={styles.cardDescription}>{action.description}</Text>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      {renderTopBar()}
      {renderMenu()}

      <div className={styles.contentArea}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Admin Dashboard</h1>
          <Text className={styles.welcomeSubtitle}>
            Manage users, courses, sections, programs, and monitor system activity.
          </Text>
        </div>

        {renderCards()}
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

export default AdminPage;
