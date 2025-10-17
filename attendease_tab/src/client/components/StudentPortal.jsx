import React, { useEffect, useState } from 'react';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text,
  Divider,
  Input,
  Label
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
    width: '500px',
    minWidth: '350px',
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
    justifyContent: 'space-around',
    ...shorthands.gap('20px'),
    marginBottom: '30px',
    width: '100%'
  },
  facialProfileSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('15px'),
    alignItems: 'center',
    minWidth: '300px',
    ...shorthands.padding('20px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    borderRadius: '6px'
  },
  facialProfileBox: {
    width: '250px',
    height: '250px',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#7f8c8d',
    ...shorthands.border('1px', 'dashed', '#ccc'),
    borderRadius: '4px',
    fontSize: '14px',
    objectFit: 'cover'
  },
  facialProfileImage: {
    width: '250px',
    height: '250px',
    borderRadius: '4px',
    objectFit: 'cover'
  },
  buttonSection: {
    display: 'flex',
    ...shorthands.gap('15px'),
    flexWrap: 'wrap',
    marginTop: '20px'
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
  },
  formLabel: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '8px',
    display: 'block'
  },
  formInput: {
    width: '100%',
    marginBottom: '15px'
  }
});

// Hardcoded users data
const HARDCODED_USERS = {
  'mqsy2@student.apc.edu.ph': {
    name: 'Moises Sy',
    studentId: '2024-00002',
    section: 'SS231',
    photoPath: '/photos/moises_sy.jpg',
    isHardcoded: true
  }
};

function StudentPortal() {
  const styles = useStyles();
  const [userEmail, setUserEmail] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state for new users
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [section, setSection] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    // Get logged-in user email from localStorage
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);

    if (!email) {
      setIsLoading(false);
      return;
    }

    // Initialize user profiles object if it doesn't exist
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');

    // Check if hardcoded user
    if (HARDCODED_USERS[email]) {
      setUserData(HARDCODED_USERS[email]);
    } 
    // Check if user has saved profile
    else if (userProfiles[email]) {
      setUserData(userProfiles[email]);
    }
    // New user - no profile yet
    else {
      setUserData(null);
    }

    setIsLoading(false);
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteProfile = () => {
    if (!firstName || !lastName || !studentId || !section) {
      alert('Please fill in all required fields');
      return;
    }

    const fullName = `${firstName}${lastName ? ' ' + lastName : ''}`;
    const newProfile = {
      name: fullName,
      firstName,
      lastName,
      studentId,
      section,
      photoPath: photoPreview || null,
      isHardcoded: false
    };

    // Save to localStorage
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    userProfiles[userEmail] = newProfile;
    localStorage.setItem('userProfiles', JSON.stringify(userProfiles));

    // Update state
    setUserData(newProfile);
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <Text>Loading...</Text>
        </Card>
      </div>
    );
  }

  // New User Registration View
  if (!userData) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <h1 className={styles.header}>Complete Your Profile</h1>
          <Text className={styles.subtitle}>
            Welcome! Please complete your student profile to get started.
          </Text>

          <Divider style={{ marginBottom: '25px' }} />

          <div className={styles.profileLayout}>
            <div className={styles.facialProfileSection}>
              <div className={styles.facialProfileBox}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className={styles.facialProfileImage} />
                ) : (
                  'Upload Your Photo'
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ cursor: 'pointer' }}
              />
            </div>

            <div className={styles.infoSection}>
              <div>
                <label className={styles.formLabel}>First Name *</label>
                <Input 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="Enter first name"
                  className={styles.formInput}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Last Name *</label>
                <Input 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder="Enter last name"
                  className={styles.formInput}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Student ID *</label>
                <Input 
                  value={studentId} 
                  onChange={(e) => setStudentId(e.target.value)} 
                  placeholder="Enter student ID"
                  className={styles.formInput}
                />
              </div>

              <div>
                <label className={styles.formLabel}>Section *</label>
                <Input 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)} 
                  placeholder="Enter section"
                  className={styles.formInput}
                />
              </div>
            </div>
          </div>

          <Divider style={{ marginBottom: '25px' }} />

          <div className={styles.buttonSection}>
            <Button 
              appearance="primary"
              className={styles.updateProfileButton}
              onClick={handleCompleteProfile}
            >
              Complete Profile
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Logged-in User Profile View
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
              {userData.photoPath ? (
                <img src={userData.photoPath} alt={userData.name} className={styles.facialProfileImage} />
              ) : (
                'No Photo'
              )}
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
              <Text className={styles.value}>{userData.name}</Text>
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Student ID:</Text>
              <Text className={styles.value}>{userData.studentId}</Text>
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Section:</Text>
              <Text className={styles.value}>{userData.section}</Text>
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Email:</Text>
              <Text className={styles.value}>{userEmail}</Text>
            </div>
          </div>
        </div>

        <Divider style={{ marginBottom: '25px' }} />

        <div className={styles.buttonSection}>
          <Button 
            appearance="primary"
            className={styles.updateProfileButton}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {isEditMode && (
          <div className={styles.infoSection} style={{ marginTop: '20px' }}>
            <div className={styles.infoRow}>
              <Text className={styles.label}>First Name:</Text>
              <Input 
                value={firstName || userData.firstName || ''} 
                onChange={(e) => setFirstName(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Last Name:</Text>
              <Input 
                value={lastName || userData.lastName || ''} 
                onChange={(e) => setLastName(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Student ID:</Text>
              <Input 
                value={studentId || userData.studentId || ''} 
                onChange={(e) => setStudentId(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Section:</Text>
              <Input 
                value={section || userData.section || ''} 
                onChange={(e) => setSection(e.target.value)} 
                className={styles.value} 
              />
            </div>

            <Button 
              appearance="primary"
              className={styles.updateProfileButton}
              onClick={handleCompleteProfile}
              style={{ marginTop: '15px' }}
            >
              Save Changes
            </Button>
          </div>
        )}

        <Text size={200} style={{ marginTop: '15px', color: '#7f8c8d' }}>
          Note: You can update your profile information at any time.
        </Text>
      </Card>
    </div>
  );
}

export default StudentPortal;

