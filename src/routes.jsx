import { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { ScrollTools } from './components/ScrollTools.jsx';
import ProtectedRoute from './admin/ProtectedRoute.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import { useAdminAuth } from './context/AdminAuthContext.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Rooms = lazy(() => import('./pages/Rooms.jsx'));
const RoomDetailsPage = lazy(() => import('./pages/RoomDetailsPage.jsx'));
const Booking = lazy(() => import('./pages/Booking.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));

const AdminLogin = lazy(() => import('./admin/pages/AdminLogin.jsx'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard.jsx'));
const AdminRooms = lazy(() => import('./admin/pages/Rooms.jsx'));
const Bookings = lazy(() => import('./admin/pages/Bookings.jsx'));
const AccessPanel = lazy(() => import('./admin/pages/AccessPanel.jsx'));

function Loading({ admin = false }) {
  return (
    <div className={admin ? 'admin-loading' : 'route-loading'}>
      {admin ? 'Atithi Admin' : 'Atithi'}
    </div>
  );
}

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);
  return null;
}

export function UserRoutes() {
  const loc = useLocation();
  const login = loc.pathname === '/login';

  return (
    <>
      <ScrollToTop />
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.38 }}
        >
          <Suspense fallback={<Loading />}>
            <Routes location={loc}>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/room/:id" element={<RoomDetailsPage />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      {!login && <Footer />}
      <ScrollTools />
    </>
  );
}

function AdminIndex() {
  const { isAuthenticated } = useAdminAuth();
  return <Navigate to={isAuthenticated ? '/admin/dashboard' : '/admin/login'} replace />;
}

function AdminFallback() {
  const { isAuthenticated } = useAdminAuth();
  return <Navigate to={isAuthenticated ? '/admin/dashboard' : '/admin/login'} replace />;
}

export function AdminRoutes() {
  return (
    <Suspense fallback={<Loading admin />}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminIndex />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminRooms />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Bookings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/access"
          element={
            <ProtectedRoute superOnly>
              <AdminLayout>
                <AccessPanel />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/*" element={<AdminFallback />} />
      </Routes>
    </Suspense>
  );
}
