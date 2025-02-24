import React, { useState, useEffect } from 'react';
import { Folder, File, Upload, Download, Trash2, Edit } from 'lucide-react';
import api from '../../api/axios';
import FileEditor from './FileEditor';

// Utility function per la gestione dei path
const joinPaths = (...parts) => {
  const joinedPath = parts
    .map(part => part.trim())          // Rimuove spazi
    .filter(Boolean)                    // Rimuove parti vuote
    .join('/')
    .replace(/\/+/g, '/');             // Normalizza slash multipli
  
  return joinedPath.startsWith('/') ? joinedPath : `/${joinedPath}`;
};

// Utility function per formattare le dimensioni dei file
const formatFileSize = (size) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  let fileSize = size;

  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024;
    index++;
  }

  return `${fileSize.toFixed(2)} ${units[index]}`;
};

const FileManager = ({ clientId }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, clientId]);

  const loadFiles = async (path) => {
    setLoading(true);
    try {
      const normalizedPath = joinPaths(path);
      const response = await api.get(
        `/api/files/${clientId}?path=${encodeURIComponent(normalizedPath)}`
      );
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderName) => {
    const newPath = joinPaths(currentPath, folderName);
    setCurrentPath(newPath);
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`;
    setCurrentPath(parentPath);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    
    try {
      await api.post(`/api/files/${clientId}/folder`, {
        path: currentPath,
        folderName: newFolderName.trim()
      });

      await loadFiles(currentPath);
      setNewFolderName('');
      setShowNewFolderInput(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
  
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
  
      console.log('Uploading file:', {
        name: files[0].name,
        size: files[0].size,
        type: files[0].type,
        path: currentPath
      });
  
      const normalizedPath = joinPaths(currentPath);
      const response = await api.post(
        `/api/files/${clientId}/upload?path=${encodeURIComponent(normalizedPath)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      console.log('Upload response:', response.data);
      await loadFiles(currentPath);
    } catch (error) {
      console.error('Error uploading file:', error.response?.data || error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
  
    try {
      const filePath = joinPaths(currentPath, fileName);
      await api.delete(`/api/files/${clientId}`, {
        data: { path: filePath }
      });
  
      await loadFiles(currentPath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const filePath = joinPaths(currentPath, fileName);
      const response = await api({
        url: `/api/files/${clientId}/download?path=${encodeURIComponent(filePath)}`,
        method: 'GET',
        responseType: 'blob'
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleEdit = (fileName) => {
    const filePath = joinPaths(currentPath, fileName);
    console.log('Opening file for editing:', {
      fileName,
      currentPath,
      normalizedPath: filePath
    });
    setEditingFile(filePath);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">File Manager</h2>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading}/>
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </label>
          <button onClick={() => setShowNewFolderInput(true)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
            <Folder className="w-4 h-4" />
            New Folder
          </button>
        </div>
      </div>

      {showNewFolderInput && (
        <div className="flex items-center gap-2 mb-4 p-4 bg-gray-50 rounded-md">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create
          </button>
          <button
            onClick={() => {
              setShowNewFolderInput(false);
              setNewFolderName('');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Path navigation */}
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={navigateUp}
          disabled={currentPath === '/'}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          ..
        </button>
        <div className="bg-gray-50 px-3 py-2 rounded-md flex-1">
          {currentPath}
        </div>
      </div>

      {/* File list */}
      <div className="border border-gray-200 rounded-md">
        <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 font-medium">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Modified</div>
          <div className="col-span-2">Actions</div>
        </div>

        <div className="divide-y divide-gray-200">
          {files.map((file) => (
            <div key={file.name} className="grid grid-cols-12 gap-4 p-3 hover:bg-gray-50">
              <div className="col-span-6 flex items-center gap-2">
                {file.type === 'directory' ? (
                  <>
                    <Folder className="w-4 h-4 text-blue-500" />
                    <button
                      onClick={() => navigateToFolder(file.name)}
                      className="hover:underline"
                    >
                      {file.name}
                    </button>
                  </>
                ) : (
                  <>
                    <File className="w-4 h-4 text-gray-500" />
                    <span>{file.name}</span>
                  </>
                )}
              </div>
              <div className="col-span-2">
                {file.type === 'file' ? formatFileSize(file.size) : '--'}
              </div>
              <div className="col-span-2">
                {new Date(file.modifiedAt).toLocaleDateString()}
              </div>
              <div className="col-span-2 flex gap-2">
                {file.type === 'file' && (
                  <>
                    <button onClick={() => handleDownload(file.name)} className="p-1 hover:bg-gray-100 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(file.name)} className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => handleDeleteFile(file.name)}
                  className="p-1 hover:bg-gray-100 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
            {editingFile && (
        <FileEditor
          clientId={clientId}
          filePath={editingFile}
          onClose={() => setEditingFile(null)}
          onSave={async () => {
            await loadFiles(currentPath);
            setEditingFile(null);
          }}
        />
      )}
    </div>
  );
};

export default FileManager;