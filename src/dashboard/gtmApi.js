export async function fetchGtmSettings(token) {
  const res = await fetch('/api/dashboard/gtm', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed loading GTM settings');
  }

  const data = await res.json();
  return data.settings || { gtmId: 'GTM-XXXXXXX', tags: [] };
}

export async function persistGtmSettings(settings, token) {
  const res = await fetch('/api/dashboard/gtm', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ settings }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed saving GTM settings');
  }

  const data = await res.json();
  return data.settings || { gtmId: 'GTM-XXXXXXX', tags: [] };
}
