import AdminSidebar from './AdminSidebar';
import './AdminUI.css';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-contenido">{children}</main>
    </div>
  );
}
