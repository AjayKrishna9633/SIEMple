/**
 * Turns an axios failure into something worth showing a user.
 *
 * The distinction that matters: no `response` object means the request never
 * reached the server, so reporting the endpoint's fallback message would
 * blame the data for what is actually a connectivity problem.
 */
export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  if (!e.response) {
    return "Couldn't reach the server. Check that the backend is running.";
  }
  return e.response.data?.message ?? fallback;
}
