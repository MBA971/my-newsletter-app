import React, { useState } from 'react';
import { Calendar, User, Shield, FileText, Activity, Archive, Users } from 'lucide-react';
import DomainsTab from './admin/DomainsTab';
import UsersTab from './admin/UsersTab';
import NewsTab from './admin/NewsTab';
import ArchivedNewsTab from './admin/ArchivedNewsTab';
import AuditLogTab from './admin/AuditLogTab';
import ValidationTab from './admin/ValidationTab';

const AdminView = ({
    domains,
    users,
    news,
    currentUser,
    onSaveDomain,
    onDeleteDomain,
    onSaveUser,
    onDeleteUser,
    onSaveNews,
    onDeleteNews,
    availableColors,
    domainColors,
    showNotification
}) => {
    const [activeTab, setActiveTab] = useState('domains'); // domains, users, news, archived, audit, validation

    // Dashboard Stats
    const stats = [
        {
            label: 'Total Domains',
            value: domains.length,
            icon: Shield,
            gradientClass: 'text-gradient-blue',
            bgClass: 'bg-blue-50'
        },
        {
            label: 'Total Users',
            value: users.length,
            icon: Users,
            gradientClass: 'text-gradient-purple',
            bgClass: 'bg-purple-50'
        },
        {
            label: 'Total Articles',
            value: news.length,
            icon: FileText,
            gradientClass: 'text-gradient-green',
            bgClass: 'bg-green-50'
        },
        {
            label: 'Version',
            value: 'v1.4.0',
            icon: Activity,
            gradientClass: 'text-gradient-orange',
            bgClass: 'bg-orange-50'
        },
    ];

    return (
        <div className="animate-fadeIn">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-tertiary mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-primary">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`stat-card-icon ${stat.bgClass}`}>
                                <stat.icon className={`w-8 h-8 ${stat.gradientClass}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div className="tabs m-0">
                    <button
                        className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
                        onClick={() => setActiveTab('domains')}
                    >
                        <Shield size={18} />
                        Domains
                    </button>
                    {currentUser.role === 'super_admin' && (
                        <button
                            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <User size={18} />
                            Users
                        </button>
                    )}
                    <button
                        className={`tab ${activeTab === 'news' ? 'active' : ''}`}
                        onClick={() => setActiveTab('news')}
                    >
                        <FileText size={18} />
                        News
                    </button>
                    <button
                        className={`tab ${activeTab === 'archived' ? 'active' : ''}`}
                        onClick={() => setActiveTab('archived')}
                    >
                        <Archive size={18} />
                        Archived
                    </button>
                    {currentUser.role === 'super_admin' && (
                        <button
                            className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('audit')}
                        >
                            <Activity size={18} />
                            Audit Log
                        </button>
                    )}
                    <button
                        className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('validation')}
                    >
                        <Calendar size={18} />
                        Validation
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'domains' && (
                <DomainsTab
                    domains={domains}
                    currentUser={currentUser}
                    onSaveDomain={onSaveDomain}
                    onDeleteDomain={onDeleteDomain}
                    availableColors={availableColors}
                    domainColors={domainColors}
                    showNotification={showNotification}
                />
            )}

            {activeTab === 'users' && (
                <UsersTab
                    users={users}
                    currentUser={currentUser}
                    onSaveUser={onSaveUser}
                    onDeleteUser={onDeleteUser}
                    domains={domains}
                    domainColors={domainColors}
                    showNotification={showNotification}
                />
            )}

            {activeTab === 'news' && (
                <NewsTab
                    news={news}
                    currentUser={currentUser}
                    onSaveNews={onSaveNews}
                    onDeleteNews={onDeleteNews}
                    domains={domains}
                    domainColors={domainColors}
                    showNotification={showNotification}
                />
            )}

            {activeTab === 'archived' && (
                <ArchivedNewsTab
                    currentUser={currentUser}
                    domainColors={domainColors}
                    showNotification={showNotification}
                />
            )}

            {activeTab === 'audit' && (
                <AuditLogTab
                    currentUser={currentUser}
                    showNotification={showNotification}
                />
            )}

            {activeTab === 'validation' && (
                <ValidationTab
                    currentUser={currentUser}
                    domainColors={domainColors}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

export default AdminView;