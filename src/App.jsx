import { BrowserRouter, Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/public/Home";
import Products from "./pages/public/Products";
import ProductCategory from "./pages/public/ProductCategory";
import ProductDetail from "./pages/public/ProductDetail";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

import Login from "./pages/admin/Login";
import Admin from "./pages/admin/Admin";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductCreate from "./pages/admin/AdminProductCreate";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminCategories from "./pages/admin/AdminCategories";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminBanners from "./pages/admin/AdminBanners";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PUBLIC
        ========================= */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/products" element={<Products />} />

          <Route path="/products/:categorySlug" element={<ProductCategory />} />

          <Route
            path="/products/:categorySlug/:productSlug"
            element={<ProductDetail />}
          />

          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* =========================
            ADMIN
        ========================= */}
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route element={<AdminLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/products" element={<AdminProducts />} />

            <Route
              path="/admin/products/create"
              element={<AdminProductCreate />}
            />

            <Route
              path="/admin/products/edit/:id"
              element={<AdminProductEdit />}
            />

            <Route path="/admin/categories" element={<AdminCategories />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
