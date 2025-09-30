import React from "react";
import { Lock } from "lucide-react";
import { useProfileLock } from "@/hooks/useProfileLock";
import { cn } from "@/lib/utils";

export function ToolLock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { locked } = useProfileLock();

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div
          className={cn(
            locked
              ? "pointer-events-none select-none filter blur-[1px]"
              : undefined,
          )}
        >
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
