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
  Label,
  Badge,
  Spinner,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Search24Regular,
  Grid24Regular,
  ChevronDown24Regular,
  ChevronUp24Regular,
  People24Regular,
} from '@fluentui/react-icons';
import {
  fetchSections,
  createSection,
  updateSection,
  deleteSection,
  fetchStudentsBySection,
  fetchStudentCountsBySection,
} from '../../services/supabase/referenceData.js';
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
    gridTemplateColumns: '1fr 120px 160px 120px',
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
  sectionList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
  },
  sectionRowWrapper: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', '#f0f0f0'),
    transitionProperty: 'box-shadow',
    transitionDuration: '150ms',
    '&:hover': {
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
  },
  sectionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 160px 120px',
    ...shorthands.gap('16px'),
    alignItems: 'center',
    ...shorthands.padding('14px', '16px'),
    cursor: 'pointer',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr auto',
    },
  },
  sectionInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#ecfeff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  studentCountBadge: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    color: '#64748b',
    fontSize: '13px',
  },
  dateBadge: {
    fontSize: '13px',
    color: '#64748b',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap('4px'),
  },
  // Expanded student panel
  studentPanel: {
    ...shorthands.padding('0', '16px', '16px', '16px'),
    ...shorthands.borderTop('1px', 'solid', '#f0f0f0'),
  },
  studentTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
  },
  studentTableHead: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', '#e2e8f0'),
  },
  studentTableCell: {
    fontSize: '13px',
    color: '#334155',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', '#f1f5f9'),
  },
  studentEmptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('20px'),
    color: '#94a3b8',
    fontSize: '13px',
  },
  // Dialogs
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

export default function AdminSections() {
  const styles = useStyles();

  const [sections, setSections] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState(null);
  const [sectionToDelete, setSectionToDelete] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Student-related state
  const [studentCounts, setStudentCounts] = React.useState({}); // { sectionId: count }
  const [expandedSectionId, setExpandedSectionId] = React.useState(null);
  const [expandedStudents, setExpandedStudents] = React.useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(false);

  const [newSection, setNewSection] = React.useState({
    name: ''
  });

  // Load sections + student counts on mount
  React.useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setIsLoading(true);
    setError(null);

    const [sectionsResult, countsResult] = await Promise.all([
      fetchSections(),
      fetchStudentCountsBySection(),
    ]);

    if (sectionsResult.success) {
      setSections(sectionsResult.data);
    } else {
      setError(sectionsResult.error);
      console.error('Failed to load sections:', sectionsResult.error);
    }

    if (countsResult.success) {
      setStudentCounts(countsResult.data);
    }

    setIsLoading(false);
  };

  const handleToggleExpand = async (sectionId) => {
    if (expandedSectionId === sectionId) {
      // Collapse
      setExpandedSectionId(null);
      setExpandedStudents([]);
      return;
    }

    // Expand and load students
    setExpandedSectionId(sectionId);
    setIsLoadingStudents(true);
    setExpandedStudents([]);

    const { success, data } = await fetchStudentsBySection(sectionId);
    if (success) {
      setExpandedStudents(data);
    }
    setIsLoadingStudents(false);
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
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'SECTION_CREATED',
        description: `Created section ${newSection.name}`,
        performed_by: adminSession.user_id || null,
        metadata: { section_id: data.id, name: newSection.name }
      });
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

  const handleEditClick = (section, e) => {
    e.stopPropagation();
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
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'SECTION_UPDATED',
        description: `Updated section ${editingSection.name}`,
        performed_by: adminSession.user_id || null,
        metadata: { section_id: editingSection.id, name: editingSection.name }
      });
      setSections(sections.map(s => s.id === editingSection.id ? data : s));
      setEditingSection(null);
      console.log('✅ Section updated successfully');
    } else {
      setError(updateError);
      console.error('Failed to update section:', updateError);
    }
    setIsLoading(false);
  };

  const handleDeleteClick = (section, e) => {
    e.stopPropagation();
    setSectionToDelete(section);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);
    const { success, error: deleteError } = await deleteSection(sectionToDelete.id);

    if (success) {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'SECTION_DELETED',
        description: `Deleted section ${sectionToDelete.name}`,
        performed_by: adminSession.user_id || null,
        metadata: { section_id: sectionToDelete.id, name: sectionToDelete.name }
      });
      setSections(sections.filter(s => s.id !== sectionToDelete.id));
      // Clean up expanded state if this section was expanded
      if (expandedSectionId === sectionToDelete.id) {
        setExpandedSectionId(null);
        setExpandedStudents([]);
      }
      // Remove from counts
      setStudentCounts(prev => {
        const updated = { ...prev };
        delete updated[sectionToDelete.id];
        return updated;
      });
      setSectionToDelete(null);
      console.log('✅ Section deleted successfully');
    } else {
      setError(deleteError);
      console.error('Failed to delete section:', deleteError);
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
          <Text size={600} weight="bold">Manage Sections</Text>
          <Text size={200} style={{ color: '#64748b' }}>Organize and configure block sections. Click a row to view enrolled students.</Text>
        </div>
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

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Text>Loading sections...</Text>
        </div>
      ) : (() => {
        const filtered = sections.filter(section => {
          const searchRegex = new RegExp(searchText, 'i');
          return searchRegex.test(section.name);
        });
        if (filtered.length === 0) {
          return (
            <div className={styles.emptyState}>
              <Grid24Regular style={{ width: 40, height: 40 }} />
              <Text weight="semibold">No sections found</Text>
              <Text size={200}>Add a section or adjust your search.</Text>
            </div>
          );
        }
        return (
          <>
            <div className={styles.listHeader}>
              <Text className={styles.listHeaderLabel}>Section Name</Text>
              <Text className={styles.listHeaderLabel}>Students</Text>
              <Text className={styles.listHeaderLabel}>Created</Text>
              <Text className={styles.listHeaderLabel} style={{ textAlign: 'right' }}>Actions</Text>
            </div>
            <div className={styles.sectionList}>
              {filtered.map(section => {
                const count = studentCounts[section.id] || 0;
                const isExpanded = expandedSectionId === section.id;
                return (
                  <div key={section.id} className={styles.sectionRowWrapper}>
                    <div
                      className={styles.sectionRow}
                      onClick={() => handleToggleExpand(section.id)}
                      title="Click to view students"
                    >
                      <div className={styles.sectionInfo}>
                        <div className={styles.iconBadge}>
                          {isExpanded
                            ? <ChevronUp24Regular style={{ color: '#06b6d4', width: 18, height: 18 }} />
                            : <ChevronDown24Regular style={{ color: '#06b6d4', width: 18, height: 18 }} />
                          }
                        </div>
                        <Text weight="semibold" size={300}>{section.name}</Text>
                      </div>
                      <div className={styles.studentCountBadge}>
                        <People24Regular style={{ width: 16, height: 16 }} />
                        <Badge
                          appearance="filled"
                          color={count > 0 ? 'brand' : 'informative'}
                          size="small"
                        >
                          {count} {count === 1 ? 'student' : 'students'}
                        </Badge>
                      </div>
                      <Text className={styles.dateBadge}>
                        {new Date(section.created_at).toLocaleDateString()}
                      </Text>
                      <div className={styles.actions}>
                        <Button
                          icon={<Edit24Regular />}
                          appearance="subtle"
                          size="small"
                          onClick={(e) => handleEditClick(section, e)}
                          disabled={isLoading}
                        />
                        <Button
                          icon={<Delete24Regular />}
                          appearance="subtle"
                          size="small"
                          onClick={(e) => handleDeleteClick(section, e)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Expanded student panel */}
                    {isExpanded && (
                      <div className={styles.studentPanel}>
                        {isLoadingStudents ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '8px' }}>
                            <Spinner size="tiny" />
                            <Text size={200} style={{ color: '#64748b' }}>Loading students...</Text>
                          </div>
                        ) : expandedStudents.length === 0 ? (
                          <div className={styles.studentEmptyState}>
                            <People24Regular style={{ width: 20, height: 20, marginRight: 8 }} />
                            <Text>No students enrolled in this section.</Text>
                          </div>
                        ) : (
                          <table className={styles.studentTable}>
                            <thead>
                              <tr>
                                <th className={styles.studentTableHead}>#</th>
                                <th className={styles.studentTableHead}>Student Number</th>
                                <th className={styles.studentTableHead}>Name</th>
                                <th className={styles.studentTableHead}>Email</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedStudents.map((student, idx) => (
                                <tr key={student.user_id}>
                                  <td className={styles.studentTableCell}>{idx + 1}</td>
                                  <td className={styles.studentTableCell}>
                                    <Text weight="semibold">{student.student_number || '—'}</Text>
                                  </td>
                                  <td className={styles.studentTableCell}>
                                    {student.last_name}, {student.first_name}
                                  </td>
                                  <td className={styles.studentTableCell}>
                                    <Text style={{ color: '#64748b' }}>{student.email || '—'}</Text>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                Add New Section
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label className={styles.formLabel}>Section Name (Unique)</Label>
              <Input
                value={newSection.name}
                onChange={(e, data) => setNewSection({ name: data.value })}
                placeholder="e.g., BSCS-SS231"
                disabled={isLoading}
              />
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddSection} disabled={isLoading}>Add</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(event, data) => { if (!data.open) setEditingSection(null); }}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#fef3c7' }}>
                  <Edit24Regular style={{ color: '#d97706', width: 20, height: 20 }} />
                </div>
                Edit Section
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label className={styles.formLabel}>Section Name</Label>
              <Input
                value={editingSection?.name || ''}
                onChange={(e, data) => setEditingSection({ ...editingSection, name: data.value })}
                disabled={isLoading}
              />
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setEditingSection(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit} disabled={isLoading}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!sectionToDelete} onOpenChange={(event, data) => { if (!data.open) setSectionToDelete(null); }}>
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
                Are you sure you want to delete the section <Text weight="semibold">"{sectionToDelete?.name}"</Text>? This action cannot be undone.
              </div>
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setSectionToDelete(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleConfirmDelete} disabled={isLoading}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </AdminShell>
  );
}