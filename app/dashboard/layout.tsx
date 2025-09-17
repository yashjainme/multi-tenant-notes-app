'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useIsAdmin } from '@/contexts/AuthContext';
import { NotesProvider } from '@/contexts/NotesContext';
import { Avatar, Badge, DropdownMenu, DropdownMenuItem } from '@/components/ui';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { LogOut, Settings, Crown, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenant, logout, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !tenant) {
    return null;
  }

  const userInitials = getInitials(user.first_name, user.last_name);
  const avatarColor = getAvatarColor(user.email);

  return (
    <NotesProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Logo and Tenant Info */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Notes</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{tenant.name}</Badge>
                <Badge 
                  variant={tenant.subscription_plan === 'pro' ? 'success' : 'default'}
                >
                  {tenant.subscription_plan.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <DropdownMenu
                trigger={
                  <button className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent">
                    <Avatar
                      fallback={userInitials}
                      size="sm"
                      className={avatarColor}
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {isAdmin ? (
                          <>
                            <Crown className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="mr-1 h-3 w-3" />
                            Member
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                }
                align="end"
              >
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/dashboard/admin')}>
                    <Crown className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                
                <div className="border-t border-border my-1" />
                
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-card/30 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Multi-tenant Notes App • Tenant: {tenant.name}
            </div>
            <div>
              {tenant.subscription_plan === 'free' ? (
                <span>Free Plan - 3 notes limit</span>
              ) : (
                <span>Pro Plan - Unlimited notes</span>
              )}
            </div>
          </div>
        </footer>
      </div>
    </NotesProvider>
  );
}