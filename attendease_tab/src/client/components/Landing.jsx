import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card,
  Button,
  makeStyles,
  shorthands,
  Text
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
  }
});

function Landing() {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.title}>AttendEase</div>
        <Text className={styles.subtitle}>
          test
        </Text>
        
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
    </div>
  );
}

export default Landing;

