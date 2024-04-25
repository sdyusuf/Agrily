import React, { lazy, Suspense, useMemo, useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppContext } from './state/AppContext';
import { CartProvider } from './state/CartContext';
import CartDrawer from './components/CartDrawer';
import { PrivateRoute } from './auth/PrivateRoute';
import useFetch from './hook/useFetch';
import { useUser } from './auth/useUser';
import { useToken } from './auth/useToken';

// Eager load primary landing page for instant initial paint
import Index from './pages/Index';

// Code-split route components via React.lazy for optimized initial bundle payload
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AddProduct = lazy(() => import('./pages/AddProduct'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const EmailVerificationLandingPage = lazy(() => import('./pages/EmailVerificationLandingPage'));
const PleaseVerifyEmailPage = lazy(() => import('./pages/PleaseVerifyEmailPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Route loading fallback component adhering to Agrily design tokens
 */
const RouteLoadingSpinner = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      color: '#2d6a4f',
      fontFamily: "'Inter', sans-serif"
    }}
    data-testid="route-loading-fallback"
  >
    <div
      style={{
        width: '42px',
        height: '42px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#2d6a4f',
        borderRadius: '50%',
        animation: 'agrilyRouteSpin 0.75s linear infinite'
      }}
    />
    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}>
      Loading Agrily Platform...
    </span>
    <style>{`
      @keyframes agrilyRouteSpin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  const user = useUser();
  const email = user?.email;
  const [token] = useToken();

  const { data, error, isPending } = useFetch(
    email ? `http://localhost:5000/api/products/${email}` : null,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const [value, setValue] = useState(data);

  useEffect(() => {
    setValue(data);
  }, [data]);

  const providerValue = useMemo(() => ({ value, setValue }), [value, setValue]);

  return (
    <AppContext.Provider value={providerValue}>
      <CartProvider>
        <BrowserRouter>
          <>
            <CartDrawer />
            <Suspense fallback={<RouteLoadingSpinner />}>
              <Routes>
                <Route exact path="/" element={<Index />} />
                <Route path="/index" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify/:verificationString" element={<EmailVerificationLandingPage />} />
                <Route path="/verify-email" element={<PleaseVerifyEmailPage />} />
                <Route path="/reset-password/:resetPasswordCode" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />

                <Route exact path="/home" element={<PrivateRoute />}>
                  <Route exact path="/home" element={<Home />} />
                </Route>
              </Routes>
            </Suspense>
          </>
        </BrowserRouter>
      </CartProvider>
    </AppContext.Provider>
  );
}

export default App;
