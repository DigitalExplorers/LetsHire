export function getDashboardRoute(user: { role: string }): string {
    switch (user.role) {
      case "superadmin":
        return "/super-admin/dashboard";
      case "hr":
        return "/hr/dashboard";
      case "interviewer":
        return "/interviewer/dashboard";
      default:
        return "/admin/dashboard";
    }
  }
  