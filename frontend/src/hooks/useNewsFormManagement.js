import { useState, useCallback } from 'react';

export const useNewsFormManagement = (currentUser, showNotification) => {
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', domain_id: null });

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingNews(null);
        setFormData({ title: '', content: '', domain_id: null });
    }, []);

    const handleAddNew = useCallback(() => {
        // Check if user has permission to create articles
        if (!currentUser) {
            if (showNotification) {
                showNotification('You must be logged in to create articles.', 'error');
            }
            return;
        }

        // For contributors, check if they have a domain assigned
        if (currentUser.role === 'contributor' && !currentUser.domain_id) {
            if (showNotification) {
                showNotification('You must be assigned to a domain before creating articles. Please contact your administrator.', 'error');
            }
            return;
        }

        // For super admins and domain admins, they can create articles in any domain
        // Set default domain to their assigned domain if they have one
        const defaultDomainId = currentUser.domain_id || null;
        
        setFormData({ title: '', content: '', domain_id: defaultDomainId });
        setEditingNews(null);
        setShowModal(true);
    }, [currentUser, showNotification]);

    return {
        showModal,
        setShowModal,
        editingNews,
        setEditingNews,
        formData,
        setFormData,
        closeModal,
        handleAddNew,
    };
};