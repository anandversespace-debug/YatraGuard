import { ReactNode } from "react";

export function PhoneShell({ children, noPad = false }: { children: ReactNode; noPad?: boolean }) {
  return (
    <div className="min-h-screen w-full flex items-stretch sm:items-center justify-center sm:py-6">
      <div
        className="relative w-full sm:max-w-[420px] sm:rounded-[2.5rem] sm:border sm:border-border sm:shadow-elevated bg-background overflow-hidden flex flex-col"
        style={{ minHeight: "100vh", maxHeight: "100vh" }}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className={noPad ? "" : "px-5 pt-6 pb-28"}>{children}</div>
        </div>
      </div>
    </div>
  );
}
