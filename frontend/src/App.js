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
const DriverRegistration = lazy(() => import('./pages/DriverRegistration'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const ConsignmentTracking = lazy(() => import('./pages/ConsignmentTracking'));
const ColdChainMonitor = lazy(() => import('./pages/ColdChainMonitor'));
const EscrowManagement = lazy(() => import('./pages/EscrowManagement'));
const RoutePlanner = lazy(() => import('./pages/RoutePlanner'));
const DispatchManifestView = lazy(() => import('./pages/DispatchManifestView'));
const WaybillManagement = lazy(() => import('./pages/WaybillManagement'));
const FleetAnalyticsCockpit = lazy(() => import('./pages/FleetAnalyticsCockpit'));
const AgronomyVisionCockpit = lazy(() => import('./pages/AgronomyVisionCockpit'));
const SoilNutrientCockpit = lazy(() => import('./pages/SoilNutrientCockpit'));
const SatelliteNdviCockpit = lazy(() => import('./pages/SatelliteNdviCockpit'));

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
                <Route path="/driver/register" element={<DriverRegistration />} />
                <Route path="/driver/dashboard" element={<DriverDashboard />} />
                <Route path="/tracking" element={<ConsignmentTracking />} />
                <Route path="/logistics/tracking" element={<ConsignmentTracking />} />
                <Route path="/cold-chain" element={<ColdChainMonitor />} />
                <Route path="/logistics/cold-chain" element={<ColdChainMonitor />} />
                <Route path="/escrow" element={<EscrowManagement />} />
                <Route path="/finance/escrow" element={<EscrowManagement />} />
                <Route path="/route-planner" element={<RoutePlanner />} />
                <Route path="/dispatch/routes" element={<RoutePlanner />} />
                <Route path="/routes" element={<RoutePlanner />} />
                <Route path="/manifest/:id" element={<DispatchManifestView />} />
                <Route path="/manifest" element={<DispatchManifestView />} />
                <Route path="/waybills" element={<WaybillManagement />} />
                <Route path="/logistics/waybills" element={<WaybillManagement />} />
                <Route path="/waybills/:id" element={<WaybillManagement />} />
                <Route path="/fleet-analytics" element={<FleetAnalyticsCockpit />} />
                <Route path="/logistics/fleet-analytics" element={<FleetAnalyticsCockpit />} />
                <Route path="/fleet" element={<FleetAnalyticsCockpit />} />
                <Route path="/agronomy" element={<AgronomyVisionCockpit />} />
                <Route path="/agronomy-vision" element={<AgronomyVisionCockpit />} />
                <Route path="/soil-nutrition" element={<SoilNutrientCockpit />} />
                <Route path="/agronomy/soil" element={<SoilNutrientCockpit />} />
                <Route path="/satellite-ndvi" element={<SatelliteNdviCockpit />} />
                <Route path="/agronomy/satellite" element={<SatelliteNdviCockpit />} />

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
