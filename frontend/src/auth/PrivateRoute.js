import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from './useUser';

export const PrivateRoute = () => {
  const user = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};