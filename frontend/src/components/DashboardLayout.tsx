import { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import Navbar from "@/Navbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
                  <header className="h-8 border-b pb-8 border-border flex items-center justify-between backdrop-blur-sm sticky z-10">
                           
                      <SidebarTrigger className="" />
                       <Navbar />
          </header>
          <div className="w-full pt-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
