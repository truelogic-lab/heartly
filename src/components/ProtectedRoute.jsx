import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return null; // boot screen handled in App
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
