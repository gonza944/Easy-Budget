import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createError,
  deleteCookie,
  getHeader,
  getRequestURL,
  parseCookies,
  setCookie,
  setResponseHeader,
  type H3Event,
} from "h3";
import { useRuntimeConfig } from "#imports";

type ServerSupabaseContext = {
  supabaseClient?: SupabaseClient;
  supabaseUserPromise?: Promise<User | null>;
};

const isCookieDeletion = (maxAge?: number, value?: string) =>
  maxAge === 0 || value === "";

const shouldHandleAuthRequest = (event: H3Event) => {
  const { pathname } = getRequestURL(event);
  const accept = getHeader(event, "accept") ?? "";

  if (
    pathname.startsWith("/_nuxt/") ||
    pathname.startsWith("/__nuxt") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public/")
  ) {
    return false;
  }

  return pathname.startsWith("/api/") || accept.includes("text/html");
};

const getSupabaseRuntimeConfig = (event: H3Event) => {
  const config = useRuntimeConfig(event);
  const supabaseUrl = config.supabaseUrl || config.public.supabaseUrl;
  const supabaseAnonKey =
    config.supabaseAnonKey || config.public.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase runtime config is missing.");
  }

  return { supabaseUrl, supabaseAnonKey };
};

const getServerContext = (event: H3Event) =>
  event.context as typeof event.context & ServerSupabaseContext;

export const getSupabaseServerClient = (event: H3Event) => {
  const context = getServerContext(event);

  if (context.supabaseClient) {
    return context.supabaseClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseRuntimeConfig(event);
  const cookieStore = { ...parseCookies(event) };

  context.supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () =>
        Object.entries(cookieStore).map(([name, value]) => ({ name, value })),
      setAll: (cookiesToSet, headers) => {
        for (const [key, value] of Object.entries(headers)) {
          setResponseHeader(event, key, value);
        }

        for (const { name, value, options } of cookiesToSet) {
          if (isCookieDeletion(options.maxAge, value)) {
            delete cookieStore[name];
            deleteCookie(event, name, options);
            continue;
          }

          cookieStore[name] = value;
          setCookie(event, name, value, options);
        }
      },
    },
  });

  return context.supabaseClient;
};

export const getSupabaseUser = async (event: H3Event) => {
  const context = getServerContext(event);

  if (!context.supabaseUserPromise) {
    context.supabaseUserPromise = (async () => {
      const supabase = getSupabaseServerClient(event);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        if (error.name !== "AuthSessionMissingError") {
          console.error("Error resolving Supabase user:", error);
        }

        return null;
      }

      return user;
    })();
  }

  return context.supabaseUserPromise;
};

export const requireSupabaseUser = async (event: H3Event) => {
  const supabase = getSupabaseServerClient(event);
  const user = await getSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Please log in",
    });
  }

  return { supabase, user };
};

export const refreshSupabaseAuthIfNeeded = async (event: H3Event) => {
  if (!shouldHandleAuthRequest(event)) {
    return;
  }

  await getSupabaseUser(event);
};
