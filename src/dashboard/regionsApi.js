export async function fetchRegions(token) {
  const res = await fetch('/api/dashboard/regions', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed loading regions');
  }

  const data = await res.json();
  return Array.isArray(data.regions) ? data.regions : [];
}

export async function updateRegion(code, patch, token) {
  const res = await fetch('/api/dashboard/regions', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ code, patch }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed saving region');
  }

  const data = await res.json();
  return Array.isArray(data.regions) ? data.regions : [];
}
