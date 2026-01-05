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
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  DialogContent,
  Label
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Search24Regular,
  CheckmarkCircle24Regular,
  Timer24Regular,
  Person24Regular,
  Add24Regular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    ...shorthands.padding('40px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  controls: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center'
  },
  filterBar: {
    display: 'flex',
    ...shorthands.gap('10px'),
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('20px'),
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('24px'),
    backgroundColor: 'white',
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
    fontWeight: '600'
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
    ...shorthands.padding('12px'),
    backgroundColor: 'white',
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
    color: '#666',
    minWidth: '150px',
    textAlign: 'right'
  }
});

const MOCK_LOGS = [
  { id: 1, issue: 'Camera Feed Latency', professor: 'Christian Luis Esguerra', resolvedTime: '2023-10-27 09:30:00', downtime: '2m', status: 'Resolved' },
  { id: 2, issue: 'Login Timeout', professor: 'Jane Doe', resolvedTime: '2023-10-26 14:45:00', downtime: '5m', status: 'Resolved' },
  { id: 3, issue: 'Facial Recognition Service Restart', professor: 'System', resolvedTime: '2023-10-26 10:15:00', downtime: '15s', status: 'Resolved' },
  { id: 4, issue: 'Database Connection Retry', professor: 'John Smith', resolvedTime: '2023-10-25 11:30:00', downtime: '1m', status: 'Resolved' },
  { id: 5, issue: 'API Gateway 502', professor: 'System', resolvedTime: '2023-10-25 08:00:00', downtime: '45s', status: 'Resolved' },
  { id: 6, issue: 'Slow Dashboard Load', professor: 'Moises Sy', resolvedTime: '-', downtime: 'Ongoing', status: 'Unresolved' },
  { id: 7, issue: 'Export CSV Failure', professor: 'Suzanne Marie Rosco', resolvedTime: '-', downtime: 'Ongoing', status: 'Unresolved' },
];

export default function AdminLogs() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [searchText, setSearchText] = React.useState('');
  const [logs, setLogs] = React.useState(MOCK_LOGS);
  const [viewMode, setViewMode] = React.useState('unresolved');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newLog, setNewLog] = React.useState({
    issue: '',
    professor: '',
    downtime: '',
    status: 'Resolved'
  });

  const handleAddLog = () => {
    const id = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
    const resolvedTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logToAdd = { ...newLog, id, resolvedTime };
    setLogs([logToAdd, ...logs]);
    setIsAddDialogOpen(false);
    setNewLog({ issue: '', professor: '', downtime: '', status: 'Resolved' });
  };

  const handleResolveLog = (id) => {
    const resolvedTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setLogs(logs.map(log => 
      log.id === id 
        ? { ...log, status: 'Resolved', resolvedTime, downtime: 'Recovered' } 
        : log
    ));
  };

  // Calculate dynamic stats
  const totalErrors = logs.filter(l => l.status === 'Resolved').length;
  
  const uptime = React.useMemo(() => {
    // Equation: (Total Time Since Deployment - Total Downtime) / Total Time Since Deployment * 100
    // const deploymentDate = new Date('2023-01-01').getTime();
    // const totalTime = Date.now() - deploymentDate;
    // const totalDowntime = logs.reduce((acc, log) => acc + parseDowntime(log.downtime), 0);
    // return ((totalTime - totalDowntime) / totalTime * 100).toFixed(2) + '%';
    return "N/A (Not Deployed)";
  }, [logs]);

  const activeSessions = React.useMemo(() => {
    // Equation: Count of unique users with active sessions (last activity < 5 mins)
    // const activeCount = sessions.filter(s => (Date.now() - s.lastActivity) < 300000).length;
    // return activeCount;
    return "N/A (Not Deployed)";
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.topBar}>
          <Button icon={<ArrowLeft24Regular />} onClick={() => navigate('/admin')}>
            Back to Admin
          </Button>
          <div className={styles.controls}>
            <Button icon={<Add24Regular />} appearance="primary" onClick={() => setIsAddDialogOpen(true)}>
              Create Log
            </Button>
            <Input 
              contentBefore={<Search24Regular />} 
              placeholder="Search resolved errors..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
        <Text size={600} weight="bold">System Logs</Text>
        <Text>Review attendance logs and system activity.</Text>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <Timer24Regular style={{ color: '#0f6cbd', width: 32, height: 32 }} />
          <Text className={styles.statValue}>{uptime}</Text>
          <Text className={styles.statLabel}>Total Uptime</Text>
        </Card>
        <Card className={styles.statCard}>
          <CheckmarkCircle24Regular style={{ color: '#107c10', width: 32, height: 32 }} />
          <Text className={styles.statValue}>{totalErrors}</Text>
          <Text className={styles.statLabel}>Errors Resolved</Text>
        </Card>
        <Card className={styles.statCard}>
          <Person24Regular style={{ color: '#d13438', width: 32, height: 32 }} />
          <Text className={styles.statValue}>{activeSessions}</Text>
          <Text className={styles.statLabel}>Active Sessions</Text>
        </Card>
      </div>

      <div className={styles.filterBar}>
        <Button appearance={viewMode === 'unresolved' ? 'primary' : 'subtle'} onClick={() => setViewMode('unresolved')}>
          Errors List
        </Button>
        <Button appearance={viewMode === 'resolved' ? 'primary' : 'subtle'} onClick={() => setViewMode('resolved')}>
          Resolved Errors
        </Button>
      </div>

      <Text size={400} weight="semibold">{viewMode === 'resolved' ? 'Resolved Errors History' : 'Pending Errors List'}</Text>

      <div className={styles.logList}>
        {logs
          .filter(log => {
            if (log.status !== (viewMode === 'resolved' ? 'Resolved' : 'Unresolved')) return false;
            const searchRegex = new RegExp(searchText, 'i');
            return searchRegex.test(log.issue) || searchRegex.test(log.professor);
          })
          .map(log => (
            <Card key={log.id} className={styles.logCard}>
              <div className={styles.logInfo}>
                <Avatar name={log.professor} size={32} />
                <div className={styles.logDetails}>
                  <Text weight="semibold">{log.issue}</Text>
                  <Text size={200}>Affected: {log.professor}</Text>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Text size={200} weight="semibold">Downtime: {log.downtime}</Text>
                  <Text size={200} className={styles.timestamp}>{log.resolvedTime}</Text>
                </div>
                {log.status === 'Unresolved' ? (
                  <Button 
                    appearance="primary" 
                    size="small"
                    icon={<CheckmarkCircle24Regular />}
                    onClick={() => handleResolveLog(log.id)}
                  >
                    Resolve
                  </Button>
                ) : (
                  <Badge appearance="tint" color={log.status === 'Resolved' ? 'success' : 'danger'}>{log.status}</Badge>
                )}
              </div>
            </Card>
          ))}
      </div>

      {/* Add Log Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(event, data) => setIsAddDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Create New Log</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Label>Issue</Label>
              <Input value={newLog.issue} onChange={(e, data) => setNewLog({...newLog, issue: data.value})} />
              <Label>Professor</Label>
              <Input value={newLog.professor} onChange={(e, data) => setNewLog({...newLog, professor: data.value})} />
              <Label>Downtime</Label>
              <Input value={newLog.downtime} onChange={(e, data) => setNewLog({...newLog, downtime: data.value})} placeholder="e.g. 5m, 30s" />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddLog}>Create</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
