import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Text,
  makeStyles,
  shorthands,
  MessageBar,
  MessageBarTitle
} from '@fluentui/react-components';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px')
  }
});

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'test123';

function AdminLoginModal({ open, onCancel, onSuccess }) {
  const styles = useStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const normalizedUsername = username.trim();

    if (normalizedUsername === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      onSuccess();
      setUsername('');
      setPassword('');
    } else {
      setError('Invalid admin credentials. Please try again.');
    }
  };

  const handleCancel = () => {
    setUsername('');
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <Dialog open={open} modalType="alert">
      <DialogSurface>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>Administrator Access</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Text size={200}>
                  Enter administrator credentials to open the admin dashboard.
                </Text>

                <Input
                  label="Username"
                  value={username}
                  onChange={(_, data) => setUsername(data.value)}
                  required
                  type="text"
                />

                <Input
                  label="Password"
                  value={password}
                  onChange={(_, data) => setPassword(data.value)}
                  required
                  type="password"
                />

                {error && (
                  <MessageBar intent="error">
                    <MessageBarTitle>Login failed</MessageBarTitle>
                    {error}
                  </MessageBar>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button appearance="primary" type="submit">
                Login
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}

export default AdminLoginModal;


