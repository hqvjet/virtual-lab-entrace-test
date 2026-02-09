'use client';

import { useState, useEffect } from 'react';
import { adminApi, type Category } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const categoriesData = await adminApi.listAllCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const newCategory = await adminApi.createCategory({
        name: newCategoryName,
        description: newCategoryDescription || undefined,
      });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setSuccess(`Category "${newCategory.name}" created successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
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
            <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Category Management 📁</h1>
            <p className="text-lg text-gray-600">Create and manage document categories</p>
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
          {/* Create Category Form */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 bg-white shadow-sm sticky top-24">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600">
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Create Category</CardTitle>
                    <CardDescription>Add a new document category</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      placeholder="e.g., Technology, Finance"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">Description (Optional)</Label>
                    <Textarea
                      id="categoryDescription"
                      placeholder="Describe this category..."
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Category
                  </Button>
                </form>

                {/* Info Card */}
                <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h4 className="font-medium text-orange-900 mb-2">About Categories</h4>
                  <p className="text-xs text-orange-800">
                    Categories help organize documents. You can assign category access permissions to roles to control who can view documents in each category.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Existing Categories ({categories.length})</CardTitle>
                <CardDescription>All document categories in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {categories.map((category) => (
                    <div
                      key={category.oid}
                      className="rounded-lg border border-gray-200 p-4 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 flex-shrink-0">
                          <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
                          {category.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{category.description}</p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Created: {new Date(category.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            ID: {category.oid.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="col-span-2">
                      <p className="py-8 text-center text-sm text-gray-500">No categories yet</p>
                    </div>
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
