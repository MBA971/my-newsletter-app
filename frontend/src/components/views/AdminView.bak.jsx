import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Calendar, User, Shield,
  Search, LayoutGrid, FileText, Activity, Users,
  Archive, CheckCircle, Clock, Check, X, AlertCircle
} from 'lucide-react';

const AdminView = ({
  users = [],
  domains = [],
  news = [],
  auditLogs = [],
  onSaveDomain,
  onDeleteDomain,
  onSaveUser,
  onDeleteUser,
  onSaveNews,
  onDeleteNews,
  availableColors = [],
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Optimized Filter Logic
  const filteredUsers = useMemo(() =>
    users.filter(user =>
      (currentUser.role === 'super_admin' || user.domain_name === currentUser.domain) &&
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [users, searchTerm, currentUser]);

  const validatedNews = useMemo(() =>
    news.filter(item => !item.pending_validation && !item.archived &&
      (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [news, searchTerm]);

  const pendingNews = useMemo(() =>
    news.filter(item => item.pending_validation && !item.archived &&
      (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [news, searchTerm]);

  const archivedNews = useMemo(() =>
    news.filter(item => item.archived &&
      (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [news, searchTerm]);

  const filteredAuditLogs = useMemo(() =>
    auditLogs.filter(log =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [auditLogs, searchTerm]);

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalNews = news.length;
    const pCount = news.filter(n => n.pending_validation && !n.archived).length;
    const aCount = news.filter(n => n.archived).length;
    const vCount = news.filter(n => !n.pending_validation && !n.archived).length;

    return [
      { label: 'Domains', value: domains.length, icon: Shield, color: 'var(--primary-500)', tab: 'domains' },
      { label: 'Users', value: users.length, icon: Users, color: 'var(--secondary-500)', tab: 'users' },
      { label: 'Validated', value: vCount, icon: CheckCircle, color: 'var(--success-500)', tab: 'news' },
      { label: 'Pending', value: pCount, icon: Clock, color: 'var(--warning-500)', tab: 'pending' }
    ];
  }, [domains.length, users.length, news]);

  // Reset search when tab changes
  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  const getDomainColor = (domainName) => {
    const domain = domains.find(d => d.name === domainName);
    return domain?.color || 'var(--primary-500)';
  };

  return (
    <div className="animate-fadeIn">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="card glass p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setActiveTab(stat.tab)}
          >
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-tertiary text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div className="tabs glass p-1 rounded-xl flex flex-wrap gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
            { id: 'domains', label: 'Domains', icon: Shield },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'news', label: 'News', icon: FileText },
            { id: 'pending', label: 'Pending', icon: Clock },
            { id: 'archived', label: 'Archived', icon: Archive },
            { id: 'activity', label: 'Activity', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} /> <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="search-container glass w-full lg:max-w-xs">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search in current tab..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content transition-all duration-300">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="card glass p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield className="text-primary-500" /> Domain Distribution
              </h3>
              <div className="space-y-4">
                {domains.map(domain => {
                  const count = news.filter(n => n.domain === domain.name).length;
                  const percentage = news.length > 0 ? (count / news.length) * 100 : 0;
                  return (
                    <div key={domain.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{domain.name}</span>
                        <span className="text-tertiary">{count} articles ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: domain.color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card glass p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity className="text-secondary-500" /> System Health
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Status</p>
                  <p className="text-lg font-bold">Operational</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                  <p className="text-xs text-purple-600 font-bold uppercase mb-1">Role</p>
                  <p className="text-lg font-bold">{currentUser.role === 'super_admin' ? 'Super Admin' : 'Domain Admin'}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Database</p>
                  <p className="text-lg font-bold">Connected</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                  <p className="text-xs text-orange-600 font-bold uppercase mb-1">Updates</p>
                  <p className="text-lg font-bold">Up to date</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Domains List */}
        {activeTab === 'domains' && (
          <div className="grid grid-cols-3 gap-6">
            {domains.map(domain => (
              <div key={domain.id} className="card glass p-6 hover:translate-y-[-4px] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: domain.color }}
                  >
                    {domain.name.charAt(0)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onSaveDomain(domain, true)} className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => onDeleteDomain(domain.id)} className="p-2 text-error-500 hover:bg-error-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1">{domain.name}</h3>
                <p className="text-tertiary text-sm">
                  {news.filter(n => (n.domain_name || n.domain) === domain.name).length} articles total
                </p>
              </div>
            ))}
            <button
              onClick={() => onSaveDomain({ name: '', color: '#3b82f6' }, false)}
              className="card glass border-dashed border-2 p-6 flex flex-col items-center justify-center gap-3 text-tertiary hover:text-primary-500 hover:border-primary-500 transition-all min-h-[160px]"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <Plus size={24} />
              </div>
              <span className="font-medium">Add New Domain</span>
            </button>
          </div>
        )}

        {/* Users List */}
        {activeTab === 'users' && (
          <div className="card glass overflow-hidden border-none shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 text-tertiary text-xs uppercase tracking-[0.1em] font-bold">
                  <th className="px-6 py-5">System Member</th>
                  <th className="px-6 py-5">Authorization</th>
                  <th className="px-6 py-5">Assigned Domain</th>
                  <th className="px-6 py-5 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-tertiary">No members found matching your search.</td></tr>
                ) : filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-primary-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{user.username}</p>
                          <p className="text-tertiary text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${user.role === 'super_admin' ? 'badge-secondary' :
                        user.role === 'domain_admin' ? 'badge-success' : 'badge-primary'}`}>
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-tertiary text-sm">
                      {user.domain_name || user.domain || 'All Domains'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onSaveUser(user, true)} className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg" title="Edit User">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => onDeleteUser(user.id)} className="p-2 text-error-500 hover:bg-error-50 rounded-lg" title="Delete User">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* News List */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            {validatedNews.length === 0 ? (
              <div className="card glass p-10 text-center text-tertiary">No validated articles found.</div>
            ) : validatedNews.map(item => (
              <NewsCard key={item.id} item={item} getDomainColor={getDomainColor} onEdit={onSaveNews} onDelete={onDeleteNews} />
            ))}
          </div>
        )}

        {/* Pending Validation List */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingNews.length === 0 ? (
              <div className="card glass p-10 text-center text-tertiary">No articles pending validation.</div>
            ) : pendingNews.map(item => (
              <NewsCard key={item.id} item={item} getDomainColor={getDomainColor} onEdit={onSaveNews} onDelete={onDeleteNews} status="pending" />
            ))}
          </div>
        )}

        {/* Archived News List */}
        {activeTab === 'archived' && (
          <div className="space-y-4">
            {archivedNews.length === 0 ? (
              <div className="card glass p-10 text-center text-tertiary">No archived articles found.</div>
            ) : archivedNews.map(item => (
              <NewsCard key={item.id} item={item} getDomainColor={getDomainColor} onEdit={onSaveNews} onDelete={onDeleteNews} status="archived" />
            ))}
          </div>
        )}

        {/* Activity Log (Audit Logs) */}
        {activeTab === 'activity' && (
          <div className="card glass overflow-hidden border-none shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 text-tertiary text-xs uppercase tracking-[0.1em] font-bold">
                  <th className="px-6 py-5">Time</th>
                  <th className="px-6 py-5">Administrator</th>
                  <th className="px-6 py-5">Action</th>
                  <th className="px-6 py-5">Target / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {filteredAuditLogs.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-tertiary">No activity logs recorded yet.</td></tr>
                ) : filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs whitespace-nowrap text-tertiary">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm">{log.username || 'System'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.action?.includes('DELETE') ? 'bg-red-50 text-red-600' :
                          log.action?.includes('UPDATE') ? 'bg-blue-50 text-blue-600' :
                            'bg-green-50 text-green-600'
                        }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-tertiary text-sm max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for News Article Card
const NewsCard = ({ item, getDomainColor, onEdit, onDelete, status }) => (
  <div className="card glass p-6 flex gap-6 hover:translate-x-2 transition-transform duration-300">
    <div
      className="w-1.5 bg-primary-500 rounded-full shrink-0"
      style={{ backgroundColor: getDomainColor(item.domain_name || item.domain) }}
    ></div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <span className="badge" style={{
          backgroundColor: `${getDomainColor(item.domain_name || item.domain)}20`,
          color: getDomainColor(item.domain_name || item.domain)
        }}>
          {item.domain_name || item.domain}
        </span>
        {status === 'pending' && <span className="badge badge-warning flex items-center gap-1"><Clock size={12} /> Needs Approval</span>}
        {status === 'archived' && <span className="badge badge-secondary flex items-center gap-1"><Archive size={12} /> Archived</span>}
        <span className="text-tertiary text-xs flex items-center gap-1">
          <Calendar size={12} /> {new Date(item.date).toLocaleDateString()}
        </span>
        <span className="text-tertiary text-xs font-medium">by <span className="text-secondary-600">{item.author}</span></span>
      </div>
      <h3 className="text-lg font-bold mb-2 group-hover:text-primary-600 transition-colors">{item.title}</h3>
      <p className="text-secondary text-sm line-clamp-2 leading-relaxed">{item.content}</p>
    </div>
    <div className="flex flex-col gap-2 justify-center">
      <button onClick={() => onEdit(item, true)} className="btn btn-ghost btn-sm text-primary-500 glass hover:bg-primary-500 hover:text-white transition-all">
        <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
      </button>
      <button onClick={() => onDelete(item.id)} className="btn btn-ghost btn-sm text-error-500 glass hover:bg-error-500 hover:text-white transition-all">
        <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
      </button>
    </div>
  </div>
);

export default AdminView;
