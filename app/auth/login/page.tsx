'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, Alert } from '@/components/ui';
import { LoginFormData } from '@/types';
import { isValidEmail } from '@/lib/utils';
import { NotebookText, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>('');

  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Test accounts for easy access
  const testAccounts = [
    { email: 'admin@acme.test', role: 'Admin', tenant: 'Acme' },
    { email: 'user@acme.test', role: 'Member', tenant: 'Acme' },
    { email: 'admin@globex.test', role: 'Admin', tenant: 'Globex' },
    { email: 'user@globex.test', role: 'Member', tenant: 'Globex' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setLoginError('');
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        router.push('/dashboard');
      } else {
        setLoginError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const fillTestAccount = (email: string) => {
    setFormData({ email, password: 'password' });
    setErrors({});
    setLoginError('');
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* ===== Left Column: Branding Panel ===== */}
      <div className="hidden bg-muted lg:flex flex-col items-center justify-center p-12 text-center">
        <NotebookText className="h-24 w-24 mb-6 text-primary" strokeWidth={1.5} />
        <h1 className="text-4xl font-bold tracking-tight">
          Unlock Your Team&apos;s Knowledge
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Our multi-tenant platform provides a secure, isolated, and collaborative
          space for all your team&apos;s notes.
        </p>
      </div>

      {/* ===== Right Column: Authentication ===== */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center">
             <NotebookText className="h-12 w-12 mx-auto mb-4 text-primary lg:hidden" strokeWidth={1.5} />
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your workspace
            </p>
          </div>

          {/* Login Form */}
          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email Address"
                placeholder="admin@acme.test"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                disabled={isLoading}
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                disabled={isLoading}
                required
              />
              {loginError && (
                <Alert variant="destructive">
                  {loginError}
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Card>

          {/* Test Accounts */}
          <Card className="p-6 sm:p-8">
            <h3 className="text-sm font-medium mb-4 text-center text-muted-foreground">
              Or use a test account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {testAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => fillTestAccount(account.email)}
                  className="group w-full p-3 text-left rounded-md border border-border hover:bg-accent hover:border-primary/50 transition-all duration-200"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{account.tenant} {account.role}</div>
                      <div className="text-xs text-muted-foreground">
                        {account.email}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
             <p className="text-xs text-muted-foreground mt-4 text-center">
               Password for all accounts: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">password</code>
             </p>
          </Card>
          
        </div>
      </div>
    </div>
  );
}