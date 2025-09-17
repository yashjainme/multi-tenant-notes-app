'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/contexts/NotesContext';
import { Button, Card, Alert } from '@/components/ui';
import { getApiUrl } from '@/lib/utils';
import { storage } from '@/lib/utils';
import { Zap, Check, X } from 'lucide-react';

export function UpgradePrompt() {
  const { tenant, refreshUser } = useAuth();
  const { refreshNoteCount } = useNotes();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string>('');
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handleUpgrade = async () => {
    if (!tenant) return;

    setIsUpgrading(true);
    setUpgradeError('');

    try {
      const token = storage.get('auth-token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(getApiUrl(`/tenants/${tenant.slug}/upgrade`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUpgradeSuccess(true);

        // Refresh user data to get updated subscription
        await refreshUser();

        // Refresh notes count to update limits
        await refreshNoteCount();

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setUpgradeSuccess(false);
        }, 3000);
      } else {
        setUpgradeError(data.error || 'Failed to upgrade subscription');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setUpgradeError(error.message);
        console.error('Upgrade error:', error);
      } else {
        setUpgradeError('Network error during upgrade');
        console.error('Upgrade error:', error);
      }
    } finally {
      setIsUpgrading(false);
    }

  };

  if (upgradeSuccess) {
    return (
      <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
        <div className="flex items-center text-green-700 dark:text-green-400">
          <Check className="w-5 h-5 mr-2" />
          <div>
            <h4 className="font-medium">Upgrade Successful!</h4>
            <p className="text-sm mt-1">
              You now have unlimited notes with your Pro subscription.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (tenant?.subscription_plan === 'pro') {
    return null; // Don't show upgrade prompt for Pro users
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Zap className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">Upgrade to Pro</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock unlimited notes and advanced features for your team.
          </p>

          {/* Features List */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center text-xs">
              <Check className="w-3 h-3 text-green-600 mr-2" />
              Unlimited notes
            </div>
            <div className="flex items-center text-xs">
              <Check className="w-3 h-3 text-green-600 mr-2" />
              Advanced formatting
            </div>
            <div className="flex items-center text-xs">
              <Check className="w-3 h-3 text-green-600 mr-2" />
              Priority support
            </div>
          </div>

          {upgradeError && (
            <Alert variant="destructive" className="mb-3 p-2">
              <div className="flex items-center">
                <X className="w-4 h-4 mr-2" />
                <span className="text-xs">{upgradeError}</span>
              </div>
            </Alert>
          )}

          <Button
            onClick={handleUpgrade}
            size="sm"
            className="w-full"
            loading={isUpgrading}
            disabled={isUpgrading}
          >
            <Zap className="w-4 h-4 mr-2" />
            {isUpgrading ? 'Upgrading...' : 'Upgrade Now'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Subscription Status Component
export function SubscriptionStatus() {
  const { tenant } = useAuth();

  if (!tenant) return null;

  const isPro = tenant.subscription_plan === 'pro';

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <span className="text-sm font-medium">
        {isPro ? 'Pro Plan' : 'Free Plan'}
      </span>
      {!isPro && (
        <span className="text-xs text-muted-foreground">
          (3 notes limit)
        </span>
      )}
    </div>
  );
}