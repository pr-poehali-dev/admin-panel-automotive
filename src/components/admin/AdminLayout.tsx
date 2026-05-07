import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem('ais_auth');
    if (!auth) navigate('/login');
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-grad-page">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(p => !p)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader pathname={location.pathname} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
