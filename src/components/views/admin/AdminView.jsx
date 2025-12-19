import React, { useState } from 'react';
import { User, Mail } from 'lucide-react';
import UsersTab from './UsersTab';
import DomainsTab from './DomainsTab';
import SubscribersTab from './SubscribersTab';
import ValidationTab from './ValidationTab';
import ArchivedNewsTab from './ArchivedNewsTab';
import NewsTab from './NewsTab';

const AdminView = ({ 
  users, 
  subscribers, 
  domains, 
  domainColors,
  news,
  handleOpenNewUser,
  handleEditUser,
  handleDeleteUser,
  handleOpenNewDomain,
  handleEditDomain,
  handleDeleteDomain,
  handleValidateNews,
  handleToggleArchiveNews,
  handleEditNews,
  handleDeleteNews
}) => {
  const [activeTab, setActiveTab] = useState('users');

  // Filter news for pending validation
  const pendingValidationNews = news.filter(item => item.pending_validation && !item.archived);
  
  // Filter archived news
  const archivedNews = news.filter(item => item.archived);

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <h2 className="section-title">Administration Panel</h2>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <User size={16} />
          Users ({users.length})
        </button>
        <button 
          className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          Domains ({domains.length})
        </button>
        <button 
          className={`tab ${activeTab === 'subscribers' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscribers')}
        >
          <Mail size={16} />
          Subscribers ({subscribers.length})
        </button>
        <button 
          className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          Pending Validation ({pendingValidationNews.length})
        </button>
        <button 
          className={`tab ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived ({archivedNews.length})
        </button>
        <button 
          className={`tab ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          All News ({news.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <UsersTab 
            users={users}
            handleOpenNewUser={handleOpenNewUser}
            handleEditUser={handleEditUser}
            handleDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'domains' && (
          <DomainsTab 
            domains={domains}
            handleOpenNewDomain={handleOpenNewDomain}
            handleEditDomain={handleEditDomain}
            handleDeleteDomain={handleDeleteDomain}
          />
        )}

        {activeTab === 'subscribers' && (
          <SubscribersTab 
            subscribers={subscribers}
          />
        )}

        {activeTab === 'validation' && (
          <ValidationTab 
            news={news}
            domainColors={domainColors}
            handleValidateNews={handleValidateNews}
            handleToggleArchiveNews={handleToggleArchiveNews}
          />
        )}

        {activeTab === 'archived' && (
          <ArchivedNewsTab 
            news={news}
            domainColors={domainColors}
            handleToggleArchiveNews={handleToggleArchiveNews}
          />
        )}

        {activeTab === 'news' && (
          <NewsTab 
            news={news}
            domainColors={domainColors}
            handleEditNews={handleEditNews}
            handleDeleteNews={handleDeleteNews}
          />
        )}
      </div>
    </div>
  );
};

export default AdminView;