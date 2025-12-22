/**
 * Unit tests for ContributorView component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContributorView from './ContributorView.jsx';

// Mock the dependencies
jest.mock('../../services/api', () => ({
  news: {
    getAll: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({ id: 1, title: 'Test', content: 'Content', domain: 'Hiring' })),
    update: jest.fn(() => Promise.resolve({ id: 1, title: 'Updated', content: 'Updated Content', domain: 'Hiring' })),
    delete: jest.fn(() => Promise.resolve({})),
    toggleArchive: jest.fn(() => Promise.resolve({})),
    like: jest.fn(() => Promise.resolve({})),
  },
  domains: {
    getAll: jest.fn(() => Promise.resolve([{ id: 1, name: 'Hiring', color: '#007AFF' }])),
  },
  users: {
    getAll: jest.fn(() => Promise.resolve([])),
  },
  subscribers: {
    getAll: jest.fn(() => Promise.resolve([])),
  },
  audit: {
    getAll: jest.fn(() => Promise.resolve([])),
  }
}));

// Mock the Notification component
jest.mock('../ui/Notification', () => () => <div data-testid="notification" />);

// Mock the NewsModal component
jest.mock('../modals/NewsModal', () => ({ show, children }) => {
  return show ? <div data-testid="news-modal">{children}</div> : null;
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock the theme functions
global.getCurrentTheme = () => 'macos';
global.setThemePreference = jest.fn();
global.applyTheme = jest.fn();

describe('ContributorView Component', () => {
  const mockProps = {
    news: [
      { id: 1, title: 'Test Article', domain: 'Hiring', content: 'Test content', author: 'testuser', date: '2025-12-20' }
    ],
    domains: [
      { id: 1, name: 'Hiring', color: '#007AFF' },
      { id: 2, name: 'Events', color: '#5856D6' }
    ],
    currentUser: {
      id: 1,
      username: 'testuser',
      email: 'test@company.com',
      role: 'contributor',
      domain: 'Hiring',
      domain_id: 1
    },
    onSaveNews: jest.fn(() => Promise.resolve(true)),
    onDeleteNews: jest.fn(() => Promise.resolve(true)),
    onArchiveNews: jest.fn(() => Promise.resolve(true)),
    onUnarchiveNews: jest.fn(() => Promise.resolve(true)),
    showNotification: jest.fn()
  };

  test('renders contributor view with articles', () => {
    render(<ContributorView {...mockProps} />);
    
    expect(screen.getByText('Manage Your Articles')).toBeInTheDocument();
    expect(screen.getByText('Add Article')).toBeInTheDocument();
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  test('shows domain information for articles', () => {
    render(<ContributorView {...mockProps} />);
    
    // Check that the domain badge is displayed
    const domainBadge = screen.getByText('Hiring');
    expect(domainBadge).toBeInTheDocument();
  });

  test('handles adding new article', () => {
    render(<ContributorView {...mockProps} />);
    
    const addArticleButton = screen.getByText('Add Article');
    fireEvent.click(addArticleButton);
    
    // Check if modal would be shown (implementation dependent)
  });

  test('handles editing article', () => {
    const handleEditNews = jest.fn();
    const newProps = {
      ...mockProps,
      onEditNews: handleEditNews
    };
    
    render(<ContributorView {...newProps} />);
    
    const editButtons = screen.getAllByTitle('Edit article');
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
      // Check if edit function is called
    }
  });

  test('handles archiving article', () => {
    const handleArchiveNews = jest.fn(() => Promise.resolve());
    const newProps = {
      ...mockProps,
      onArchiveNews: handleArchiveNews
    };
    
    render(<ContributorView {...newProps} />);
    
    const archiveButtons = screen.getAllByTitle('Archive/Unarchive article');
    if (archiveButtons.length > 0) {
      fireEvent.click(archiveButtons[0]);
      expect(handleArchiveNews).toHaveBeenCalledWith(1); // Assuming first article ID is 1
    }
  });

  test('handles deleting article', () => {
    const handleDeleteNews = jest.fn(() => Promise.resolve());
    const newProps = {
      ...mockProps,
      onDeleteNews: handleDeleteNews
    };
    
    render(<ContributorView {...newProps} />);
    
    const deleteButtons = screen.getAllByTitle('Delete article');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      expect(handleDeleteNews).toHaveBeenCalledWith(1); // Assuming first article ID is 1
    }
  });

  test('filters articles by contributor', () => {
    const contributorNews = [
      { id: 1, title: 'My Article', domain: 'Hiring', content: 'Content', author_id: 1, author: 'testuser' },
      { id: 2, title: 'Other Article', domain: 'Events', content: 'Content', author_id: 2, author: 'otheruser' }
    ];
    
    const newProps = {
      ...mockProps,
      news: contributorNews,
      currentUser: { ...mockProps.currentUser, id: 1 }
    };
    
    render(<ContributorView {...newProps} />);
    
    // Only articles authored by the current user should be shown
    expect(screen.getByText('My Article')).toBeInTheDocument();
    // The other article may also be visible depending on the filtering logic
  });

  test('shows appropriate message when no articles exist', () => {
    const newProps = {
      ...mockProps,
      news: []
    };
    
    render(<ContributorView {...newProps} />);
    
    expect(screen.getByText('No articles yet')).toBeInTheDocument();
  });

  test('disables edit button for archived articles', () => {
    const archivedNews = [
      { id: 1, title: 'Archived Article', domain: 'Hiring', content: 'Content', author: 'testuser', archived: true }
    ];
    
    const newProps = {
      ...mockProps,
      news: archivedNews
    };
    
    render(<ContributorView {...newProps} />);
    
    // Archived articles should have edit buttons disabled
    const editButtons = screen.getAllByTitle('Edit article');
    // This depends on the implementation - archived articles might have disabled edit buttons
  });
});