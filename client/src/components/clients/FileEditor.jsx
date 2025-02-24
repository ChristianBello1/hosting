// src/components/clients/FileEditor.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const FileEditor = ({ clientId, filePath, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState('text');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageData, setImageData] = useState(null);

  const normalizePath = (path) => {
    if (!path) return '';
    const normalized = path.replace(/^\/+/, '')
                          .replace(/\/+/g, '/')
                          .trim();
    
    return normalized;
  };

  const loadImage = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const normalizedPath = normalizePath(filePath);
      const url = `/api/files/${clientId}/download?path=${encodeURIComponent(normalizedPath)}`;
      
      const response = await api.get(url, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const imageUrl = URL.createObjectURL(response.data);
      setImageData(imageUrl);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error loading image:', error);
      setError('Unable to load image. Please check if the file exists and try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId || !filePath) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }
    
    const extension = filePath.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const isImage = imageExtensions.includes(extension);
    
    setFileType(isImage ? 'image' : 'text');
    
    if (isImage) {
      loadImage();
    } else {
      loadFileContent();
    }
  }, [clientId, filePath]);

  const loadFileContent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const normalizedPath = normalizePath(filePath);
      
      const response = await api.get(
        `/api/files/${clientId}/content?path=${encodeURIComponent(normalizedPath)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setContent(response.data.content);
      setError(null);
    } catch (error) {
      console.error('Error loading file:', error);
      setError(`Error loading file content: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const normalizedPath = normalizePath(filePath);
      await api.put(
        `/api/files/${clientId}/content`,
        {
          path: normalizedPath,
          content
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      onSave?.();
    } catch (error) {
      console.error('Error saving file:', error);
      setError(`Error saving file: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setError(null);
  };

  const handleImageError = (e) => {
    console.error('Error displaying image:', {
      path: filePath,
      normalizedPath: normalizePath(filePath),
      clientId
    });
    setError('Unable to display image. Please check if the file exists and try again.');
    setImageLoaded(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl w-3/4 h-3/4 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-3/4 h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Editing: {filePath}</h3>
          <div className="flex gap-2">
            {fileType === 'text' && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {fileType === 'text' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-4 border border-gray-300 rounded font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full h-full flex flex-col items-center justify-center">
              {!imageLoaded && !error && (
                <div className="text-gray-500 mb-4">Loading image...</div>
              )}
              {imageData && (
                <img 
                  src={imageData}
                  alt={`Preview of ${filePath}`}
                  className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileEditor;