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
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
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
  buttonContainer: {
    display: 'flex',
    ...shorthands.gap('20px'),
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    minWidth: '200px',
    height: '50px',
    fontSize: '16px'
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
    fontSize: '16px'
  },
  termsCheckbox: {
    marginBottom: '20px'
  },
  accordion: {
    width: '100%',
    marginTop: '20px',
    marginBottom: '20px'
  },
  accordionPanel: {
    maxHeight: '200px', // Adjust this value as needed
    overflowY: 'auto',
    ...shorthands.padding('0px', '10px')
  },
  boldText: {
    fontWeight: 'bold'
  }
});

function Landing() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [isTermsAccordionOpen, setIsTermsAccordionOpen] = React.useState(false);
  const [messageBar, setMessageBar] = React.useState({ visible: false, message: '' });

  const handleLogin = () => {
    if (!acceptedTerms) {
      setMessageBar({ visible: true, message: 'Please accept the terms of service.' });
      return;
    }
    setMessageBar({ visible: false, message: '' }); // Clear message on successful attempt
    console.log('Login attempt with:', { email, password, acceptedTerms });
    // Add actual login logic here later
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
              I accept the <a href="#" onClick={(e) => { e.preventDefault(); setIsTermsAccordionOpen(!isTermsAccordionOpen); }}>Terms of Service</a>
            </Text>
          )}
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className={styles.termsCheckbox}
        />
        
        <div className={styles.buttonContainer}>
          <Button 
            appearance="primary" 
            size="large"
            className={styles.button}
            onClick={() => navigate('/student')}
          >
            Student Portal
          </Button>
          
          <Button 
            appearance="primary" 
            size="large"
            className={styles.button}
            onClick={() => navigate('/professor')}
          >
            Professor Dashboard
          </Button>
        </div>
      </Card>
      
      <Accordion 
        className={styles.accordion} 
        collapsible
        openItems={isTermsAccordionOpen ? ['terms'] : []}
        onToggle={() => setIsTermsAccordionOpen(!isTermsAccordionOpen)}
      >
        <AccordionItem value="terms">
          <AccordionHeader><Text className={styles.boldText}>Terms of Service</Text></AccordionHeader>
          <AccordionPanel className={styles.accordionPanel}>
            <Text>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default Landing;

