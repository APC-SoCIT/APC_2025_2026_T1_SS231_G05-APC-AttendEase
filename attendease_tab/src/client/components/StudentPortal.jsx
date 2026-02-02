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
    alignItems: 'flex-start',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'center'
    }
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
    flexShrink: 0,
    '@media (max-width: 768px)': {
      minWidth: '100%',
      width: '100%'
    }
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
    marginTop: '20px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      width: '100%'
    }
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
  successHeader: {
    marginBottom: '30px',
    width: '100%',
    textAlign: 'center'
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '10px'
  },
  successMessage: {
    fontSize: '14px',
    color: '#7f8c8d',
    lineHeight: '1.4'
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
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    ...shorthands.padding('40px')
  }
});

function StudentPortal() {
  const styles = useStyles();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [section, setSection] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = () => {
    setIsLoading(true);
    
    // Get email from URL params or session
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || localStorage.getItem('userEmail');
    
    if (!email) {
      setError('No user email found');
      setIsLoading(false);
      return;
    }

    // Fetch user from API
    const encodedEmail = encodeURIComponent(email);
    fetch(`/api/students/email/${encodedEmail}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.student) {
          // Transform DB fields to frontend format
          const s = data.student;
          const transformedData = {
            ...s,
            name: `${s.first_name} ${s.last_name}`,
            firstName: s.first_name,
            lastName: s.last_name,
            studentId: s.student_number,
            section: s.section,
            course: s.program,
            photoPath: s.photo_url,
            isHardcoded: false
          };
          
          setUserData(transformedData);
          
          // Logic: If photo exists, show profile. If not, show "Upload Photo" screen.
          if (s.photo_url) {
            setIsRegistrationComplete(true);
          } else {
            setIsRegistrationComplete(false); // Will show the read-only info + photo upload
          }
        } else {
          // User not found in DB
          setAccessDenied(true);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching student:', err);
        setIsLoading(false);
        // On error, safest to deny access or show retry
        setAccessDenied(true); 
      });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = () => {
    if (!photoPreview) {
      alert('Please select a photo to upload');
      return;
    }

    // Only update the photo
    const updates = {
      photoUrl: photoPreview
    };

    fetch(`/api/students/${userData.user_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        const s = data.student;
        setUserData(prev => ({
          ...prev,
          photoPath: s.photo_url
        }));
        setIsRegistrationComplete(true);
        setPhotoPreview(null);
      } else {
        alert('Failed to save photo: ' + data.message);
      }
    })
    .catch(err => {
      console.error('Error uploading photo:', err);
      alert('Error uploading photo');
    });
  };

  const handleEditProfilePhoto = () => {
    setShowPhotoInput(!showPhotoInput);
  };

  const handleSavePhoto = () => {
    if (photoPreview && photoPreview !== userData.photoPath) {
      const updates = {
        photoUrl: photoPreview
      };

      fetch(`/api/students/${userData.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
           const s = data.student;
           setUserData(prev => ({
             ...prev,
             photoPath: s.photo_url
           }));
           setShowPhotoInput(false);
        } else {
          alert('Failed to update photo: ' + data.message);
        }
      })
      .catch(err => console.error('Error updating photo:', err));
    } else {
      setShowPhotoInput(false);
    }
  };

  const handleCancelPhoto = () => {
    setShowPhotoInput(false);
    setPhotoPreview(userData.photoPath);
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

  // Access Denied View (User not in DB)
  if (accessDenied) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.errorContainer}>
            <Text size={500} weight="bold" style={{ color: '#c0392b', marginBottom: '15px' }}>
              Access Denied
            </Text>
            <Text size={300}>
              We couldn't find your student record. Please contact your professor or administrator to have your account added to the system.
            </Text>
            <div style={{ marginTop: '20px' }}>
              <Text size={200} style={{ color: '#7f8c8d' }}>
                Email: {userEmail}
              </Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Upload Photo View (For existing users with no photo)
  // This replaces the old "Complete Profile" form
  if (!isRegistrationComplete && userData) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <h1 className={styles.header}>Welcome, {userData.firstName}!</h1>
          <Text className={styles.subtitle}>
            Please upload your photo to complete your attendance profile.
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
              {/* Read-only info display */}
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
              onClick={handleUploadPhoto}
            >
              Save Photo & Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Logged-in User Profile View (Photo exists)
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
              {showPhotoInput ? (
                <>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile Preview" className={styles.facialProfileImage} />
                  ) : (
                    'Upload Your Photo'
                  )}
                </>
              ) : (
                <>
                  {userData.photoPath ? (
                    <img src={userData.photoPath} alt={userData.name} className={styles.facialProfileImage} />
                  ) : (
                    'No Photo'
                  )}
                </>
              )}
            </div>
            {showPhotoInput && (
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ cursor: 'pointer' }}
              />
            )}
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

        <div className={styles.buttonSection} style={{ justifyContent: 'space-between' }}>
          {showPhotoInput ? (
            <>
              <Button 
                appearance="primary"
                className={styles.updateProfileButton}
                onClick={handleSavePhoto}
              >
                Save Photo
              </Button>
              <Button 
                appearance="secondary"
                onClick={handleCancelPhoto}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                appearance="primary"
                className={styles.updateProfileButton}
                onClick={handleEditProfilePhoto}
              >
                Edit Profile
              </Button>
            </>
          )}
        </div>

        <Text size={200} style={{ marginTop: '15px', color: '#7f8c8d' }}>
          Note: If you want changes in your Personal Information, contact Admin for changes.
        </Text>
      </Card>
    </div>
  );
}

export default StudentPortal;
