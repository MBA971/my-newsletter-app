import { useCallback } from 'react';

export const useNewsSubmissionLogic = (currentUser, showNotification, saveNews, editingNews) => {

    const handleSaveSubmission = useCallback(async (newsItem) => {
        // If no newsItem was provided (shouldn't happen but just in case)
        if (!newsItem) {
            console.error('No news data provided to handleSaveSubmission');
            return false;
        }

        // Validate domain assignment based on user role
        if (currentUser.role === 'contributor' && (!currentUser || !currentUser.domain_id)) {
            if (showNotification) {
                showNotification('You must be assigned to a domain before creating or editing articles. Please contact your administrator.', 'error');
            }
            return false;
        }

        // Create a copy of the newsItem
        const newsItemToSend = {
            ...newsItem,
            author: currentUser.username
        };

        // Handle domain assignment based on user role
        if (currentUser.role === 'contributor') {
            // Contributors must use their assigned domain
            newsItemToSend.domain_id = currentUser.domain_id;
        } else if (currentUser.role === 'domain_admin') {
            // Domain admins should use their assigned domain
            newsItemToSend.domain_id = currentUser.domain_id;
        } else if (currentUser.role === 'super_admin') {
            // Super admins can choose any domain, but must select one
            // Check if domain_id is valid (not null, undefined, or empty string)
            const isValidDomain = newsItem.domain_id !== undefined && newsItem.domain_id !== null && newsItem.domain_id !== '';
            
            if (!isValidDomain) {
                if (showNotification) {
                    showNotification('Please select a domain for this article.', 'error');
                }
                return false;
            }
            // Use the selected domain
            newsItemToSend.domain_id = newsItem.domain_id;
        }

        // If editing, ensure the ID is included
        if (editingNews) {
            newsItemToSend.id = editingNews.id;
        }

        const success = await saveNews(newsItemToSend, !!editingNews); // Use saveNews
        return success;

    }, [currentUser, showNotification, saveNews, editingNews]); // Dependencies

    return handleSaveSubmission;
};
