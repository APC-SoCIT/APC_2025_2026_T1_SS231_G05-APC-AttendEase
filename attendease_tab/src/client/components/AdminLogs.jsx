import React from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Card,
  Input,
  Badge,
  Avatar,
  Select,
  Spinner,
} from '@fluentui/react-components';
import {
  Search24Regular,
  ArrowClockwise24Regular,
  Person24Regular,
  DocumentText24Regular,
  ArrowRight24Regular,
  Edit24Regular,
  Delete24Regular,
  Add24Regular,
  BookOpen24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import { fetchLogs, fetchLogStats } from '../../services/supabase/logService.js';
import AdminShell from './AdminShell';

/* ------------------------------------------------------------------ */
/*  Action → display helpers                                          */
/* ------------------------------------------------------------------ */
const ACTION_META = {
  USER_LOGIN:        { label: 'Login',           color: 'informative', icon: <ArrowRight24Regular /> },
  USER_CREATED:      { label: 'User Created',    color: 'success',     icon: <Add24Regular /> },
  USER_UPDATED:      { label: 'User Updated',    color: 'warning',     icon: <Edit24Regular /> },
  USER_DELETED:      { label: 'User Deleted',    color: 'danger',      icon: <Delete24Regular /> },
  COURSE_CREATED:    { label: 'Course Created',  color: 'success',     icon: <BookOpen24Regular /> },
  COURSE_UPDATED:    { label: 'Course Updated',  color: 'warning',     icon: <BookOpen24Regular /> },
  COURSE_DELETED:    { label: 'Course Deleted',  color: 'danger',      icon: <BookOpen24Regular /> },
  SECTION_CREATED:   { label: 'Section Created', color: 'success',     icon: <Add24Regular /> },
  SECTION_UPDATED:   { label: 'Section Updated', color: 'warning',     icon: <Edit24Regular /> },
  SECTION_DELETED:   { label: 'Section Deleted', color: 'danger',      icon: <Delete24Regular /> },
  PROGRAM_CREATED:   { label: 'Program Created', color: 'success',     icon: <Add24Regular /> },
  PROGRAM_UPDATED:   { label: 'Program Updated', color: 'warning',     icon: <Edit24Regular /> },
  PROGRAM_DELETED:   { label: 'Program Deleted', color: 'danger',      icon: <Delete24Regular /> },
};

const getMeta = (action) => ACTION_META[action] || { label: action, color: 'subtle', icon: <DocumentText24Regular /> };

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const performerName = (performer) => {
  if (!performer) return 'System';
  return `${performer.first_name || ''} ${performer.last_name || ''}`.trim() || performer.email || 'Unknown';
};

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const useStyles = makeStyles({
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  controls: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
  },
  filterBar: {
    display: 'flex',
    ...shorthands.gap('10px'),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('24px'),
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    ...shorthands.gap('8px'),
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#0f6cbd',
  },
  statLabel: {
    fontSize: '14px',
    color: '#616161',
    fontWeight: '600',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
  },
  logCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('14px'),
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
  },
  logInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  logDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  timestamp: {
    color: '#94a3b8',
    minWidth: '150px',
    textAlign: 'right',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
});

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;

export default function AdminLogs() {
  const styles = useStyles();

  // Data
  const [logs, setLogs] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [stats, setStats] = React.useState({ totalLogs: 0, loginsToday: 0, userChangesToday: 0 });

  // Filters
  const [searchText, setSearchText] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('');
  const [page, setPage] = React.useState(0);

  // UI
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  /* ---------- loaders ---------- */
  const loadLogs = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { success, data, count, error: fetchErr } = await fetchLogs({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      action: actionFilter,
      search: searchText,
    });
    if (success) {
      setLogs(data);
      setTotalCount(count ?? 0);
    } else {
      setError(fetchErr);
    }
    setIsLoading(false);
  }, [page, actionFilter, searchText]);

  const loadStats = async () => {
    const { success, data } = await fetchLogStats();
    if (success) setStats(data);
  };

  React.useEffect(() => { loadLogs(); }, [loadLogs]);
  React.useEffect(() => { loadStats(); }, []);

  /* ---------- handlers ---------- */
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') { setPage(0); loadLogs(); }
  };

  const handleActionChange = (_e, data) => {
    setActionFilter(data.value);
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /* ---------- render ---------- */
  return (
    <AdminShell>
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
          <Text>Error: {error}</Text>
        </div>
      )}

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <Text size={600} weight="bold">Activity Logs</Text>
          <Text size={200} style={{ color: '#64748b' }}>View audit trail of all admin and login activity.</Text>
        </div>
        <div className={styles.controls}>
          <Button icon={<ArrowClockwise24Regular />} onClick={() => { loadLogs(); loadStats(); }} disabled={isLoading}>
            Refresh
          </Button>
          <Input
            contentBefore={<Search24Regular />}
            placeholder="Search logs..."
            value={searchText}
            onChange={(_e, d) => setSearchText(d.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <DocumentText24Regular style={{ color: '#0f6cbd', width: 32, height: 32 }} />
          <Text className={styles.statValue}>{stats.totalLogs}</Text>
          <Text className={styles.statLabel}>Total Logs</Text>
        </Card>
        <Card className={styles.statCard}>
          <ArrowRight24Regular style={{ color: '#107c10', width: 32, height: 32 }} />
          <Text className={styles.statValue}>{stats.loginsToday}</Text>
          <Text className={styles.statLabel}>Logins Today</Text>
        </Card>
        <Card className={styles.statCard}>
          <Person24Regular style={{ color: '#d13438', width: 32, height: 32 }} />
          <Text className={styles.statValue}>{stats.userChangesToday}</Text>
          <Text className={styles.statLabel}>User Changes Today</Text>
        </Card>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <Select value={actionFilter} onChange={handleActionChange} style={{ minWidth: '180px' }}>
          <option value="">All Actions</option>
          {Object.entries(ACTION_META).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>

      {/* Loading spinner */}
      {isLoading && <Spinner label="Loading logs..." />}

      {/* Log list */}
      <div className={styles.logList}>
        {!isLoading && logs.length === 0 && (
          <Card className={styles.logCard}>
            <Text>No logs found.</Text>
          </Card>
        )}

        {logs.map((log) => {
          const meta = getMeta(log.action);
          const name = performerName(log.performer);
          return (
            <Card key={log.id} className={styles.logCard}>
              <div className={styles.logInfo}>
                <Avatar name={name} icon={meta.icon} size={32} color="colorful" />
                <div className={styles.logDetails}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge appearance="tint" color={meta.color}>{meta.label}</Badge>
                    <Text weight="semibold">{log.description}</Text>
                  </div>
                  <Text size={200}>By: {name}{log.performer?.role ? ` (${log.performer.role})` : ''}</Text>
                </div>
              </div>
              <Text size={200} className={styles.timestamp}>{formatDate(log.created_at)}</Text>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            icon={<ChevronLeft24Regular />}
            disabled={page === 0 || isLoading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          />
          <Text>Page {page + 1} of {totalPages}</Text>
          <Button
            icon={<ChevronRight24Regular />}
            disabled={page >= totalPages - 1 || isLoading}
            onClick={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </AdminShell>
  );
}
