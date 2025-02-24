// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import ClientList from '../components/clients/ClientList';
import AddClientModal from '../components/clients/AddClientModal';
import AlertsDashboard from '../components/dashboard/AlertsDashboard';
import ResetDemoButton from '../components/demo/ResetDemoButton';

const DashboardPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/auth/clients');
      setClients(response.data);
    } catch (err) {
      setError('Failed to fetch clients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="bg-red-50 p-4 rounded-md">
        <div className="text-red-700">{error}</div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <ResetDemoButton />
      <div className="w-full">
        <AlertsDashboard />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add New Client
          </button>
        </div>

        <ClientList 
          clients={clients} 
          onRefresh={fetchClients}
        />

        <AddClientModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onClientAdded={fetchClients}
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;