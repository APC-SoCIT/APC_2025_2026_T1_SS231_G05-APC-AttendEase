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
  Select,
  Label,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Search24Regular,
  BookOpen24Regular,
  Beaker24Regular,
} from '@fluentui/react-icons';
import { fetchCourses, createCourse, updateCourse, deleteCourse } from '../../services/supabase/referenceData.js';
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
    gridTemplateColumns: '1fr 100px 80px 120px',
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
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
  },
  courseRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 80px 120px',
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
  courseInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#f5f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  courseDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  unitsBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('2px', '10px'),
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
  labBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('2px', '10px'),
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
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

export default function AdminCourses() {
  const styles = useStyles();

  const [courses, setCourses] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState(null);
  const [courseToDelete, setCourseToDelete] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  const [newCourse, setNewCourse] = React.useState({
    course_code: '',
    description: '',
    units: 3,
    is_laboratory: false
  });

  // Load courses on component mount
  React.useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);
    const { success, data, error: fetchError } = await fetchCourses();
    
    if (success) {
      setCourses(data);
    } else {
      setError(fetchError);
      console.error('Failed to load courses:', fetchError);
    }
    setIsLoading(false);
  };

  const handleAddCourse = async () => {
    if (!newCourse.course_code.trim()) {
      setError('Course code is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    const { success, data, error: createError } = await createCourse(newCourse);
    
    if (success) {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'COURSE_CREATED',
        description: `Created course ${newCourse.course_code}`,
        performed_by: adminSession.user_id || null,
        metadata: { course_id: data.id, course_code: newCourse.course_code }
      });
      setCourses([...courses, data]);
      setIsAddDialogOpen(false);
      setNewCourse({ course_code: '', description: '', units: 3, is_laboratory: false });
      console.log('✅ Course added successfully');
    } else {
      setError(createError);
      console.error('Failed to create course:', createError);
    }
    setIsLoading(false);
  };

  const handleEditClick = (course) => {
    setEditingCourse({ ...course });
  };

  const handleSaveEdit = async () => {
    if (!editingCourse.course_code.trim()) {
      setError('Course code is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    const { success, data, error: updateError } = await updateCourse(
      editingCourse.id,
      {
        course_code: editingCourse.course_code,
        description: editingCourse.description,
        units: editingCourse.units,
        is_laboratory: editingCourse.is_laboratory
      }
    );
    
    if (success) {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'COURSE_UPDATED',
        description: `Updated course ${editingCourse.course_code}`,
        performed_by: adminSession.user_id || null,
        metadata: { course_id: editingCourse.id, course_code: editingCourse.course_code }
      });
      setCourses(courses.map(c => c.id === editingCourse.id ? data : c));
      setEditingCourse(null);
      console.log('✅ Course updated successfully');
    } else {
      setError(updateError);
      console.error('Failed to update course:', updateError);
    }
    setIsLoading(false);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);
    const { success, error: deleteError } = await deleteCourse(courseToDelete.id);
    
    if (success) {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'COURSE_DELETED',
        description: `Deleted course ${courseToDelete.course_code}`,
        performed_by: adminSession.user_id || null,
        metadata: { course_id: courseToDelete.id, course_code: courseToDelete.course_code }
      });
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      setCourseToDelete(null);
      console.log('✅ Course deleted successfully');
    } else {
      setError(deleteError);
      console.error('Failed to delete course:', deleteError);
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
          <Text size={600} weight="bold">Manage Courses</Text>
          <Text size={200} style={{ color: '#64748b' }}>View and manage course offerings.</Text>
        </div>
        <div className={styles.controls}>
          <Button icon={<Add24Regular />} appearance="primary" onClick={() => setIsAddDialogOpen(true)} disabled={isLoading}>
            Add Course
          </Button>
          <Input 
            contentBefore={<Search24Regular />} 
            placeholder="Search courses..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Text>Loading courses...</Text>
        </div>
      ) : (() => {
        const filtered = courses.filter(course => {
          const searchRegex = new RegExp(searchText, 'i');
          return searchRegex.test(course.course_code) || searchRegex.test(course.description || '');
        });
        if (filtered.length === 0) {
          return (
            <div className={styles.emptyState}>
              <BookOpen24Regular style={{ width: 40, height: 40 }} />
              <Text weight="semibold">No courses found</Text>
              <Text size={200}>Add a course or adjust your search.</Text>
            </div>
          );
        }
        return (
          <>
            <div className={styles.listHeader}>
              <Text className={styles.listHeaderLabel}>Course</Text>
              <Text className={styles.listHeaderLabel}>Units</Text>
              <Text className={styles.listHeaderLabel}>Lab</Text>
              <Text className={styles.listHeaderLabel} style={{ textAlign: 'right' }}>Actions</Text>
            </div>
            <div className={styles.courseList}>
              {filtered.map(course => (
                <div key={course.id} className={styles.courseRow}>
                  <div className={styles.courseInfo}>
                    <div className={styles.iconBadge}>
                      <BookOpen24Regular style={{ color: '#8b5cf6', width: 18, height: 18 }} />
                    </div>
                    <div className={styles.courseDetails}>
                      <Text weight="semibold" size={300}>{course.course_code}</Text>
                      <Text size={200} style={{ color: '#64748b' }}>{course.description}</Text>
                    </div>
                  </div>
                  <span className={styles.unitsBadge}>{course.units}</span>
                  <span
                    className={styles.labBadge}
                    style={{
                      backgroundColor: course.is_laboratory ? '#ecfdf5' : '#f8fafc',
                      color: course.is_laboratory ? '#059669' : '#94a3b8',
                    }}
                  >
                    {course.is_laboratory ? 'Yes' : 'No'}
                  </span>
                  <div className={styles.actions}>
                    <Button
                      icon={<Edit24Regular />}
                      appearance="subtle"
                      size="small"
                      onClick={() => handleEditClick(course)}
                      disabled={isLoading}
                    />
                    <Button
                      icon={<Delete24Regular />}
                      appearance="subtle"
                      size="small"
                      onClick={() => handleDeleteClick(course)}
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
                Add New Course
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label className={styles.formLabel}>Course Code (Unique)</Label>
              <Input 
                value={newCourse.course_code} 
                onChange={(e, data) => setNewCourse({...newCourse, course_code: data.value})} 
                placeholder="e.g., CS101"
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Description</Label>
              <Input 
                value={newCourse.description} 
                onChange={(e, data) => setNewCourse({...newCourse, description: data.value})} 
                placeholder="Course description"
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Units</Label>
              <Input 
                type="number"
                value={newCourse.units.toString()} 
                onChange={(e, data) => setNewCourse({...newCourse, units: parseInt(data.value) || 3})} 
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Is Laboratory?</Label>
              <Select 
                value={newCourse.is_laboratory ? 'true' : 'false'} 
                onChange={(e, data) => setNewCourse({...newCourse, is_laboratory: data.value === 'true'})}
                disabled={isLoading}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddCourse} disabled={isLoading}>Add</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={(event, data) => { if (!data.open) setEditingCourse(null); }}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#fef3c7' }}>
                  <Edit24Regular style={{ color: '#d97706', width: 20, height: 20 }} />
                </div>
                Edit Course
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label className={styles.formLabel}>Course Code</Label>
              <Input 
                value={editingCourse?.course_code || ''} 
                onChange={(e, data) => setEditingCourse({...editingCourse, course_code: data.value})}
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Description</Label>
              <Input 
                value={editingCourse?.description || ''} 
                onChange={(e, data) => setEditingCourse({...editingCourse, description: data.value})}
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Units</Label>
              <Input 
                type="number"
                value={(editingCourse?.units || 3).toString()} 
                onChange={(e, data) => setEditingCourse({...editingCourse, units: parseInt(data.value) || 3})}
                disabled={isLoading}
              />
              <Label className={styles.formLabel}>Is Laboratory?</Label>
              <Select 
                value={(editingCourse?.is_laboratory ? 'true' : 'false')} 
                onChange={(e, data) => setEditingCourse({...editingCourse, is_laboratory: data.value === 'true'})}
                disabled={isLoading}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setEditingCourse(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit} disabled={isLoading}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!courseToDelete} onOpenChange={(event, data) => { if (!data.open) setCourseToDelete(null); }}>
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
                Are you sure you want to delete <Text weight="semibold">{courseToDelete?.course_code}</Text>? This action cannot be undone.
              </div>
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setCourseToDelete(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleConfirmDelete} disabled={isLoading}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </AdminShell>
  );
}