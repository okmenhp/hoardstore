import { Outlet } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Support from "../components/Support";

function PublicLayout() {
  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <Outlet />
      </main>

      <Support />

      <Footer />
    </div>
  );
}

export default PublicLayout;
