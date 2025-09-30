import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { app as teamsApp } from '@microsoft/teams-js';
import App from './App';
import './styles/app.css';

// Initialize Teams SDK
teamsApp.initialize().then(() => {
  teamsApp.notifySuccess();
}).catch(error => {
  console.error('Teams initialization error:', error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  </React.StrictMode>
);
