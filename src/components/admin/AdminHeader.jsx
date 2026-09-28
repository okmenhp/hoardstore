function AdminHeader() {
  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <h1>Dashboard</h1>
        <p>Quản lý HoardStore</p>
      </div>

      <div className="admin-header__right">
        <div className="admin-header__user">
          <div className="admin-header__avatar">
            <i className="fa-solid fa-user"></i>
          </div>

          <div>
            <strong>Admin</strong>
            <span>Quản trị viên</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
