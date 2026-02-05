import React, { useEffect, useState, useRef } from 'react';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text,
  Divider,
  Input,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  MessageBar,
  MessageBarBody,
  Badge
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  // Main Container
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(to right,rgb(66, 59, 34), #FFCC00)',
  },
  
  // Top Bar Styles
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    ...shorthands.padding('15px', '30px'),
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    '@media (max-width: 768px)': {
      ...shorthands.padding('12px', '20px'),
    }
  },
  logo: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#244670',
    cursor: 'default',
    '@media (max-width: 768px)': {
      fontSize: '24px',
    }
  },
  logoHighlight: {
    color: '#FFB900',
  },
  hamburgerButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    fontSize: '24px',
    color: '#244670',
    '&:hover': {
      backgroundColor: '#f3f2f1',
      borderRadius: '4px',
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    }
  },
  
  // Hamburger Menu Overlay
  menuBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
    animation: 'fadeIn 300ms ease-in-out',
  },
  menuPanel: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '280px',
    backgroundColor: '#ffffff',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 300ms ease-in-out',
    '@media (max-width: 768px)': {
      width: '260px',
    }
  },
  menuHeader: {
    ...shorthands.padding('20px'),
    ...shorthands.borderBottom('1px', 'solid', '#e1e4e8'),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#244670',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#f3f2f1',
    }
  },
  menuItems: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('10px'),
    flex: 1,
  },
  menuItem: {
    ...shorthands.padding('14px', '16px'),
    cursor: 'pointer',
    fontSize: '15px',
    color: '#323130',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    borderRadius: '4px',
    textAlign: 'left',
    width: '100%',
    '&:hover': {
      backgroundColor: '#f3f2f1',
    }
  },
  menuItemActive: {
    backgroundColor: '#e8f4f8',
    color: '#244670',
    fontWeight: '600',
  },
  menuDivider: {
    ...shorthands.margin('10px', '0'),
    borderTop: '1px solid #e1e4e8',
  },
  
  // Content Area
  contentArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('40px', '20px'),
    flex: 1,
    minHeight: 'calc(100vh - 70px)',
    '@media (max-width: 768px)': {
      ...shorthands.padding('20px', '15px'),
    }
  },
  
  // Card Styles
  card: {
    maxWidth: '900px',
    width: '100%',
    minHeight: '600px',
    ...shorthands.padding('40px'),
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    '@media (max-width: 768px)': {
      ...shorthands.padding('24px'),
      minHeight: '500px',
    }
  },
  
  // Progress Dots
  progressDots: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginBottom: '30px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: '#244670',
    width: '14px',
    height: '14px',
  },
  
  // Headers
  header: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#244670',
    marginBottom: '10px',
    textAlign: 'center',
    '@media (max-width: 768px)': {
      fontSize: '26px',
    }
  },
  subtitle: {
    fontSize: '15px',
    color: '#5a6c7d',
    marginBottom: '30px',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  
  // Info Section (Read-only fields)
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('14px', '16px'),
    backgroundColor: '#f9fafb',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
    borderRadius: '6px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      ...shorthands.gap('6px'),
    }
  },
  label: {
    fontWeight: '600',
    color: '#2c3e50',
    minWidth: '140px',
  },
  value: {
    color: '#5a6c7d',
    textAlign: 'right',
    flex: 1,
    '@media (max-width: 768px)': {
      textAlign: 'left',
    }
  },
  emptyValue: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  adminContactFooter: {
    fontSize: '13px',
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: '20px',
    ...shorthands.padding('12px'),
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  
  // Photo Upload Section
  photoUploadSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('20px'),
    marginBottom: '30px',
  },
  photoBox: {
    width: '300px',
    height: '300px',
    backgroundColor: '#f0f2f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#7f8c8d',
    ...shorthands.border('2px', 'dashed', '#d1d5db'),
    borderRadius: '8px',
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      width: '250px',
      height: '250px',
    }
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoInput: {
    cursor: 'pointer',
    fontSize: '14px',
  },
  photoRequirements: {
    ...shorthands.padding('12px', '16px'),
    backgroundColor: '#e8f4f8',
    borderRadius: '6px',
    ...shorthands.border('1px', 'solid', '#b3d9e8'),
    fontSize: '13px',
    color: '#5a6c7d',
    textAlign: 'center',
    maxWidth: '500px',
  },
  
  // Error Messages
  errorMessage: {
    ...shorthands.padding('12px', '16px'),
    backgroundColor: '#fee',
    ...shorthands.border('1px', 'solid', '#fcc'),
    borderRadius: '6px',
    color: '#c0392b',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '10px',
  },
  
  // Buttons
  buttonSection: {
    display: 'flex',
    ...shorthands.gap('15px'),
    justifyContent: 'center',
    marginTop: '30px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      width: '100%',
    }
  },
  primaryButton: {
    minWidth: '160px',
    height: '48px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#244670',
    color: '#ffffff',
    borderRadius: '8px',
    ...shorthands.border('none'),
    '&:hover': {
      backgroundColor: '#1a3350',
    },
    '&:disabled': {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
    '@media (max-width: 768px)': {
      width: '100%',
      minWidth: 'auto',
    }
  },
  secondaryButton: {
    minWidth: '160px',
    height: '48px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#244670',
    ...shorthands.border('2px', 'solid', '#244670'),
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: '#f3f2f1',
    },
    '@media (max-width: 768px)': {
      width: '100%',
      minWidth: 'auto',
    }
  },
  
  // Success Overlay
  successOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    animation: 'fadeIn 200ms ease-in-out',
  },
  successCard: {
    maxWidth: '500px',
    width: '90%',
    ...shorthands.padding('50px', '40px'),
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('20px'),
    '@media (max-width: 768px)': {
      ...shorthands.padding('40px', '30px'),
    }
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '48px',
    color: '#ffffff',
    marginBottom: '10px',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#244670',
    marginBottom: '0px',
    '@media (max-width: 768px)': {
      fontSize: '24px',
    }
  },
  successMessage: {
    fontSize: '15px',
    color: '#5a6c7d',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  
  // Profile Tab Styles
  profilePhotoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    marginBottom: '30px',
  },
  profilePhotoError: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  brokenImageIcon: {
    fontSize: '48px',
    color: '#94a3b8',
  },
  
  // Toast/MessageBar Styling
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 3000,
    minWidth: '300px',
    animation: 'slideInDown 250ms ease-in-out',
    '@media (max-width: 768px)': {
      top: '10px',
      right: '10px',
      left: '10px',
      minWidth: 'auto',
    }
  },
  toastSuccess: {
    backgroundColor: '#f0fdf4',
    ...shorthands.border('1px', 'solid', '#86efac'),
    color: '#166534',
  },
  
  // Loading Spinner
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    ...shorthands.border('4px', 'solid', '#e1e4e8'),
    borderTop: '4px solid #244670',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  
  // Modal Styles
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
    minWidth: '400px',
    '@media (max-width: 768px)': {
      minWidth: '300px',
    }
  },
  consentText: {
    fontSize: '14px',
    color: '#2c3e50',
    lineHeight: '1.6',
    ...shorthands.padding('16px'),
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    ...shorthands.border('1px', 'solid', '#e1e4e8'),
  },
});


function StudentPortal() {
  const styles = useStyles();
  
  // Core State
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  
  // UI State
  const [currentStep, setCurrentStep] = useState(1); // 1 = Information, 2 = Profile/Upload
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Photo Upload State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  
  // Consent Modal State
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  
  // Biometric Data
  const [biometricData, setBiometricData] = useState(null);
  
  const successTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
    
    // Check sessionStorage for current step
    const savedStep = sessionStorage.getItem('currentStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
    
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const loadUserProfile = () => {
    setIsLoading(true);
    
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || localStorage.getItem('userEmail');
    
    if (!email) {
      setAccessDenied(true);
      setIsLoading(false);
      return;
    }
    
    setUserEmail(email);

    const encodedEmail = encodeURIComponent(email);
    fetch(`/api/students/email/${encodedEmail}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.student) {
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
          };
          
          setUserData(transformedData);
        } else {
          setAccessDenied(true);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching student:', err);
        setAccessDenied(true);
        setIsLoading(false);
      });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadError(null);
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPG and PNG are supported.');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    setCurrentStep(2);
    sessionStorage.setItem('currentStep', '2');
  };

  const handleBackStep = () => {
    setCurrentStep(1);
    sessionStorage.setItem('currentStep', '1');
    setPhotoPreview(null);
    setPhotoFile(null);
    setUploadError(null);
  };

  const handleUploadClick = () => {
    if (!photoPreview) {
      setUploadError('Please select a photo to upload');
      return;
    }
    setShowConsentModal(true);
    setIsUpdateMode(false);
  };

  const handleUpdatePhotoClick = () => {
    setIsEditingPhoto(true);
    setPhotoPreview(null);
    setPhotoFile(null);
    setUploadError(null);
  };

  const handleCancelPhotoUpdate = () => {
    setIsEditingPhoto(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setUploadError(null);
    setPhotoLoadError(false);
  };

  const handleSavePhotoClick = () => {
    if (!photoPreview) {
      setUploadError('Please select a photo to upload');
      return;
    }
    setShowConsentModal(true);
    setIsUpdateMode(true);
  };

  const handleConsentSave = async () => {
    if (!consentChecked) {
      setUploadError('Please provide consent to continue');
      return;
    }
    
    if (!photoPreview) {
      setUploadError('Please select a photo to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    setShowConsentModal(false);

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
        
        if (isUpdateMode) {
          // Show toast for update
          setToastMessage('Photo updated successfully');
          setShowToast(true);
          toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
          }, 3500);
          setPhotoPreview(null);
          setPhotoFile(null);
          setIsEditingPhoto(false);
        } else {
          // Show success overlay for initial registration
          setShowSuccessOverlay(true);
          successTimeoutRef.current = setTimeout(() => {
            setShowSuccessOverlay(false);
            setCurrentStep(2);
            sessionStorage.setItem('currentStep', '2');
          }, 2500);
        }
        
        setConsentChecked(false);
      } else {
        const errorMsg = data.detail || data.message || 'Failed to process photo';
        // Check for specific service error
        if (errorMsg.includes('facial recognition') || errorMsg.includes('service')) {
          setUploadError('Facial recognition service is temporarily unavailable. Please try again later or contact Admin for assistance.');
        } else {
          setUploadError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadError('Facial recognition service is temporarily unavailable. Please try again later or contact Admin for assistance.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConsentCancel = () => {
    setShowConsentModal(false);
    setConsentChecked(false);
  };

  const handleCloseSuccessOverlay = () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setShowSuccessOverlay(false);
    setCurrentStep(2);
    sessionStorage.setItem('currentStep', '2');
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (step) => {
    setCurrentStep(step);
    sessionStorage.setItem('currentStep', step.toString());
    setIsMenuOpen(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setUploadError(null);
    setPhotoLoadError(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('currentStep');
    window.location.href = '/';
  };

  const handlePhotoError = () => {
    setPhotoLoadError(true);
  };

  // Render Loading State
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.contentArea}>
          <Card className={styles.card}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Render Access Denied
  if (accessDenied) {
    return (
      <div className={styles.container}>
        <div className={styles.contentArea}>
          <Card className={styles.card}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text size={600} weight="bold" style={{ color: '#c0392b', marginBottom: '15px', display: 'block' }}>
                Access Denied
              </Text>
              <Text size={400} style={{ display: 'block', marginBottom: '10px' }}>
                We couldn't find your student record.
              </Text>
              <Text size={300} style={{ color: '#7f8c8d' }}>
                Please contact your administrator to have your account added to the system.
              </Text>
              {userEmail && (
                <div style={{ marginTop: '20px' }}>
                  <Text size={200} style={{ color: '#94a3b8' }}>
                    Email: {userEmail}
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Render Top Bar
  const renderTopBar = () => (
    <div className={styles.topBar}>
      <div className={styles.logo}>
        Attend<span className={styles.logoHighlight}>Ease</span>
      </div>
      <button
        className={styles.hamburgerButton}
        onClick={handleMenuToggle}
        disabled={isUploading}
        aria-label="Menu"
      >
        ☰
      </button>
    </div>
  );

  // Render Hamburger Menu
  const renderMenu = () => {
    if (!isMenuOpen) return null;
    
    return (
      <>
        <div className={styles.menuBackdrop} onClick={() => setIsMenuOpen(false)} />
        <div className={styles.menuPanel}>
          <div className={styles.menuHeader}>
            <Text className={styles.menuTitle}>Menu</Text>
            <button className={styles.closeButton} onClick={() => setIsMenuOpen(false)} aria-label="Close">
              <Dismiss24Regular />
            </button>
          </div>
          <div className={styles.menuItems}>
            <button
              className={`${styles.menuItem} ${currentStep === 1 ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick(1)}
            >
              Information
            </button>
            <button
              className={`${styles.menuItem} ${currentStep === 2 ? styles.menuItemActive : ''}`}
              onClick={() => handleMenuItemClick(2)}
            >
              Profile
            </button>
            <div className={styles.menuDivider} />
            <button className={styles.menuItem} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </>
    );
  };

  // Render Progress Dots
  const renderProgressDots = () => (
    <div className={styles.progressDots}>
      <div className={`${styles.dot} ${currentStep === 1 ? styles.dotActive : ''}`} />
      <div className={`${styles.dot} ${currentStep === 2 ? styles.dotActive : ''}`} />
    </div>
  );

  // Render Student Info (Read-only)
  const renderStudentInfo = () => (
    <div className={styles.infoSection}>
      <div className={styles.infoRow}>
        <Text className={styles.label}>Full Name:</Text>
        <Text className={`${styles.value} ${!userData.name ? styles.emptyValue : ''}`}>
          {userData.name || 'No information given'}
        </Text>
      </div>
      <div className={styles.infoRow}>
        <Text className={styles.label}>Student ID:</Text>
        <Text className={`${styles.value} ${!userData.studentId ? styles.emptyValue : ''}`}>
          {userData.studentId || 'No information given'}
        </Text>
      </div>
      <div className={styles.infoRow}>
        <Text className={styles.label}>Section:</Text>
        <Text className={`${styles.value} ${!userData.section ? styles.emptyValue : ''}`}>
          {userData.section || 'No information given'}
        </Text>
      </div>
      <div className={styles.infoRow}>
        <Text className={styles.label}>Course:</Text>
        <Text className={`${styles.value} ${!userData.course ? styles.emptyValue : ''}`}>
          {userData.course || 'No information given'}
        </Text>
      </div>
      <div className={styles.infoRow}>
        <Text className={styles.label}>Email:</Text>
        <Text className={`${styles.value} ${!userData.email ? styles.emptyValue : ''}`}>
          {userData.email || userEmail || 'No information given'}
        </Text>
      </div>
    </div>
  );

  // Render Step A: Welcome & Verification
  const renderStepA = () => (
    <Card className={styles.card}>
      {renderProgressDots()}
      <h1 className={styles.header}>Welcome, {userData.firstName}!</h1>
      <Text className={styles.subtitle}>
        Kindly check your information details below.
      </Text>
      
      <Divider style={{ marginBottom: '30px' }} />
      
      {renderStudentInfo()}
      
      <Text className={styles.adminContactFooter}>
        If you want to change or edit information details contact Admin.
      </Text>
      
      <div className={styles.buttonSection}>
        <button className={styles.primaryButton} onClick={handleNextStep}>
          Next
        </button>
      </div>
    </Card>
  );

  // Render Step B: Profile/Photo Upload (works for both first-time and registered users)
  const renderStepB = () => {
    const hasPhoto = userData?.photoPath && !photoPreview && !isEditingPhoto;
    
    return (
      <Card className={styles.card}>
        {renderProgressDots()}
        <h1 className={styles.header}>{hasPhoto ? 'Profile' : 'Upload Photo'}</h1>
        <Text className={styles.subtitle}>
          Please upload profile photo for facial registration
        </Text>
        
        <Divider style={{ marginBottom: '30px' }} />
        
        <div className={styles.photoUploadSection}>
          <div className={styles.photoBox}>
            {photoLoadError ? (
              <div className={styles.profilePhotoError}>
                <div className={styles.brokenImageIcon}>📷</div>
                <Text style={{ color: '#94a3b8', fontSize: '14px' }}>Image failed to load</Text>
              </div>
            ) : photoPreview ? (
              <img src={photoPreview} alt="Preview" className={styles.photoImage} />
            ) : hasPhoto ? (
              <img 
                src={userData.photoPath} 
                alt={userData.name} 
                className={styles.photoImage}
                onError={handlePhotoError}
              />
            ) : (
              <Text style={{ textAlign: 'center', padding: '20px' }}>No photo selected</Text>
            )}
          </div>
          
          {(photoLoadError || photoPreview || isEditingPhoto || !userData?.photoPath) && (
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handlePhotoChange}
              className={styles.photoInput}
              disabled={isUploading}
            />
          )}
          
          {!photoPreview && !photoLoadError && (
            <Text className={styles.photoRequirements}>
              Ensure you are the only one in the photo, facing the camera with good lighting • Maximum file size: 5MB • Supported formats: JPG, PNG
            </Text>
          )}
          
          {biometricData && biometricData.enrolled_at && !photoPreview && !isEditingPhoto && (
            <Badge appearance="filled" color="success" style={{ marginTop: '10px' }}>
              Enrolled: {new Date(biometricData.enrolled_at).toLocaleDateString()}
            </Badge>
          )}
          
          {uploadError && (
            <div className={styles.errorMessage}>
              {uploadError}
            </div>
          )}
        </div>
        
        <div className={styles.buttonSection}>
          <button className={styles.secondaryButton} onClick={isEditingPhoto || photoPreview ? handleCancelPhotoUpdate : handleBackStep} disabled={isUploading}>
            {isEditingPhoto || photoPreview ? 'Cancel' : 'Back'}
          </button>
          {photoPreview ? (
            <button className={styles.primaryButton} onClick={handleSavePhotoClick} disabled={isUploading}>
              {isUploading ? 'Processing...' : 'Save Photo'}
            </button>
          ) : hasPhoto && !isEditingPhoto ? (
            <button className={styles.primaryButton} onClick={handleUpdatePhotoClick} disabled={isUploading}>
              Update Photo
            </button>
          ) : (
            <button className={styles.primaryButton} onClick={handleUploadClick} disabled={!photoPreview || isUploading}>
              {isUploading ? 'Processing...' : 'Upload'}
            </button>
          )}
        </div>
      </Card>
    );
  };

  // Render Consent Modal
  const renderConsentModal = () => (
    <Dialog open={showConsentModal} onOpenChange={(_, data) => !data.open && handleConsentCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Consent Required</DialogTitle>
          <DialogContent className={styles.modalContent}>
            <Text className={styles.consentText}>
              Your photo will be used for facial recognition attendance tracking. By clicking "Save", 
              you consent to the collection and use of your facial biometric data for automated attendance 
              verification purposes.
            </Text>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
              <Text style={{ fontSize: '14px' }}>
                I consent to the use of my photo for facial recognition attendance
              </Text>
            </label>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleConsentCancel}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleConsentSave}
              disabled={!consentChecked || isUploading}
              style={{
                minWidth: '120px',
                height: '44px',
                fontSize: '15px',
                fontWeight: '600',
                backgroundColor: (!consentChecked || isUploading) ? '#94a3b8' : '#244670',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: (!consentChecked || isUploading) ? 'not-allowed' : 'pointer',
              }}
              onMouseOver={(e) => {
                if (!(!consentChecked || isUploading)) {
                  e.currentTarget.style.backgroundColor = '#1a3350';
                }
              }}
              onMouseOut={(e) => {
                if (!(!consentChecked || isUploading)) {
                  e.currentTarget.style.backgroundColor = '#244670';
                }
              }}
            >
              {isUploading ? 'Processing...' : 'Save'}
            </button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );

  // Render Success Overlay
  const renderSuccessOverlay = () => {
    if (!showSuccessOverlay) return null;
    
    return (
      <div className={styles.successOverlay}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Facial Registration Complete</h2>
          <Text className={styles.successMessage}>
            Your photo has been successfully enrolled. You can now use facial recognition for attendance tracking.
          </Text>
          <button className={styles.primaryButton} onClick={handleCloseSuccessOverlay}>
            Close
          </button>
        </div>
      </div>
    );
  };

  // Render Toast
  const renderToast = () => {
    if (!showToast) return null;
    
    return (
      <div className={styles.toast}>
        <MessageBar className={styles.toastSuccess}>
          <MessageBarBody>
            {toastMessage}
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  };

  // Main Render
  return (
    <div className={styles.container}>
      {renderTopBar()}
      {renderMenu()}
      <div className={styles.contentArea}>
        {userData && (currentStep === 1 ? renderStepA() : renderStepB())}
      </div>
      {renderConsentModal()}
      {renderSuccessOverlay()}
      {renderToast()}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default StudentPortal;
