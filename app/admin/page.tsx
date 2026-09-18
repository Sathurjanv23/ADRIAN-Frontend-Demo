'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useNovaStore } from '@/lib/store/nova-store';
import { adminApi } from '@/lib/api/client';
import { StatCard } from '@/components/emergency/StatCard';
import { Users, Activity, Settings, Shield, FileText, AlertTriangle, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const UserRoleDistributionChart = dynamic(
  () => import('@/components/charts/AdminActivityChart').then((m) => m.UserRoleDistributionChart),
  { ssr: false }
);
import type { AuditLog, User } from '@/types';
import { useTranslation } from '@/lib/i18n';

const SYSTEM_HEALTH = [
  { name: 'API Server', status: 'operational', uptime: '99.97%', latency: '12ms' },
  { name: 'AI Service', status: 'operational', uptime: '99.91%', latency: '180ms' },
  { name: 'WebSocket', status: 'operational', uptime: '99.99%', latency: '3ms' },
  { name: 'MongoDB Atlas', status: 'operational', uptime: '99.95%', latency: '8ms' },
  { name: 'OpenStreetMap Service', status: 'operational', uptime: '100%', latency: '24ms' },
  { name: 'GIS Engine', status: 'operational', uptime: '99.2%', latency: '40ms' },
];

const AI_CONFIG = [
  { name: 'Flood Severity Threshold', value: '70%', editable: true },
  { name: 'Critical Alert Confidence', value: '85%', editable: true },
  { name: 'Auto-Assign Teams', value: 'Enabled', editable: true },
  { name: 'Language Detection', value: 'EN/TA/SI', editable: false },
  { name: 'Prediction Window', value: '6 Hours', editable: true },
  { name: 'Model Version', value: 'NOVA-AI-v2.1', editable: false },
];

export default function AdminDashboardPage() {
  const { incidents } = useNovaStore();
  const { t, timeAgo } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadAdminData() {
      try {
        const [logsRes, usersRes] = await Promise.allSettled([
          adminApi.getAuditLogs(),
          adminApi.getUsers(),
        ]);
        if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
          setAuditLogs(logsRes.value);
        }
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          setUsers(usersRes.value);
        }
      } catch {
        // Handled silently, defaults to empty arrays
      }
    }
    loadAdminData();
  }, []);

  const userCountData = [
    { role: 'Citizens', count: users.filter((u) => u.role === 'citizen').length },
    { role: 'Officers', count: users.filter((u) => u.role === 'officer').length },
    { role: 'Rescue', count: users.filter((u) => u.role === 'rescue_team').length },
    { role: 'Hospital', count: users.filter((u) => u.role === 'hospital').length },
    { role: 'Admin', count: users.filter((u) => u.role === 'admin').length },
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
    <div className="min-h-screen bg-em-bg">
      <TopNav role="admin" />
      <DashboardShell role="admin">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold font-display text-nova-text">{t('heading.system_dashboard')}</h1>
            <p className="text-sm text-em-text-dim mt-0.5">{t('portal.admin')} · ADRIAN Operations Hub</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={t('stats.total_users')} value={users.length} icon={<Users className="w-4 h-4" />} variant="cyan" />
            <StatCard label={t('stats.active_incidents')} value={incidents.filter(i => i.status !== 'resolved').length} icon={<AlertTriangle className="w-4 h-4" />} variant="warning" />
            <StatCard label={t('stats.ai_analyses_today')} value={auditLogs.length} icon={<Cpu className="w-4 h-4" />} variant="success" />
            <StatCard label={t('stats.system_uptime')} value="99.94" suffix="%" icon={<Activity className="w-4 h-4" />} variant="cyan" animate={false} />
          </div>

          {/* System Health */}
          <div className="em-card border border-em-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-er-blue" />
              <h2 className="text-sm font-bold text-nova-text">{t('heading.system_health')}</h2>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-er-green">
                <div className="w-1.5 h-1.5 rounded-full bg-nova-low animate-pulse" />
                {t('common.live')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SYSTEM_HEALTH.map((service) => (
                <div key={service.name} className={cn(
                  'p-3 rounded-xl border',
                  service.status === 'operational' ? 'border-em-border bg-white/50' : 'border-orange-500/30 bg-orange-500/5'
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-nova-text">{service.name}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', {
                      'bg-green-500/10 text-green-400 border border-green-500/20': service.status === 'operational',
                      'bg-orange-500/10 text-orange-400 border border-orange-500/20': service.status === 'degraded',
                    })}>
                      {service.status === 'operational' ? `● ${t('common.online')}` : `⚠ ${t('common.degraded')}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-em-text-muted">
                    <span>Uptime: {service.uptime}</span>
                    <span>Latency: {service.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Distribution & AI Config */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User chart */}
            <div className="em-card border border-em-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-nova-text">{t('heading.users_by_role')}</p>
                <Link href="/admin/users" className="text-xs text-er-blue hover:underline">{t('btn.manage')} →</Link>
              </div>
              <div className="h-40 flex items-center justify-center overflow-hidden">
                <UserRoleDistributionChart data={userCountData} />
              </div>
            </div>

            {/* AI Config */}
            <div className="em-card border border-em-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-bold text-nova-text">{t('heading.ai_config')}</p>
                </div>
                <Link href="/admin/ai-config" className="text-xs text-er-blue hover:underline">{t('btn.edit')} →</Link>
              </div>
              <div className="space-y-2">
                {AI_CONFIG.map((cfg) => (
                  <div key={cfg.name} className="flex items-center justify-between p-2 rounded-lg bg-white/50 border border-em-border">
                    <span className="text-xs text-em-text-dim">{cfg.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-er-blue font-mono">{cfg.value}</span>
                      {cfg.editable && <Settings className="w-3 h-3 text-em-text-muted" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="em-card border border-em-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-er-blue" />
                <h2 className="text-sm font-bold text-nova-text">{t('heading.recent_audit_logs')}</h2>
              </div>
              <Link href="/admin/audit-logs" className="text-xs text-er-blue hover:underline">{t('heading.view_all')} →</Link>
            </div>
            <div className="space-y-2">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-em-border">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', {
                      'bg-nova-cyan': log.severity === 'info',
                      'bg-orange-400': log.severity === 'warning',
                      'bg-red-400': log.severity === 'critical',
                    })} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-nova-text truncate">{log.action}</p>
                        <span className="text-[10px] text-em-text-muted flex-shrink-0">{timeAgo(log.timestamp)}</span>
                      </div>
                      <p className="text-xs text-em-text-dim mt-0.5">{log.details}</p>
                      <p className="text-[10px] text-em-text-muted mt-0.5">by {log.userName} · {log.ipAddress}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-em-text-dim">
                  No recent system audit logs recorded in database.
                </div>
              )}
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/admin/users', icon: <Users className="w-5 h-5" />, label: t('nav.users'), color: 'text-er-blue border-er-blue/20 bg-er-blue-light' },
              { href: '/admin/ai-config', icon: <Cpu className="w-5 h-5" />, label: t('nav.ai_config'), color: 'text-purple-400 border-purple-400/20 bg-purple-400/5' },
              { href: '/admin/monitoring', icon: <Activity className="w-5 h-5" />, label: t('nav.monitoring'), color: 'text-green-400 border-green-400/20 bg-green-400/5' },
              { href: '/admin/audit-logs', icon: <Shield className="w-5 h-5" />, label: t('nav.audit_logs'), color: 'text-orange-400 border-orange-400/20 bg-orange-400/5' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:scale-102',
                  action.color
                )}
              >
                {action.icon}
                <span className="text-xs font-semibold">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </DashboardShell>
    </div>
    </AuthGuard>
  );
}
