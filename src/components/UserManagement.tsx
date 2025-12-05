import { useEffect, useState } from 'react';
import { Users, Shield, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  department: string;
  position: string;
  employee_id: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    const { error } = await supabase
      .from('users_profile')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      setActionMessage({ type: 'error', text: `Failed to update role: ${error.message}` });
    } else {
      setActionMessage({ type: 'success', text: `User role updated to ${newRole}` });
      loadUsers();
    }

    setTimeout(() => setActionMessage(null), 3000);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('users_profile')
      .update({ is_active: !currentStatus })
      .eq('id', userId);

    if (error) {
      setActionMessage({ type: 'error', text: `Failed to update status: ${error.message}` });
    } else {
      setActionMessage({ type: 'success', text: `User ${!currentStatus ? 'activated' : 'deactivated'}` });
      loadUsers();
    }

    setTimeout(() => setActionMessage(null), 3000);
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This will also delete all their records.`)) {
      return;
    }

    const { error } = await supabase
      .from('users_profile')
      .delete()
      .eq('id', userId);

    if (error) {
      setActionMessage({ type: 'error', text: `Failed to delete user: ${error.message}` });
    } else {
      setActionMessage({ type: 'success', text: 'User deleted successfully' });
      loadUsers();
    }

    setTimeout(() => setActionMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-blue-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600">Manage user roles and permissions</p>
          </div>
        </div>

        {actionMessage && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            actionMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {actionMessage.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Admin Privileges</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• View and manage all users in the system</li>
            <li>• Promote users to admin or demote to regular user</li>
            <li>• Activate or deactivate user accounts</li>
            <li>• Delete users and their associated records</li>
            <li>• Delete any incident, inspection, risk assessment, or training record</li>
          </ul>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{user.department || '-'}</td>
                    <td className="py-3 px-4 text-gray-700">{user.position || '-'}</td>
                    <td className="py-3 px-4 text-gray-700">{user.employee_id || '-'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleUserRole(user.id, user.role)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {user.role === 'admin' && <Shield size={14} />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <CheckCircle size={14} />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteUser(user.id, user.full_name)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-900">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-purple-700">Admins</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-green-700">Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
