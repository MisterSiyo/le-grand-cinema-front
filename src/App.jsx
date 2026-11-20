import { useEffect, useState } from "react";
import { appeler, enregistrerSession, lireSession } from "./api.js";

const formatDate = (iso) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

function Connexion({ onConnecte }) {
  const [inscription, setInscription] = useState(false);
  const [champs, setChamps] = useState({ nom: "", prenom: "", email: "", mot_de_passe: "" });
  const [erreur, setErreur] = useState("");

  const changer = (e) => setChamps({ ...champs, [e.target.name]: e.target.value });

  async function envoyer(e) {
    e.preventDefault();
    setErreur("");
    try {
      const chemin = inscription ? "/auth/inscription" : "/auth/connexion";
      const corps = inscription
        ? champs
        : { email: champs.email, mot_de_passe: champs.mot_de_passe };
      onConnecte(await appeler(chemin, { method: "POST", body: corps }));
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <form onSubmit={envoyer}>
      <h2>{inscription ? "Inscription" : "Connexion"}</h2>
      {inscription && (
        <>
          <input name="nom" placeholder="Nom" value={champs.nom} onChange={changer} required />
          <input name="prenom" placeholder="Prénom" value={champs.prenom} onChange={changer} required />
        </>
      )}
      <input name="email" type="email" placeholder="Email" value={champs.email} onChange={changer} required />
      <input name="mot_de_passe" type="password" placeholder="Mot de passe (8 caractères minimum)" value={champs.mot_de_passe} onChange={changer} required />
      {erreur && <p className="erreur">{erreur}</p>}
      <button className="principal">{inscription ? "Créer mon compte" : "Se connecter"}</button>
      <p>
        <a href="#" onClick={(e) => { e.preventDefault(); setInscription(!inscription); }}>
          {inscription ? "J'ai déjà un compte" : "Créer un compte"}
        </a>
      </p>
    </form>
  );
}

function Seances() {
  const [seances, setSeances] = useState([]);
  const [choisie, setChoisie] = useState(null);
  const [message, setMessage] = useState(null);

  const charger = () => appeler("/seances").then(setSeances).catch((e) => setMessage({ erreur: e.message }));
  useEffect(() => { charger(); }, []);

  async function ouvrir(id) {
    setMessage(null);
    setChoisie(await appeler("/seances/" + id));
  }

  async function reserver(place) {
    try {
      const billet = await appeler("/reservations", {
        method: "POST",
        body: { seance_id: choisie.id, place_id: place.id },
      });
      setMessage({ succes: `Place ${billet.numero_place} réservée. Code billet : ${billet.code_billet}` });
    } catch (e) {
      setMessage({ erreur: e.message });
    }
    setChoisie(await appeler("/seances/" + choisie.id));
    charger();
  }

  if (choisie) {
    return (
      <>
        <button onClick={() => setChoisie(null)}>← Retour aux séances</button>
        <h2>{choisie.titre_film} - {choisie.salle} - {formatDate(choisie.date_heure_debut)}</h2>
        <p>{choisie.places_libres} places libres sur {choisie.places_total}. Tarif : {choisie.tarif} €</p>
        {message?.erreur && <p className="erreur">{message.erreur}</p>}
        {message?.succes && <p className="succes">{message.succes}</p>}
        <div className="places">
          {choisie.places.map((p) => (
            <button key={p.id} disabled={p.statut !== "LIBRE"} onClick={() => reserver(p)}>
              {p.numero_place}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Séances à venir</h2>
      {message?.erreur && <p className="erreur">{message.erreur}</p>}
      {seances.map((s) => (
        <div className="carte" key={s.id}>
          <div>
            <strong>{s.titre_film}</strong><br />
            {formatDate(s.date_heure_debut)} - {s.salle} - {s.tarif} €<br />
            {s.places_libres} places libres
          </div>
          <button className="principal" onClick={() => ouvrir(s.id)}>Choisir ma place</button>
        </div>
      ))}
    </>
  );
}

function Billets() {
  const [billets, setBillets] = useState([]);
  useEffect(() => { appeler("/reservations/moi").then(setBillets); }, []);

  return (
    <>
      <h2>Mes billets</h2>
      {billets.length === 0 && <p>Aucune réservation pour le moment.</p>}
      {billets.map((b) => (
        <div className="carte" key={b.id}>
          <div>
            <strong>{b.titre_film}</strong><br />
            {formatDate(b.date_heure_debut)} - {b.salle} - place {b.numero_place}
          </div>
          <strong>{b.code_billet}</strong>
        </div>
      ))}
    </>
  );
}

function Admin() {
  const [synthese, setSynthese] = useState(null);
  const [remplissage, setRemplissage] = useState([]);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    appeler("/admin/remplissage/synthese").then(setSynthese);
    appeler("/admin/remplissage").then(setRemplissage);
    appeler("/admin/reservations").then(setReservations);
  }, []);

  return (
    <>
      <h2>Suivi du remplissage</h2>
      {synthese && (
        <p>
          Global : {synthese.places_reservees} places réservées sur {synthese.places_total} ({synthese.taux_remplissage} %)
        </p>
      )}
      <table>
        <thead><tr><th>Film</th><th>Séance</th><th>Réservées</th><th>Taux</th></tr></thead>
        <tbody>
          {remplissage.map((r) => (
            <tr key={r.seance_id}>
              <td>{r.titre_film}</td>
              <td>{formatDate(r.date_heure_debut)} - {r.salle}</td>
              <td>{r.places_reservees} / {r.places_total}</td>
              <td>{r.taux_remplissage} %</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Réservations</h2>
      <table>
        <thead><tr><th>Code</th><th>Spectateur</th><th>Film</th><th>Place</th></tr></thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id}>
              <td>{r.code_billet}</td><td>{r.email}</td><td>{r.titre_film}</td><td>{r.numero_place}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(lireSession());
  const [page, setPage] = useState("seances");

  function connecter(nouvelle) {
    enregistrerSession(nouvelle);
    setSession(nouvelle);
    setPage("seances");
  }

  function deconnecter() {
    enregistrerSession(null);
    setSession(null);
  }

  const onglet = (nom, texte) => (
    <button className={page === nom ? "actif" : ""} onClick={() => setPage(nom)}>{texte}</button>
  );

  return (
    <>
      <header>
        <h1>Le Grand Cinéma</h1>
        {session && onglet("seances", "Séances")}
        {session && onglet("billets", "Mes billets")}
        {session?.utilisateur.role === "ADMIN" && onglet("admin", "Administration")}
        {session && <button onClick={deconnecter}>Déconnexion ({session.utilisateur.prenom})</button>}
      </header>
      <main>
        {!session && <Connexion onConnecte={connecter} />}
        {session && page === "seances" && <Seances />}
        {session && page === "billets" && <Billets />}
        {session && page === "admin" && <Admin />}
      </main>
    </>
  );
}
