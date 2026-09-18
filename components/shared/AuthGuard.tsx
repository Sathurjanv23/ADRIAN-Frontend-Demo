'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNovaStore } from '@/lib/store/nova-store';
import { getSession, signIn, getToken } from '@/lib/auth';
import type { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

import { CitizenSignInPrompt } from '@/components/citizen/CitizenSignInPrompt';

interface AuthGuardProps {
  children: React.ReactNode;
  /** If set, only users with one of these roles can access the route */
  allowedRoles?: UserRole[];
  /** Where to redirect unauthenticated users */
  redirectTo?: string;
  /** Allow launching command center without redirecting to login */
  allowGuestCommander?: boolean;
}

const ROLE_HREF: Record<UserRole, string> = {
  citizen:     '/citizen',
  officer:     '/command',
  rescue_team: '/rescue',
  hospital:    '/hospital',
  admin:       '/admin',
};

/**
 * AuthGuard — Protects dashboard pages.
 * - Checks localStorage session on mount
 * - Rejects unverified users (redirects to /login or shows sign-in prompt)
 * - Enforces role-based access (redirects wrong roles to their own portal)
 * - For Citizen portal: Displays a dedicated CitizenSignInPrompt informing users
 *   that full citizen access requires sign-in, while allowing direct emergency reporting.
 * - For Command Center: Allows launching command center directly if allowGuestCommander is enabled.
 */
export function AuthGuard({ children, allowedRoles, redirectTo = '/login', allowGuestCommander }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, currentUser, login } = useNovaStore();
  const [status, setStatus] = useState<'checking' | 'authorized' | 'unauthorized' | 'need_citizen_signin'>('checking');

  useEffect(() => {
    // 1. Prefer in-memory session (already verified by AuthProvider)
    let user = isAuthenticated && currentUser ? currentUser : null;

    // 2. Fall back to localStorage if store is empty
    if (!user) {
      const session = getSession(); // getSession() already rejects unverified users
      if (session) {
        // Hydrate store
        login({
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          status: session.status,
          approvalStatus: session.approvalStatus,
          rescueTeamId: session.rescueTeamId,
          language: session.language,
          createdAt: session.createdAt,
          lastActive: session.lastActive,
          isActive: session.isActive ?? true,
          isVerified: session.isVerified ?? true,
        });
        user = session;
      }
    }

    // 3. If user exists and has an allowed role, authorize immediately (do NOT overwrite)
    if (user && (!allowedRoles || allowedRoles.includes(user.role))) {
      setStatus('authorized');
      return;
    }

    // 4. Guest / Cross-Portal Commander bypass for Command Center
    if (allowGuestCommander) {
      if (!user) {
        const commanderSession = {
          id: 'officer-demo',
          name: 'Officer Ranasinghe (Command Center)',
          email: 'officer@nova.lk',
          role: 'officer' as UserRole,
          status: 'ACTIVE' as const,
          approvalStatus: 'APPROVED' as const,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isActive: true,
          isVerified: true,
          language: 'en' as const,
        };
        login(commanderSession);

        if (!getToken()) {
          signIn('officer@nova.lk', 'Demo1234')
            .then((res) => {
              if (res.success) {
                login({
                  id: res.user.id,
                  name: res.user.name,
                  email: res.user.email,
                  role: res.user.role,
                  status: res.user.status,
                  approvalStatus: res.user.approvalStatus,
                  rescueTeamId: res.user.rescueTeamId,
                  language: res.user.language || 'en',
                  createdAt: res.user.createdAt,
                  lastActive: res.user.lastActive,
                  isActive: res.user.isActive,
                  isVerified: res.user.isVerified,
                });
                useNovaStore.getState().fetchAllData();
              }
            })
            .catch(() => {});
        }
      }
      setStatus('authorized');
      return;
    }

    // 5. Role mismatch: If logged in with a different role, redirect to appropriate portal
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      const dest = ROLE_HREF[user.role] || redirectTo;
      router.replace(dest);
      setStatus('unauthorized');
      return;
    }

    // 6. Citizen Portal access control for unauthenticated visitors
    if (allowedRoles && allowedRoles.includes('citizen') && (!user || user.role !== 'citizen')) {
      setStatus('need_citizen_signin');
      return;
    }

    // 7. No session → redirect to login
    if (!user) {
      router.replace(redirectTo);
      setStatus('unauthorized');
      return;
    }

    setStatus('authorized');
  }, [isAuthenticated, currentUser, allowedRoles, redirectTo, allowGuestCommander, login, router]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-em-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-er-blue animate-spin" />
          <p className="text-sm text-em-text-dim">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (status === 'need_citizen_signin') {
    return <CitizenSignInPrompt feature="dashboard" />;
  }

  if (status === 'unauthorized') {
    return null; // Router is handling the redirect
  }

  return <>{children}</>;
}
