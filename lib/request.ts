import { z } from "zod";

const ErrorSchema = z.object({ error: z.string() });

/** Calls one of the app's routes, throwing the error it answered with */
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      ErrorSchema.safeParse(body).data?.error ??
        "Something went wrong. Try again."
    );
  }
  return body;
}

export function postJson<T>(url: string, body: object): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
