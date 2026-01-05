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

const MOCK_COURSES = [
  { id: 1, code: 'SS231', name: 'Software Engineering 1', section: 'SS231', schedule: 'MW 10:00-12:00', room: 'R405', professor: 'Christian Luis Esguerra', department: 'Engineering' },
  { id: 2, code: 'CS101', name: 'Introduction to Computing', section: 'CS101-A', schedule: 'TTh 08:00-10:00', room: 'LAB1', professor: 'Jane Doe', department: 'Engineering' },
  { id: 3, code: 'IT101', name: 'Information Technology Fundamentals', section: 'IT101-B', schedule: 'Fri 13:00-16:00', room: 'R302', professor: 'John Smith', department: 'Engineering' },
  { id: 4, code: 'PHY101', name: 'General Physics', section: 'PHY101-A', schedule: 'TTh 08:00-10:00', room: 'LAB2', professor: 'Albert Einstein', department: 'Physics' },
  { id: 5, code: 'BUS101', name: 'Business Management', section: 'BUS101-B', schedule: 'Fri 13:00-16:00', room: 'R305', professor: 'Warren Buffet', department: 'Business' },
];

export default function AdminCourses() {
  const styles = useStyles();
  const navigate = useNavigate();
  
  const [courses, setCourses] = React.useState(MOCK_COURSES);
  const [searchText, setSearchText] = React.useState('');
  const [filterDepartment, setFilterDepartment] = React.useState('All');
  const [filterSection, setFilterSection] = React.useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState(null);
  const [courseToDelete, setCourseToDelete] = React.useState(null);
  
  const [newCourse, setNewCourse] = React.useState({
    code: '',
    name: '',
    section: '',
    schedule: '',
    room: '',
    professor: '',
    department: 'Engineering'
  });

  const handleAddCourse = () => {
    const id = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    setCourses([{ ...newCourse, id }, ...courses]);
    setIsAddDialogOpen(false);
    setNewCourse({ code: '', name: '', section: '', schedule: '', room: '', professor: '' });
  };

  const handleEditClick = (course) => {
    setEditingCourse({ ...course });
  };

  const handleSaveEdit = () => {
    setCourses(courses.map(c => c.id === editingCourse.id ? editingCourse : c));
    setEditingCourse(null);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
  };

  const handleConfirmDelete = () => {
    setCourses(courses.filter(c => c.id !== courseToDelete.id));
    setCourseToDelete(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.topBar}>
          <Button icon={<ArrowLeft24Regular />} onClick={() => navigate('/admin')}>
            Back to Admin
          </Button>
          <div className={styles.controls}>
            <Button icon={<Add24Regular />} appearance="primary" onClick={() => setIsAddDialogOpen(true)}>
              Add Course
            </Button>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<Filter24Regular />}>
                  Department: {filterDepartment}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => setFilterDepartment('All')}>All</MenuItem>
                  <MenuItem onClick={() => setFilterDepartment('Engineering')}>Engineering</MenuItem>
                  <MenuItem onClick={() => setFilterDepartment('General Subject')}>General Subject</MenuItem>
                  <MenuItem onClick={() => setFilterDepartment('Business')}>Business</MenuItem>
                  <MenuItem onClick={() => setFilterDepartment('Physics')}>Physics</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<Filter24Regular />}>
                  Section: {filterSection}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => setFilterSection('All')}>All</MenuItem>
                  {[...new Set(courses.map(c => c.section))].map(section => (
                    <MenuItem key={section} onClick={() => setFilterSection(section)}>{section}</MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
            <Input 
              contentBefore={<Search24Regular />} 
              placeholder="Search courses..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
        <Text size={600} weight="bold">Manage Courses</Text>
        <Text>View and manage course offerings, schedules, and assignments.</Text>
      </div>

      <div className={styles.courseList}>
        {courses
          .filter(course => {
            if (filterDepartment !== 'All' && course.department !== filterDepartment) return false;
            if (filterSection !== 'All' && course.section !== filterSection) return false;
            const searchRegex = new RegExp(searchText, 'i');
            return searchRegex.test(course.name) || searchRegex.test(course.code) || searchRegex.test(course.professor);
          })
          .map(course => (
            <Card key={course.id} className={styles.courseCard}>
              <div className={styles.courseInfo}>
                <div style={{ padding: '8px', backgroundColor: '#eef2ff', borderRadius: '4px' }}>
                  <BookOpen24Regular />
                </div>
                <div className={styles.courseDetails}>
                  <Text weight="semibold">{course.code} - {course.name}</Text>
                  <Text size={200}>Section: {course.section} | Room: {course.room} | Dept: {course.department}</Text>
                  <Text size={200} style={{ color: '#666' }}>{course.schedule} | Prof. {course.professor}</Text>
                </div>
              </div>
              <div className={styles.actions}>
                <Button icon={<Edit24Regular />} appearance="subtle" onClick={() => handleEditClick(course)} />
                <Button icon={<Delete24Regular />} appearance="subtle" onClick={() => handleDeleteClick(course)} />
              </div>
            </Card>
          ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(event, data) => setIsAddDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label>Course Code</Label>
              <Input value={newCourse.code} onChange={(e, data) => setNewCourse({...newCourse, code: data.value})} />
              <Label>Course Name</Label>

              <Input value={newCourse.name} onChange={(e, data) => setNewCourse({...newCourse, name: data.value})} />
              <Label>Section</Label>
              <Input value={newCourse.section} onChange={(e, data) => setNewCourse({...newCourse, section: data.value})} />
              <Label>Schedule</Label>
              <Input value={newCourse.schedule} onChange={(e, data) => setNewCourse({...newCourse, schedule: data.value})} />
              <Label>Room</Label>
              <Input value={newCourse.room} onChange={(e, data) => setNewCourse({...newCourse, room: data.value})} />
              <Label>Department</Label>
              <Select value={newCourse.department} onChange={(e, data) => setNewCourse({...newCourse, department: data.value})}>
                <option value="Engineering">Engineering</option>
                <option value="General Subject">General Subject</option>
                <option value="Business">Business</option>
                <option value="Physics">Physics</option>
              </Select>
              <Label>Professor</Label>
              <Input value={newCourse.professor} onChange={(e, data) => setNewCourse({...newCourse, professor: data.value})} />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddCourse}>Add</Button>
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
              <Input value={editingCourse?.code || ''} onChange={(e, data) => setEditingCourse({...editingCourse, code: data.value})} />
              <Label>Course Name</Label>
              <Input value={editingCourse?.name || ''} onChange={(e, data) => setEditingCourse({...editingCourse, name: data.value})} />
              <Label>Section</Label>
              <Input value={editingCourse?.section || ''} onChange={(e, data) => setEditingCourse({...editingCourse, section: data.value})} />
              <Label>Department</Label>
              <Select value={editingCourse?.department || ''} onChange={(e, data) => setEditingCourse({...editingCourse, department: data.value})}>
                <option value="Engineering">Engineering</option>
                <option value="General Subject">General Subject</option>
                <option value="Business">Business</option>
                <option value="Physics">Physics</option>
              </Select>
              <Label>Schedule</Label>
              <Input value={editingCourse?.schedule || ''} onChange={(e, data) => setEditingCourse({...editingCourse, schedule: data.value})} />
              <Label>Room</Label>
              <Input value={editingCourse?.room || ''} onChange={(e, data) => setEditingCourse({...editingCourse, room: data.value})} />
              <Label>Professor</Label>
              <Input value={editingCourse?.professor || ''} onChange={(e, data) => setEditingCourse({...editingCourse, professor: data.value})} />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditingCourse(null)}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit}>Save</Button>
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
              Are you sure you want to delete {courseToDelete?.code} - {courseToDelete?.name}?
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCourseToDelete(null)}>Cancel</Button>
              <Button appearance="primary" onClick={handleConfirmDelete}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}