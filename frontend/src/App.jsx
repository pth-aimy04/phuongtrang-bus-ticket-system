  import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
  import AdminLayout from "./components/AdminLayout";
  import Dashboard from "./pages/admin/Dashboard";
  import Trips from "./pages/admin/Trips";
  import Users from "./pages/admin/Users";
  import RoutesPage from "./pages/admin/Routes";
  import Vehicles from "./pages/admin/Vehicles";
  import Tickets from "./pages/admin/Tickets";
  import CustomerLayout from "./pages/customer/CustomerLayout";
  import Login from "./pages/customer/Login";
  import Register from "./pages/customer/Register";
  import Home from "./pages/customer/Home";
  import Booking from "./pages/customer/Booking";
  import Payment from "./pages/customer/Payment";
  import PaymentSuccess from "./pages/customer/PaymentSuccess";
  import TicketDetail from "./pages/customer/TicketDetail";
  import ForgotPassword from "./pages/customer/ForgotPassword";
  import Profile from "./pages/customer/Profile";
  import Lookup from "./pages/customer/Lookup";
  import MomoPaymentPage from "./pages/customer/MomoPaymentPage";

  function App() {
    return (
      <Router basename="/">
        <Routes>
          {/* 🌍 ADMIN */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="trips" element={<Trips />} />
            <Route path="users" element={<Users />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="tickets" element={<Tickets />} />
          </Route>

          {/* 🌍 CUSTOMER */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<Home />} />        {/* ✅ /customer */}
            <Route path="home" element={<Home />} />  {/* ✅ /customer/home */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="booking" element={<Booking />} />
            <Route path="payment" element={<Payment />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="ticket-detail" element={<TicketDetail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="profile" element={<Profile />} />
            <Route path="lookup" element={<Lookup />} />
            <Route path="momo-payment" element={<MomoPaymentPage />} />

          </Route>
        </Routes>
      </Router>
    );
  }

  export default App;
