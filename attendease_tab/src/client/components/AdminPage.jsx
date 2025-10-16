import React from 'react';
import {
  makeStyles,
  shorthands,
  Card,
  Text,
  Button
} from '@fluentui/react-components';
import {
  Settings48Regular,
  ClipboardTaskListLtr24Regular,
  BookOpen24Regular,
  DocumentBulletList24Regular,
  ArrowCircleLeft24Regular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { setAdminSession } from '../utils/auth';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    ...shorthands.padding('40px')
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px')
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('12px')
  },
  grid: {
    maxWidth: '960px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    ...shorthands.gap('16px')
  },
  card: {
    ...shorthands.padding('24px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    minHeight: '160px'
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

const adminActions = [
  {
    title: 'Update Courses',
    description: 'Manage course details, sections, and scheduling.',
    icon: <BookOpen24Regular />
  },
  {
    title: 'Check Logs',
    description: 'Review attendance logs and system activity.',
    icon: <ClipboardTaskListLtr24Regular />
  },
  {
    title: 'Manage Users',
    description: 'Administer user roles and enrollment status.',
    icon: <Settings48Regular />
  },
  {
    title: 'System Settings',
    description: 'Configure integration settings and environment toggles.',
    icon: <Settings48Regular />
  },
  {
    title: 'View Reports',
    description: 'Access attendance analytics and export history.',
    icon: <DocumentBulletList24Regular />
  }
];

function AdminPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  const handleExit = () => {
    setAdminSession(false);
    navigate('/professor');
  };

  const handleBack = () => {
    navigate('/professor');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text weight="bold" size={600}>Administrative Controls</Text>
          <Text size={300} style={{ color: '#666' }}>Manage prototype settings and oversee system operations.</Text>
        </div>
        <div className={styles.actions}>
          <Button
            appearance="secondary"
            icon={<ArrowCircleLeft24Regular />}
            onClick={handleBack}
          >
            Back to Dashboard
          </Button>
          <Button appearance="primary" onClick={handleExit}>
            Logout Admin
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        {adminActions.map((action) => (
          <Card key={action.title} className={styles.card}>
            <div className={styles.iconWrapper}>{action.icon}</div>
            <Text weight="semibold" size={400}>{action.title}</Text>
            <Text size={200}>{action.description}</Text>
            <Button appearance="secondary">Open</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminPage;


