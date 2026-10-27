import { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { ScrollTools } from './components/ScrollTools.jsx';
import AdminProtectedRoute, { AdminOnlyRoute } from './admin/AdminProtectedRoute.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import AdminErrorBoundary from './admin/AdminErrorBoundary.jsx';
import { useAdminAuth } from './context/AdminAuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
const Home=lazy(()=>import('./pages/Home.jsx')),Rooms=lazy(()=>import('./pages/Rooms.jsx')),RoomDetailsPage=lazy(()=>import('./pages/RoomDetailsPage.jsx')),Booking=lazy(()=>import('./pages/Booking.jsx')),MyBookings=lazy(()=>import('./pages/MyBookings.jsx')),About=lazy(()=>import('./pages/About.jsx')),Login=lazy(()=>import('./pages/Login.jsx')),Contact=lazy(()=>import('./pages/Contact.jsx'));
const Dashboard=lazy(()=>import('./admin/pages/Dashboard.jsx')),AdminRooms=lazy(()=>import('./admin/pages/Rooms.jsx')),Bookings=lazy(()=>import('./admin/pages/Bookings.jsx')),Services=lazy(()=>import('./admin/pages/Services.jsx')),Messages=lazy(()=>import('./admin/pages/Messages.jsx')),AccessManagement=lazy(()=>import('./admin/pages/AccessManagement.jsx')),AdminLoginActivity=lazy(()=>import('./admin/pages/AdminLoginActivity.jsx'));
const NewWalkInBooking=lazy(()=>import('./admin/pages/NewWalkInBooking.jsx'));
function Loading({admin=false}){return <div className={admin?'admin-loading':'route-loading'}>{admin?'Atithi Admin':'Atithi'}</div>}
function ScrollToTop(){const {pathname,search}=useLocation();useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'instant'})},[pathname,search]);return null}

function AuthenticatedUser({ children }) {
  return <ProtectedRoute><AuthenticatedContent>{children}</AuthenticatedContent></ProtectedRoute>;
}
function AuthenticatedContent({ children }) {
  const { user } = useAuth();
  return children(user);
}
export function UserRoutes() {
  const location = useLocation();
  const login = location.pathname === '/login';
  return <>
    <ScrollToTop />
    <Header />
    <AnimatePresence mode="wait">
      <motion.main key={location.pathname} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .38 }}>
        <Suspense fallback={<Loading />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:id" element={<RoomDetailsPage />} />
            <Route path="/room/:id" element={<RoomDetailsPage />} />
            <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/booking/:roomId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<AuthenticatedUser>{user => <MyBookings user={user} />}</AuthenticatedUser>} />
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
  </>;
}

function AdminIndex() { return <Navigate to="/admin/dashboard" replace />; }

function AdminFallback() {
  const { user } = useAdminAuth();
  return <Navigate to={user ? '/admin/dashboard' : '/login'} replace />;
}

function ProtectedAdminPage({ Page, allowedRoles = ['admin', 'staff'] }) {
  return <AdminProtectedRoute allowedRoles={allowedRoles}><AdminLayout><Page /></AdminLayout></AdminProtectedRoute>;
}

export function AdminRoutes() {
  return <AdminErrorBoundary>
    <Suspense fallback={<Loading admin />}>
      <Routes>
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/users" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/users/*" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminIndex /></AdminProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedAdminPage Page={Dashboard} allowedRoles={["admin"]} />} />
        <Route path="/admin/rooms" element={<ProtectedAdminPage Page={AdminRooms} />} />
        <Route path="/admin/bookings" element={<ProtectedAdminPage Page={Bookings} />} />
        <Route path="/admin/bookings/new" element={<ProtectedRoute role="admin"><AdminLayout><NewWalkInBooking /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedAdminPage Page={Services} />} />
        <Route path="/admin/messages" element={<ProtectedAdminPage Page={Messages} />} />
        <Route path="/admin/login-activity" element={<ProtectedAdminPage Page={AdminLoginActivity} allowedRoles={["admin"]} />} />
        <Route path="/admin/access" element={<AdminOnlyRoute><AdminLayout><AccessManagement /></AdminLayout></AdminOnlyRoute>} />
        <Route path="/admin/*" element={<AdminFallback />} />
      </Routes>
    </Suspense>
  </AdminErrorBoundary>;
}







