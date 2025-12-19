import React from 'react';
import { Calendar } from 'lucide-react';

const SubscribersTab = ({ subscribers }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <div className="section-header">
        <h3>Newsletter Subscribers</h3>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subscription Date</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(subscriber => (
              <tr key={subscriber.id}>
                <td>{subscriber.name || 'N/A'}</td>
                <td>{subscriber.email}</td>
                <td>{formatDate(subscriber.subscribed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscribersTab;