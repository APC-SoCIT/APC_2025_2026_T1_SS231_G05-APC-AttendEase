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
  }
});

function ExportPanel({ onExport }) {
  const styles = useStyles();

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <Text weight="semibold" size={400}>Export Options</Text>
          <Text size={200}>Download attendance records as CSV.</Text>
        </div>
        <Text size={200} style={{ color: '#666' }}>
          Generates a CSV report combining onsite and unknown participants captured during this session.
        </Text>
        <Button
          appearance="primary"
          onClick={onExport}
          icon={<ArrowDownload24Regular />}
          style={{ maxWidth: '200px' }}
        >
          Export as CSV
        </Button>
      </div>
    </Card>
  );
}

export default ExportPanel;
