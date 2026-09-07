import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const links = [{ href: "/admin", label: "Overview" }, { href: "/admin/users", label: "Users" }, { href: "/admin/analytics", label: "Analytics" }, { href: "/admin/imports", label: "Imports" }, { href: "/admin/usage", label: "AI & Usage" }, { href: "/admin/health", label: "System health" }, { href: "/admin/audit", label: "Audit log" }];
  return <div className="min-h-screen bg-background"><header className="border-b bg-card/80"><div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8"><Link href="/admin" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" /></span><div><p className="font-semibold tracking-tight">FinPilot Admin</p><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Control center</p></div></Link><nav aria-label="Admin navigation" className="flex max-w-full gap-1 overflow-x-auto text-sm">{links.map((link) => <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">{link.label}</Link>)}<Link href="/dashboard" className="whitespace-nowrap rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">Back to app</Link></nav></div></header><main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">{children}</main></div>;
}
