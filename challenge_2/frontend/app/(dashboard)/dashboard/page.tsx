'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi, approvalsApi, adminApi, statsApi, type Document } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, Star, Users, Shield, FolderOpen, Plus, MessageSquare, TrendingUp, BarChart3, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useRole } from '@/hooks/use-role';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface SystemStats {
  overview: {
    total_users: number;
    total_documents: number;
    approved_documents: number;
    pending_documents: number;
    rejected_documents: number;
  };
  documents_over_time: Array<{ date: string; count: number }>;
  users_over_time: Array<{ date: string; count: number }>;
  status_breakdown: Array<{ name: string; value: number; color: string }>;
  category_distribution: Array<{ name: string; count: number }>;
  approvals_over_time: Array<{ date: string; count: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isCreator, isReader, canCreate, isApprover, isManager } = useRole();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [starredDocuments, setStarredDocuments] = useState<Document[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Redirect pure readers and approvers to their main pages
        if (isReader && !isCreator && !isApprover && !isManager) {
          router.push(ROUTES.DOCUMENTS);
          return;
        }
        if (isApprover && !isCreator && !isManager) {
          router.push(ROUTES.APPROVAL);
          return;
        }

        // Load different data based on role
        if (isManager) {
          // Manager - load system statistics with time series data
          const stats = await statsApi.getSystemStats();
          setSystemStats(stats);
          setLoading(false);
          return;
        }
        
        if (isApprover && !isCreator && !isManager) {
          // Pure approver - redirect to approval center
          router.push(ROUTES.APPROVAL);
          return;
        }
        
        if (isCreator) {
          // Creator - needs own docs and all accessible docs
          const [mine, all, starred] = await Promise.all([
            documentsApi.getMyDocuments(),
            documentsApi.list(),
            documentsApi.getStarredDocuments(),
          ]);
          setMyDocuments(mine);
          setDocuments(all);
          setStarredDocuments(starred);
        } else if (isReader && !isCreator && !isApprover && !isManager) {
          // Pure reader - needs available docs and starred
          const [all, starred] = await Promise.all([
            documentsApi.list(),
            documentsApi.getStarredDocuments(),
          ]);
          setDocuments(all);
          setStarredDocuments(starred);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isManager, isApprover, isCreator, isReader, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // MANAGER Dashboard
  if (isManager) {
    if (!systemStats) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }

    const { overview, documents_over_time, users_over_time, status_breakdown, category_distribution, approvals_over_time } = systemStats;

    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
        <div className="container mx-auto space-y-6 p-6 lg:p-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">
                Manager Dashboard <BarChart3 className="inline h-10 w-10" />
              </h1>
              <p className="text-lg text-gray-600">
                Real-time analytics and system overview
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-l-blue-600 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.total_users}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Docs</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.total_documents}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.approved_documents}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-600 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.pending_documents}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-600 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.rejected_documents}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Documents Over Time */}
            <Card className="border border-gray-200 bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Documents Created (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={documents_over_time}>
                    <defs>
                      <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDocs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Users Over Time */}
            <Card className="border border-gray-200 bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  User Registrations (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={users_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Status Breakdown Pie Chart */}
            <Card className="border border-gray-200 bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Document Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={status_breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {status_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="border border-gray-200 bg-white shadow-md lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-indigo-600" />
                  Top Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={category_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Approvals Timeline */}
          <Card className="border border-gray-200 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Approval Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={approvals_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // CREATOR Dashboard
  if (isCreator) {
    const publishedDocs = myDocuments.filter(d => d.status === 1);
    const pendingDocs = myDocuments.filter(d => d.status === 0);
    const totalStars = myDocuments.reduce((sum, doc) => sum + (doc.stars_count || 0), 0);
    const totalComments = myDocuments.reduce((sum, doc) => sum + (doc.comments_count || 0), 0);

    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/20 to-white">
        <div className="container mx-auto space-y-8 p-6 lg:p-8">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-lg text-gray-600">
                  Manage your documents and track engagement
                </p>
              </div>
              <Link href={ROUTES.DOCUMENT_NEW}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Document
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">My Documents</p>
                    <p className="text-3xl font-bold text-gray-900">{myDocuments.length}</p>
                    <p className="text-xs text-gray-500">Total created</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-3xl font-bold text-gray-900">{publishedDocs.length}</p>
                    <p className="text-xs font-medium text-green-600">Live documents</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingDocs.length}</p>
                    <p className="text-xs text-gray-500">Under review</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Engagement</p>
                    <p className="text-3xl font-bold text-gray-900">{totalStars + totalComments}</p>
                    <p className="text-xs text-gray-500">{totalStars} ⭐ {totalComments} 💬</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Recent Documents</CardTitle>
                  <Link href={ROUTES.WORKSPACE}>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {myDocuments.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No documents yet</p>
                    <Link href={ROUTES.DOCUMENT_NEW}>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Document
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myDocuments.slice(0, 5).map((doc) => (
                      <Link
                        key={doc.did}
                        href={`${ROUTES.DOCUMENTS}/${doc.did}`}
                        className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                      >
                        <h3 className="font-medium text-gray-900">{doc.title}</h3>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{doc.stars_count} ⭐</span>
                          <span>{doc.comments_count} 💬</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Starred Documents</CardTitle>
                  <Link href={ROUTES.STARRED}>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {starredDocuments.length === 0 ? (
                  <div className="py-8 text-center">
                    <Star className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No starred documents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {starredDocuments.slice(0, 5).map((doc) => (
                      <Link
                        key={doc.did}
                        href={`${ROUTES.DOCUMENTS}/${doc.did}`}
                        className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                      >
                        <h3 className="font-medium text-gray-900">{doc.title}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          by {doc.author_name}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // READER - Should never reach here due to redirect, but fallback just in case
  return null;
}
