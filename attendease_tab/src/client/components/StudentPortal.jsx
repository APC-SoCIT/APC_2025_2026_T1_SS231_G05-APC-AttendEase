import React from 'react';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text,
  Divider,
  Input // Re-import Input component
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('40px', '20px'),
    backgroundImage: 'linear-gradient(to right,rgb(66, 59, 34), #FFCC00)',
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
    marginBottom: '30px',
    width: '500px', // Make infoSection longer
    minWidth: '350px',
    // maxWidth: '500px' // Removed maxWidth
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
  profileLayout: {
    display: 'flex',
    justifyContent: 'space-around', // Changed to space-around
    ...shorthands.gap('20px'), // Kept gap at 20px
    marginBottom: '30px',
    width: '100%'
  },
  facialProfileSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('15px'),
    alignItems: 'center',
    minWidth: '300px', // Increased minWidth
    ...shorthands.padding('20px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    borderRadius: '6px'
  },
  facialProfileBox: {
    width: '250px', // Made bigger and square
    height: '250px', // Made bigger and square
    backgroundColor: '#f0f2f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#7f8c8d',
    ...shorthands.border('1px', 'dashed', '#ccc'),
    borderRadius: '4px',
    fontSize: '14px'
  },
  buttonSection: {
    display: 'flex',
    ...shorthands.gap('15px'),
    flexWrap: 'wrap',
    marginTop: '20px'
  },
  button: {
    minWidth: '200px'
  },
  updateProfileButton: {
    backgroundColor: '#244670',
    color: '#ffffff',
    
    '&:hover': {
      backgroundColor: '#1a3350',
    },
    
    '&:active': {
      backgroundColor: '#1a3350',
    },
    
    '&:focus': {
      backgroundColor: '#1a3350',
    }
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

  // State for new input fields
  const [showUpdateFields, setShowUpdateFields] = React.useState(false);
  const [newFirstName, setNewFirstName] = React.useState('');
  const [newMiddleName, setNewMiddleName] = React.useState('');
  const [newLastName, setNewLastName] = React.useState('');
  const [newStudentId, setNewStudentId] = React.useState('');
  const [newSection, setNewSection] = React.useState('');

  const handleUpdateAppProfileClick = () => {
    setShowUpdateFields(!showUpdateFields);
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.header}>Student Portal</h1>
        <Text className={styles.subtitle}>
          Manage your attendance profile and settings
        </Text>

        <Divider style={{ marginBottom: '25px' }} />

        <div className={styles.profileLayout}>
          <div className={styles.facialProfileSection}>
            <div className={styles.facialProfileBox}>
              Facial Recognition Area
            </div>
            <Button 
              appearance="primary"
              className={styles.updateProfileButton}
            >
              Update Facial Profile
            </Button>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <Text className={styles.label}>Full Name:</Text>
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
        </div>

        <Divider style={{ marginBottom: '25px' }} />

        <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: '15px' }}>
          Profile Settings
        </Text>

        <div className={styles.buttonSection}>
          <Button 
            appearance="primary"
            className={styles.updateProfileButton}
            onClick={handleUpdateAppProfileClick} // Add onClick handler
          >
            Update App Profile
          </Button>
        </div>

        {showUpdateFields && (
          <div className={styles.infoSection} style={{ marginTop: '20px' }}>
            <div className={styles.infoRow}>
              <Text className={styles.label}>First Name:</Text>
              <Input 
                value={newFirstName} 
                onChange={(e) => setNewFirstName(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Middle Name (Optional):</Text>
              <Input 
                value={newMiddleName} 
                onChange={(e) => setNewMiddleName(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Last Name:</Text>
              <Input 
                value={newLastName} 
                onChange={(e) => setNewLastName(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>New Student ID:</Text>
              <Input 
                value={newStudentId} 
                onChange={(e) => setNewStudentId(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>New Section:</Text>
              <Input 
                value={newSection} 
                onChange={(e) => setNewSection(e.target.value)} 
                className={styles.value} 
              />
            </div>
          </div>
        )}

        <Text size={200} style={{ marginTop: '15px', color: '#7f8c8d' }}>
          Note: Profile update features coming soon
        </Text>
      </Card>
    </div>
  );
}

export default StudentPortal;

