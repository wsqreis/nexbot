export async function fetchDeployments(token) {
  const res = await fetch('/api/dashboard/deployments', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed loading deployments');
  }

  const data = await res.json();
  return Array.isArray(data.deployments) ? data.deployments : [];
}

export async function createDeployment(payload, token) {
  const res = await fetch('/api/dashboard/deployments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: 'request', ...payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed creating deployment request');
  }

  const data = await res.json();
  return Array.isArray(data.deployments) ? data.deployments : [];
}

export async function approveDeployment(id, token) {
  const res = await fetch('/api/dashboard/deployments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: 'approve', id }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed approving deployment');
  }

  const data = await res.json();
  return Array.isArray(data.deployments) ? data.deployments : [];
}

export async function checkDeploymentHealth(id, externalUrl, token) {
  const res = await fetch('/api/dashboard/deployments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: 'health-check', id, externalUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed running deployment health check');
  }

  const data = await res.json();
  return { deployments: Array.isArray(data.deployments) ? data.deployments : [], healthCheck: data.healthCheck || null };
}
