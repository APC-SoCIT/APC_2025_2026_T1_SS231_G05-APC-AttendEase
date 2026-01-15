import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text,
  Input,
  Label,
  Checkbox,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundImage: 'linear-gradient(to right,rgb(66, 59, 34), #FFCC00)',
    ...shorthands.padding('20px')
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    ...shorthands.padding('40px'),
    textAlign: 'center'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#7f8c8d',
    marginBottom: '40px'
  },
  loginSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
    marginBottom: '40px',
    width: '100%'
  },
  inputField: {
    width: '100%',
    height: '50px',
    fontSize: '16px'
  },
  loginButton: {
    width: '100%',
    height: '50px',
    fontSize: '16px',
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
  termsCheckbox: {
    marginBottom: '20px'
  },
  dialogContent: {
    maxHeight: '400px',
    overflowY: 'auto',
    ...shorthands.padding('20px')
  }
});

function Landing() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = React.useState(false);
  const [messageBar, setMessageBar] = React.useState({ visible: false, message: '' });

  const handleLogin = () => {
    if (!acceptedTerms) {
      setMessageBar({ visible: true, message: 'Please accept the terms of service.' });
      return;
    }

    // Simple credential validation
    const validCredentials = [
      { email: 'test@student.apc.edu.ph', password: 'test123', route: '/student' },
      { email: 'test@apc.edu.ph', password: 'test123', route: '/professor' }
    ];

    // Check if credentials match
    const matchedCredential = validCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (matchedCredential) {
      setMessageBar({ visible: false, message: '' });
      localStorage.setItem('userEmail', email);
      navigate(matchedCredential.route);
      return;
    }

    // Check email domain and password for general pattern matching
    if (password === 'test123') {
      if (email.endsWith('@student.apc.edu.ph')) {
        setMessageBar({ visible: false, message: '' });
        localStorage.setItem('userEmail', email);
        navigate('/student');
        return;
      } else if (email.endsWith('@apc.edu.ph')) {
        setMessageBar({ visible: false, message: '' });
        localStorage.setItem('userEmail', email);
        navigate('/professor');
        return;
      }
    }

    // Invalid credentials
    setMessageBar({ visible: true, message: 'Invalid email or password.' });
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.title}>AttendEase</div>
        <Text className={styles.subtitle}>
          
        </Text>
        
        <div className={styles.loginSection}>
          <Label htmlFor="email-input">Email</Label>
          <Input 
            id="email-input" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Enter your email" 
            className={styles.inputField}
          />
          
          <Label htmlFor="password-input">Password</Label>
          <Input 
            id="password-input" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
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
        </div>
        
        {messageBar.visible && (
          <MessageBar intent="error">
            <MessageBarBody>{messageBar.message}</MessageBarBody>
          </MessageBar>
        )}
        
        <Checkbox 
          label={(
            <Text>
              I accept the <a href="#" onClick={(e) => { e.preventDefault(); setIsTermsDialogOpen(true); }}>Terms of Service</a>
            </Text>
          )}
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className={styles.termsCheckbox}
        />
      </Card>
      
      <Dialog open={isTermsDialogOpen} onOpenChange={(event, data) => setIsTermsDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Text>
                <h3 style={{ marginTop: 0 }}>Terms and Conditions</h3>
                <p><strong>Last Updated:</strong> January 15, 2025</p>

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
              </Text>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsTermsDialogOpen(false)}>Close</Button>
              <Button 
                appearance="primary" 
                onClick={() => {
                  setAcceptedTerms(true);
                  setIsTermsDialogOpen(false);
                }}
              >
                Accept
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default Landing;

