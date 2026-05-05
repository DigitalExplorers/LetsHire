"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { BarChart, Briefcase, Building2, UserCog, Users, UsersIcon } from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

interface SidebarChildItem {
  label: string;
  route: string;
}

interface SidebarMenuItem {
  icon?: React.ReactNode;
  label: string;
  route: string;
  children?: SidebarChildItem[];
}

interface SidebarMenuGroup {
  menuItems: SidebarMenuItem[];
}

// Define menus for each role
const menusByRole: Record<string, SidebarMenuGroup[]> = {
  superadmin: [
    {
      menuItems: [
        {
          icon: <BarChart className="w-[18px] h-[18px]" />,
          label: "Dashboard",
          route: "/super-admin/dashboard",
        },
        {
          icon: <Building2 className="w-[18px] h-[18px]" />,
          label: "Organizations",
          route: "/super-admin/organizations",
        },
        {
          icon: <UserCog className="w-[18px] h-[18px]" />,
          label: "Admins",
          route: "/super-admin/admins",
        },
      ],
    },
  ],
  admin: [
    {
      menuItems: [
        {
          icon: <BarChart className="w-[18px] h-[18px]" />,
          label: "Dashboard",
          route: "/admin/dashboard",
        },
        {
          icon: <Briefcase className="w-[18px] h-[18px]" />,
          label: "Positions",
          route: "/positions",
        },
        {
          label: "Manage Users",
          route: "#",
          icon: <UsersIcon />,
          children: [
            { label: "All Users", route: "/admin/team" },
            { label: "Add User", route: "/admin/team/add-member" },
          ],
        },
        {
          icon: <Users className="w-[18px] h-[18px]" />,
          label: "Candidates",
          route: "#",
          children: [
            { label: "Applied Candidates", route: "/candidates" },
            { label: "Shortlisted Candidates", route: "/interview/shortlist-candidates" },
            { label: "Hired Candidates", route: "/interview/hired-candidates" },
            { label: "Rejected Candidates", route: "/interview/rejected-candidates" },
            { label: "Total Candidates", route: "/interview/interview-history" },
            // { label: "Interviewers", route: "/interview/interviewer-view" },
          ],
        },
      ],
    },
  ],
  hr: [
    {
      menuItems: [
        {
          icon: <BarChart className="w-[18px] h-[18px]" />,
          label: "Dashboard",
          route: "/hr/dashboard",
        },
        {
          icon: <Briefcase className="w-[18px] h-[18px]" />,
          label: "Positions",
          route: "/positions",
        },
        {
          icon: <Users className="w-[18px] h-[18px]" />,
          label: "Candidates",
          route: "#",
          children: [
            { label: "Applied Candidates", route: "/candidates" },
            { label: "Shortlisted Candidates", route: "/interview/shortlist-candidates" },
            { label: "Hired Candidates", route: "/interview/hired-candidates" },
            { label: "Rejected Candidates", route: "/interview/rejected-candidates" },
            { label: "Total Candidates", route: "/interview/interview-history" },
          ],
        },
      ],
    },
  ],
  interviewer: [
    {
      menuItems: [
        {
          icon: <BarChart className="w-[18px] h-[18px]" />,
          label: "Dashboard",
          route: "/interviewer/dashboard",
        },
        {
          icon: <Users className="w-[18px] h-[18px]" />,
          label: "Assigned Interviews",
          route: "/interviewer/assigned",
        },
      ],
    },
  ],
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const { user } = useAuth();
  const { logoUrl } = useBranding();

  const role = user?.role || "admin"; // fallback
  const menuGroups = menusByRole[role] || [];

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <Link style={{marginLeft:'40px'}} href="/">
            <Image
              width={100}
              height={20}
              src={logoUrl}
              alt="Company Logo"
              priority
            />
            
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <nav className="px-4 py-4 ">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <ul className="mb-6 flex flex-col gap-1.5">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
