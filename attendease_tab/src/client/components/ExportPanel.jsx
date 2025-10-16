import React, { useState } from 'react';
import {
  makeStyles,
  Button,
  Text,
  shorthands,
  Divider
} from '@fluentui/react-components';
import { ArrowDownload24Regular, ChevronDown20Regular, ChevronUp20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', '#e6e6e6'),
    overflow: 'hidden',
    marginTop: '20px'
  },
  trigger: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    ...shorthands.padding('12px', '16px'),
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    textAlign: 'left'
  },
  triggerText: {
    display: 'flex',
    flexDirection: 'column'
  },
  panel: {
    backgroundColor: '#fff',
    ...shorthands.padding('16px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    borderTop: '1px solid #e6e6e6'
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px')
  }
});

function ExportPanel({ onExport, disabled }) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(prev => !prev)}
      >
        <div className={styles.triggerText}>
          <Text weight="semibold">Export Options</Text>
          <Text size={200}>Download attendance records as CSV.</Text>
        </div>
        {open ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
      </button>

      {open && (
        <div className={styles.panel}>
          <Text size={200} style={{ marginBottom: '12px' }}>
            Generates a CSV report combining onsite and unknown participants captured during this session.
          </Text>
          <Button
            appearance="primary"
            onClick={onExport}
            disabled={disabled}
            icon={<ArrowDownload24Regular />}
            style={{ maxWidth: '200px' }}
          >
            Export as CSV
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExportPanel;


