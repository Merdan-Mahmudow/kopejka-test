import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely extract readable error strings from TanStack Form field errors.
 * Handles: strings, ZodError objects, nested {message} objects, etc.
 */
export function formatFieldErrors(errors: any[]): string {
  return errors
    .map((e) => {
      if (typeof e === "string") return e
      if (e?.message && typeof e.message === "string") return e.message
      if (typeof e === "object") return JSON.stringify(e)
      return String(e)
    })
    .join(", ")
}
