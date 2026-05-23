// static/hooks/useDeployments.js

export async function fetchDeployments() {
  const res = await fetch('/api/deployments');
  if (!res.ok) throw new Error("Failed to fetch deployments");
  return await res.json();
}

export function subscribeDeploymentsRealtime(supabase, onNewDeployment) {
  // Realtime subscription disabled for frontend as it requires RLS permissions
  // To restore, we would need either a logged-in technician session or polling
  console.log("Realtime updates via client are disabled due to RLS.");
  return null;
}
