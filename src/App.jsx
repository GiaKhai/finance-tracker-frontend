import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wallets from "./pages/Wallets";
import WalletDetail from "./pages/WalletDetail";
import WalletEdit from "./pages/WalletEdit";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import Budgets from "./pages/Budgets";
import Layout from "./components/Layout";

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/register"
        element={!token ? <Register /> : <Navigate to="/" />}
      />

      <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="wallets" element={<Wallets />} />
        <Route path="wallets/:id" element={<WalletDetail />} />
        <Route path="wallets/:id/edit" element={<WalletEdit />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<Users />} />
        <Route path="budgets" element={<Budgets />} />
      </Route>
    </Routes>
  );
}

export default App;
