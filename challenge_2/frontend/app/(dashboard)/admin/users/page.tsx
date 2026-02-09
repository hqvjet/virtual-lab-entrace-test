'use client';

import { useState, useEffect } from 'react';
import { adminApi, type Role, type User } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [selectedUserRoles, setSelectedUserRoles] = useState<{[userId: string]: string[]}>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesData, usersData] = await Promise.all([
        adminApi.listRoles(),
        adminApi.listAllUsers(),
      ]);
      setRoles(rolesData);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const newUser = await adminApi.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
      });
      setUsers([...users, newUser]);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setSuccess(`User "${newUser.name}" created successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleAssignRoles = async (userId: string) => {
    setError('');
    setSuccess('');

    try {
      const roleIds = selectedUserRoles[userId] || [];
      await adminApi.assignUserRoles(userId, roleIds);
      setSuccess('Roles assigned successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Reload users to get updated roles
      const usersData = await adminApi.listAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign roles');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setError('');
    setSuccess('');

    try {
      await adminApi.deleteUser(userId);
      setUsers(users.filter(u => u.uid !== userId));
      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const toggleRoleSelection = (userId: string, roleId: string) => {
    setSelectedUserRoles(prev => {
      const userRoles = prev[userId] || [];
      const newRoles = userRoles.includes(roleId)
        ? userRoles.filter(r => r !== roleId)
        : [...userRoles, roleId];
      return { ...prev, [userId]: newRoles };
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
      <div className="container mx-auto space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">User Management 👥</h1>
            <p className="text-lg text-gray-600">Create and manage user accounts</p>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create User Form */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 bg-white shadow-sm sticky top-24">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Create User</CardTitle>
                    <CardDescription>Add a new user account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Name</Label>
                    <Input
                      id="userName"
                      placeholder="John Doe"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">Password</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      placeholder="Min 6 characters"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>All Users ({users.length})</CardTitle>
                    <CardDescription>Manage users and assign roles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[700px] overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.uid}
                      className="rounded-lg border border-gray-200 p-4 space-y-3 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.name}</span>
                            <Badge variant="outline" className="text-xs">{user.email}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  className={
                                    role === 'MANAGER' ? 'bg-purple-500' :
                                    role === 'CREATOR' ? 'bg-blue-500' :
                                    role === 'APPROVER' ? 'bg-green-500' :
                                    role === 'READER' ? 'bg-gray-500' :
                                    'bg-gray-400'
                                  }
                                >
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary">No roles</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.uid)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Assign Roles:</Label>
                        <div className="flex flex-wrap gap-2">
                          {roles.map((role) => {
                            const isSelected = (selectedUserRoles[user.uid] || []).includes(role.rid);
                            const hasRole = user.roles?.includes(role.name);
                            return (
                              <Button
                                key={role.rid}
                                variant={isSelected || hasRole ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleRoleSelection(user.uid, role.rid)}
                                className={
                                  isSelected || hasRole
                                    ? role.name === 'MANAGER' ? 'bg-purple-500 hover:bg-purple-600' :
                                      role.name === 'CREATOR' ? 'bg-blue-500 hover:bg-blue-600' :
                                      role.name === 'APPROVER' ? 'bg-green-500 hover:bg-green-600' :
                                      role.name === 'READER' ? 'bg-gray-500 hover:bg-gray-600' :
                                      ''
                                    : ''
                                }
                              >
                                {role.name}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          onClick={() => handleAssignRoles(user.uid)}
                          size="sm"
                          className="mt-2 bg-purple-600 hover:bg-purple-700"
                          disabled={!selectedUserRoles[user.uid] || selectedUserRoles[user.uid].length === 0}
                        >
                          <CheckCircle className="mr-2 h-3 w-3" />
                          Update Roles
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Created: {new Date(user.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  {users.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-500">No users yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
