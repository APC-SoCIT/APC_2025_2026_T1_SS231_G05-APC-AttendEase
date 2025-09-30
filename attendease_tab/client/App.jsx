import React, { useState, useEffect } from 'react';
import { app as teamsApp } from '@microsoft/teams-js';
import { 
  TabList, 
  Tab,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import ProfessorDashboard from './components/ProfessorDashboard';

const useStyles = makeStyles({
  root: {
    ...shorthands.padding('20px'),
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    ...shorthands.margin('0', '0', '20px', '0'),
    color: '#2c3e50'
  },
  tabList: {
    ...shorthands.margin('0', '0', '20px', '0')
  }
});

function App() {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState('professor');
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    teamsApp.getContext().then((context) => {
      console.log('Teams context:', context);
      setUserContext(context);
    }).catch(error => {
      console.error('Error getting Teams context:', error);
    });
  }, []);

  return (
    <div className={styles.root}>
      <h1 className={styles.header}>AttendEase - Automated Attendance System</h1>
      
      <TabList 
        selectedValue={selectedTab} 
        onTabSelect={(_, data) => setSelectedTab(data.value)}
        className={styles.tabList}
      >
        <Tab value="professor">Professor Dashboard</Tab>
        <Tab value="student">Student Portal</Tab>
        <Tab value="reports">Reports</Tab>
      </TabList>

      {selectedTab === 'professor' && <ProfessorDashboard userContext={userContext} />}
      {selectedTab === 'student' && <div>Student Portal (Coming Soon)</div>}
      {selectedTab === 'reports' && <div>Reports (Coming Soon)</div>}
    </div>
  );
}

export default App;
