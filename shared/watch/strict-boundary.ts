/**
 * Compile-time sentinels for the Watch Together strict TypeScript boundary.
 *
 * These are intentionally-invalid examples guarded by @ts-expect-error.
 * If strictNullChecks or noImplicitAny is ever disabled, TypeScript will report
 * the directive as unused and Gate B will fail instead of silently weakening
 * the synchronization protocol's type safety.
 */

// strictNullChecks must reject assigning null to string.
// @ts-expect-error strictNullChecks sentinel
const strictNullChecksSentinel: string = null;

// noImplicitAny must reject an untyped function parameter.
// @ts-expect-error noImplicitAny sentinel
function noImplicitAnySentinel(value) {
  return value;
}

void strictNullChecksSentinel;
void noImplicitAnySentinel;
