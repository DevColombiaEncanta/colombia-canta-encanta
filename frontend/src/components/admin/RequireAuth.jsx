import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function RequireAuth({ children }) {
  const { admin, cargando } = useAdminAuth();

  if (cargando) return null;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return children;
}
