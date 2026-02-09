'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { categoriesApi, type Category } from '@/lib/api';

export function DocumentFilters() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const clearAll = () => {
    setSelectedCategories([]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        Loading categories...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      {/* Categories */}
      <div className="flex flex-1 flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-900">Categories</h4>
        {categories.length === 0 ? (
          <p className="text-xs text-gray-500">No categories available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.oid}
                variant={selectedCategories.includes(category.oid) ? 'default' : 'outline'}
                className={`cursor-pointer px-3 py-1.5 text-xs transition-colors ${
                  selectedCategories.includes(category.oid)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => toggleCategory(category.oid)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Clear button */}
      {selectedCategories.length > 0 && (
        <div className="flex items-end lg:min-w-[120px]">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll} 
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
