'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowRight, Sparkles, Users, Shield } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.roles?.includes('MANAGER')) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      // Router.push được gọi trong login function
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">DocHub</span>
          </Link>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-600">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-900">
                    Password
                  </label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-gray-300"
                />
              </div>

              <Button 
                type="submit" 
                className="h-11 w-full bg-blue-600 text-base hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            {/* Demo credentials */}
            <Card className="border border-blue-100 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-gray-900">Demo Account</p>
                    <p className="mt-1.5 text-gray-700">
                      <strong>Manager:</strong> <span className="font-mono">admin@dochub.com</span> / admin123<br/>
                      <strong>Creator:</strong> <span className="font-mono">creator@dochub.com</span> / creator123<br/>
                      <strong>Approver:</strong> <span className="font-mono">approver@dochub.com</span> / approver123<br/>
                      <strong>Reader:</strong> <span className="font-mono">reader@dochub.com</span> / reader123
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                Contact your admin
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden flex-1 bg-blue-600 lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-lg space-y-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400 bg-blue-500 px-3.5 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trusted by 500+ teams</span>
          </div>

          <h2 className="text-5xl font-bold leading-tight">
            Manage your documents
            <br />
            like never before
          </h2>

          <p className="text-xl text-blue-50">
            Join hundreds of teams using DocHub to collaborate better and work smarter with
            intelligent document management.
          </p>

          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Smart Organization</p>
                <p className="text-sm text-blue-100">AI-powered tagging and search</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Team Collaboration</p>
                <p className="text-sm text-blue-100">Real-time comments and feedback</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Secure & Compliant</p>
                <p className="text-sm text-blue-100">Enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
