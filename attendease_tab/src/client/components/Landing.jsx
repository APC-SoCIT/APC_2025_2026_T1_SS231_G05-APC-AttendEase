import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  MessageBar,
  MessageBarBody,
  Input,
  Label,
  Tooltip,
} from '@fluentui/react-components';

import backgroundUrl from '../../assets/bg_img.jpg';
import { setAdminSession } from '../utils/auth'; 

const useStyles = makeStyles({
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundImage: `url(${backgroundUrl})`, 
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflowY: 'auto',
    fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    '@media (max-width: 768px)': {
      paddingBottom: '40px',
    },
  },
  backgroundImage: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `url(${backgroundUrl})`, 
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(32, 79, 235, 0.5) 0%, rgba(255, 204, 0, 0.54) 100%)',
    zIndex: 1,
  },
  card: {
    maxWidth: '450px',
    width: '100%',
    ...shorthands.padding('40px'),
    textAlign: 'center',
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '20px',
    '@media (max-width: 768px)': {
      maxWidth: '90%',
      ...shorthands.padding('24px'),
      margin: '16px',
    },
  },
  logoSection: {
    marginBottom: '30px',
    '@media (max-width: 768px)': {
      marginBottom: '20px',
    },
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#244670', // Deep Blue
    lineHeight: '1',
    marginBottom: '5px',
    '@media (max-width: 768px)': {
      fontSize: '28px',
    },
  },
  titleHighlight: {
    color: '#FFB900', // Gold/Yellow
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px',
    textAlign: 'center',
    display: 'block',
    '@media (max-width: 768px)': {
      fontSize: '12px',
    },
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('15px'),
    width: '100%',
    maxWidth: '100%',
    '@media (max-width: 768px)': {
      ...shorthands.gap('12px'),
    },
  },
  customBtn: {
    width: 'auto',
    ...shorthands.padding('0', '30px'),
    height: '60px',
    fontSize: '16px',
    fontWeight: '400',
    backgroundColor: '#2E3A6E', // Deep Blue
    color: '#ffffff',
    justifyContent: 'center',
    borderRadius: '10px',
    border: 'none',
    '&:hover': {
      backgroundColor: '#1a264a',
      color: '#ffffff',
      fontWeight: '500',
    },
    '@media (max-width: 768px)': {
      height: '50px',
      fontSize: '14px',
    },
  },
  btnIcon: {
    marginRight: '10px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      width: '20px',
      height: '20px',
      marginRight: '8px',
    },
  },
  footer: {
    position: 'absolute',
    bottom: '20px',
    color: 'white',
    zIndex: 10,
    fontSize: '12px',
    opacity: 0.8,
    '@media (max-width: 768px)': {
      fontSize: '10px',
      bottom: '10px',
    },
  },
  dialogContent: {
    maxHeight: '400px',
    overflowY: 'auto',
    ...shorthands.padding('20px')
  },
  loginSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    width: '100%',
    marginTop: '20px',
    textAlign: 'left'
  },
  inputLabel: {
    fontWeight: '600',
    color: '#323130',
    fontSize: '14px'
  },
  inputField: {
    width: '100%'
  },
  loginButton: {
    marginTop: '15px',
    width: '100%',
    height: '44px',
    backgroundColor: '#2E3A6E', // Deep Blue
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    '&:hover': {
      backgroundColor: '#1a264a',
      color: '#ffffff',
      fontWeight: '700',
    },
  },
  backButton: {
    width: '100%',
    marginTop: '5px',
    color: '#605e5c'
  }
});

function Landing() {
  const styles = useStyles();
  const navigate = useNavigate();
  
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = React.useState(false);
  const [messageBar, setMessageBar] = React.useState({ visible: false, message: '' });
  const [showLogin, setShowLogin] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [canAcceptTerms, setCanAcceptTerms] = React.useState(false);
  const termsContentRef = React.useRef(null);

  React.useEffect(() => {
    if (isTermsDialogOpen) {
      // Use a timeout to allow the dialog to render and calculate dimensions
      const timer = setTimeout(() => {
        if (termsContentRef.current) {
          const { scrollHeight, clientHeight } = termsContentRef.current;
          if (scrollHeight <= clientHeight) {
            setCanAcceptTerms(true);
          }
        }
      }, 150); // A small delay for rendering
      return () => clearTimeout(timer);
    }
  }, [isTermsDialogOpen]);

  const handleTermsScroll = (event) => {
    const element = event.currentTarget;
    // Check if user has scrolled to the bottom (with a small tolerance)
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 1) {
      setCanAcceptTerms(true);
    }
  };

  // Custom Icons
  const MicrosoftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0H10.5V10.5H0V0Z" fill="#F25022"/>
      <path d="M12.5 0H23V10.5H12.5V0Z" fill="#7FBA00"/>
      <path d="M0 12.5H10.5V23H0V12.5Z" fill="#00A4EF"/>
      <path d="M12.5 12.5H23V23H12.5V12.5Z" fill="#FFB900"/>
    </svg>
  );

  const CheckboxIcon = ({ checked }) => (
    <div style={{
      width: '18px',
      height: '18px',
      backgroundColor: checked ? '#FFB900' : 'white',
      borderRadius: '3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'black',
      fontSize: '14px'
    }}>
      {checked && '✓'}
    </div>
  );

  const handleSignInClick = () => {
    if (!acceptedTerms) {
      setMessageBar({ visible: true, message: 'Please accept the terms of service.' });
      return;
    }
    setMessageBar({ visible: false, message: '' });
    setShowLogin(true);
  };

  const handleLogin = async () => {
    if (!acceptedTerms) {
      setMessageBar({ visible: true, message: 'Please accept the terms of service.' });
      return;
    }

    if (!email.trim() || !password.trim()) {
      setMessageBar({ visible: true, message: 'Please enter your email and password.' });
      return;
    }

    setMessageBar({ visible: false, message: '' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        setMessageBar({ visible: true, message: data.message || 'Invalid email or password.' });
        return;
      }

      // Store email for downstream pages
      localStorage.setItem('userEmail', data.user.email);

      // Route based on role from database
      const role = data.user.role;
      if (role === 'Student') {
        navigate('/student');
      } else if (role === 'Professor') {
        navigate('/professor');
      } else if (role === 'Admin') {
        setAdminSession(true);
        navigate('/admin');
      } else {
        setMessageBar({ visible: true, message: 'Unknown role. Please contact an administrator.' });
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessageBar({ visible: true, message: 'Unable to connect to server. Please try again.' });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundImage}></div>
      {/* Background Overlay */}
      <div className={styles.overlay}></div>

      <Card className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.title}>
            Attend<span className={styles.titleHighlight}>Ease</span>
          </div>
          <Text className={styles.subtitle}>
            Automated Attendance System
          </Text>
        </div>
        
        {!showLogin ? (
          <div className={styles.buttonGroup}>
            
            {/* Button 1: Sign In (Text updated) */}
            <Tooltip content="Please ensure you have read, understood, and agreed to the terms and conditions before signing in." relationship="description" positioning="above">
              <Button 
                className={styles.customBtn}
                onClick={handleSignInClick}
                icon={<div className={styles.btnIcon}><MicrosoftIcon /></div>}
              >
                Sign in with APC Email
              </Button>
            </Tooltip>

            {/* Button 2: Terms and Conditions */}
            <Button 
              className={styles.customBtn}
              onClick={() => setIsTermsDialogOpen(true)}
              icon={<div className={styles.btnIcon}><CheckboxIcon checked={acceptedTerms} /></div>}
            >
              Terms and Conditions &nbsp;
            </Button>

          </div>
        ) : (
          <div className={styles.loginSection}>
            <Label htmlFor="email-input" className={styles.inputLabel}>Email Address</Label>
            <Input 
              id="email-input" 
              size="large"
              value={email} 
              onChange={(e, data) => setEmail(data.value)} 
              placeholder="name@student.apc.edu.ph" 
              className={styles.inputField}
            />
            
            <Label htmlFor="password-input" className={styles.inputLabel}>Password</Label>
            <Input 
              id="password-input" 
              size="large"
              type="password" 
              value={password} 
              onChange={(e, data) => setPassword(data.value)} 
              placeholder="Enter your password" 
              className={styles.inputField}
            />
            
            <Button 
              appearance="primary" 
              size="large"
              className={styles.loginButton}
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button
              appearance="subtle"
              onClick={() => setShowLogin(false)}
              className={styles.backButton}
            >
              Back
            </Button>
          </div>
        )}
        
        {/* Error Message Bar */}
        {messageBar.visible && (
          <div style={{ marginTop: '15px', width: '100%' }}>
             <MessageBar intent="error">
                <MessageBarBody>{messageBar.message}</MessageBarBody>
             </MessageBar>
          </div>
        )}
      </Card>

      <div className={styles.footer}>
        © 2025 AttendEase. All Rights Reserved.
      </div>

      {/* Terms Dialog */}
      <Dialog open={isTermsDialogOpen} onOpenChange={(event, data) => {
        if (data.type === 'backdropClick') {
          return;
        }
        setIsTermsDialogOpen(data.open);
        if (!data.open) {
          setCanAcceptTerms(false);
        }
      }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Terms and Conditions</DialogTitle>
            <DialogContent
              ref={termsContentRef}
              onScroll={handleTermsScroll}
              className={styles.dialogContent}
            >
              <Text>
                <h4>Introduction</h4>
                <p>
                  Welcome to AttendEase. By accessing or using our attendance management platform (the "Service"), 
                  you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part 
                  of the terms, you may not access the Service. These Terms apply to all visitors, users, 
                  administrators, and others who access or use the Service.
                </p>

                <h4>1. Accounts and Registration</h4>
                <p>
                  To use certain features of the Service (e.g., marking attendance, viewing reports, or managing courses), 
                  you must register for an account. By creating an account, you agree to:
                </p>
                <ul>
                  <li>Provide accurate, current, and complete information.</li>
                  <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
                  <li>Notify us immediately if you discover any security breach or unauthorized use of your account.</li>
                </ul>
                <p>
                  AttendEase reserves the right to refuse service, terminate accounts, or remove content in our sole discretion.
                </p>

                <h4>2. Acceptable Use</h4>
                <p>
                  You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. 
                  You agree <strong>NOT</strong> to:
                </p>
                <ul>
                  <li><strong>Disrupt Services:</strong> Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
                  <li><strong>Malicious Software:</strong> Upload invalid data, viruses, worms, or other software agents through the Service.</li>
                  <li><strong>Unauthorized Access:</strong> Access any data or account that does not belong to you without permission.</li>
                </ul>

                <h4>3. Role-Based Responsibilities</h4>
                <ul>
                  <li><strong>Administrators/Professors:</strong> You are responsible for the accuracy of the schedules created and the validity of the attendance records approved within the system.</li>
                  <li><strong>Students/Attendees:</strong> You are responsible for ensuring your attendance is recorded correctly at the time of the event and for reporting discrepancies immediately.</li>
                </ul>

                <h4>4. Intellectual Property</h4>
                <p>
                  The Service and its original content (excluding content provided by users), features, and functionality 
                  are and will remain the exclusive property of AttendEase and its licensors. The Service is protected 
                  by copyright, trademark, and other laws.
                </p>

                <h4>5. Privacy and Data Protection</h4>
                <p>
                  Your privacy is important to us. Our use of your personal information is governed by our Privacy Policy. 
                  By using AttendEase, you consent to the collection and use of your data (including name, student ID, 
                  and login timestamps) as outlined in that policy.
                </p>

                <h4>6. Limitation of Liability</h4>
                <p>
                  In no event shall AttendEase, nor its developers, partners, or suppliers, be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including without limitation:
                </p>
                <ul>
                  <li>Loss of profits, data, use, goodwill, or other intangible losses.</li>
                  <li>Errors or omissions in attendance records that affect academic grading or employment status.</li>
                  <li>Service interruptions or system failures.</li>
                </ul>
                <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis.</p>

                <h4>7. Termination</h4>
                <p>
                  We may terminate or suspend your account immediately, without prior notice or liability, for any 
                  reason whatsoever, including without limitation if you breach the Terms. Upon termination, your 
                  right to use the Service will immediately cease.
                </p>

                <h4>8. Governing Law</h4>
                <p>
                  These Terms shall be governed and construed in accordance with the laws of the Republic of the 
                  Philippines without regard to its conflict of law provisions.
                </p>

                <h4>9. Changes to Terms</h4>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material, we will try to provide at least 30 days' notice prior to any new 
                  terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>

                <h4>10. Contact Us</h4>
                <p>If you have any questions about these Terms, please contact us:</p>
                <ul>
                  <li><strong>Email:</strong> attendease@outlook.com</li>
                  <li><strong>Website:</strong> attendease.com</li>
                </ul>

                <p><strong>Last Updated:</strong> January 15, 2026</p>
              </Text>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsTermsDialogOpen(false)}>Close</Button>
              {canAcceptTerms && (
                <Button
                  appearance="primary"
                  onClick={() => {
                    setAcceptedTerms(true);
                    setIsTermsDialogOpen(false);
                    setMessageBar({ visible: false, message: '' });
                  }}
                >
                  Accept
                </Button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default Landing;