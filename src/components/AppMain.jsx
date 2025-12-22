import React from 'react';
import { PublicView, ContributorView, AdminView } from './index';

const AppMain = ({ 
  currentView,
  news,
  domains,
  domainColors,
  searchTerm,
  setSearchTerm,
  filterDomain,
  setFilterDomain,
  handleLikeNews,
  contributorNews,
  handleOpenNewNews,
  handleEditNews,
  handleDeleteNews,
  testFetchContributorData,
  users,
  subscribers,
  adminNews,
  handleOpenNewUser,
  handleEditUser,
  handleDeleteUser,
  handleOpenNewDomain,
  handleEditDomain,
  handleDeleteDomain,
  handleValidateNews,
  handleToggleArchiveNews
}) => {
  return (
    <main className="main-content">
      {currentView === 'public' && (
        <PublicView 
          news={news}
          domains={domains}
          domainColors={domainColors}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterDomain={filterDomain}
          setFilterDomain={setFilterDomain}
          handleLikeNews={handleLikeNews}
        />
      )}
      {currentView === 'contributor' && (
        <ContributorView 
          contributorNews={contributorNews}
          domainColors={domainColors}
          handleOpenNewNews={handleOpenNewNews}
          handleEditNews={handleEditNews}
          handleDeleteNews={handleDeleteNews}
          testFetchContributorData={testFetchContributorData}
        />
      )}
      {currentView === 'admin' && (
        <AdminView 
          users={users}
          subscribers={subscribers}
          domains={domains}
          domainColors={domainColors}
          news={adminNews}
          handleOpenNewUser={handleOpenNewUser}
          handleEditUser={handleEditUser}
          handleDeleteUser={handleDeleteUser}
          handleOpenNewDomain={handleOpenNewDomain}
          handleEditDomain={handleEditDomain}
          handleDeleteDomain={handleDeleteDomain}
          handleValidateNews={handleValidateNews}
          handleToggleArchiveNews={handleToggleArchiveNews}
        />
      )}
    </main>
  );
};

export default AppMain;