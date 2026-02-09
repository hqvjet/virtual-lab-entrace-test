'use client';

import { useState, useEffect } from 'react';
import { adminApi, type Role } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const rolesData = await adminApi.listRoles();
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const newRole = await adminApi.createRole({ name: newRoleName });
      setRoles([...roles, newRole]);
      setNewRoleName('');
      setSuccess(`Role "${newRole.name}" created successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
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
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Role Management 🛡️</h1>
            <p className="text-lg text-gray-600">Create and manage access control roles</p>
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
          {/* Create Role Form */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 bg-white shadow-sm sticky top-24">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Create Role</CardTitle>
                    <CardDescription>Add a new role for access control</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Role Name</Label>
                    <Input
                      id="roleName"
                      placeholder="e.g., Editor, Viewer"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Role
                  </Button>
                </form>

                {/* Info Card */}
                <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="font-medium text-blue-900 mb-2">System Roles</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>🟣 <strong>MANAGER</strong> - Full system access</li>
                    <li>🔵 <strong>CREATOR</strong> - Create documents</li>
                    <li>🟢 <strong>APPROVER</strong> - Approve content</li>
                    <li>⚫ <strong>READER</strong> - Read documents</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roles List */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Existing Roles ({roles.length})</CardTitle>
                <CardDescription>All roles in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role.rid}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          role.name === 'MANAGER' ? 'bg-purple-600' :
                          role.name === 'CREATOR' ? 'bg-blue-600' :
                          role.name === 'APPROVER' ? 'bg-green-600' :
                          role.name === 'READER' ? 'bg-gray-600' :
                          'bg-blue-600'
                        }`}>
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 text-lg">{role.name}</span>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(role.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {role.rid.slice(0, 8)}...
                      </div>
                    </div>
                  ))}
                  {roles.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-500">No roles yet</p>
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
