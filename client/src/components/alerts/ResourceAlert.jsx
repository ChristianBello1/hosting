// src/components/alerts/ResourceAlerts.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const ResourceAlerts = ({ client }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get(`/api/monitoring/alerts/${client._id}`);
        setAlerts(response.data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Aggiorna ogni minuto

    return () => clearInterval(interval);
  }, [client._id]);

  if (loading) return null;

  if (alerts.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900">Resource Alerts</h3>
      <div className="mt-2 space-y-2">
        {alerts.map((alert, index) => (
          <div 
            key={index}
            className={`p-3 rounded-md ${
              alert.severity === 'high' ? 'bg-red-50 text-red-800' :
              alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-800' :
              'bg-green-50 text-green-800'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium">{alert.type.toUpperCase()}</span>
              <span className="text-sm">
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-sm">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceAlerts;