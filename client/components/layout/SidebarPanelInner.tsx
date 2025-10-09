import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  ListChecks,
  MessageSquare,
  User,
  LifeBuoy,
  BookOpen,
  History,
  LayoutTemplate,
} from "lucide-react";

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        active
          ? "bg-primary text-primary-foreground"
          : "transition-colors hover:bg-primary/10"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function SidebarPanelInner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <div className="mb-3 px-1 text-xs font-bold text-muted-foreground">
        Navigation
      </div>
      <nav className="flex flex-col gap-1">
        <NavItem
          icon={LayoutGrid}
          label="Dashboard"
          active={pathname === "/get-started"}
          onClick={() => navigate("/get-started")}
        />

        <div className="mt-3 mb-1 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80">
          Exams
        </div>
        <NavItem
          icon={ListChecks}
          label="Generate MCQs"
          active={pathname === "/mcqs"}
          onClick={() => navigate("/mcqs")}
        />
        <NavItem
          icon={MessageSquare}
          label="Generate Q&A"
          active={pathname === "/qna"}
          onClick={() => navigate("/qna")}
        />
        <NavItem
          icon={FileText}
          label="Generate Exam"
          active={pathname === "/app"}
          onClick={() => navigate("/app")}
        />
        <NavItem
          icon={LayoutTemplate}
          label="Templates"
          active={pathname === "/templates"}
          onClick={() => navigate("/templates")}
        />
        <NavItem
          icon={BookOpen}
          label="Syllabus"
          active={pathname === "/syllabus"}
          onClick={() => navigate("/syllabus")}
        />
        <NavItem
          icon={History}
          label="Result History"
          active={pathname.startsWith("/results")}
          onClick={() => navigate("/results")}
        />

        <div className="mt-3 mb-1 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80">
          My account
        </div>
        <NavItem
          icon={LayoutGrid}
          label="Manage Subscription"
          active={pathname === "/subscription"}
          onClick={() => navigate("/subscription")}
        />
        <NavItem
          icon={User}
          label="My Profile"
          active={pathname === "/profile"}
          onClick={() => navigate("/profile")}
        />
        <NavItem
          icon={LifeBuoy}
          label="Support"
          active={pathname === "/support"}
          onClick={() => navigate("/support")}
        />
      </nav>
    </>
  );
}
