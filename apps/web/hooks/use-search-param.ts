"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Read/write a single URL query param (client-side, `replace`, no scroll).
 * Returns `[value, setValue]`. Setting it to `defaultValue` removes the param,
 * so the default state keeps a clean URL (e.g. no `?tab=overview`).
 */
export function useSearchParam(
  key: string,
  defaultValue = ""
): readonly [string, (next: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const value = params.get(key) ?? defaultValue;

  const setValue = (next: string) => {
    const sp = new URLSearchParams(params);
    if (next === defaultValue) sp.delete(key);
    else sp.set(key, next);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return [value, setValue] as const;
}
