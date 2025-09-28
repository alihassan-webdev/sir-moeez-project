import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, FileText } from "lucide-react";

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${
        active
          ? "bg-primary text-primary-foreground hover:text-primary-foreground"
          : "transition-colors hover:bg-primary/10"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function SidebarPanelInner() {
  const { pathname } = useLocation();
  return (
    <>
      <div className="mb-3 px-1 text-xs font-semibold text-muted-foreground">
        Navigation
      </div>
      <nav className="flex flex-col gap-1">
        <NavItem
          to="/get-started"
          icon={LayoutGrid}
          label="Dashboard"
          active={pathname === "/get-started"}
        />
        <NavItem
          to="/app"
          icon={FileText}
          label="Generate Exam"
          active={pathname === "/app"}
        />
      </nav>
    </>
  );
}
