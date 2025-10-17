import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { StoreProvider } from './contexts/StoreContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cashier from './pages/Cashier';
import Stock from './pages/Stock';
import Notifications from './pages/Notifications';
import Statistics from './pages/Statistics';
import Account from './pages/Account';
import Settings from './pages/Settings';
import TodayRevenue from './pages/TodayRevenue';
import CollectiveShopping from './pages/CollectiveShopping';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/cashier" element={
                <PrivateRoute>
                  <Layout>
                    <Cashier />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/stock" element={
                <PrivateRoute>
                  <Layout>
                    <Stock />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/notifications" element={
                <PrivateRoute>
                  <Layout>
                    <Notifications />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/statistics" element={
                <PrivateRoute>
                  <Layout>
                    <Statistics />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/account" element={
                <PrivateRoute>
                  <Layout>
                    <Account />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/today-revenue" element={
                <PrivateRoute>
                  <Layout>
                    <TodayRevenue />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/collective-shopping" element={
                <PrivateRoute>
                  <Layout>
                    <CollectiveShopping />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          </Router>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
