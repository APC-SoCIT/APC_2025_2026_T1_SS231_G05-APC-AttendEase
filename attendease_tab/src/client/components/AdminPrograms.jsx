import React from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Input,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  DialogContent,
  Label
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Search24Regular,
  BookOpen24Regular,
} from '@fluentui/react-icons';
import { fetchPrograms, createProgram, updateProgram, deleteProgram } from '../../services/supabase/referenceData.js';
import { insertLog } from '../../services/supabase/logService.js';
import AdminShell from './AdminShell';

const useStyles = makeStyles({
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  controls: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
  },
  listHeader: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 120px',
    ...shorthands.gap('16px'),
    ...shorthands.padding('10px', '16px'),
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  listHeaderLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  programList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
  },
  programRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 120px',
    ...shorthands.gap('16px'),
    alignItems: 'center',
    ...shorthands.padding('14px', '16px'),
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', '#f0f0f0'),
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: '150ms',
    '&:hover': {
      backgroundColor: '#f8fafc',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr auto',
    },
  },
  abbrBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('4px'),
  },
  dialogSurface: {
    borderRadius: '16px',
    maxWidth: '480px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  },
  dialogTitleRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  dialogTitleIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('14px'),
    marginTop: '4px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  dialogActionsRow: {
    ...shorthands.borderTop('1px', 'solid', '#e2e8f0'),
    paddingTop: '16px',
    marginTop: '4px',
  },
  deleteWarning: {
    backgroundColor: '#fef2f2',
    ...shorthands.padding('12px', '16px'),
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', '#fecaca'),
    fontSize: '14px',
    color: '#991b1b',
    lineHeight: '1.5',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('40px'),
    ...shorthands.gap('8px'),
    color: '#94a3b8',
  },
});

export default function AdminPrograms() {
  const styles = useStyles();

  const [programs, setPrograms] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingProgram, setEditingProgram] = React.useState(null);
  const [programToDelete, setProgramToDelete] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [newProgram, setNewProgram] = React.useState({
    name: '',
    abbreviation: ''
  });

  // Load programs on component mount
  React.useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setIsLoading(true);
    setError(null);
    const { success, data, error: fetchError } = await fetchPrograms();

    if (success) {
      setPrograms(data);
    } else {
      setError(fetchError);
      console.error('Failed to load programs:', fetchError);
    }
    setIsLoading(false);
  };

  const handleAddProgram = async () => {
    if (!newProgram.name.trim() || !newProgram.abbreviation.trim()) {
      setError('Program name and abbreviation are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    const { success, data, error: createError } = await createProgram(newProgram);

    if (success) {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'PROGRAM_CREATED',
        description: `Created program ${newProgram.abbreviation} (${newProgram.name})`,
        performed_by: adminSession.user_id || null,
        metadata: { program_id: data.id, name: newProgram.name, abbreviation: newProgram.abbreviation }
      });
      setPrograms([...programs, data]);
      setIsAddDialogOpen(false);
      setNewProgram({ name: '', abbreviation: '' });
      console.log('✅ Program added successfully');
    } else {
      setError(createError);
      console.error('Failed to create program:', createError);
    }
    setIsLoading(false);
  };

  const handleEditClick = (program) => {
    setEditingProgram({ ...program });
  };

  const handleSaveEdit = async () => {
    if (!editingProgram.name.trim() || !editingProgram.abbreviation.trim()) {
      setError('Program name and abbreviation are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    const { success, data, error: updateError } = await updateProgram(
      editingProgram.id,
      {
        name: editingProgram.name,
        abbreviation: editingProgram.abbreviation
      }
    );

    if (success) {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'PROGRAM_UPDATED',
        description: `Updated program ${editingProgram.abbreviation} (${editingProgram.name})`,
        performed_by: adminSession.user_id || null,
        metadata: { program_id: editingProgram.id, name: editingProgram.name, abbreviation: editingProgram.abbreviation }
      });
      setPrograms(programs.map(p => p.id === editingProgram.id ? data : p));
      setEditingProgram(null);
      console.log('✅ Program updated successfully');
    } else {
      setError(updateError);
      console.error('Failed to update program:', updateError);
    }
    setIsLoading(false);
  };

  const handleDeleteClick = (program) => {
    setProgramToDelete(program);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);
    const { success, error: deleteError } = await deleteProgram(programToDelete.id);

    if (success) {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'PROGRAM_DELETED',
        description: `Deleted program ${programToDelete.abbreviation} (${programToDelete.name})`,
        performed_by: adminSession.user_id || null,
        metadata: { program_id: programToDelete.id, name: programToDelete.name, abbreviation: programToDelete.abbreviation }
      });
      setPrograms(programs.filter(p => p.id !== programToDelete.id));
      setProgramToDelete(null);
      console.log('✅ Program deleted successfully');
    } else {
      setError(deleteError);
      console.error('Failed to delete program:', deleteError);
    }
    setIsLoading(false);
  };

  return (
    <AdminShell>
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
          <Text>Error: {error}</Text>
        </div>
      )}

      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <Text size={600} weight="bold">Manage Programs</Text>
          <Text size={200} style={{ color: '#64748b' }}>Add, edit, and remove academic degree programs.</Text>
        </div>
        <div className={styles.controls}>
          <Button icon={<Add24Regular />} appearance="primary" onClick={() => setIsAddDialogOpen(true)} disabled={isLoading}>
            Add Program
          </Button>
          <Input
            contentBefore={<Search24Regular />}
            placeholder="Search programs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Text>Loading programs...</Text>
        </div>
      ) : (() => {
        const filtered = programs.filter(program => {
          const searchRegex = new RegExp(searchText, 'i');
          return searchRegex.test(program.name) || searchRegex.test(program.abbreviation || '');
        });
        if (filtered.length === 0) {
          return (
            <div className={styles.emptyState}>
              <BookOpen24Regular style={{ width: 40, height: 40 }} />
              <Text weight="semibold">No programs found</Text>
              <Text size={200}>Add a program or adjust your search.</Text>
            </div>
          );
        }
        return (
          <>
            <div className={styles.listHeader}>
              <Text className={styles.listHeaderLabel}>Abbreviation</Text>
              <Text className={styles.listHeaderLabel}>Program Name</Text>
              <Text className={styles.listHeaderLabel} style={{ textAlign: 'right' }}>Actions</Text>
            </div>
            <div className={styles.programList}>
              {filtered.map(program => (
                <div key={program.id} className={styles.programRow}>
                  <div className={styles.abbrBadge}>
                    <div className={styles.iconBadge}>
                      <BookOpen24Regular style={{ color: '#10b981', width: 18, height: 18 }} />
                    </div>
                    <Text weight="semibold" size={300}>{program.abbreviation}</Text>
                  </div>
                  <Text size={300} style={{ color: '#334155' }}>{program.name}</Text>
                  <div className={styles.actions}>
                    <Button
                      icon={<Edit24Regular />}
                      appearance="subtle"
                      size="small"
                      onClick={() => handleEditClick(program)}
                      disabled={isLoading}
                    />
                    <Button
                      icon={<Delete24Regular />}
                      appearance="subtle"
                      size="small"
                      onClick={() => handleDeleteClick(program)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(event, data) => setIsAddDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#eef2ff' }}>
                  <Add24Regular style={{ color: '#4f46e5', width: 20, height: 20 }} />
                </div>
                Add New Program
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label className={styles.formLabel}>Abbreviation</Label>
              <Input
                value={newProgram.abbreviation}
                onChange={(e, data) => setNewProgram({ ...newProgram, abbreviation: data.value })}
                placeholder="e.g., BSCS-SS"
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Full Program Name</Label>
              <Input
                value={newProgram.name}
                onChange={(e, data) => setNewProgram({ ...newProgram, name: data.value })}
                placeholder="e.g., Bachelor of Science in Computer Science"
                disabled={isLoading}
              />
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddProgram} disabled={isLoading}>Add</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProgram} onOpenChange={(event, data) => { if (!data.open) setEditingProgram(null); }}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#fef3c7' }}>
                  <Edit24Regular style={{ color: '#d97706', width: 20, height: 20 }} />
                </div>
                Edit Program
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label className={styles.formLabel}>Abbreviation</Label>
              <Input
                value={editingProgram?.abbreviation || ''}
                onChange={(e, data) => setEditingProgram({ ...editingProgram, abbreviation: data.value })}
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Full Program Name</Label>
              <Input
                value={editingProgram?.name || ''}
                onChange={(e, data) => setEditingProgram({ ...editingProgram, name: data.value })}
                disabled={isLoading}
              />
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setEditingProgram(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit} disabled={isLoading}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!programToDelete} onOpenChange={(event, data) => { if (!data.open) setProgramToDelete(null); }}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#fef2f2' }}>
                  <Delete24Regular style={{ color: '#ef4444', width: 20, height: 20 }} />
                </div>
                Confirm Deletion
              </div>
            </DialogTitle>
            <DialogContent>
              <div className={styles.deleteWarning}>
                Are you sure you want to delete <Text weight="semibold">{programToDelete?.abbreviation}</Text> ({programToDelete?.name})? This action cannot be undone.
              </div>
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setProgramToDelete(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleConfirmDelete} disabled={isLoading}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </AdminShell>
  );
}
