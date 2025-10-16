import React from 'react';
import {
  Card,
  makeStyles,
  shorthands,
  Text,
  Badge
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px'),
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    border: '1px dashed #ccc'
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px')
  }
});

function OnlineAttendancePlaceholder() {
  const styles = useStyles();

  return (
    <Card className={styles.container}>
      <div className={styles.placeholder}>
        <Text weight="semibold">Online Attendance (Prototype)</Text>
        <Badge appearance="tint" color="subtle">Paused</Badge>
        <Text size={200}>
          Real-time Teams participant tracking is temporarily disabled in this prototype build.
        </Text>
        <Text size={200}>
          The UI will be re-enabled once Graph API integration stabilizes.
        </Text>
      </div>
    </Card>
  );
}

export default OnlineAttendancePlaceholder;
