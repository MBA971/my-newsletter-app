import React, { useState, useEffect } from 'react';
import { Activity, Search } from 'lucide-react';
import { audit as auditApi } from '../../../services/api';

const AuditLogTab = ({ 
    currentUser,
    showNotification
}) => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Reset search when component mounts
    useEffect(() => {
        setSearchTerm('');
    }, []);

    // Load audit logs
    useEffect(() => {
        const loadAuditLogs = async () => {
            // Only super admins can access audit logs
            if (currentUser.role === 'super_admin') {
                setLoadingAuditLogs(true);
                try {
                    const logs = await auditApi.getAll();
                    setAuditLogs(logs);
                } catch (error) {
                    console.error('Failed to load audit logs:', error);
                    if (showNotification) {
                        showNotification('Failed to load audit logs. Please try again.', 'error');
                    }
                } finally {
                    setLoadingAuditLogs(false);
                }
            }
        };

        loadAuditLogs();
    }, [currentUser, showNotification]);

    // Helper function
    const getInitials = (name) => {
        return name
            ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
            : '??';
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    // Filter Logic - only for super admins
    const filteredAuditLogs = currentUser.role === 'super_admin' 
        ? auditLogs.filter(log =>
            (log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : [];

    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Audit Log</h2>
                    <p className="text-secondary mt-1">Track system security and user details</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative max-w-md">
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search audit logs..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Action</th>
                            <th>Timestamp</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingAuditLogs ? (
                            <tr>
                                <td colSpan="4" className="text-center py-4">
                                    Loading audit logs...
                                </td>
                            </tr>
                        ) : filteredAuditLogs.length > 0 ? (
                            filteredAuditLogs.map(log => (
                                <tr key={log.id} className="group">
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                                {getInitials(log.username)}
                                            </div>
                                            {log.username}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${
                                            log.action === 'login' ? 'badge-success' :
                                            log.action === 'logout' ? 'badge-info' : 'badge-secondary'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="text-tertiary">{formatTimestamp(log.timestamp)}</td>
                                    <td className="text-tertiary">{log.ip_address}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-4">
                                    <p>No audit logs found matching "{searchTerm}"</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogTab;