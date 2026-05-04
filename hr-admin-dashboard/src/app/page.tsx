"use client";

import { useEffect, useState } from "react";
import ECommerce from "@/components/Dashboard/E-commerce";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import SignIn from "./auth/signin/page";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (stored in localStorage or cookies)
    const token = localStorage.getItem("token"); // Change this based on how you store auth tokens
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated) {
    return (
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    );
  } else {
    return <SignIn />;
  }
}
