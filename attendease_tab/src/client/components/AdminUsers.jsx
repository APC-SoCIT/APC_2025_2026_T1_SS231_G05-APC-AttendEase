import React from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Avatar,
  Badge,
  Menu,
  MenuTrigger,
  MenuList,
  MenuPopover,
  MenuItem,
  Card,
  Input,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  DialogContent,
  Label,
  Select
} from '@fluentui/react-components';
import { 
  ArrowLeft24Regular, 
  Delete24Regular, 
  Edit24Regular,
  Search24Regular,
  Filter24Regular,
  ArrowSort24Regular,
  Add24Regular
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
  userList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
  },
  userCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px'),
    backgroundColor: 'white',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('8px'),
  }
});

const MOCK_USERS = [
  { 
    id: 1, 
    name: 'Christian Luis Esguerra', 
    email: 'ciesguerra@apc.edu.ph', 
    role: 'Professor',
    dateAdded: '2023-01-15',
    studentId: 'EMP-001',
    course: 'Faculty',
    yearEnrolled: 'N/A',
    birthdate: '1985-05-20',
    contactNumber: '+63 917 123 4567'
  },
  { 
    id: 2, 
    name: 'Moises Sy', 
    email: 'mqsy2@student.apc.edu.ph', 
    role: 'Student',
    dateAdded: '2023-08-01',
    studentId: '2021-10001',
    course: 'BSCS-SS',
    yearEnrolled: '2021',
    birthdate: '2003-03-15',
    contactNumber: '+63 917 111 2222'
  },
  { 
    id: 3, 
    name: 'Suzanne Marie Rosco', 
    email: 'sdrosco@student.apc.edu.ph', 
    role: 'Student',
    dateAdded: '2023-08-02',
    studentId: '2021-10002',
    course: 'BSCS-SS',
    yearEnrolled: '2021',
    birthdate: '2003-06-20',
    contactNumber: '+63 917 333 4444'
  },
  { 
    id: 4, 
    name: 'Maria Sophea Balidio', 
    email: 'mmbalidio@student.apc.edu.ph', 
    role: 'Student',
    dateAdded: '2023-08-03',
    studentId: '2021-10003',
    course: 'BSCS-SS',
    yearEnrolled: '2021',
    birthdate: '2003-09-10',
    contactNumber: '+63 917 555 6666'
  },
  { 
    id: 5, 
    name: 'Test User', 
    email: 'tuser@student.apc.edu.ph', 
    role: 'Student',
    dateAdded: '2023-08-03',
    studentId: '2021-10003',
    course: 'BSCS-SS',
    yearEnrolled: '2021',
    birthdate: '2003-09-10',
    contactNumber: '+63 917 555 6666'
  },
];

export default function AdminUsers() {
  const styles = useStyles();
  const [users, setUsers] = React.useState(MOCK_USERS);
  const [searchText, setSearchText] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('All');
  const [sortOrder, setSortOrder] = React.useState('Ascending');
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [userToDelete, setUserToDelete] = React.useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    name: '',
    email: '',
    role: 'Student',
    studentId: '',
    course: '',
    yearEnrolled: '',
    birthdate: '',
    contactNumber: ''
  });
  const navigate = useNavigate();

  const handleEditClick = (e, user) => {
    e.stopPropagation();
    setEditingUser({ ...user });
  };

  const handleSaveEdit = () => {
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  const handleDeleteClick = (e, user) => {
    e.stopPropagation();
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    setUsers(users.filter(u => u.id !== userToDelete.id));
    setUserToDelete(null);
  };

  const handleAddUser = () => {
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const dateAdded = new Date().toISOString().split('T')[0];
    const userToAdd = { ...newUser, id, dateAdded };
    setUsers([userToAdd, ...users]);
    setIsAddDialogOpen(false);
    setNewUser({
      name: '',
      email: '',
      role: 'Student',
      studentId: '',
      course: '',
      yearEnrolled: '',
      birthdate: '',
      contactNumber: ''
    });
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
              Add User
            </Button>
            <Input 
              contentBefore={<Search24Regular />} 
              placeholder="Search users..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<Filter24Regular />}>
                  Filter: {filterRole}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => setFilterRole('All')}>All</MenuItem>
                  <MenuItem onClick={() => setFilterRole('Student')}>Student</MenuItem>
                  <MenuItem onClick={() => setFilterRole('Professor')}>Professor</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<ArrowSort24Regular />}>Sort: {sortOrder}</Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => setSortOrder('Ascending')}>Ascending</MenuItem>
                  <MenuItem onClick={() => setSortOrder('Descending')}>Descending</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
        <Text size={600} weight="bold">Manage Users</Text>
        <Text>View and manage registered users and their roles.</Text>
      </div>
      
      <div className={styles.userList}>
        {users
          .filter((user) => {
            if (filterRole === 'All') return true;
            return user.role === filterRole;
          })
          .filter((user) => {
            const searchRegex = new RegExp(searchText, 'i');
            return searchRegex.test(user.name) || searchRegex.test(user.email);
          })
          .sort((a, b) => {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();
            if (sortOrder === 'Ascending') {
              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            } else {
              if (nameA < nameB) return 1;
              if (nameA > nameB) return -1;
              return 0;
            }
          })
          .map((user) => (
          <Card key={user.id} className={styles.userCard} onClick={() => setSelectedUser(user)}>
            <div className={styles.userInfo}>
              <Avatar name={user.name} />
              <div className={styles.userDetails}>
                <Text weight="semibold">{user.name}</Text>
                <Text size={200}>{user.email}</Text>
                <Text size={100} style={{ color: '#666' }}>Added: {user.dateAdded}</Text>
              </div>
              <Badge appearance="tint" color={user.role === 'Professor' ? 'danger' : 'brand'}>
                {user.role}
              </Badge>
            </div>
            <div className={styles.actions}>
              <Button 
                icon={<Edit24Regular />} 
                appearance="subtle" 
                aria-label="Edit" 
                onClick={(e) => handleEditClick(e, user)} 
              />
              <Button 
                icon={<Delete24Regular />} 
                appearance="subtle" 
                aria-label="Delete" 
                onClick={(e) => handleDeleteClick(e, user)} 
              />
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(event, data) => {
        if (!data.open) setSelectedUser(null);
      }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>User Details</DialogTitle>
            <DialogContent>
              {selectedUser && (
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Name</Text>
                    <Text>{selectedUser.name}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Email</Text>
                    <Text>{selectedUser.email}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Role</Text>
                    <Text>{selectedUser.role}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Date Added</Text>
                    <Text>{selectedUser.dateAdded}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">ID</Text>
                    <Text>{selectedUser.studentId}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Course</Text>
                    <Text>{selectedUser.course}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Year Enrolled</Text>
                    <Text>{selectedUser.yearEnrolled}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Birthdate</Text>
                    <Text>{selectedUser.birthdate}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Contact Number</Text>
                    <Text>{selectedUser.contactNumber}</Text>
                  </div>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setSelectedUser(null)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(event, data) => setIsAddDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add New User</DialogTitle>
            <DialogContent className={styles.header}>
              <Label>Name</Label>
              <Input value={newUser.name} onChange={(e, data) => setNewUser({...newUser, name: data.value})} />
              <Label>Email</Label>
              <Input value={newUser.email} onChange={(e, data) => setNewUser({...newUser, email: data.value})} />
              <Label>Role</Label>
              <Select value={newUser.role} onChange={(e, data) => setNewUser({...newUser, role: data.value})}>
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Administrator">Administrator</option>
              </Select>
              <Label>ID</Label>
              <Input value={newUser.studentId} onChange={(e, data) => setNewUser({...newUser, studentId: data.value})} />
              <Label>Course</Label>
              <Input value={newUser.course} onChange={(e, data) => setNewUser({...newUser, course: data.value})} />
              <Label>Year Enrolled</Label>
              <Input value={newUser.yearEnrolled} onChange={(e, data) => setNewUser({...newUser, yearEnrolled: data.value})} />
              <Label>Birthdate</Label>
              <Input type="date" value={newUser.birthdate} onChange={(e, data) => setNewUser({...newUser, birthdate: data.value})} />
              <Label>Contact Number</Label>
              <Input value={newUser.contactNumber} onChange={(e, data) => setNewUser({...newUser, contactNumber: data.value})} />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddUser}>Add</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(event, data) => {
        if (!data.open) setEditingUser(null);
      }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit User</DialogTitle>
            <DialogContent className={styles.header}>
              <Label>Name</Label>
              <Input value={editingUser?.name || ''} onChange={(e, data) => setEditingUser({...editingUser, name: data.value})} />
              <Label>Email</Label>
              <Input value={editingUser?.email || ''} onChange={(e, data) => setEditingUser({...editingUser, email: data.value})} />
              <Label>Role</Label>
              <Input value={editingUser?.role || ''} onChange={(e, data) => setEditingUser({...editingUser, role: data.value})} />
              <Label>ID</Label>
              <Input value={editingUser?.studentId || ''} onChange={(e, data) => setEditingUser({...editingUser, studentId: data.value})} />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(event, data) => {
        if (!data.open) setUserToDelete(null);
      }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setUserToDelete(null)}>Cancel</Button>
              <Button appearance="primary" onClick={handleConfirmDelete}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}