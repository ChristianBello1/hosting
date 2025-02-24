// src/components/clients/SiteMetrics.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const SiteMetrics = ({ client }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get(`/api/monitoring/resources/${client._id}`);
        const resources = response.data;
        
        // Verifichiamo che resources contenga i dati necessari
        if (resources) {
          setMetrics({
            uptime: Math.floor(90 + Math.random() * 10) + '%',
            storage: {
              used: resources.disk?.used || 0,
              total: resources.disk?.total || 100
            },
            lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            visitors: {
              today: Math.floor(Math.random() * 200),
              thisMonth: Math.floor(Math.random() * 5000)
            },
            responseTime: Math.floor(100 + Math.random() * 300)
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setLoading(false);
      }
    };

    if (client && client._id) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 60000); // da 30000 a 60000
      return () => clearInterval(interval);
    } 
  }, [client]);

  if (loading || !metrics) return null;

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Site Metrics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500">Uptime</div>
          <div className="text-lg font-semibold text-green-600">{metrics.uptime}</div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500">Storage Used</div>
          <div className="text-lg font-semibold text-blue-600">
            {metrics.storage.used}GB / {metrics.storage.total}GB
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500">Response Time</div>
          <div className="text-lg font-semibold text-indigo-600">
            {metrics.responseTime}ms
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-500">Monthly Visitors</div>
          <div className="text-lg font-semibold text-purple-600">
            {metrics.visitors.thisMonth.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteMetrics;