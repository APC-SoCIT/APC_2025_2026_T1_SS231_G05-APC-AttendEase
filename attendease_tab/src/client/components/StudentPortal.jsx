import React, { useEffect, useState } from 'react';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text,
  Divider,
  Input
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: '10px',
    textAlign: 'left'
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '30px',
    textAlign: 'left'
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('15px'),
    flex: 1
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
    color: '#2c3e50',
    minWidth: '120px'
  },
  value: {
    color: '#5a6c7d',
    textAlign: 'right',
    flex: 1
  },
  profileLayout: {
    display: 'flex',
    ...shorthands.gap('30px'),
    marginBottom: '30px',
    width: '100%',
    alignItems: 'flex-start'
  },
  facialProfileSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('15px'),
    alignItems: 'center',
    minWidth: '280px',
    ...shorthands.padding('20px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    borderRadius: '6px',
    flexShrink: 0
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
    firstName: 'Moises',
    lastName: 'Sy',
    studentId: '2023-140180',
    section: 'SS231',
    course: 'Bachelor of Science in Computer Science with specialization in Software Systems',
    photoPath: '/photos/moises_sy.jpg',
    isHardcoded: true
  },
  'mmbalidio@student.apc.edu.ph': {
    name: 'Maria Sophea Balidio',
    firstName: 'Maria Sophea',
    lastName: 'Balidio',
    studentId: '2023-140262',
    section: 'SS231',
    course: 'Bachelor of Science in Computer Science with specialization in Software Systems',
    photoPath: '/photos/maria_sophea_balidio.jpg',
    isHardcoded: true
  },
  'sdrosco@student.apc.edu.ph': {
    name: 'Suzanne Marie Rosco',
    firstName: 'Suzanne Marie',
    lastName: 'Rosco',
    studentId: '2023-140425',
    section: 'SS231',
    course: 'Bachelor of Science in Computer Science with specialization in Software Systems',
    photoPath: '/photos/suzanne_rosco.jpg',
    isHardcoded: true
  },
  'ciesguerra2@student.apc.edu.ph': {
    name: 'Christian Luis Esguerra',
    firstName: 'Christian Luis',
    lastName: 'Esguerra',
    studentId: '2023-140118',
    section: 'SS231',
    course: 'Bachelor of Science in Computer Science with specialization in Software Systems',
    photoPath: '/photos/christian_esguerra.jpg', 
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
  const [course, setCourse] = useState('');
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

    // Priority: Check if user has saved profile FIRST (user edits override hardcoded)
    if (userProfiles[email]) {
      setUserData(userProfiles[email]);
    }
    // Then check if hardcoded user
    else if (HARDCODED_USERS[email]) {
      setUserData(HARDCODED_USERS[email]);
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
    if (!firstName || !lastName || !studentId || !section || !course) {
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
      course,
      photoPath: photoPreview || userData?.photoPath || null,
      isHardcoded: false
    };

    // Save to localStorage
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    userProfiles[userEmail] = newProfile;
    localStorage.setItem('userProfiles', JSON.stringify(userProfiles));

    // Update state
    setUserData(newProfile);
    setIsEditMode(false);
    // Clear form state
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleEditProfile = () => {
    // Populate form fields with current data
    setFirstName(userData.firstName || userData.name?.split(' ')[0] || '');
    setLastName(userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '');
    setStudentId(userData.studentId || '');
    setSection(userData.section || '');
    setCourse(userData.course || '');
    setPhotoPreview(userData.photoPath);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setPhotoFile(null);
    setPhotoPreview(null);
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

              <div>
                <label className={styles.formLabel}>Course *</label>
                <Input 
                  value={course} 
                  onChange={(e) => setCourse(e.target.value)} 
                  placeholder="Enter course"
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

  // Logged-in User Profile View - Read Mode
  if (!isEditMode) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <h1 className={styles.header}>Hello, {userData.firstName}!</h1>
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
                <Text className={styles.label}>Course:</Text>
                <Text className={styles.value}>{userData.course}</Text>
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
              onClick={handleEditProfile}
            >
              Edit Profile
            </Button>
          </div>

          <Text size={200} style={{ marginTop: '15px', color: '#7f8c8d' }}>
            Note: You can update your profile information at any time.
          </Text>
        </Card>
      </div>
    );
  }

  // Logged-in User Profile View - Edit Mode
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.header}>Hello, {firstName}!</h1>
        <Text className={styles.subtitle}>
          Update your attendance profile information
        </Text>

        <Divider style={{ marginBottom: '25px' }} />

        <div className={styles.profileLayout}>
          <div className={styles.facialProfileSection}>
            <div className={styles.facialProfileBox}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile Preview" className={styles.facialProfileImage} />
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
            <div className={styles.infoRow}>
              <Text className={styles.label}>First Name:</Text>
              <Input 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Enter first name"
                style={{ flex: 1, marginLeft: '10px' }}
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Last Name:</Text>
              <Input 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Enter last name"
                style={{ flex: 1, marginLeft: '10px' }}
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Student ID:</Text>
              <Input 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)} 
                placeholder="Enter student ID"
                style={{ flex: 1, marginLeft: '10px' }}
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Section:</Text>
              <Input 
                value={section} 
                onChange={(e) => setSection(e.target.value)} 
                placeholder="Enter section"
                style={{ flex: 1, marginLeft: '10px' }}
              />
            </div>

            <div className={styles.infoRow}>
              <Text className={styles.label}>Course:</Text>
              <Input 
                value={course} 
                onChange={(e) => setCourse(e.target.value)} 
                placeholder="Enter course"
                style={{ flex: 1, marginLeft: '10px' }}
              />
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
            onClick={handleCompleteProfile}
          >
            Save Changes
          </Button>
          <Button 
            appearance="secondary"
            onClick={handleCancelEdit}
          >
            Cancel
          </Button>
        </div>

        <Text size={200} style={{ marginTop: '15px', color: '#7f8c8d' }}>
          Note: Changes will be saved when you click "Save Changes".
        </Text>
      </Card>
    </div>
  );
}

export default StudentPortal;

