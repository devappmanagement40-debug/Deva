import { QueryClient, QueryFunction } from "@tanstack/react-query";

function looksLikeHtmlDocument(value: string): boolean {
  return /<!doctype\s+html\b|<html(?:\s|>)/i.test(value.slice(0, 2048));
}

export function errorMessageFromResponse(
  body: string,
  contentType: string,
  status: number,
  statusText = "",
): string {
  const genericMessage = `Le serveur a renvoyé une erreur (${status}). Réessayez dans quelques instants.`;
  let parsed: unknown;

  try {
    parsed = JSON.parse(body);
  } catch {
    // Reverse proxies and hosting panels sometimes return an HTML error page
    // with a missing or incorrect content type.
  }

  if (parsed && typeof parsed === "object") {
    const payload = parsed as { message?: unknown; error?: unknown };
    const message = payload.message ?? payload.error;
    if (typeof message === "string") {
      return looksLikeHtmlDocument(message) ? genericMessage : message;
    }
  }

  if (
    typeof parsed === "string" &&
    looksLikeHtmlDocument(parsed)
  ) {
    return genericMessage;
  }

  if (
    contentType.toLowerCase().includes("text/html") ||
    looksLikeHtmlDocument(body)
  ) {
    return genericMessage;
  }

  return body || statusText || genericMessage;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    const message = errorMessageFromResponse(
      text,
      res.headers.get("content-type") || "",
      res.status,
      res.statusText,
    );
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
