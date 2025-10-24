import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const [usersByRegion, setUsersByRegion] = useState({});
  const [filteredUsers, setFilteredUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsInfo, setShowPermissionsInfo] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    phone: '',
    gender: 'male',
    role: 'committee_member',
    region: currentUser?.region || '',
    division: currentUser?.division || '',
    local_church: '',
  });

  const rolePermissions = {
    single: [
      'View own applications',
      'Create new applications',
      'View scheduled meetings',
      'Receive committee feedback',
      'View medical test instructions'
    ],
    committee_member: [
      'View applications in their region',
      'Update application stages',
      'Schedule meetings',
      'Add notes and feedback',
      'Access committee portal',
      'Participate in divisional and regional discussions',
      'View medical test results'
    ],
    central_committee: [
      'View all applications',
      'Manage all application stages',
      'Schedule and manage meetings',
      'Access admin panel',
      'Create and manage users',
      'Participate in all discussions',
      'Pin and close discussions',
      'Access central committee-only discussions'
    ],
    overseer: [
      'Full system access',
      'All central committee permissions',
      'Oversee all regions and divisions',
      'Final approval authority',
      'System-wide announcements'
    ]
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsersByRegion();
      setUsersByRegion(response.data.users_by_region);
      setFilteredUsers(response.data.users_by_region);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and role
  useEffect(() => {
    if (!usersByRegion) return;

    let filtered = {};
    
    Object.keys(usersByRegion).forEach(region => {
      const users = usersByRegion[region].filter(user => {
        // Search filter
        const matchesSearch = !searchQuery || 
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Role filter
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
      });
      
      if (users.length > 0) {
        filtered[region] = users;
      }
    });
    
    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, usersByRegion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      await adminAPI.createUser(formData);
      toast.success('User created successfully!');
      setShowCreateModal(false);
      setFormData({
        email: '',
        username: '',
        password: '',
        full_name: '',
        phone: '',
        gender: 'male',
        role: 'committee_member',
        region: '',
        division: '',
        local_church: '',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeactivate = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to deactivate user "${username}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error(error.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      single: 'bg-gray-100 text-gray-800',
      committee_member: 'bg-blue-100 text-blue-800',
      central_committee: 'bg-purple-100 text-purple-800',
      overseer: 'bg-green-100 text-green-800',
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and roles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPermissionsInfo(true)}
            className="btn btn-outline flex items-center"
          >
            <KeyIcon className="h-5 w-5 mr-2" />
            Permissions
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create User
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Roles</option>
              <option value="single">Singles</option>
              <option value="committee_member">Committee Members</option>
              <option value="central_committee">Central Committee</option>
              <option value="overseer">Overseers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users by Region */}
      {loading ? (
        <LoadingSpinner />
      ) : Object.keys(filteredUsers).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(filteredUsers).sort().map((region) => (
            <div key={region} className="card overflow-hidden">
              <button
                onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-gray-900">{region}</h3>
                  <span className="ml-3 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                    {filteredUsers[region].length} users
                  </span>
                </div>
                <svg
                  className={`h-6 w-6 text-gray-500 transition-transform ${
                    expandedRegion === region ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedRegion === region && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Division/Church
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers[region].map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-xs text-gray-400">@{user.username}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(
                                user.role
                              )}`}
                            >
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{user.division || 'N/A'}</div>
                            <div className="text-xs">{user.local_church}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeactivate(user.id, user.username)}
                              className="text-red-600 hover:text-red-900 ml-4"
                              title="Deactivate user"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="input"
                  >
                    <option value="single">Single (Brother/Sister)</option>
                    <option value="committee_member">Committee Member</option>
                    <option value="central_committee">Central Committee</option>
                    <option value="overseer">Overseer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region *
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="e.g., Greater Accra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division *
                  </label>
                  <input
                    type="text"
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="e.g., Accra Central"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local Church *
                  </label>
                  <input
                    type="text"
                    name="local_church"
                    value={formData.local_church}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="e.g., Accra Assembly 1"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Info Modal */}
      {showPermissionsInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-4">Role Permissions</h3>
            <p className="text-gray-600 mb-6">
              Each role in the system has specific permissions. Assign roles carefully based on responsibilities.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(rolePermissions).map(([role, permissions]) => (
                <div key={role} className="border-2 border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-primary-600 capitalize mb-3">
                    {role.replace('_', ' ')}
                  </h4>
                  <ul className="space-y-2">
                    {permissions.map((permission, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowPermissionsInfo(false)}
                className="btn btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

