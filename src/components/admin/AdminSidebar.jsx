import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__logo">H</div>

        <div>
          <h2>HOARDSTORE</h2>
          <span>ADMIN PANEL</span>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        <p className="admin-sidebar__label">QUẢN LÝ</p>

        {/* DASHBOARD */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? "active" : ""}`
          }
        >
          <i className="fa-solid fa-chart-line"></i>
          <span>Dashboard</span>
        </NavLink>

        {/* SẢN PHẨM */}
        <NavLink
          to="/admin/products"
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? "active" : ""}`
          }
        >
          <i className="fa-solid fa-box"></i>
          <span>Sản phẩm</span>
        </NavLink>

        {/* BANNER */}
        <NavLink
          to="/admin/banners"
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? "active" : ""}`
          }
        >
          <i className="fa-solid fa-images"></i>
          <span>Banner</span>
        </NavLink>

        {/* DANH MỤC */}
        <NavLink
          to="/admin/categories"
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? "active" : ""}`
          }
        >
          <i className="fa-solid fa-layer-group"></i>
          <span>Danh mục</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar__bottom">
        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={handleLogout}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
