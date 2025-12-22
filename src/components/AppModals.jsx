import React from 'react';
import { LoginForm, NewsModal, UserModal, DomainModal } from './index';

const AppModals = ({ 
  showLogin, 
  setShowLogin, 
  loginForm, 
  setLoginForm, 
  handleLogin,
  showAddNews,
  setShowAddNews,
  editingNews,
  newNews,
  setNewNews,
  domains,
  currentUser,
  handleCreateNews,
  handleUpdateNews,
  handleCancelNews,
  showAddUser,
  setShowAddUser,
  editingUser,
  newUser,
  setNewUser,
  handleCreateUser,
  handleUpdateUser,
  handleCancelUser,
  showAddDomain,
  setShowAddDomain,
  editingDomain,
  newDomain,
  setNewDomain,
  availableColors,
  handleCreateDomain,
  handleUpdateDomain,
  handleCancelDomain
}) => {
  return (
    <>
      {showLogin && (
        <LoginForm 
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          handleLogin={handleLogin}
          setShowLogin={setShowLogin}
        />
      )}
      
      {showAddNews && (
        <NewsModal
          editingNews={editingNews}
          newNews={newNews}
          setNewNews={setNewNews}
          domains={domains}
          currentUser={currentUser}
          handleCreateNews={handleCreateNews}
          handleUpdateNews={handleUpdateNews}
          handleCancelNews={handleCancelNews}
        />
      )}
      
      {showAddUser && (
        <UserModal
          editingUser={editingUser}
          newUser={newUser}
          setNewUser={setNewUser}
          domains={domains}
          handleCreateUser={handleCreateUser}
          handleUpdateUser={handleUpdateUser}
          handleCancelUser={handleCancelUser}
        />
      )}
      
      {showAddDomain && (
        <DomainModal
          editingDomain={editingDomain}
          newDomain={newDomain}
          setNewDomain={setNewDomain}
          availableColors={availableColors}
          handleCreateDomain={handleCreateDomain}
          handleUpdateDomain={handleUpdateDomain}
          handleCancelDomain={handleCancelDomain}
        />
      )}
    </>
  );
};

export default AppModals;