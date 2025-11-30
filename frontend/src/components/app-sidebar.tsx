import { Home, TrendingUp, Wallet } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
    // const path = import.meta.env.VITE_PATH;

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/markets", label: "Markets", icon: TrendingUp },
    { href: "/bets", label: "My Bets", icon: Wallet },
    // { href: `/${path}`, label: "Admin", icon: User },
    // { href: "/wallet", label: "Wallet", icon: History },
    // { href: "/settings", label: "Settings", icon: Settings },
  ]

export function AppSidebar() {
    const location = useLocation();
  const pathname = location.pathname


  return (
      <Sidebar>
    <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-2">
          <img className="w-10" src="./solscore-logo.jpg" alt="logo" />
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Solscore</h1>
            <p className="text-xs text-sidebar-foreground/60">Football Betting</p>
          </div>
        </div>
      </SidebarHeader>
          
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      
      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {navItems.map((item) => {
            // const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10",
                  )}
                >
                  <Link to={item.href} className="flex items-center gap-3">
                    {/* <Icon className="w-5 h-5" /> */}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
          </SidebarContent>
          
        </SidebarGroup>
        
     
      </SidebarContent>
           <SidebarFooter className="border-t border-sidebar-border p-4 space-y-3">
        <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
          <span className="text-sm font-medium">Settings</span>
        </button>
          </SidebarFooter>
</Sidebar>
  )
}