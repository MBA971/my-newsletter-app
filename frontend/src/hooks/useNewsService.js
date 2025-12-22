import { useCallback } from 'react';
import { news as newsApi } from '../services/api'; // Import the news API service

export const useNewsService = (showNotification, fetchData) => {

    const fetchNewsItemById = useCallback(async (id) => {
        try {
            const newsItem = await newsApi.getById(id);
            return newsItem;
        } catch (error) {
            console.error('Error fetching news item:', error);
            if (showNotification) {
                showNotification('Failed to load article data. Please try again.', 'error');
            }
            throw error; // Re-throw to allow component to handle if needed
        }
    }, [showNotification]);

    const saveNews = useCallback(async (newsItemToSend, isEditing) => {
        try {
            if (isEditing) {
                await newsApi.update(newsItemToSend.id, newsItemToSend);
                if (showNotification) {
                    showNotification('Article updated successfully!', 'success');
                }
            } else {
                await newsApi.create(newsItemToSend);
                if (showNotification) {
                    showNotification('Article created successfully!', 'success');
                }
            }
            if (fetchData) {
                fetchData(); // Refresh data in parent component
            }
            return true;
        } catch (error) {
            console.error('Error saving news:', error);
            if (showNotification) {
                showNotification('Failed to save article. ' + (error.message || ''), 'error');
            }
            return false;
        }
    }, [showNotification, fetchData]);

    const deleteNews = useCallback(async (id) => {
        try {
            await newsApi.delete(id);
            if (showNotification) {
                showNotification('Article deleted successfully!', 'success');
            }
            if (fetchData) {
                fetchData(); // Refresh data in parent component
            }
            return true;
        } catch (error) {
            console.error('Error deleting news:', error);
            if (showNotification) {
                showNotification('Failed to delete article. ' + (error.message || ''), 'error');
            }
            return false;
        }
    }, [showNotification, fetchData]);

    const toggleArchive = useCallback(async (id, currentArchivedStatus) => {
        try {
            // newsApi.toggleArchive is not defined. We have newsApi.archive and newsApi.unarchive.
            // So we'll call the appropriate one based on currentArchivedStatus
            if (currentArchivedStatus) {
                await newsApi.unarchive(id);
                if (showNotification) {
                    showNotification('Article unarchived successfully!', 'success');
                }
            } else {
                await newsApi.archive(id);
                if (showNotification) {
                    showNotification('Article archived successfully!', 'success');
                }
            }
            if (fetchData) {
                fetchData(); // Refresh data in parent component
            }
            return true;
        } catch (error) {
            console.error('Error toggling archive status:', error);
            if (showNotification) {
                showNotification('Failed to change archive status. ' + (error.message || ''), 'error');
            }
            return false;
        }
    }, [showNotification, fetchData]);

    return {
        fetchNewsItemById,
        saveNews,
        deleteNews,
        toggleArchive,
    };
};
