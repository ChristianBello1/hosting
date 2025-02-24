// src/components/clients/StatusManager.jsx
import { useState } from 'react';
import api from '../../api/axios';

const StatusManager = ({ client, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await api.patch(`/api/auth/clients/${client._id}/status`, {
        status: newStatus
      });
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusOptions = () => {
    switch (client.siteStatus) {
      case 'pending':
        return [
          { label: 'Activate', value: 'active', color: 'bg-green-600' }
        ];
      case 'active':
        return [
          { label: 'Suspend', value: 'suspended', color: 'bg-red-600' }
        ];
      case 'suspended':
        return [
          { label: 'Reactivate', value: 'active', color: 'bg-green-600' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex gap-2">
      {getStatusOptions().map((option) => (
        <button
          key={option.value}
          onClick={() => handleStatusChange(option.value)}
          disabled={loading}
          className={`${option.color} text-white px-3 py-1 rounded-md text-sm hover:opacity-90 disabled:opacity-50`}
        >
          {loading ? 'Updating...' : option.label}
        </button>
      ))}
    </div>
  );
};

export default StatusManager;