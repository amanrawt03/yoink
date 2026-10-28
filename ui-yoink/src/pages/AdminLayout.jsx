import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">YO INK / ADMIN</p>
          <h1>Admin workspace</h1>
        </div>
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        <NavLink end to="/admin">
          Dashboard
        </NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
      </nav>
      <Outlet />
    </main>
  );
}
