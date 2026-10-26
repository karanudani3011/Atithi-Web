import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import Splash from './splash/Splash.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { AdminRoutes, UserRoutes } from './routes.jsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const { pathname } = useLocation();
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <AdminAuthProvider>
      {isAdminPath ? (
        <AdminRoutes />
      ) : ready ? (
        <UserRoutes />
      ) : (
        <Splash onFinish={() => setReady(true)} />
      )}
      <Toaster
        position="top-right"
        containerStyle={{
          top: 'calc(16px + env(safe-area-inset-top))',
          right: 'calc(16px + env(safe-area-inset-right))',
        }}
        toastOptions={{
          duration: 3200,
          style: {
            background: '#14213d',
            color: '#fbf6ec',
            border: '1px solid #c9954a',
            borderRadius: '14px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </AdminAuthProvider>
  );
}
