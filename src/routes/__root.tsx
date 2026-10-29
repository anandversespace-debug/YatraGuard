import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "YatraGuard (यात्रा गार्ड) — Safe Navigation & Emergency Response" },
      {
        name: "description",
        content:
          "YatraGuard — Intelligent safety-centric urban navigation & emergency response system for Indian cities. Multi-factor route safety scoring, hazard heatmaps, zero-asset offline SOS siren, and crowd hazard reporting.",
      },
      { name: "author", content: "Syntax Squad & ANANDVERSE TECHNOLOGIES" },
      { property: "og:title", content: "YatraGuard (यात्रा गार्ड) — Safest Route, Every Time" },
      {
        property: "og:description",
        content:
          "Context-aware urban safety navigation built for Indian cities. Multi-factor safety scoring (1–100), spatial risk heatmaps, offline emergency SOS siren, and community hazard verification.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "YatraGuard" },
      { property: "og:url", content: "https://yatraguard.anandverse.tech" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "YatraGuard (यात्रा गार्ड) — Safest Route, Every Time" },
      {
        name: "twitter:description",
        content:
          "Intelligent safety-centric urban navigation & emergency response system built for Indian cities.",
      },
      { name: "theme-color", content: "#0df2a0" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
