import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  Bell,
  ArrowLeftRight,
  Building2,
  BarChart3,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { auth } from "@/lib/auth"

const features = [
  {
    icon: Building2,
    title: "Multi-branch inventory",
    body: "Track stock for every product across all of your store locations from one clean dashboard.",
  },
  {
    icon: ArrowLeftRight,
    title: "One-click transfers",
    body: "Move units between branches and watch quantities update everywhere, instantly and atomically.",
  },
  {
    icon: Bell,
    title: "Low-stock alerts",
    body: "Set thresholds per item. ShelfSync flags anything running low so you reorder before you run out.",
  },
  {
    icon: BarChart3,
    title: "Live stock insights",
    body: "See how inventory is distributed across branches with at-a-glance charts and totals.",
  },
  {
    icon: Boxes,
    title: "Product catalog",
    body: "Manage SKUs, categories, and per-branch stock levels in a single source of truth.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    body: "Every workspace is isolated and protected with hashed credentials and scoped sessions.",
  },
]

export default async function LandingPage() {
  const session = await auth()
  const ctaHref = session?.user ? "/dashboard" : "/register"

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={ctaHref}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Inventory control for multi-location retail
            </span>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              Keep every shelf in sync, across every branch.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              ShelfSync gives small businesses a single dashboard to track stock,
              transfer inventory between locations, and get alerted the moment
              something runs low.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={ctaHref}>
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required. Your workspace comes pre-loaded with demo data.
            </p>
          </div>

          {/* Preview mock */}
          <div className="mx-auto mt-16 max-w-5xl rounded-xl border border-border bg-card p-2 shadow-sm">
            <div className="rounded-lg border border-border bg-background">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="ml-3 text-xs text-muted-foreground">
                  app.shelfsync.com/dashboard
                </span>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-3">
                {[
                  { label: "Total units", value: "8,420" },
                  { label: "Branches", value: "3" },
                  { label: "Low stock alerts", value: "4" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-border bg-card p-4 text-left"
                  >
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {s.value}
                    </p>
                  </div>
                ))}
                <div className="md:col-span-3">
                  <div className="flex h-32 items-end gap-3 rounded-lg border border-border bg-card p-4">
                    {[70, 45, 90, 55, 80, 35, 65].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-primary/80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border bg-card/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20">
            <div className="max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
                Everything you need to manage stock across locations
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                Purpose-built for growing retailers juggling more than one storefront.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
                Up and running in three steps
              </h2>
              <ol className="mt-8 space-y-6">
                {[
                  {
                    t: "Create your workspace",
                    d: "Sign up and your business is set up with sample branches and products to explore.",
                  },
                  {
                    t: "Add branches & products",
                    d: "Register each store location and your catalog, then set per-item stock levels.",
                  },
                  {
                    t: "Transfer & track",
                    d: "Move inventory where it's needed and let alerts handle the rest.",
                  },
                ].map((step, i) => (
                  <li key={step.t} className="flex gap-4">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{step.t}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {step.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-xl font-semibold text-foreground">
                Ready to take control of your inventory?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Join ShelfSync and stop guessing what&apos;s on your shelves.
              </p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href={ctaHref}>
                  Create your free workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} ShelfSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
