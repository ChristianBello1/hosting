// src/pages/ClientFiles.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import FileManager from '../components/clients/FileManager';
import { ArrowLeft } from 'lucide-react';

const ClientFiles = () => {
  const { clientId } = useParams();

  return (
    <div className="p-4">
      {/* Header con breadcrumb */}
      <div className="mb-4 flex items-center gap-4">
        <Link 
          to="/dashboard" 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* File Manager */}
      <FileManager clientId={clientId} />
    </div>
  );
};

export default ClientFiles;