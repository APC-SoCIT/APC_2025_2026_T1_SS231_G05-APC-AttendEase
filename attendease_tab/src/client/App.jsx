import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { app as teamsApp } from '@microsoft/teams-js';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import Landing from './components/Landing';
import StudentPortal from './components/StudentPortal';
import ProfessorDashboard from './components/ProfessorDashboard';

function App() {
  const [userContext, setUserContext] = useState(null);
  const [isTeamsEnvironment, setIsTeamsEnvironment] = useState(false);

  useEffect(() => {
    // Try to initialize Teams SDK (gracefully handle browser mode)
    teamsApp.initialize()
      .then(() => {
        setIsTeamsEnvironment(true);
        return teamsApp.getContext();
      })
      .then((context) => {
        console.log('Teams context:', context);
        setUserContext(context);
      })
      .catch(error => {
        console.log('Running in browser mode (not Teams):', error.message);
        setIsTeamsEnvironment(false);
      });
  }, []);

  return (
    <FluentProvider theme={webLightTheme}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/professor" element={<ProfessorDashboard userContext={userContext} isTeamsEnvironment={isTeamsEnvironment} />} />
        </Routes>
      </Router>
    </FluentProvider>
  );
}

export default App;
