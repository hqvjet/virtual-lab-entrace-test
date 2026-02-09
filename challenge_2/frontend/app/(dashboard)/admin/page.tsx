'use client';

import { useState, useEffect } from 'react';
import { adminApi, type Role, type Category, type User } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, FolderOpen, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function AdminPage() {
  const [stats, setStats] = useState({
    users: 0,
    roles: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [rolesData, categoriesData, usersData] = await Promise.all([
        adminApi.listRoles(),
        adminApi.listAllCategories(),
        adminApi.listAllUsers(),
      ]);
      setStats({
        roles: rolesData.length,
        categories: categoriesData.length,
        users: usersData.length,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
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
    <div className="space-y-8 p-6 lg:p-8">
      <div className="container mx-auto space-y-8">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Admin Dashboard 🛡️</h1>
            <p className="text-lg text-gray-600">Manage your system settings and resources</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Users Stats */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active user accounts
              </p>
              <Link href={ROUTES.ADMIN.USERS}>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  Manage Users
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Roles Stats */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.roles}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Access control roles
              </p>
              <Link href={ROUTES.ADMIN.ROLES}>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  Manage Roles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Categories Stats */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.categories}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Document categories
              </p>
              <Link href={ROUTES.ADMIN.CATEGORIES}>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  Manage Categories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Link href={ROUTES.ADMIN.USERS} className="group">
            <Card className="border border-gray-200 bg-white shadow-sm hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600 group-hover:bg-green-700 transition-colors">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-600">Create and manage users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={ROUTES.ADMIN.ROLES} className="group">
            <Card className="border border-gray-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-700 transition-colors">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Role Management</h3>
                    <p className="text-sm text-gray-600">Configure access roles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={ROUTES.ADMIN.CATEGORIES} className="group">
            <Card className="border border-gray-200 bg-white shadow-sm hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-600 group-hover:bg-orange-700 transition-colors">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Category Management</h3>
                    <p className="text-sm text-gray-600">Organize document categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* System Info */}
        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">System Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-center justify-between">
                <span>Role-Based Access Control (RBAC)</span>
                <span className="font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Document Approval Workflow</span>
                <span className="font-medium">✓ Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Category Permissions</span>
                <span className="font-medium">✓ Configured</span>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs">
                  <strong>System Roles:</strong> MANAGER (Admin) • CREATOR (Content) • APPROVER (Review) • READER (View)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
