import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from 'js-cookie';

type ProtectedRouteProps = {
  element: React.ReactElement;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
//   const isAuthenticated = localStorage.getItem("userid") !== null;
  const isAuthenticated = Cookies.get('userId');

  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;