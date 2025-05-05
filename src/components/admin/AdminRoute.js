import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Simple admin route guard - checks both isLoggedIn and isAdmin
const AdminRoute = ({ isLoggedIn, isAdmin, redirectPath = '/' }) => {
  if (!isLoggedIn || !isAdmin) {
    // Redirect to home or login page if not logged in or not admin
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />; // Render the nested admin route's element
};

export default AdminRoute; 