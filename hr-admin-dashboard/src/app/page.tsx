"use client";

import { useEffect, useState } from "react";
import ECommerce from "@/components/Dashboard/E-commerce";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import SignIn from "./auth/signin/page";
import Cookies from "js-cookie";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token"); 
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
