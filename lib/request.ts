/** Calls one of the app's routes, throwing the error it answered with */
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : "Something went wrong. Try again."
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

/** What a caught error says, for the message under a form */
export function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
