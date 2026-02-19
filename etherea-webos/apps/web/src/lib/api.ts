export type ApiHealth = {
  ok: boolean;
  service: string;
  now: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  status: string;
  owner: string;
};

const defaultApiBaseUrl = 'http://localhost:8787';

export function getApiBaseUrl() {
  return (import.meta.env.VITE_ETHEREA_API_BASE_URL as string | undefined)?.trim() || defaultApiBaseUrl;
}

export async function fetchApiHealth(): Promise<ApiHealth> {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  if (!response.ok) throw new Error(`Health check failed (${response.status})`);
  return response.json() as Promise<ApiHealth>;
}

export async function fetchWorkspaceSummaries(): Promise<WorkspaceSummary[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/workspaces`);
  if (!response.ok) throw new Error(`Workspace request failed (${response.status})`);
  const payload = (await response.json()) as { items?: WorkspaceSummary[] };
  return payload.items ?? [];
}
