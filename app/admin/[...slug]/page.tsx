'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { adminApi, rescueTeamsApi } from '@/lib/api/client';
import { Settings, Users, Activity, FileText, Database, Cpu, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import type { User, AuditLog, RescueTeam } from '@/types';

export default function AdminOperationsCatchAll() {
  const params = useParams<{ slug: string[] }>();
  const router = useRouter();
  const slug = params?.slug?.[0] || '';
  const { t, localize, timeAgo, statusLabel } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [savingUser, setSavingUser] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, logsRes, teamsRes] = await Promise.allSettled([
          adminApi.getUsers(),
          adminApi.getAuditLogs(),
          rescueTeamsApi.getAll(),
        ]);
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          setUsers(usersRes.value);
        }
        if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
          setAuditLogs(logsRes.value);
        }
        if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value)) {
          setRescueTeams(teamsRes.value);
        }
      } catch {
        // Fallback to empty arrays
      }
    }
    loadData();
  }, []);

  const updateApproval = async (user: User, decision: 'APPROVE' | 'REJECT') => {
    const rescueTeamId = selectedTeams[user.id];
    if (decision === 'APPROVE' && user.role === 'rescue_team' && !rescueTeamId) {
      toast.error('Select a rescue team before approving this user.');
      return;
    }
    setSavingUser(user.id);
    try {
      const updated = await adminApi.approveUser(user.id, decision, rescueTeamId) as User;
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success(decision === 'APPROVE' ? 'User approved and linked.' : 'User request rejected.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update approval.');
    } finally {
      setSavingUser(null);
    }
  };

  // 1. USERS LIST PANEL
  const renderUsers = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <Users className="w-5 h-5 text-er-blue" /> {t('heading.user_directory')}
        </h2>
        <div className="em-card border border-em-border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-em-border bg-white/40 text-[10px] font-bold text-em-text-muted uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">District</th>
                <th className="p-4">{t('stats.status')}</th>
                <th className="p-4">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nova-border/50 text-sm text-nova-text">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/10 transition-colors">
                    <td className="p-4 font-semibold">{user.name}</td>
                    <td className="p-4 text-xs text-em-text-muted">{user.email}</td>
                    <td className="p-4 text-xs capitalize text-er-blue">{user.role.replace('_', ' ')}</td>
                    <td className="p-4 text-xs text-em-text-muted">{user.district ? localize(user.district) : 'National'}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                        {user.approvalStatus || user.status || statusLabel('active')}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.role !== 'citizen' && user.approvalStatus !== 'APPROVED' ? (
                        <div className="flex items-center gap-2">
                          {user.role === 'rescue_team' && (
                            <select
                              value={selectedTeams[user.id] || ''}
                              onChange={(event) => setSelectedTeams((current) => ({ ...current, [user.id]: event.target.value }))}
                              className="bg-em-subtle border border-em-border rounded px-2 py-1 text-xs text-nova-text"
                            >
                              <option value="">Select team</option>
                              {rescueTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                            </select>
                          )}
                          <button type="button" disabled={savingUser === user.id} onClick={() => updateApproval(user, 'APPROVE')} className="text-green-400 hover:text-green-300" aria-label="Approve user"><CheckCircle className="w-4 h-4" /></button>
                          <button type="button" disabled={savingUser === user.id} onClick={() => updateApproval(user, 'REJECT')} className="text-red-400 hover:text-red-300" aria-label="Reject user"><XCircle className="w-4 h-4" /></button>
                        </div>
                      ) : <span className="text-xs text-em-text-muted">Approved</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-em-text-dim">
                    No user accounts registered in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2. COLLABORATING ORGANIZATIONS PANEL
  const renderOrganizations = () => {
    const orgs = [
      { name: 'Disaster Management Centre', code: 'DMC', sector: 'Government', contacts: '011-2134567', region: 'Colombo' },
      { name: 'Sri Lanka Rescue Corps', code: 'SLRC', sector: 'Military / Emergency', contacts: '011-2789123', region: 'Gampaha' },
      { name: 'National Hospital Sri Lanka', code: 'NHSL', sector: 'Healthcare', contacts: '011-2691111', region: 'Colombo' },
      { name: 'Sri Lanka Police Department', code: 'SLPD', sector: 'Law Enforcement', contacts: '119 / 011-2433333', region: 'All Districts' },
    ];
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <Database className="w-5 h-5 text-er-blue" /> {t('heading.organizations')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map((org) => (
            <div key={org.code} className="em-card border border-em-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-nova-text">{localize(org.name)}</p>
                  <p className="text-xs text-em-text-muted mt-0.5">{org.sector} · {localize(org.region)}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-er-blue-light text-er-blue border border-er-blue/20 rounded-full">{org.code}</span>
              </div>
              <p className="text-xs text-em-text-dim">Emergency Contacts: <strong className="text-nova-text">{org.contacts}</strong></p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. RESOURCES RESERVES CONFIG PANEL
  const renderResources = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <Settings className="w-5 h-5 text-er-blue" /> {t('heading.reserves_config')}
        </h2>
        <div className="em-card border border-em-border rounded-xl p-5 space-y-4">
          <p className="text-xs text-em-text-muted uppercase tracking-wider">Stock Alert Limits</p>
          {['Water Units threshold', 'Food Packs threshold', 'Rescue Boats threshold', 'Medical Kits threshold'].map((label, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-em-border rounded-lg text-sm">
              <span className="text-em-text-dim">{label}</span>
              <input type="number" defaultValue={[200, 150, 5, 20][idx]} className="w-20 bg-em-subtle border border-em-border rounded px-2 py-1 text-center font-mono text-nova-text" />
            </div>
          ))}
          <button onClick={() => toast.success('Reserve thresholds updated successfully.')} className="w-full bg-nova-cyan text-nova-bg font-bold py-2.5 rounded-xl text-xs hover:bg-nova-cyan-dim transition-colors">
            {t('btn.save')}
          </button>
        </div>
      </div>
    );
  };

  // 4. AI PREDICTION CONFIG PANEL
  const renderAIConfig = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" /> {t('heading.ai_model_config')}
        </h2>
        <div className="em-card border border-em-border rounded-xl p-5 space-y-4">
          {['Severity Threshold limit (%)', 'Confidence score boundary (%)', 'Auto dispatch triggers'].map((label, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-em-border rounded-lg text-sm">
              <span className="text-em-text-dim">{label}</span>
              <input type="text" defaultValue={['70%', '85%', 'Enabled'][idx]} className="w-24 bg-em-subtle border border-em-border rounded px-2 py-1 text-center font-mono text-nova-text" />
            </div>
          ))}
          <button onClick={() => toast.success('Model configurations updated successfully.')} className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-700 transition-colors">
            {t('btn.save')}
          </button>
        </div>
      </div>
    );
  };

  // 5. MONITORING PANEL
  const renderMonitoring = () => {
    const servers = [
      { name: 'Gateway Proxy API', uptime: '99.98%', latency: '12ms', status: 'online' },
      { name: 'FastAPI Prediction Engine', uptime: '99.91%', latency: '180ms', status: 'online' },
      { name: 'Java Spring Security Hub', uptime: '99.99%', latency: '6ms', status: 'online' },
      { name: 'MongoDB Database clusters', uptime: '99.94%', latency: '14ms', status: 'online' },
    ];
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <Activity className="w-5 h-5 text-er-blue" /> {t('heading.system_monitoring')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((srv) => (
            <div key={srv.name} className="em-card border border-em-border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-nova-text">{srv.name}</p>
                <p className="text-xs text-em-text-muted mt-0.5">Uptime: {srv.uptime} · Latency: {srv.latency}</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">● {t('common.online')}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 6. AUDIT LOGS PANEL
  const renderAuditLogs = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <FileText className="w-5 h-5 text-er-blue" /> {t('heading.audit_logs_full')}
        </h2>
        <div className="em-card border border-em-border rounded-xl p-3 divide-y divide-nova-border/50">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 flex items-start gap-3 hover:bg-white/10 transition-colors">
                <span className="text-lg mt-0.5">⚙️</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-semibold text-nova-text">{log.action}</p>
                    <span className="text-[10px] text-em-text-muted">{timeAgo(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-em-text-dim mt-0.5">{log.details}</p>
                  <p className="text-[10px] text-em-text-muted mt-1">By: {log.userName} · IP: {log.ipAddress}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-em-text-dim">
              No audit logs recorded in database.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-em-bg">
      <TopNav role="admin" />
      <DashboardShell role="admin">
        <div className="p-6 space-y-6">
          {slug === 'users' && renderUsers()}
          {slug === 'organizations' && renderOrganizations()}
          {slug === 'resources' && renderResources()}
          {slug === 'ai-config' && renderAIConfig()}
          {slug === 'monitoring' && renderMonitoring()}
          {slug === 'audit-logs' && renderAuditLogs()}
        </div>
      </DashboardShell>
    </div>
  );
}
