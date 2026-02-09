'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import {
  Home,
  FileText,
  Star,
  Briefcase,
  CheckCircle,
  Bell,
  Menu,
  X,
  LogOut,
  Users,
  Shield,
  FolderOpen,
  User,
  ChevronDown,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRole } from '@/hooks/use-role';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isManager, isApprover, isCreator, isReader, canCreate } = useRole();
  
  // Get primary role for badge
  const getPrimaryRole = () => {
    if (isManager) return { name: 'MANAGER' };
    if (isCreator) return { name: 'CREATOR' };
    if (isApprover) return { name: 'APPROVER' };
    if (isReader) return { name: 'READER' };
    return { name: 'USER' };
  };
  
  const primaryRole = getPrimaryRole();
  
  // Main navigation items based on roles - No Dashboard, My Workspace first
  const mainNavigation = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home, show: isManager },
    { name: 'My Workspace', href: ROUTES.WORKSPACE, icon: Briefcase, show: isCreator },
    { name: 'Documents', href: ROUTES.DOCUMENTS, icon: FileText, show: !isManager },
    { name: 'Starred', href: ROUTES.WORKSPACE_STARRED, icon: Star, show: !isManager },
    { name: 'Approval Center', href: ROUTES.APPROVAL, icon: CheckCircle, show: isApprover },
  ].filter(item => item.show);

  // Admin navigation items (only for managers)
  const adminNavigation = isManager ? [
    { name: 'User Management', href: ROUTES.ADMIN.USERS, icon: Users },
    { name: 'Role Management', href: ROUTES.ADMIN.ROLES, icon: Shield },
    { name: 'Category Management', href: ROUTES.ADMIN.CATEGORIES, icon: FolderOpen },
  ] : [];

  // Determine home link based on role
  const homeLink = (() => {
    if (isManager) return ROUTES.DASHBOARD;
    if (isCreator) return ROUTES.WORKSPACE;
    if (isReader && !isCreator && !isApprover && !isManager) return ROUTES.DOCUMENTS;
    if (isApprover && !isCreator && !isManager) return ROUTES.APPROVAL;
    return ROUTES.DOCUMENTS;
  })();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <Link href={homeLink} className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 transition-all group-hover:bg-blue-700">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">DocHub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Admin Menu Items - Show directly on navbar */}
              {isManager && adminNavigation.length > 0 && (
                <>
                  <div className="mx-2 h-6 w-px bg-gray-300"></div>
                  {adminNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                          isActive 
                            ? 'bg-purple-50 text-purple-600' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Create Document Button (for creators) */}
            {canCreate && (
              <Link href={ROUTES.DOCUMENT_NEW} className="hidden md:block">
                <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4" />
                  <span className="text-white">New Document</span>
                </Button>
              </Link>
            )}

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative hidden md:flex hover:bg-gray-50">
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </Button>

            {/* User Menu */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-gray-50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-600 text-white font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex lg:flex-col lg:items-start">
                      <span className="text-sm font-medium text-gray-900">{user?.name || 'User'}</span>
                      <Badge className="text-xs px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
                        {primaryRole.name}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{user?.name}</span>
                        <Badge className="text-xs bg-blue-100 text-blue-700 border-0">
                          {primaryRole.name}
                        </Badge>
                      </div>
                      <span className="text-xs font-normal text-gray-500">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.WORKSPACE} className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.WORKSPACE_STARRED} className="flex items-center gap-2 cursor-pointer">
                      <Star className="h-4 w-4" />
                      <span>Starred Documents</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center gap-2 text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-white shadow-lg md:hidden">
          <div className="px-4 py-6 space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-0">
                    {primaryRole.name}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>

            {/* Create Document Button (mobile) */}
            {canCreate && (
              <Link href={ROUTES.DOCUMENT_NEW} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4" />
                  <span>New Document</span>
                </Button>
              </Link>
            )}
            
            {/* Main Navigation */}
            <nav className="flex flex-col gap-1">
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Admin Section (mobile) */}
              {isManager && adminNavigation.length > 0 && (
                <>
                  <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </div>
                  {adminNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-purple-50 text-purple-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
