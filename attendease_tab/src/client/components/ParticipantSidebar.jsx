import React from 'react';
import {
  Card,
  Text,
  makeStyles,
  shorthands,
  Badge
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    height: '100%'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px')
  },
  participantList: {
    maxHeight: '240px',
    overflowY: 'auto',
    ...shorthands.border('1px', 'solid', '#e6e6e6'),
    borderRadius: '8px',
    ...shorthands.padding('10px'),
    backgroundColor: '#fafafa'
  },
  participantItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    ...shorthands.padding('8px'),
    backgroundColor: '#fff',
    borderRadius: '6px',
    ...shorthands.margin('4px', '0'),
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  placeholderItem: {
    ...shorthands.padding('8px'),
    ...shorthands.border('1px', 'dashed', '#ccc'),
    borderRadius: '6px',
    backgroundColor: '#f0f0f0',
    color: '#777',
    textAlign: 'center'
  }
});

function ParticipantList({ title, participants, placeholderText, badgeColor = 'informative' }) {
  const styles = useStyles();
  return (
    <div className={styles.section}>
      <div className={styles.label}>
        <Text weight="semibold">{title}</Text>
        <Badge appearance="filled" color={badgeColor}>
          {participants.length}
        </Badge>
      </div>
      <div className={styles.participantList}>
        {participants.length === 0 ? (
          <div className={styles.placeholderItem}>{placeholderText}</div>
        ) : (
          participants.map((participant, index) => (
            <div key={`${title}-${index}`} className={styles.participantItem}>
              <Text weight="semibold">{participant.name || participant.email || 'Unnamed Participant'}</Text>
              {participant.detectedTime && (
                <Text size={200}>Detected: {participant.detectedTime}</Text>
              )}
              {participant.status && (
                <Text size={200}>Status: {participant.status}</Text>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ParticipantSidebar({ onsiteParticipants, unknownParticipants }) {
  const styles = useStyles();
  return (
    <Card className={styles.container}>
      <ParticipantList
        title="Onsite"
        participants={onsiteParticipants}
        placeholderText="Onsite participants will appear here."
        badgeColor="informative"
      />
      <ParticipantList
        title="Unknown"
        participants={unknownParticipants}
        placeholderText="Any unidentified faces will be listed here."
        badgeColor="important"
      />
    </Card>
  );
}

export default ParticipantSidebar;


