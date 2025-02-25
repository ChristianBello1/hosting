// src/components/layout/DashboardLayout.jsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DemoBanner from './DemoBanner';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow z-50">
        <div className="max-w-full mx-auto h-16">
          <div className="h-full px-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 md:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="ml-auto flex items-center">
              <span className="mr-4 text-gray-700 font-medium">{admin?.name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors mr-5 sm:mr-10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 w-64 bg-gray-800 pt-16 transform transition-transform duration-300 ease-in-out z-40
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        >
          <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
            <div className="text-xl font-semibold text-white">Admin Dashboard</div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="mt-5 px-2 space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
                location.pathname === '/dashboard'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Clienti
            </Link>
            <Link
              to="/dashboard/register-admin"
              className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
                location.pathname === '/dashboard/register-admin'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Registra Admin
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-64">
          <main className="p-4 w-full">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Overlay per mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Demo Banner */}
      <DemoBanner />
    </div>
  );
};

export default DashboardLayout;