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
  Delete24Regular,
  Edit24Regular,
  Search24Regular,
  Filter24Regular,
  ArrowSort24Regular,
  Add24Regular
} from '@fluentui/react-icons';
import { supabase } from '../../config/supabase.config.js';
import { fetchSections, fetchPrograms } from '../../services/supabase/referenceData.js';
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
    flexWrap: 'wrap',
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
    ...shorthands.padding('16px'),
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '200ms',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
    },
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
  formContent: {
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
  detailLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailValue: {
    fontSize: '14px',
    color: '#1e293b',
    marginTop: '2px',
  },
});

// Helper: get the default empty state for a new user based on role
const getDefaultNewUser = (role = 'Student') => ({
  role,
  first_name: '',
  last_name: '',
  email: '',
  // Student-specific
  student_number: '',
  program_id: '',
  section_id: '',
  // Professor/Admin-specific
  id_number: ''
});

// Helper: build the insert payload based on role (only send relevant columns)
const buildInsertPayload = (user) => {
  const base = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role
  };

  if (user.role === 'Student') {
    return {
      ...base,
      student_number: user.student_number || null,
      program_id: user.program_id || null,
      section_id: user.section_id || null,
      id_number: null
    };
  }
  // Professor or Admin
  return {
    ...base,
    id_number: user.id_number || null,
    student_number: null,
    program_id: null,
    section_id: null
  };
};

// Helper: build the update payload based on role
const buildUpdatePayload = (user) => {
  // Strip nested join objects before sending
  const base = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role
  };

  if (user.role === 'Student') {
    return {
      ...base,
      student_number: user.student_number || null,
      program_id: user.program_id || null,
      section_id: user.section_id || null,
      id_number: null
    };
  }
  return {
    ...base,
    id_number: user.id_number || null,
    student_number: null,
    program_id: null,
    section_id: null
  };
};

export default function AdminUsers() {
  const styles = useStyles();
  const [users, setUsers] = React.useState([]);
  const [sections, setSections] = React.useState([]);
  const [programs, setPrograms] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('All');
  const [sortOrder, setSortOrder] = React.useState('Ascending');
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [userToDelete, setUserToDelete] = React.useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [newUser, setNewUser] = React.useState(getDefaultNewUser('Student'));
  
  // Load users, sections, and programs from Supabase
  React.useEffect(() => {
    loadUsers();
    loadSections();
    loadPrograms();
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
          ),
          programs (
            id,
            name,
            abbreviation
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

  const loadPrograms = async () => {
    const result = await fetchPrograms();
    if (result.success) {
      setPrograms(result.data);
    }
  };

  // When role changes in Add form, reset role-specific fields
  const handleNewUserRoleChange = (role) => {
    setNewUser({
      ...getDefaultNewUser(role),
      // Preserve common fields already filled in
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email
    });
  };

  // When role changes in Edit form, clear role-specific fields
  const handleEditUserRoleChange = (role) => {
    setEditingUser({
      ...editingUser,
      role,
      // Reset role-specific fields
      student_number: role === 'Student' ? (editingUser.student_number || '') : '',
      program_id: role === 'Student' ? (editingUser.program_id || '') : '',
      section_id: role === 'Student' ? (editingUser.section_id || '') : '',
      id_number: role !== 'Student' ? (editingUser.id_number || '') : ''
    });
  };

  const handleEditClick = (e, user) => {
    e.stopPropagation();
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      const updateData = buildUpdatePayload(editingUser);

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'USER_UPDATED',
        description: `Updated user ${editingUser.first_name} ${editingUser.last_name} (${editingUser.role})`,
        performed_by: adminSession.user_id || null,
        metadata: { target_user_id: editingUser.user_id, role: editingUser.role }
      });

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

      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'USER_DELETED',
        description: `Deleted user ${userToDelete.first_name} ${userToDelete.last_name} (${userToDelete.role})`,
        performed_by: adminSession.user_id || null,
        metadata: { target_user_id: userToDelete.user_id, email: userToDelete.email, role: userToDelete.role }
      });

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
    if (!newUser.first_name.trim() || !newUser.last_name.trim() || !newUser.email.trim()) {
      setError('First name, last name, and email are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = buildInsertPayload(newUser);

      const { error } = await supabase
        .from('user_profiles')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      insertLog({
        action: 'USER_CREATED',
        description: `Created new ${newUser.role} user: ${newUser.first_name} ${newUser.last_name}`,
        performed_by: adminSession.user_id || null,
        metadata: { email: newUser.email, role: newUser.role }
      });

      await loadUsers();
      setIsAddDialogOpen(false);
      setNewUser(getDefaultNewUser('Student'));
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render role-conditional form fields for Add User
  const renderAddFormFields = () => {
    const role = newUser.role;

    return (
      <>
        {/* Common fields */}
        <Label className={styles.formLabel}>Last Name</Label>
        <Input value={newUser.last_name} onChange={(e, data) => setNewUser({...newUser, last_name: data.value})} />
        <Label className={styles.formLabel}>First Name</Label>
        <Input value={newUser.first_name} onChange={(e, data) => setNewUser({...newUser, first_name: data.value})} />
        <Label className={styles.formLabel}>Email</Label>
        <Input value={newUser.email} onChange={(e, data) => setNewUser({...newUser, email: data.value})} />

        {/* Student-specific fields */}
        {role === 'Student' && (
          <>
            <Label className={styles.formLabel}>Student ID</Label>
            <Input value={newUser.student_number} onChange={(e, data) => setNewUser({...newUser, student_number: data.value})} />
            <Label className={styles.formLabel}>Program</Label>
            <Select value={newUser.program_id} onChange={(e, data) => setNewUser({...newUser, program_id: data.value})}>
              <option value="">Select Program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.abbreviation} — {program.name}</option>
              ))}
            </Select>
            <Label className={styles.formLabel}>Section</Label>
            <Select value={newUser.section_id} onChange={(e, data) => setNewUser({...newUser, section_id: data.value})}>
              <option value="">Select Section</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </Select>
          </>
        )}

        {/* Professor/Admin-specific fields */}
        {(role === 'Professor' || role === 'Admin') && (
          <>
            <Label className={styles.formLabel}>ID Number</Label>
            <Input value={newUser.id_number} onChange={(e, data) => setNewUser({...newUser, id_number: data.value})} />
          </>
        )}
      </>
    );
  };

  // Render role-conditional form fields for Edit User
  const renderEditFormFields = () => {
    if (!editingUser) return null;
    const role = editingUser.role;

    return (
      <>
        {/* Common fields */}
        <Label className={styles.formLabel}>Last Name</Label>
        <Input value={editingUser.last_name || ''} onChange={(e, data) => setEditingUser({...editingUser, last_name: data.value})} />
        <Label className={styles.formLabel}>First Name</Label>
        <Input value={editingUser.first_name || ''} onChange={(e, data) => setEditingUser({...editingUser, first_name: data.value})} />
        <Label className={styles.formLabel}>Email</Label>
        <Input value={editingUser.email || ''} onChange={(e, data) => setEditingUser({...editingUser, email: data.value})} />

        {/* Student-specific fields */}
        {role === 'Student' && (
          <>
            <Label className={styles.formLabel}>Student ID</Label>
            <Input value={editingUser.student_number || ''} onChange={(e, data) => setEditingUser({...editingUser, student_number: data.value})} />
            <Label className={styles.formLabel}>Program</Label>
            <Select value={editingUser.program_id || ''} onChange={(e, data) => setEditingUser({...editingUser, program_id: data.value})}>
              <option value="">Select Program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.abbreviation} — {program.name}</option>
              ))}
            </Select>
            <Label className={styles.formLabel}>Section</Label>
            <Select value={editingUser.section_id || ''} onChange={(e, data) => setEditingUser({...editingUser, section_id: data.value})}>
              <option value="">Select Section</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </Select>
          </>
        )}

        {/* Professor/Admin-specific fields */}
        {(role === 'Professor' || role === 'Admin') && (
          <>
            <Label className={styles.formLabel}>ID Number</Label>
            <Input value={editingUser.id_number || ''} onChange={(e, data) => setEditingUser({...editingUser, id_number: data.value})} />
          </>
        )}
      </>
    );
  };

  // Helper to get display label for user's subtitle on cards
  const getUserSubtitle = (user) => {
    if (user.role === 'Student') {
      return `Section: ${user.sections?.name || 'None'}`;
    }
    return `ID: ${user.id_number || 'N/A'}`;
  };

  return (
    <AdminShell>
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '8px' }}>
          <Text>Error: {error}</Text>
        </div>
      )}

      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <Text size={600} weight="bold">Manage Users</Text>
          <Text size={200} style={{ color: '#64748b' }}>View and manage registered users and their roles.</Text>
        </div>
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
                <MenuItem onClick={() => setFilterRole('Admin')}>Admin</MenuItem>
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
                <Text size={100} style={{ color: '#666' }}>{getUserSubtitle(user)}</Text>
              </div>
              <Badge appearance="tint" color={user.role === 'Professor' ? 'danger' : user.role === 'Admin' ? 'warning' : 'brand'}>
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

      {/* View User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(event, data) => {
        if (!data.open) setSelectedUser(null);
      }}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#eef2ff' }}>
                  <Search24Regular style={{ color: '#4f46e5', width: 20, height: 20 }} />
                </div>
                User Details
              </div>
            </DialogTitle>
            <DialogContent>
              {selectedUser && (
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>First Name</Text>
                    <Text className={styles.detailValue}>{selectedUser.first_name}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Last Name</Text>
                    <Text className={styles.detailValue}>{selectedUser.last_name}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Email</Text>
                    <Text className={styles.detailValue}>{selectedUser.email}</Text>
                  </div>
                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Role</Text>
                    <Text className={styles.detailValue}>{selectedUser.role}</Text>
                  </div>

                  {/* Student-specific details */}
                  {selectedUser.role === 'Student' && (
                    <>
                      <div className={styles.detailItem}>
                        <Text className={styles.detailLabel}>Student ID</Text>
                        <Text className={styles.detailValue}>{selectedUser.student_number || 'N/A'}</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <Text className={styles.detailLabel}>Program</Text>
                        <Text className={styles.detailValue}>{selectedUser.programs?.abbreviation || 'N/A'}</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <Text className={styles.detailLabel}>Section</Text>
                        <Text className={styles.detailValue}>{selectedUser.sections?.name || 'None'}</Text>
                      </div>
                    </>
                  )}

                  {/* Professor/Admin-specific details */}
                  {(selectedUser.role === 'Professor' || selectedUser.role === 'Admin') && (
                    <div className={styles.detailItem}>
                      <Text className={styles.detailLabel}>ID Number</Text>
                      <Text className={styles.detailValue}>{selectedUser.id_number || 'N/A'}</Text>
                    </div>
                  )}

                  <div className={styles.detailItem}>
                    <Text className={styles.detailLabel}>Photo URL</Text>
                    <Text className={styles.detailValue}>{selectedUser.photo_url || 'Not set'}</Text>
                  </div>
                </div>
              )}
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setSelectedUser(null)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(event, data) => {
        if (!data.open) {
          setIsAddDialogOpen(false);
          setError(null);
        } else {
          setIsAddDialogOpen(true);
        }
      }}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#eef2ff' }}>
                  <Add24Regular style={{ color: '#4f46e5', width: 20, height: 20 }} />
                </div>
                Add New User
              </div>
            </DialogTitle>
            <DialogContent className={styles.formContent}>
              <Label className={styles.formLabel}>Role</Label>
              <Select value={newUser.role} onChange={(e, data) => handleNewUserRoleChange(data.value)}>
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Admin">Admin</option>
              </Select>
              {renderAddFormFields()}
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleAddUser} disabled={isLoading}>Add</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(event, data) => {
        if (!data.open) setEditingUser(null);
      }}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogTitleRow}>
                <div className={styles.dialogTitleIcon} style={{ backgroundColor: '#fef3c7' }}>
                  <Edit24Regular style={{ color: '#d97706', width: 20, height: 20 }} />
                </div>
                Edit User
              </div>
            </DialogTitle>
            <DialogContent className={styles.formContent}>
              <Label className={styles.formLabel}>Role</Label>
              <Select value={editingUser?.role || 'Student'} onChange={(e, data) => handleEditUserRoleChange(data.value)}>
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Admin">Admin</option>
              </Select>
              {renderEditFormFields()}
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setEditingUser(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" onClick={handleSaveEdit} disabled={isLoading}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(event, data) => {
        if (!data.open) setUserToDelete(null);
      }}>
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
                Are you sure you want to delete <Text weight="semibold">{userToDelete?.first_name} {userToDelete?.last_name}</Text>? This action cannot be undone.
              </div>
            </DialogContent>
            <DialogActions className={styles.dialogActionsRow}>
              <Button appearance="secondary" onClick={() => setUserToDelete(null)} disabled={isLoading}>Cancel</Button>
              <Button appearance="primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleConfirmDelete} disabled={isLoading}>Delete</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </AdminShell>
  );
}