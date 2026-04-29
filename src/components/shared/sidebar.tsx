"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Upload,
  Settings,
  LogOut,
  Menu,
  ShoppingBag,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Đơn hàng", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Khách hàng", href: "/dashboard/customers", icon: Users },
  { label: "Sản phẩm", href: "/dashboard/products", icon: Package },
  { label: "Tài xế", href: "/dashboard/drivers", icon: Truck },
  { label: "Nhập đơn", href: "/dashboard/import", icon: Upload },
  { label: "Cài đặt", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar with hamburger + settings */}
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-12 px-3 border-b bg-background md:hidden">
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            }
          />
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:bg-sidebar">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <ShoppingBag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-sm">Vinhomes</h2>
          <p className="text-xs text-muted-foreground">Bán Hàng</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive gap-3"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
