/**
 * Marker for the Watch Together strict TypeScript boundary.
 *
 * `tsconfig.watch.json` is the executable proof that strictNullChecks and
 * noImplicitAny are enabled: the aggregate gate compiles this subtree with that
 * project after the legacy repository-wide typecheck.
 *
 * Do not add a real strict-only @ts-expect-error sentinel here. The legacy root
 * tsconfig intentionally includes `shared/**` with strict mode disabled, so a
 * strict-only expected error would become an unused directive during the base
 * typecheck and make the aggregate gate fail for the wrong reason.
 */
export type WatchStrictBoundary = {
  readonly enabled: true;
};

export const watchStrictBoundary: WatchStrictBoundary = { enabled: true };
