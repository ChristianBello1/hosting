// src/components/clients/PlanManager.jsx
import { useState } from 'react';
import api from '../../api/axios';

const PLAN_FEATURES = {
  free: {
    storage: 1,
    ssl: 'shared',
    customDomain: false,
    backups: { enabled: false, frequency: 'none' },
    price: '0'
  },
  business: {
    storage: 10,
    ssl: 'dedicated',
    customDomain: true,
    backups: { enabled: true, frequency: 'weekly' },
    price: '29.99'
  },
  enterprise: {
    storage: 50,
    ssl: 'dedicated',
    customDomain: true,
    backups: { enabled: true, frequency: 'daily' },
    price: '99.99'
  }
};

const PlanManager = ({ client, onPlanUpdate, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState(client.plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePlanChange = async () => {
    if (selectedPlan === client.plan) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.patch(`/api/auth/clients/${client._id}/plan`, {
        plan: selectedPlan,
        features: PLAN_FEATURES[selectedPlan]
      });
      
      onPlanUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg max-w-2xl mx-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Update Plan</h3>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Object.entries(PLAN_FEATURES).map(([planName, features]) => (
          <div
            key={planName}
            className={`border rounded-lg p-4 cursor-pointer hover:border-indigo-500 ${
              selectedPlan === planName ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedPlan(planName)}
          >
            <h4 className="text-lg font-medium capitalize mb-2">{planName}</h4>
            <p className="text-2xl font-bold mb-4">${features.price}<span className="text-sm font-normal">/month</span></p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>Storage: {features.storage}GB</li>
              <li>SSL: {features.ssl}</li>
              <li>Custom Domain: {features.customDomain ? 'Yes' : 'No'}</li>
              <li>Backups: {features.backups.enabled ? features.backups.frequency : 'No'}</li>
            </ul>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handlePlanChange}
          disabled={loading || selectedPlan === client.plan}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Plan'}
        </button>
      </div>
    </div>
  );
};

export default PlanManager;