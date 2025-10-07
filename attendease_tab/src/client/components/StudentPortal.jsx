import React from 'react';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text,
  Divider
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('40px', '20px'),
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  card: {
    maxWidth: '800px',
    width: '100%',
    ...shorthands.padding('30px')
  },
  header: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '30px'
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('15px'),
    marginBottom: '30px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('10px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    borderRadius: '6px'
  },
  label: {
    fontWeight: '600',
    color: '#2c3e50'
  },
  value: {
    color: '#5a6c7d'
  },
  buttonSection: {
    display: 'flex',
    ...shorthands.gap('15px'),
    flexWrap: 'wrap',
    marginTop: '20px'
  },
  button: {
    minWidth: '200px'
  }
});

function StudentPortal() {
  const styles = useStyles();

  // Placeholder student data
  const studentData = {
    name: 'Juan Dela Cruz',
    studentId: '2024-00001',
    section: 'CS-3A'
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.header}>Student Portal</h1>
        <Text className={styles.subtitle}>
          Manage your attendance profile and settings
        </Text>

        <Divider style={{ marginBottom: '25px' }} />

        <div className={styles.infoSection}>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Name:</Text>
            <Text className={styles.value}>{studentData.name}</Text>
          </div>

          <div className={styles.infoRow}>
            <Text className={styles.label}>Student ID:</Text>
            <Text className={styles.value}>{studentData.studentId}</Text>
          </div>

          <div className={styles.infoRow}>
            <Text className={styles.label}>Section:</Text>
            <Text className={styles.value}>{studentData.section}</Text>
          </div>
        </div>

        <Divider style={{ marginBottom: '25px' }} />

        <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: '15px' }}>
          Profile Settings
        </Text>

        <div className={styles.buttonSection}>
          <Button 
            appearance="primary"
            className={styles.button}
            disabled
          >
            Update Facial Profile
          </Button>

          <Button 
            appearance="secondary"
            className={styles.button}
            disabled
          >
            Update App Profile
          </Button>
        </div>

        <Text size={200} style={{ marginTop: '15px', color: '#7f8c8d' }}>
          Note: Profile update features coming soon
        </Text>
      </Card>
    </div>
  );
}

export default StudentPortal;

