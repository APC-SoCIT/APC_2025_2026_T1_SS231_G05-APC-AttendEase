import React from 'react';
import {
  Card,
  makeStyles,
  Button,
  Text,
  shorthands
} from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px')
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px')
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('10px')
  }
});

function ExportPanel({ onExportAttendance, onExportEngagement }) {
  const styles = useStyles();

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <Text weight="semibold" size={400}>Export Options</Text>
          <Text size={200}>Download attendance and engagement reports as separate CSV files.</Text>
        </div>
        <Text size={200} style={{ color: '#666' }}>
          Attendance CSV focuses on participation records, while Engagement CSV captures engagement state metrics for this session.
        </Text>
        <div className={styles.actions}>
        <Button
          appearance="primary"
            onClick={onExportAttendance}
            icon={<ArrowDownload24Regular />}
          >
            Generate Attendance Report
          </Button>
          <Button
            appearance="secondary"
            onClick={onExportEngagement}
          icon={<ArrowDownload24Regular />}
        >
            Generate Engagement Report
        </Button>
        </div>
      </div>
    </Card>
  );
}

export default ExportPanel;
