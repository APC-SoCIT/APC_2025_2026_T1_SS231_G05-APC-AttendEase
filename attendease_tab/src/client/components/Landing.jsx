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
      navigate(matchedCredential.route);
      return;
    }

    // Check email domain and password for general pattern matching
    if (password === 'test123') {
      if (email.endsWith('@student.apc.edu.ph')) {
        setMessageBar({ visible: false, message: '' });
        navigate('/student');
        return;
      } else if (email.endsWith('@apc.edu.ph')) {
        setMessageBar({ visible: false, message: '' });
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
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                <br /><br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                <br /><br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                <br /><br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
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

