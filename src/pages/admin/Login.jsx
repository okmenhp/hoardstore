import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email hoặc mật khẩu không chính xác.");
      setLoading(false);
      return;
    }

    navigate("/admin");
  }

  return (
    <div className="admin-login">
      <div className="admin-login__box">
        {/* Logo */}
        <div className="admin-login__brand">
          <div className="admin-login__logo">H</div>

          <div>
            <h1>HOARDSTORE</h1>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        {/* Title */}
        <div className="admin-login__title">
          <h2>Đăng nhập</h2>
          <p>Đăng nhập để quản lý cửa hàng</p>
        </div>

        {/* Form */}
        <form className="admin-login__form" onSubmit={handleLogin}>
          <div className="admin-login__field">
            <label htmlFor="email">Email</label>

            <div className="admin-login__input">
              <i className="fa-solid fa-envelope"></i>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="admin-login__field">
            <label htmlFor="password">Mật khẩu</label>

            <div className="admin-login__input">
              <i className="fa-solid fa-lock"></i>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="admin-login__error">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="admin-login__button"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}

            {!loading && <i className="fa-solid fa-arrow-right"></i>}
          </button>
        </form>

        <div className="admin-login__footer">
          <span>HoardStore Admin</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
