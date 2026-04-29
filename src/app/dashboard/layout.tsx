import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { PwaInstallPrompt } from "@/components/shared/pwa-install";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ServiceWorkerRegister />
      <Sidebar />
      <MobileBottomNav />
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <PwaInstallPrompt />
    </div>
  );
}
