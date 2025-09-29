import React from "react";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfileLock } from "@/hooks/useProfileLock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ToolLock({ children, className }: { children: React.ReactNode; className?: string }) {
  const { locked } = useProfileLock();

  return (
    <div className={cn("relative", className)}>
      {locked && (
        <div className="mb-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white shadow-[0_6px_18px_rgba(16,24,40,0.16)] ring-1 ring-white/10">
          <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] sm:text-sm font-semibold tracking-tight">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <span>⚠️ Please complete your profile setup to unlock this tool.</span>
            </div>
            <Button asChild size="sm" className="bg-white text-red-600 hover:bg-white/90 shadow-md">
              <Link to="/my-profile">Go to Profile</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className={cn(locked ? "pointer-events-none select-none filter blur-[1px]" : undefined)}>
          {children}
        </div>
        {locked && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-[1px]">
            <Lock className="h-7 w-7 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolLock;
