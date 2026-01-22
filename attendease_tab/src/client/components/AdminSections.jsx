import React from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Card,
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
  ArrowLeft24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Search24Regular,
  BookOpen24Regular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { fetchSections, createSection, updateSection, deleteSection } from '../../services/supabase/referenceData.js';

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    ...shorthands.padding('40px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  controls: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center'
  },
  sectionList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    ...shorthands.gap('20px'),
  },
  sectionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    ...shorthands.padding('16px'),
    backgroundColor: 'white',
    height: '100%',
  },
  sectionInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('12px'),
    marginBottom: '16px',
    flexGrow: 1,
  },
  sectionDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('8px'),
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
    marginTop: '10px'
  }
});

export default function AdminSections() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [sections, setSections] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState(null);
  const [sectionToDelete, setSectionToDelete] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [newSection, setNewSection] = React.useState({
    name: ''
  });

  // Load sections on component mount
  React.useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setIsLoading(true);
    setError(null);
    const { success, data, error: fetchError } = await fetchSections();

    if (success) {
      setSections(data);
    } else {
      setError(fetchError);
      console.error('Failed to load sections:', fetchError);
    }
    setIsLoading(false);
  };

  const handleAddSection = async () => {
    if (!newSection.name.trim()) {
      setError('Section name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    const { success, data, error: createError } = await createSection(newSection);

    if (success) {
      setSections([...sections, data]);
      setIsAddDialogOpen(false);
      setNewSection({ name: '' });
      console.log('✅ Section added successfully');
    } else {
      setError(createError);
      console.error('Failed to create section:', createError);
    }
    setIsLoading(false);
  };

  const handleEditClick = (section) => {
    setEditingSection({ ...section });
  };

  const handleSaveEdit = async () => {
    if (!editingSection.name.trim()) {
      setError('Section name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    const { success, data, error: updateError } = await updateSection(
      editingSection.id,
      { name: editingSection.name }
    );

    if (success) {
      setSections(sections.map(s => s.id === editingSection.id ? data : s));
      setEditingSection(null);
      console.log('✅ Section updated successfully');
    } else {
      setError(updateError);
      console.error('Failed to update section:', updateError);
    }
    setIsLoading(false);
  };

  const handleDeleteClick = (section) => {
    setSectionToDelete(section);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);
    const { success, error: deleteError } = await deleteSection(sectionToDelete.id);

    if (success) {
      setSections(sections.filter(s => s.id !== sectionToDelete.id));
      setSectionToDelete(null);
      console.log('✅ Section deleted successfully');
    } else {
      setError(deleteError);
      console.error('Failed to delete section:', deleteError);
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fed7d7', borderRadius: '4px', color: '#c53030' }}>
          <Text>Error: {error}</Text>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.topBar}>
          <Button icon={<ArrowLeft24Regular />} onClick={() => navigate('/admin')} disabled={isLoading}>
            Back to Admin
          </Button>
          <div className={styles.controls}>
            <Button icon={<Add24Regular />} appearance="primary" onClick={() => setIsAddDialogOpen(true)} disabled={isLoading}>
              Add Section
            </Button>
            <Input
              contentBefore={<Search24Regular />}
              placeholder="Search sections..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <Text size={600} weight="bold">Manage Sections</Text>
        <Text>View and manage course sections. Sections are system reference data managed by administrators only.</Text>
      </div>

      {isLoading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text>Loading sections...</Text>
        </div>
      ) : (
        <div className={styles.sectionList}>
          {sections
            .filter(section => {
              const searchRegex = new RegExp(searchText, 'i');
              return searchRegex.test(section.name);
            })
            .map(section => (
              <Card key={section.id} className={styles.sectionCard}>
                <div className={styles.sectionInfo}>
                  <div style={{ padding: '8px', backgroundColor: '#eef2ff', borderRadius: '4px' }}>
                    <BookOpen24Regular />
                  </div>
                  <div className={styles.sectionDetails}>
                    <Text weight="semibold">{section.name}</Text>
                    <Text size={200} style={{ color: '#666' }}>
                      Created: {new Date(section.created_at).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button
                    icon={<Edit24Regular />}
                    appearance="subtle"
                    onClick={() => handleEditClick(section)}
                    disabled={isLoading}
                  />
                  <Button
                    icon={<Delete24Regular />}
                    appearance="subtle"
                    onClick={() => handleDeleteClick(section)}
                    disabled={isLoading}
                  />
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(event, data) => setIsAddDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label>Section Name (Unique)</Label>
              <Input
                value={newSection.name}
                onChange={(e, data) => setNewSection({ name: data.value })}
                placeholder="e.g., BSCS-SS231"
                disabled={isLoading}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddSection} disabled={isLoading}>Add</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(event, data) => { if (!data.open) setEditingSection(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label>Section Name</Label>
              <Input
                value={editingSection?.name || ''}
                onChange={(e, data) => setEditingSection({ ...editingSection, name: data.value })}
                disabled={isLoading}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditingSection(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit} disabled={isLoading}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!sectionToDelete} onOpenChange={(event, data) => { if (!data.open) setSectionToDelete(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              Are you sure you want to delete the section "{sectionToDelete?.name}"?
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setSectionToDelete(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleConfirmDelete} disabled={isLoading}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
