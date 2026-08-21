import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">FinPilot AI</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold tracking-tight">
            Take Control of Your Finances
          </h2>
          <p className="mt-6 text-xl text-muted-foreground">
            Self-hostable, open-source personal finance tracker with AI-powered insights.
            <br />
            Your data, your rules, your privacy.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Start Free</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-center text-3xl font-bold">Features</h3>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">🔒 Privacy First</h4>
                <p className="mt-2 text-muted-foreground">
                  Self-host your data. No third-party tracking or cloud lock-in.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">📊 Beautiful Dashboard</h4>
                <p className="mt-2 text-muted-foreground">
                  Track spending with charts, category breakdowns, and trends.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">🤖 AI Chat</h4>
                <p className="mt-2 text-muted-foreground">
                  Ask questions in natural language. Get instant answers and charts.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">📥 CSV Import</h4>
                <p className="mt-2 text-muted-foreground">
                  Import transactions from your bank with flexible column mapping.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">🏷️ Smart Categories</h4>
                <p className="mt-2 text-muted-foreground">
                  Organize spending with custom categories and recurring detection.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">⚡ Fast & Modern</h4>
                <p className="mt-2 text-muted-foreground">
                  Built with Next.js 15, React 19, and TypeScript for blazing speed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>FinPilot AI © 2026. Open source under MIT License.</p>
        </div>
      </footer>
    </div>
  );
}
