// src/components/clients/ClientList.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusManager from './StatusManager';
import SiteMetrics from './SiteMetrics';
import ResourceMonitor from './ResourceMonitor';
import { Link } from 'react-router-dom';

const ClientList = ({ clients: initialClients, onRefresh }) => {
  const [deployingClients, setDeployingClients] = useState(new Set());
  const [clients, setClients] = useState(initialClients);
  const [updatingPlan, setUpdatingPlan] = useState(null); // Per tracciare quale client sta aggiornando il piano

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const handleRedeploy = async (clientId) => {
    try {
      setDeployingClients(prev => new Set([...prev, clientId]));
      await api.post(`/api/auth/clients/${clientId}/redeploy`);
      onRefresh();
    } catch (error) {
      console.error('Redeploy failed:', error);
    } finally {
      setDeployingClients(prev => {
        const newSet = new Set(prev);
        newSet.delete(clientId);
        return newSet;
      });
    }
  };

const handlePlanChange = async (clientId, newPlan) => {
  try {
    setUpdatingPlan(clientId);

    console.log('Updating plan:', {
      clientId,
      newPlan,
      timestamp: new Date().toISOString()
    });
    
    const response = await api.patch(
      `/api/auth/clients/${clientId}/plan`,
      { plan: newPlan }
    );

    if (response.data.status === 'success') {
      // Aggiorna lo state locale
      setClients(prevClients => 
        prevClients.map(client => 
          client._id === clientId 
            ? { ...client, ...response.data.client }
            : client
        )
      );

      // Mostra notifica di successo (se hai un sistema di notifiche)
      // showNotification('Piano aggiornato con successo');
    }

  } catch (error) {
    console.error('Failed to update plan:', error);
    
    // Ripristina il piano precedente nello state locale
    setClients(prevClients => 
      prevClients.map(client => 
        client._id === clientId 
          ? { ...client } // mantiene il piano originale
          : client
      )
    );

    // Mostra errore all'utente
    // showError('Errore nell\'aggiornamento del piano');
  } finally {
    // Resetta lo stato di loading dopo un breve delay
    setTimeout(() => {
      setUpdatingPlan(null);
    }, 500);
  }
};

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'pro_plus': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <ul className="divide-y divide-gray-200">
        {clients.map((client) => (
          <li key={client._id} className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              {/* Client Info Section */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h3 className="text-lg font-medium text-indigo-600">
                   <Link to={`/client/${client._id}/files`} className="hover:underline hover:opacity-80 transition-all">
                    {client.companyName}
                   </Link>
                </h3>
                  <div className={`relative transition-all duration-300 ${
                    updatingPlan === client._id ? 'scale-105 shadow-lg' : ''
                  }`}>
                    <select
                      value={client.plan}
                      onChange={(e) => handlePlanChange(client._id, e.target.value)}
                      className={`mt-2 sm:mt-0 text-sm rounded-md border-gray-300 ${getPlanBadgeColor(client.plan)} 
                        py-1 pl-2 pr-8 transition-all duration-300 ${
                        updatingPlan === client._id ? 'bg-opacity-75' : ''
                      }`}
                      disabled={updatingPlan === client._id}
                    >
                      <option value="standard">Standard</option>
                      <option value="pro">Pro</option>
                      <option value="pro_plus">Pro+</option>
                    </select>
                    {updatingPlan === client._id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Domain: {client.domain}</p>
                  <p>Email: {client.email}</p>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex flex-col sm:items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
                    client.siteStatus === 'active' ? 'bg-green-100 text-green-800' :
                    client.siteStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {client.siteStatus}
                  </span>
                  <StatusManager 
                    client={client} 
                    onStatusUpdate={onRefresh}
                  />
                </div>
                <button
                  onClick={() => handleRedeploy(client._id)}
                  disabled={deployingClients.has(client._id)}
                  className="w-full sm:w-auto px-3 py-1 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all duration-300"
                >
                  {deployingClients.has(client._id) ? 'Deploying...' : 'Redeploy Site'}
                </button>
              </div>
            </div>

            {/* Metrics Section */}
            {client.siteStatus === 'active' && (
              <div className="mt-4 transition-all duration-300">
                <SiteMetrics client={client} />
                <ResourceMonitor client={client} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientList;