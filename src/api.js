const URL_API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function lireSession() {
  try {
    return JSON.parse(localStorage.getItem("session"));
  } catch {
    return null;
  }
}

export function enregistrerSession(session) {
  if (session) localStorage.setItem("session", JSON.stringify(session));
  else localStorage.removeItem("session");
}

export async function appeler(chemin, options = {}) {
  const session = lireSession();
  const reponse = await fetch(URL_API + chemin, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: "Bearer " + session.access_token } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const donnees = reponse.status === 204 ? null : await reponse.json();
  if (!reponse.ok) {
    const detail = donnees?.detail;
    throw new Error(typeof detail === "string" ? detail : "Données invalides");
  }
  return donnees;
}
