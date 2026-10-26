import { lazy, Suspense } from "react";
import { ClientOnly } from "./ClientOnly";
import type { ComponentProps } from "react";
import type { SafetyMap as Inner } from "./SafetyMapInner";

const LazyMap = lazy(() =>
  import("./SafetyMapInner").then((m) => ({ default: m.SafetyMap }))
);

export function SafetyMap(props: ComponentProps<typeof Inner>) {
  return (
    <ClientOnly fallback={<div className="h-full w-full bg-muted animate-pulse" />}>
      <Suspense fallback={<div className="h-full w-full bg-muted animate-pulse" />}>
        <LazyMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
