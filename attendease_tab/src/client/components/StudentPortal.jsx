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
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [section, setSection] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Enrollment state
  const [consentChecked, setConsentChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [biometricData, setBiometricData] = useState(null);

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
    
    // Store email in state
    setUserEmail(email);

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
            email: s.email,
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
    if (!file) return;
    
    // Clear previous errors
    setUploadError(null);
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPG and PNG are supported.');
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoPreview) {
      setUploadError('Please select a photo to upload');
      return;
    }
    
    if (!consentChecked) {
      setUploadError('Please consent to biometric data collection');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(`/api/students/${userData.user_id}/enroll-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoPreview,
          consent: consentChecked
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update user data with enrolled info
        setUserData(prev => ({
          ...prev,
          photoPath: data.data.photo_url
        }));
        setBiometricData({
          enrolled_at: data.data.enrolled_at,
          biometric_id: data.data.biometric_id
        });
        setIsRegistrationComplete(true);
        setPhotoPreview(null);
        setPhotoFile(null);
        setConsentChecked(false);
      } else {
        // Show specific error message from server
        setUploadError(data.detail || data.message || 'Failed to enroll face');
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProfilePhoto = () => {
    setShowPhotoInput(!showPhotoInput);
    setUploadError(null);
    setConsentChecked(false);
  };

  const handleSavePhoto = async () => {
    if (!photoPreview || photoPreview === userData.photoPath) {
      setShowPhotoInput(false);
      return;
    }
    
    if (!consentChecked) {
      setUploadError('Please consent to biometric data collection');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(`/api/students/${userData.user_id}/enroll-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoPreview,
          consent: consentChecked
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setUserData(prev => ({
          ...prev,
          photoPath: data.data.photo_url
        }));
        setBiometricData({
          enrolled_at: data.data.enrolled_at,
          biometric_id: data.data.biometric_id
        });
        setShowPhotoInput(false);
        setPhotoPreview(null);
        setConsentChecked(false);
      } else {
        setUploadError(data.detail || data.message || 'Failed to update photo');
      }
    } catch (err) {
      console.error('Error updating photo:', err);
      setUploadError('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelPhoto = () => {
    setShowPhotoInput(false);
    setPhotoPreview(userData.photoPath);
    setUploadError(null);
    setConsentChecked(false);
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
            Please upload your photo to complete your attendance profile and enable facial recognition for attendance tracking.
          </Text>

          <Divider style={{ marginBottom: '25px' }} />

          {/* Photo Requirements */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e8f4f8', 
            borderRadius: '6px', 
            marginBottom: '20px',
            border: '1px solid #b3d9e8'
          }}>
            <Text weight="semibold" style={{ display: 'block', marginBottom: '10px', color: '#2c3e50' }}>
              📸 Photo Requirements:
            </Text>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#5a6c7d' }}>
              <li>Your face only in the picture</li>
              <li>Good lighting (avoid shadows)</li>
              <li>Your face is shown or facing directly in the camera</li>
              <li>Maximum file size: 5MB</li>
              <li>Supported formats: JPG, PNG</li>
            </ul>
          </div>

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
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePhotoChange}
                style={{ cursor: 'pointer' }}
                disabled={isUploading}
              />
              
              {/* Error Display */}
              {uploadError && (
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#ffe6e6', 
                  border: '1px solid #ffcccc',
                  borderRadius: '4px',
                  marginTop: '10px',
                  width: '100%'
                }}>
                  <Text style={{ color: '#c0392b', fontSize: '14px' }}>
                    ❌ {uploadError}
                  </Text>
                </div>
              )}
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
                <Text className={styles.value}>{userData.email || userEmail}</Text>
              </div>
            </div>
          </div>

          <Divider style={{ marginBottom: '25px' }} />

          {/* Consent Checkbox */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#fff9e6', 
            border: '1px solid #ffe6b3',
            borderRadius: '6px', 
            marginBottom: '20px' 
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                style={{ marginRight: '10px', marginTop: '3px' }}
                disabled={isUploading}
              />
              <Text style={{ color: '#2c3e50', fontSize: '14px', lineHeight: '1.6' }}>
                I consent to the collection and use of my facial biometric data for automated attendance tracking purposes. 
                I understand that my photo and facial recognition data will be securely stored and used exclusively for 
                attendance verification in my enrolled courses.
              </Text>
            </label>
          </div>

          <div className={styles.buttonSection}>
            <Button 
              appearance="primary"
              className={styles.updateProfileButton}
              onClick={handleUploadPhoto}
              disabled={!photoPreview || !consentChecked || isUploading}
            >
              {isUploading ? 'Processing...' : 'Save Registration'}
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
        <div className={styles.successHeader}>
          <Text className={styles.successTitle}>✓ Registration Complete</Text>
          <Text className={styles.successMessage}>
            Hello, {userData.firstName}! Your facial recognition enrollment is active.
          </Text>
        </div>

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
              <>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  style={{ cursor: 'pointer' }}
                  disabled={isUploading}
                />
                
                {/* Photo Requirements for Update */}
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#e8f4f8', 
                  borderRadius: '4px', 
                  marginTop: '10px',
                  fontSize: '12px',
                  width: '100%'
                }}>
                  <Text style={{ color: '#5a6c7d', fontSize: '12px' }}>
                    📸 Face directly at camera, good lighting, max 5MB
                  </Text>
                </div>
                
                {/* Consent for Update */}
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#fff9e6', 
                  border: '1px solid #ffe6b3',
                  borderRadius: '4px', 
                  marginTop: '10px',
                  width: '100%'
                }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      style={{ marginRight: '8px', marginTop: '2px' }}
                      disabled={isUploading}
                    />
                    <Text style={{ color: '#2c3e50', fontSize: '12px', lineHeight: '1.5' }}>
                      I consent to updating my facial biometric data for attendance tracking.
                    </Text>
                  </label>
                </div>
                
                {/* Error Display */}
                {uploadError && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#ffe6e6', 
                    border: '1px solid #ffcccc',
                    borderRadius: '4px',
                    marginTop: '10px',
                    width: '100%'
                  }}>
                    <Text style={{ color: '#c0392b', fontSize: '12px' }}>
                      ❌ {uploadError}
                    </Text>
                  </div>
                )}
              </>
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
              <Text className={styles.value}>{userData.email || userEmail}</Text>
            </div>
            
            {biometricData && biometricData.enrolled_at && (
              <div className={styles.infoRow}>
                <Text className={styles.label}>Enrolled On:</Text>
                <Text className={styles.value}>
                  {new Date(biometricData.enrolled_at).toLocaleDateString()}
                </Text>
              </div>
            )}
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
                disabled={!photoPreview || !consentChecked || isUploading}
              >
                {isUploading ? 'Processing...' : 'Save Photo'}
              </Button>
              <Button 
                appearance="secondary"
                onClick={handleCancelPhoto}
                disabled={isUploading}
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
                Update Photo
              </Button>
            </>
          )}
        </div>

        <Text size={200} style={{ marginTop: '15px', color: '#7f8c8d' }}>
          Note: To edit other information, please contact: admin
        </Text>
      </Card>
    </div>
  );
}

export default StudentPortal;
