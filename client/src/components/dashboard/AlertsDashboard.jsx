// src/components/dashboard/AlertsDashboard.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const AlertsDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAlertStyles = (type, severity) => {
    const baseStyles = {
      critical: 'bg-red-100 border-l-4 border-red-500 text-red-900',
      high: 'bg-orange-100 border-l-4 border-orange-500 text-orange-900',
      medium: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900',
      low: 'bg-green-100 border-l-4 border-green-500 text-green-900'
    };

    const buttonStyles = {
      critical: 'bg-red-200 text-red-900 hover:bg-red-300',
      high: 'bg-orange-200 text-orange-900 hover:bg-orange-300',
      medium: 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300',
      low: 'bg-green-200 text-green-900 hover:bg-green-300'
    };

    return {
      container: baseStyles[severity] || baseStyles.medium,
      button: buttonStyles[severity] || buttonStyles.medium
    };
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.patch(`/api/monitoring/alerts/${alertId}/acknowledge`);
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== alertId));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/api/monitoring/alerts');
        setAlerts(response.data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // da 30000 a 60000

    return () => clearInterval(interval);
  }, []);

  if (loading || alerts.length === 0) return null;

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Alert Attivi</h2>
      <div className="space-y-4">
      {alerts.map((alert) => {
        const styles = getAlertStyles(alert.type || 'system', alert.severity || 'medium');
          
          return (
            <div key={alert._id} className={`p-4 rounded-lg ${styles.container}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {alert.clientId?.companyName || 'Unknown Client'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {(alert.severity || 'medium').toUpperCase()}
                        </span>
                        <span className="text-sm">
                          {(alert.type || 'system').toUpperCase()}
                        </span>
                      </div>
                  <p className="mt-1 text-sm">
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs opacity-75">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleAcknowledge(alert._id)}
                  className={`ml-4 px-3 py-1 text-sm rounded-md transition-colors ${styles.button}`}
                >
                  Visto
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsDashboard;