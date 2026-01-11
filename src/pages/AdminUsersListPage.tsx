import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, Search, CheckCircle, XCircle, UserCircle, Trash2, Edit2, Shield, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Pagination } from '../components/Table';
import { Modal } from '../components/Modal';
import { adminService, AdminUser, UpdateUserData, CreateUserData } from '../services/admin.service';
import { User as AuthUser } from '../services/auth.service';

interface AdminUsersListPageProps {
  user?: AuthUser;
}

export function AdminUsersListPage({ user: currentUser }: AdminUsersListPageProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserData>({});
  const [createFormData, setCreateFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client',
    status: 'active',
  });
  const [suspendReason, setSuspendReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    loadUsers();
  }, [currentPage, roleFilter, statusFilter]);
  
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        per_page: perPage,
        page: currentPage,
      };
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await adminService.listUsers(params);
      setUsers(response.users);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const handleActivate = async (user: AdminUser) => {
    try {
      await adminService.activateUser(user.id);
      toast.success('User activated successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Failed to activate user:', error);
      toast.error(error?.response?.data?.message || 'Failed to activate user');
    }
  };
  
  const handleSuspend = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminService.suspendUser(selectedUser.id, suspendReason ? { reason: suspendReason } : undefined);
      toast.success('User suspended successfully');
      setIsSuspendModalOpen(false);
      setSelectedUser(null);
      setSuspendReason('');
      loadUsers();
    } catch (error: any) {
      console.error('Failed to suspend user:', error);
      toast.error(error?.response?.data?.message || 'Failed to suspend user');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminService.deleteUser(selectedUser.id);
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    });
    setIsEditModalOpen(true);
  };
  
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      setIsUpdating(true);
      await adminService.updateUser(selectedUser.id, editFormData);
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setEditFormData({});
      loadUsers();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCreateUser = async () => {
    if (!createFormData.name || !createFormData.email || !createFormData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsCreating(true);
      await adminService.createUser(createFormData);
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'client',
        status: 'active',
      });
      loadUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };
  
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'company':
        return 'Company';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };
  
  const columns = [
    { header: 'Name', accessor: (row: any) => row.name },
    { header: 'Email', accessor: (row: any) => row.email },
    { header: 'Role', accessor: (row: any) => row.role },
    { header: 'Status', accessor: (row: any) => row.status },
    { header: 'Phone', accessor: (row: any) => row.phone },
    { header: 'Joined', accessor: (row: any) => row.created_at },
    { header: 'Actions', accessor: (row: any) => row.actions },
  ];
  
  const tableData = users.map((user) => ({
    name: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <p className="text-sm font-medium text-[#334155]">{user.name}</p>
      </div>
    ),
    email: (
      <p className="text-sm text-[#334155]">{user.email}</p>
    ),
    role: (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1E3A8A]">
        {getRoleDisplay(user.role)}
      </span>
    ),
    status: <StatusBadge status={user.status} />,
    phone: (
      <p className="text-sm text-[#64748B]">{user.phone || 'N/A'}</p>
    ),
    created_at: (
      <p className="text-sm text-[#64748B]">{formatDate(user.created_at)}</p>
    ),
    actions: (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEdit(user)}
          className="text-[#1E3A8A] hover:bg-[#EFF6FF]"
          title="Edit user"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        {currentUser && currentUser.id === user.id ? (
          // Hide suspend/activate and delete buttons for current user
          <span className="text-xs text-[#64748B] italic">Current user</span>
        ) : (
          <>
            {user.status !== 'active' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleActivate(user)}
                className="text-[#16A34A] hover:bg-[#D1FAE5]"
                title="Activate user"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedUser(user);
                  setIsSuspendModalOpen(true);
                }}
                className="text-[#F59E0B] hover:bg-[#FEF3C7]"
                title="Suspend user"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedUser(user);
                setIsDeleteModalOpen(true);
              }}
              className="text-[#DC2626] hover:bg-[#FEE2E2]"
              title="Delete user"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    ),
  }));
  
  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;
  const clientCount = users.filter(u => u.role === 'client').length;
  const companyCount = users.filter(u => u.role === 'company').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#334155] mb-2">User Management</h1>
          <p className="text-sm text-[#64748B]">
            Manage users, update their data, and control access
          </p>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Select
              label="Role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'client', label: 'Client' },
                { value: 'company', label: 'Company' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </div>
        </div>
      
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Total Users */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] shadow-lg">
            <div className="p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium mb-2 opacity-90">Total Users</p>
                  <p className="text-4xl font-bold mb-1">{total}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#1E3A8A] mb-1">Active</p>
                <p className="text-2xl font-bold text-[#16A34A]">{activeCount}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-[#16A34A]" />
            </div>
          </div>

          {/* Suspended */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#1E3A8A] mb-1">Suspended</p>
                <p className="text-2xl font-bold text-[#DC2626]">{suspendedCount}</p>
              </div>
              <XCircle className="w-5 h-5 text-[#DC2626]" />
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#1E3A8A] mb-1">Pending</p>
                <p className="text-2xl font-bold text-[#F59E0B]">{pendingCount}</p>
              </div>
              <UserCircle className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>

          {/* Clients */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#1E3A8A] mb-1">Clients</p>
                <p className="text-2xl font-bold text-[#1E3A8A]">{clientCount}</p>
              </div>
              <UserCircle className="w-5 h-5 text-[#1E3A8A]" />
            </div>
          </div>

          {/* Companies */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#1E3A8A] mb-1">Companies</p>
                <p className="text-2xl font-bold text-[#1E3A8A]">{companyCount}</p>
              </div>
              <Shield className="w-5 h-5 text-[#1E3A8A]" />
            </div>
          </div>
        </div>
      
        {/* Users Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E3A8A]/10 to-[#2563EB]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <h2 className="text-lg font-semibold text-[#334155]">Users</h2>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
                <p className="text-sm text-[#64748B]">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#64748B]" />
                </div>
                <p className="text-sm font-medium text-[#334155] mb-1">No users found</p>
                <p className="text-xs text-[#64748B]">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <Table columns={columns} data={tableData} />
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'client',
            status: 'active',
          });
        }}
        title="Create User"
        size="md"
        primaryAction={{
          label: 'Create User',
          onClick: handleCreateUser,
          disabled: isCreating,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setIsCreateModalOpen(false);
            setCreateFormData({
              name: '',
              email: '',
              phone: '',
              password: '',
              role: 'client',
              status: 'active',
            });
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Name <span className="text-[#DC2626]">*</span>
            </label>
            <Input
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              placeholder="User name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Email <span className="text-[#DC2626]">*</span>
            </label>
            <Input
              type="email"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Phone
            </label>
            <Input
              value={createFormData.phone || ''}
              onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Password <span className="text-[#DC2626]">*</span>
            </label>
            <Input
              type="password"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              placeholder="Password (min 8 characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Role <span className="text-[#DC2626]">*</span>
            </label>
            <Select
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'client' | 'company' })}
              options={[
                { value: 'client', label: 'Client' },
                { value: 'company', label: 'Company' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1">
              Status
            </label>
            <Select
              value={createFormData.status || 'active'}
              onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as 'active' | 'suspended' | 'pending' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          setEditFormData({});
        }}
        title="Edit User"
        size="md"
        primaryAction={{
          label: 'Save Changes',
          onClick: handleUpdateUser,
          disabled: isUpdating,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setEditFormData({});
          },
        }}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">
                Name
              </label>
              <Input
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="User name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">
                Email
              </label>
              <Input
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">
                Phone
              </label>
              <Input
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">
                Role
              </label>
              <Select
                value={editFormData.role || 'client'}
                onChange={(e) => {
                  // Prevent changing to admin if there's already an admin (unless editing the existing admin)
                  if (e.target.value === 'admin' && adminCount > 0 && selectedUser?.role !== 'admin') {
                    toast.error('Only one admin is allowed in the system');
                    return;
                  }
                  setEditFormData({ ...editFormData, role: e.target.value as any });
                }}
                disabled={selectedUser?.id === currentUser?.id}
                options={[
                  { value: 'client', label: 'Client' },
                  { value: 'company', label: 'Company' },
                  // Only show admin option if there's no admin or if editing the existing admin
                  ...(adminCount === 0 || (selectedUser && selectedUser.role === 'admin') ? [{ value: 'admin', label: 'Admin' }] : []),
                ]}
              />
              {selectedUser?.id === currentUser?.id && (
                <p className="text-xs text-[#64748B] mt-1">You cannot change your own role</p>
              )}
              {adminCount > 0 && selectedUser && selectedUser.role !== 'admin' && (
                <p className="text-xs text-[#64748B] mt-1">Only one admin is allowed in the system</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Suspend User Modal */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSelectedUser(null);
          setSuspendReason('');
        }}
        title="Suspend User"
        size="md"
        primaryAction={{
          label: 'Suspend',
          onClick: handleSuspend,
          disabled: isUpdating,
          variant: 'danger',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setIsSuspendModalOpen(false);
            setSelectedUser(null);
            setSuspendReason('');
          },
        }}
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-sm text-[#64748B]">
              Are you sure you want to suspend <strong>{selectedUser.name}</strong> ({selectedUser.email})?
            </p>
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-1">
                Reason (optional)
              </label>
              <Textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="md"
        primaryAction={{
          label: 'Delete',
          onClick: handleDelete,
          disabled: isUpdating,
          variant: 'danger',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
          },
        }}
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-sm text-[#64748B]">
              Are you sure you want to delete <strong>{selectedUser.name}</strong> ({selectedUser.email})? This action cannot be undone.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

