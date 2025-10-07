import React, { useState } from 'react';
import { 
  Card,
  Badge,
  Button,
  makeStyles,
  shorthands,
  Text,
  Field,
} from '@fluentui/react-components';
import { 
  Camera24Regular,
  EditRegular,
} from '@fluentui/react-icons';

// --- STYLES (Should be shared or defined locally) ---
const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('20px'),
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr'
    }
  },
  card: {
    ...shorthands.padding('20px'),
    minHeight: '200px',
  },
  dashboardTitle: {
    ...shorthands.margin(0, 0, '20px', 0),
    fontSize: '28px',
    fontWeight: '600',
  },
});


// --- STUDENT DASHBOARD COMPONENT ---
export default function StudentDashboard() {
  const styles = useStyles();
  
  // Initial state set to null/empty values as requested
  const [studentInfo, setStudentInfo] = useState({
    id: null,
    name: null,
    email: null,
    status: null
  });

  const handleFaceScan = () => {
    console.log("Student Dashboard: 'Scan Face for Check-in' button clicked. Functionality not yet implemented.");
  };

  const handleUpdateInfo = () => {
    console.log("Student Dashboard: 'Update Info' button clicked. Functionality not yet implemented.");
  };

  return (
    <div>
      <h2 className={styles.dashboardTitle}>Student Self-Service Portal</h2>
      
      <div className={styles.container}>
        {/* Student Info Card */}
        <Card className={styles.card}>
          <h3>👤 My Profile Information</h3>
          <Text block size={300} style={{ marginBottom: '10px' }}>View and verify your registered details.</Text>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '15px', marginTop: '15px' }}>
            <Field label="Student ID">
              <Text weight="semibold">{studentInfo.id || '--'}</Text>
            </Field>
            
            <Field label="Enrollment Status">
              <Badge 
                appearance="tint" 
                color={studentInfo.status ? "brand" : "subtle"}
              >
                {studentInfo.status || 'No Data'}
              </Badge>
            </Field>
            
            <Field label="Full Name">
              <Text>{studentInfo.name || '--'}</Text>
            </Field>
            
            <Field label="University Email">
              <Text>{studentInfo.email || '--'}</Text>
            </Field>
          </div>
        </Card>

        {/* Action Card: Update and Face Scan */}
        <Card className={styles.card}>
          <h3>🛠️ Actions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <Button 
              appearance="primary" 
              icon={<EditRegular />}
              onClick={handleUpdateInfo}
            >
              Update My Information
            </Button>
            
            <Button 
              appearance="secondary" 
              icon={<Camera24Regular />}
              onClick={handleFaceScan}
            >
              Scan Face for Check-in / Enrollment
            </Button>
          </div>
          
          <Text block size={200} style={{ marginTop: '20px', color: 'var(--colorNeutralForeground3)' }}>
            *Face scan is used for quick, onsite attendance tracking and profile verification.
          </Text>
        </Card>
      </div>
    </div>
  );
}
