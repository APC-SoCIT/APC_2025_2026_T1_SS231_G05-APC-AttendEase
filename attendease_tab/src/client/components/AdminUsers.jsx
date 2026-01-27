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
import { supabase } from '../../config/supabase.config.js';
import { fetchSections } from '../../services/supabase/referenceData.js';

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

export default function AdminUsers() {
  const styles = useStyles();
  const [users, setUsers] = React.useState([]);
  const [sections, setSections] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('All');
  const [sortOrder, setSortOrder] = React.useState('Ascending');
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [userToDelete, setUserToDelete] = React.useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [newUser, setNewUser] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'Student',
    student_number: '',
    program: '',
    section_id: '',
    password_hash: ''
  });
  const navigate = useNavigate();

  // Load users and sections from Supabase
  React.useEffect(() => {
    loadUsers();
    loadSections();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          sections (
            id,
            name
          )
        `)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSections = async () => {
    const result = await fetchSections();
    if (result.success) {
      setSections(result.data);
    }
  };

  const handleEditClick = (e, user) => {
    e.stopPropagation();
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      // Remove nested objects and only send actual column data
      const { sections, ...updateData } = editingUser;
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', editingUser.user_id);

      if (error) throw error;
      
      await loadUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (e, user) => {
    e.stopPropagation();
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userToDelete.user_id);

      if (error) throw error;
      
      await loadUsers();
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;
      
      await loadUsers();
      setIsAddDialogOpen(false);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        role: 'Student',
        student_number: '',
        program: '',
        section_id: '',
        password_hash: ''
      });
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
            const fullName = `${user.first_name} ${user.last_name}`;
            return searchRegex.test(fullName) || searchRegex.test(user.email);
          })
          .sort((a, b) => {
            const nameA = (a.first_name + ' ' + a.last_name).toUpperCase();
            const nameB = (b.first_name + ' ' + b.last_name).toUpperCase();
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
          <Card key={user.user_id} className={styles.userCard} onClick={() => setSelectedUser(user)}>
            <div className={styles.userInfo}>
              <Avatar name={`${user.first_name} ${user.last_name}`} />
              <div className={styles.userDetails}>
                <Text weight="semibold">{user.first_name} {user.last_name}</Text>
                <Text size={200}>{user.email}</Text>
                <Text size={100} style={{ color: '#666' }}>Section: {user.sections?.name || 'None'}</Text>
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
                    <Text weight="semibold">First Name</Text>
                    <Text>{selectedUser.first_name}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Last Name</Text>
                    <Text>{selectedUser.last_name}</Text>
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
                    <Text weight="semibold">Student Number</Text>
                    <Text>{selectedUser.student_number || 'N/A'}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Program</Text>
                    <Text>{selectedUser.program || 'N/A'}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Section</Text>
                    <Text>{selectedUser.sections?.name || 'None'}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text weight="semibold">Photo URL</Text>
                    <Text>{selectedUser.photo_url || 'Not set'}</Text>
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
              <Label>First Name</Label>
              <Input value={newUser.first_name} onChange={(e, data) => setNewUser({...newUser, first_name: data.value})} />
              <Label>Last Name</Label>
              <Input value={newUser.last_name} onChange={(e, data) => setNewUser({...newUser, last_name: data.value})} />
              <Label>Email</Label>
              <Input value={newUser.email} onChange={(e, data) => setNewUser({...newUser, email: data.value})} />
              <Label>Role</Label>
              <Select value={newUser.role} onChange={(e, data) => setNewUser({...newUser, role: data.value})}>
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Admin">Admin</option>
              </Select>
              <Label>Student Number</Label>
              <Input value={newUser.student_number} onChange={(e, data) => setNewUser({...newUser, student_number: data.value})} />
              <Label>Program</Label>
              <Input value={newUser.program} onChange={(e, data) => setNewUser({...newUser, program: data.value})} />
              <Label>Section</Label>
              <Select value={newUser.section_id} onChange={(e, data) => setNewUser({...newUser, section_id: data.value})}>
                <option value="">None</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </Select>
              <Label>Password Hash (temporary)</Label>
              <Input value={newUser.password_hash} onChange={(e, data) => setNewUser({...newUser, password_hash: data.value})} />
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
              <Label>First Name</Label>
              <Input value={editingUser?.first_name || ''} onChange={(e, data) => setEditingUser({...editingUser, first_name: data.value})} />
              <Label>Last Name</Label>
              <Input value={editingUser?.last_name || ''} onChange={(e, data) => setEditingUser({...editingUser, last_name: data.value})} />
              <Label>Email</Label>
              <Input value={editingUser?.email || ''} onChange={(e, data) => setEditingUser({...editingUser, email: data.value})} />
              <Label>Role</Label>
              <Select value={editingUser?.role || 'Student'} onChange={(e, data) => setEditingUser({...editingUser, role: data.value})}>
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Admin">Admin</option>
              </Select>
              <Label>Student Number</Label>
              <Input value={editingUser?.student_number || ''} onChange={(e, data) => setEditingUser({...editingUser, student_number: data.value})} />
              <Label>Program</Label>
              <Input value={editingUser?.program || ''} onChange={(e, data) => setEditingUser({...editingUser, program: data.value})} />
              <Label>Section</Label>
              <Select value={editingUser?.section_id || ''} onChange={(e, data) => setEditingUser({...editingUser, section_id: data.value})}>
                <option value="">None</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </Select>
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
              Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}? This action cannot be undone.
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