// src/components/clients/ResourceMonitor.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const ResourceMonitor = ({ client }) => {
  const [resources, setResources] = useState({
    cpu: { usage: 0, cores: 0 },
    ram: { used: 0, total: 0 },
    disk: { used: 0, total: 0 }
  });

  const fetchResources = async () => {
    try {
      const response = await api.get(`/api/monitoring/resources/${client._id}`);
      if (response.data) {
        setResources(response.data);
      }
    } catch (err) {
      console.error('Resource monitoring error:', err);
    }
  };

  // Effetto per il polling periodico
  useEffect(() => {
    fetchResources(); // Fetch iniziale
    const interval = setInterval(fetchResources, 60000); // da 30000 a 60000
    return () => clearInterval(interval);
  }, [client._id, client.plan]); // Aggiungiamo client.plan alle dipendenze

  // Effetto aggiuntivo per forzare l'aggiornamento quando cambia il piano
  useEffect(() => {
    fetchResources();
  }, [client.plan]);

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mt-3 space-y-3">
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>CPU</span>
          <span>{resources.cpu.usage}% ({resources.cpu.cores} cores)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${getUsageColor(resources.cpu.usage)} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${resources.cpu.usage}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>RAM</span>
          <span>{resources.ram.used}MB/{resources.ram.total}MB</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${getUsageColor((resources.ram.used / resources.ram.total * 100))} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${(resources.ram.used / resources.ram.total * 100)}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Disk</span>
          <span>{resources.disk.used}GB/{resources.disk.total}GB</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${getUsageColor((resources.disk.used / resources.disk.total * 100))} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${(resources.disk.used / resources.disk.total * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResourceMonitor;