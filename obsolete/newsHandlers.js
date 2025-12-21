/**
 * News handlers service for App.jsx
 */

// Handle saving news with proper domain logic
export const handleSaveNewsService = async (
  newsData, 
  isEditing, 
  currentUser, 
  domains, 
  onSaveNews, 
  showNotification
) => {
  try {
    console.log('[DEBUG] handleSaveNews called with:', { newsData, isEditing, currentUser, domains });
    console.log('[DEBUG] Available domains:', domains.map(d => ({ id: d.id, name: d.name })));
    let domainValue = newsData.domain;

    if (currentUser.role === 'contributor') {
      // For contributors, use their assigned domain
      const userDomain = currentUser.domain;
      console.log('[DEBUG] Contributor role - user domain:', userDomain);

      // Check if contributor has a domain assigned
      if (!userDomain) {
        console.error('[ERROR] Contributor user has no domain assigned');
        showNotification('You must be assigned to a domain before creating or editing articles. Please contact your administrator.', 'error');
        return false;
      }

      // Try to find domain by name (case-insensitive and trimmed)
      const domainObj = domains.find(d =>
        d.name && userDomain &&
        d.name.toString().trim().toLowerCase() === userDomain.toString().trim().toLowerCase()
      );
      domainValue = domainObj ? domainObj.id : null;
      console.log('[DEBUG] Contributor role - found domain object:', domainObj, 'resolved domainValue:', domainValue);

      // If still null, try to get domain from existing article as fallback
      if (domainValue === null && newsData.id) {
        const existingNews = news.find(n => n.id === newsData.id);
        if (existingNews) {
          // Try to get domain ID from existing news item
          domainValue = existingNews.domain_id ||
                       (existingNews.domain && typeof existingNews.domain === 'number' ? existingNews.domain : null);
          console.log('[DEBUG] Contributor role - using domain from existing article:', domainValue);

          // If we still don't have a domain ID, try to find it by domain name
          if (domainValue === null && existingNews.domain && typeof existingNews.domain === 'string') {
            const existingDomainObj = domains.find(d =>
              d.name && existingNews.domain &&
              d.name.toString().trim().toLowerCase() === existingNews.domain.toString().trim().toLowerCase()
            );
            domainValue = existingDomainObj ? existingDomainObj.id : null;
            console.log('[DEBUG] Contributor role - found domain by existing article name:', existingDomainObj, 'domainValue:', domainValue);
          }
        }
      }
    } else if (typeof newsData.domain === 'string') {
      // For admins, try to find domain by name
      const domainObj = domains.find(d =>
        d.name && newsData.domain &&
        d.name.toString().trim().toLowerCase() === newsData.domain.toString().trim().toLowerCase()
      );
      domainValue = domainObj ? domainObj.id : newsData.domain;
      console.log('[DEBUG] String domain - resolved domainValue:', domainValue);
    }

    // Validate that we have a domain
    if (domainValue === null || domainValue === undefined) {
      console.error('[ERROR] No valid domain found for news article');
      showNotification('Unable to determine article domain. Please contact administrator.', 'error');
      return false;
    }

    const payload = { ...newsData, author: currentUser.username, domain: domainValue };
    console.log('[DEBUG] Sending payload:', payload);

    if (isEditing) {
      await onSaveNews(newsData.id, payload);
      showNotification('News updated', 'success');
    } else {
      await onSaveNews(payload);
      showNotification('News added', 'success');
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] handleSaveNews:', error);
    showNotification(error.message || 'Error saving news', 'error');
    return false;
  }
};