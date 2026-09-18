'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, MapPin, Phone, UtensilsCrossed, Droplets, RefreshCw, ArrowLeft, Edit3, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { foodSourcesApi } from '@/lib/api/client';
import type { FoodSource, FoodSourceType } from '@/types';
import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  HOTEL: 'text-purple-400 bg-purple-500/10',
  RESTAURANT: 'text-orange-400 bg-orange-500/10',
  SUPERMARKET: 'text-blue-400 bg-blue-500/10',
  WAREHOUSE: 'text-green-400 bg-green-500/10',
};

const TYPE_ICONS: Record<string, string> = {
  HOTEL: '🏨', RESTAURANT: '🍽️', SUPERMARKET: '🛒', WAREHOUSE: '🏭',
};

const EMPTY_FORM = {
  name: '', type: 'RESTAURANT' as FoodSourceType,
  availableMeals: 0, waterBottles: 0, contact: '', expiryTime: '',
  address: '', district: '', lat: '6.9271', lng: '79.8612',
};

export default function FoodSourcesPage() {
  const [sources, setSources] = useState<FoodSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const fetchSources = async () => {
    try {
      const res = await foodSourcesApi.getAll();
      const data = (res as any).data || res;
      setSources(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSources(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSources();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!form.name || form.availableMeals < 0) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        availableMeals: Number(form.availableMeals),
        waterBottles: Number(form.waterBottles),
        contact: form.contact,
        expiryTime: form.expiryTime || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        location: { lat: Number(form.lat), lng: Number(form.lng), address: form.address, district: form.district },
      };

      if (editingId) {
        await foodSourcesApi.update(editingId, payload);
      } else {
        await foodSourcesApi.create(payload);
      }

      setShowAddForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchSources();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (source: FoodSource) => {
    try {
      const newStatus = source.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await foodSourcesApi.updateStatus(source.id, newStatus);
      await fetchSources();
    } catch (err: any) { alert(`Update failed: ${err.message}`); }
  };

  const handleEdit = (source: FoodSource) => {
    setForm({
      name: source.name,
      type: source.type,
      availableMeals: source.availableMeals,
      waterBottles: source.waterBottles,
      contact: source.contact || '',
      expiryTime: source.expiryTime || '',
      address: source.location?.address || '',
      district: source.location?.district || '',
      lat: String(source.location?.lat || '6.9271'),
      lng: String(source.location?.lng || '79.8612'),
    });
    setEditingId(source.id);
    setShowAddForm(true);
  };

  const filteredSources = sources.filter(s => filterType === 'ALL' || s.type === filterType);
  const totalMeals = sources.reduce((s, src) => s + src.availableMeals, 0);
  const totalWater = sources.reduce((s, src) => s + src.waterBottles, 0);
  const activeSources = sources.filter(s => s.status === 'ACTIVE').length;

  return (
    <AuthGuard allowedRoles={['officer', 'admin']}>
      <DashboardShell role="officer">
        <TopNav role="officer" title="Food Sources" subtitle="Manage food & water supply locations" />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/relief" className="flex items-center gap-2 text-em-text-dim hover:text-nova-text text-xs transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Relief
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="p-2 rounded-lg em-card border border-em-border hover:border-orange-500/50 transition-colors">
                <RefreshCw className={cn('w-4 h-4 text-em-text-dim', refreshing && 'animate-spin')} />
              </button>
              <button
                onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setForm(EMPTY_FORM); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-medium hover:bg-orange-500/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Source
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="em-card border border-em-border rounded-xl p-4 flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-nova-text">{totalMeals.toLocaleString()}</p>
                <p className="text-xs text-em-text-dim">Total Meals</p>
              </div>
            </div>
            <div className="em-card border border-em-border rounded-xl p-4 flex items-center gap-3">
              <Droplets className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-nova-text">{totalWater.toLocaleString()}</p>
                <p className="text-xs text-em-text-dim">Water Bottles</p>
              </div>
            </div>
            <div className="em-card border border-em-border rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-nova-text">{activeSources}</p>
                <p className="text-xs text-em-text-dim">Active Sources</p>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="em-card border border-orange-500/30 rounded-xl p-5 space-y-4"
            >
              <h3 className="text-sm font-semibold text-orange-300">
                {editingId ? 'Edit Food Source' : 'Add New Food Source'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-em-text-dim mb-1 block">Name *</label>
                  <input type="text" placeholder="Source name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as FoodSourceType}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none">
                    {['RESTAURANT', 'HOTEL', 'SUPERMARKET', 'WAREHOUSE'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">Contact</label>
                  <input type="text" placeholder="+94 77 xxx xxxx" value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">Available Meals</label>
                  <input type="number" min="0" value={form.availableMeals} onChange={e => setForm(f => ({...f, availableMeals: Number(e.target.value)}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">Water Bottles</label>
                  <input type="number" min="0" value={form.waterBottles} onChange={e => setForm(f => ({...f, waterBottles: Number(e.target.value)}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">Address</label>
                  <input type="text" placeholder="Street address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">District</label>
                  <input type="text" placeholder="Colombo" value={form.district} onChange={e => setForm(f => ({...f, district: e.target.value}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">Latitude</label>
                  <input type="text" value={form.lat} onChange={e => setForm(f => ({...f, lat: e.target.value}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-em-text-dim mb-1 block">Longitude</label>
                  <input type="text" value={form.lng} onChange={e => setForm(f => ({...f, lng: e.target.value}))}
                    className="w-full bg-white border border-em-border rounded-lg px-3 py-2 text-xs text-nova-text focus:border-orange-500/50 outline-none" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving || !form.name}
                  className="px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : editingId ? '💾 Update Source' : '✚ Add Source'}
                </button>
                <button onClick={() => { setShowAddForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                  className="px-4 py-2 rounded-lg border border-em-border text-em-text-dim text-xs hover:text-nova-text transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Type filters */}
          <div className="flex gap-1.5 flex-wrap">
            {['ALL', 'RESTAURANT', 'HOTEL', 'SUPERMARKET', 'WAREHOUSE'].map(type => (
              <button key={type} onClick={() => setFilterType(type)}
                className={cn('px-3 py-1.5 rounded-lg text-xs border transition-all',
                  filterType === type
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    : 'bg-white border-em-border text-em-text-dim hover:text-nova-text')}>
                {type === 'ALL' ? 'All' : `${TYPE_ICONS[type]} ${type}`}
              </button>
            ))}
          </div>

          {/* Sources Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="em-card border border-em-border rounded-xl p-5 h-40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSources.map((source, i) => (
                <motion.div key={source.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="em-card border border-em-border rounded-xl p-5 hover:border-orange-500/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{TYPE_ICONS[source.type] || '📦'}</span>
                      <div>
                        <p className="text-sm font-semibold text-nova-text">{source.name}</p>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full', TYPE_COLORS[source.type])}>{source.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(source)} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                        <Edit3 className="w-3 h-3 text-em-text-dim" />
                      </button>
                      <button onClick={() => handleStatusToggle(source)} className={cn('p-1.5 rounded-lg transition-colors',
                        source.status === 'ACTIVE' ? 'hover:bg-red-500/10' : 'hover:bg-green-500/10')}>
                        {source.status === 'ACTIVE'
                          ? <XCircle className="w-3 h-3 text-red-400" />
                          : <CheckCircle2 className="w-3 h-3 text-green-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <p className="text-[10px] text-orange-400/70 flex items-center gap-1"><UtensilsCrossed className="w-2.5 h-2.5" /> Meals</p>
                      <p className="text-sm font-bold text-orange-300">{source.availableMeals.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-[10px] text-blue-400/70 flex items-center gap-1"><Droplets className="w-2.5 h-2.5" /> Water</p>
                      <p className="text-sm font-bold text-blue-300">{source.waterBottles.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {source.location?.address && (
                      <div className="flex items-center gap-1 text-[10px] text-em-text-dim">
                        <MapPin className="w-2.5 h-2.5" />{source.location.address}
                      </div>
                    )}
                    {source.contact && (
                      <div className="flex items-center gap-1 text-[10px] text-em-text-dim">
                        <Phone className="w-2.5 h-2.5" />{source.contact}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-em-border">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full',
                      source.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                      source.status === 'DEPLETED' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400')}>
                      ● {source.status}
                    </span>
                  </div>
                </motion.div>
              ))}

              {filteredSources.length === 0 && !loading && (
                <div className="col-span-3 em-card border border-em-border rounded-xl p-12 text-center">
                  <Package className="w-12 h-12 text-em-text-dim mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-em-text-dim">No food sources found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardShell>
    </AuthGuard>
  );
}
