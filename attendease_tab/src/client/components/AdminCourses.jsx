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
  Menu,
  MenuTrigger,
  MenuList,
  MenuPopover,
  MenuItem
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Search24Regular,
  BookOpen24Regular,
  Filter24Regular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { fetchCourses, createCourse, updateCourse, deleteCourse } from '../../services/supabase/referenceData.js';

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
  courseList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    ...shorthands.gap('20px'),
  },
  courseCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    ...shorthands.padding('16px'),
    backgroundColor: 'white',
    height: '100%',
  },
  courseInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('12px'),
    marginBottom: '16px',
    flexGrow: 1,
  },
  courseDetails: {
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

export default function AdminCourses() {
  const styles = useStyles();
  const navigate = useNavigate();
  
  const [courses, setCourses] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [filterDepartment, setFilterDepartment] = React.useState('All');
  const [filterSection, setFilterSection] = React.useState('All');
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
        <Text size={600} weight="bold">Manage Courses</Text>
        <Text>View and manage course offerings. Courses are system reference data managed by administrators only.</Text>
      </div>

      {isLoading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text>Loading courses...</Text>
        </div>
      ) : (
        <div className={styles.courseList}>
          {courses
            .filter(course => {
              const searchRegex = new RegExp(searchText, 'i');
              return searchRegex.test(course.course_code) || searchRegex.test(course.description || '');
            })
            .map(course => (
              <Card key={course.id} className={styles.courseCard}>
                <div className={styles.courseInfo}>
                  <div style={{ padding: '8px', backgroundColor: '#eef2ff', borderRadius: '4px' }}>
                    <BookOpen24Regular />
                  </div>
                  <div className={styles.courseDetails}>
                    <Text weight="semibold">{course.course_code}</Text>
                    <Text size={200}>{course.description}</Text>
                    <Text size={200} style={{ color: '#666' }}>
                      Units: {course.units} | Lab: {course.is_laboratory ? 'Yes' : 'No'}
                    </Text>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button 
                    icon={<Edit24Regular />} 
                    appearance="subtle" 
                    onClick={() => handleEditClick(course)}
                    disabled={isLoading}
                  />
                  <Button 
                    icon={<Delete24Regular />} 
                    appearance="subtle" 
                    onClick={() => handleDeleteClick(course)}
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
            <DialogTitle>Add New Course</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label>Course Code (Unique)</Label>
              <Input 
                value={newCourse.course_code} 
                onChange={(e, data) => setNewCourse({...newCourse, course_code: data.value})} 
                placeholder="e.g., CS101"
                disabled={isLoading}
              />
              <Label>Description</Label>
              <Input 
                value={newCourse.description} 
                onChange={(e, data) => setNewCourse({...newCourse, description: data.value})} 
                placeholder="Course description"
                disabled={isLoading}
              />
              <Label>Units</Label>
              <Input 
                type="number"
                value={newCourse.units.toString()} 
                onChange={(e, data) => setNewCourse({...newCourse, units: parseInt(data.value) || 3})} 
                disabled={isLoading}
              />
              <Label>Is Laboratory?</Label>
              <Select 
                value={newCourse.is_laboratory ? 'true' : 'false'} 
                onChange={(e, data) => setNewCourse({...newCourse, is_laboratory: data.value === 'true'})}
                disabled={isLoading}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddCourse} disabled={isLoading}>Add</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={(event, data) => { if (!data.open) setEditingCourse(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label>Course Code</Label>
              <Input 
                value={editingCourse?.course_code || ''} 
                onChange={(e, data) => setEditingCourse({...editingCourse, course_code: data.value})}
                disabled={isLoading}
              />
              <Label>Description</Label>
              <Input 
                value={editingCourse?.description || ''} 
                onChange={(e, data) => setEditingCourse({...editingCourse, description: data.value})}
                disabled={isLoading}
              />
              <Label>Units</Label>
              <Input 
                type="number"
                value={(editingCourse?.units || 3).toString()} 
                onChange={(e, data) => setEditingCourse({...editingCourse, units: parseInt(data.value) || 3})}
                disabled={isLoading}
              />
              <Label>Is Laboratory?</Label>
              <Select 
                value={(editingCourse?.is_laboratory ? 'true' : 'false')} 
                onChange={(e, data) => setEditingCourse({...editingCourse, is_laboratory: data.value === 'true'})}
                disabled={isLoading}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditingCourse(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit} disabled={isLoading}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!courseToDelete} onOpenChange={(event, data) => { if (!data.open) setCourseToDelete(null); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              Are you sure you want to delete {courseToDelete?.course_code}?
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCourseToDelete(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleConfirmDelete} disabled={isLoading}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}