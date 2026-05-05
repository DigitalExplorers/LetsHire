"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardRoute } from "@/utils/getDashboardRoute";
import { useAuth } from "@/hooks/AuthContext";

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  const { user } = useAuth();
  const [dashboardLink, setDashboardLink] = useState("/admin/dashboard");

  useEffect(() => {
    if (user && user.role) {
      setDashboardLink(getDashboardRoute(user));
    }
  }, [user]);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">
        {pageName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <Link className="font-medium" href={dashboardLink}>
              Dashboard /
            </Link>
          </li>
          <li className="font-medium text-primary">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
