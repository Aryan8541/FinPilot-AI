"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Home, 
  CreditCard, 
  FolderOpen, 
  Tag, 
  Upload, 
  MessageSquare, 
  Settings, 
  LogOut, Menu
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Accounts", href: "/accounts", icon: FolderOpen },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Import", href: "/import", icon: Upload },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const renderNavigation = (closeOnNavigate = false) => (
    <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        return <Link key={item.name} href={item.href} onClick={() => closeOnNavigate && setMobileOpen(false)}><div className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className={cn("h-4.5 w-4.5", isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} />{item.name}</div></Link>;
      })}
    </nav>
  );

  return (
    <>
    <div className="hidden h-screen w-64 shrink-0 flex-col border-r bg-card/70 md:flex">
      <div className="px-6 pb-8 pt-7">
        <div className="mb-5 flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">FP</span><div><h1 className="font-semibold tracking-tight">FinPilot</h1><p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Money, clearly.</p></div></div>
        <div className="rounded-xl border bg-muted/60 px-3 py-2.5"><p className="text-xs font-medium text-foreground">Personal workspace</p><p className="mt-0.5 text-[11px] text-muted-foreground">Your private ledger</p></div>
      </div>
      {renderNavigation()}
      <div className="space-y-2 border-t p-3">
        <div className="flex items-center justify-between px-3">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
    <div className="flex items-center justify-between border-b bg-card/80 px-4 py-3 md:hidden"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">FP</span><span className="font-semibold tracking-tight">FinPilot</span></div><Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogTrigger asChild><Button variant="outline" size="icon" aria-label="Open navigation menu"><Menu className="h-4 w-4" /></Button></DialogTrigger><DialogContent className="left-0 top-0 h-full max-w-xs translate-x-0 translate-y-0 rounded-none"><DialogHeader><DialogTitle>Navigation</DialogTitle></DialogHeader>{renderNavigation(true)}<Button variant="ghost" className="justify-start" onClick={handleSignOut}><LogOut className="mr-3 h-5 w-5" />Sign Out</Button></DialogContent></Dialog></div>
    </>
  );
}
