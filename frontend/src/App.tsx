import { Route, Routes } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import SuccessPage from "./pages/SuccessPage";
import AdminPage from "./pages/AdminPage";
import OrderConfirmPage from "./pages/OrderConfirmPage";
import BoyfriendDashboard from "./pages/BoyfriendDashboardPage";
import { AppStoreProvider } from "./store/appStore";

export default function App() {
  return (
    <AppStoreProvider>
      <div className="page-shell min-h-screen">
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/confirm" element={<OrderConfirmPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/boyfriend" element={<BoyfriendDashboard />} />
        </Routes>
      </div>
    </AppStoreProvider>
  );
}
