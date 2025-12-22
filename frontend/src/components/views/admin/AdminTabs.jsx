import React from 'react';
import { Shield, User, FileText, Archive, Activity, Calendar } from 'lucide-react';

const AdminTabs = ({ activeTab, setActiveTab, currentUser }) => {
  const tabs = [
    { name: 'domains', label: 'Domains', icon: Shield, roles: ['super_admin'] },
    { name: 'users', label: 'Users', icon: User, roles: ['super_admin'] },
    { name: 'news', label: 'News', icon: FileText, roles: ['super_admin', 'domain_admin'] },
    { name: 'archived', label: 'Archived', icon: Archive, roles: ['super_admin', 'domain_admin'] },
    { name: 'validation', label: 'Validation', icon: Calendar, roles: ['super_admin', 'domain_admin'] },
    { name: 'audit', label: 'Audit Log', icon: Activity, roles: ['super_admin'] },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="tabs m-0">
        {tabs.map(tab => {
          if (tab.roles.includes(currentUser.role)) {
            return (
              <button
                key={tab.name}
                className={`tab ${activeTab === tab.name ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.name)}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default AdminTabs;
