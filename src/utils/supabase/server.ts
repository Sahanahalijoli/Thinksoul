import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import dns from 'node:dns';

// FORCE IPv4: Many ISPs (like Jio in India) have shaky IPv6 routes for Supabase.
// Node.js 18+ defaults to IPv6, causing 'ConnectTimeoutError'.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * RESILIENT FETCH
 * A wrapper around the native fetch with extended timeouts and basic retries
 * to handle network instability between the VPS/ISP and Supabase.
 */
const resilientFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('ConnectTimeoutError: Supabase took too long to respond (30s)');
    }
    throw error;
  }
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: resilientFetch
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Silence cookie set errors when called from Server Components
          }
        },
      },
    }
  );
}
