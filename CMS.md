# Sveltia CMS — guida operativa

CMS Git-based per gestire i contenuti del sito senza toccare il codice.
File: [`static/admin/index.html`](static/admin/index.html) (loader) +
[`static/admin/config.yml`](static/admin/config.yml) (configurazione).
URL una volta pubblicato: **`https://abruzzodivino.it/admin/`**.

## Cosa è editabile (collection)

| Collection | Tipo | Percorso |
|---|---|---|
| Homepage | file singolo | `content/_index.md` (hero + sezioni) |
| Cantine | leaf bundle | `content/cantine/<slug>/index.md` |
| Vini | leaf bundle | `content/vini/<slug>/index.md` |
| Blog | leaf bundle | `content/blog/<slug>/index.md` |
| Eventi | pagina singola | `content/eventi/<slug>.md` |
| Sapori | leaf bundle | `content/sapori/<slug>/index.md` |
| Territorio (pagina) | file singolo | `content/territorio/_index.md` |
| Chi Siamo (pagina) | file singolo | `content/about.md` |
| Intro sezioni | file multipli | `content/<sezione>/_index.md` (titolo + sottotitolo hero) |
| Impostazioni sito | file singolo | `data/ui.yml` (menu, footer, cookie, 404, etichette ricorrenti) |

> **Nessun testo è hardcoded**: tutto il copy visibile è in `content/` o in
> `data/ui.yml`, editabile dal CMS. In `hugo.toml` restano solo configurazioni
> tecniche/SEO (baseURL, title, description meta, payoff per il `<title>`, ID GA4).
> I template leggono le stringhe globali via `hugo.Data.ui.*`.

## Editing in locale (modalità attuale)

`config.yml` ha `local_backend: true`. **Metodo consigliato: proxy locale**
(`decap-server`), che evita la File System Access API del browser — spesso
disabilitata da policy nei browser aziendali (Accenture) e causa dell'errore
“A repository root directory could not be selected”.

```bash
# terminale 1 — proxy che legge/scrive i file del repo (porta 8081)
npx decap-server

# terminale 2 — sito
hugo server
```

Poi apri **`http://localhost:1313/admin/`**: con il proxy attivo Sveltia si
collega automaticamente (niente login, niente selezione cartella) e scrive
direttamente nei file del repo. Committi/pushi a mano.

> ⚠️ Il pacchetto è **`decap-server`** (Sveltia è compatibile col backend locale
> di Decap). NON esiste `@sveltia/cms-proxy-server`.

### Alternativa: File System Access API (senza proxy)

Solo su **Chrome/Edge** non vincolati da policy aziendali: apri `/admin/`,
clicca **“Work with Local Repository”** e seleziona **esattamente** la cartella
`hugo-site` (quella che contiene `.git`). Se compare “repository root directory
could not be selected”, la FS Access API è bloccata → usa il proxy qui sopra.

### Note importanti sul caricamento

- Il bundle di Sveltia è **self-hosted** in `static/admin/sveltia-cms.js` (non
  da CDN): così l'editor funziona anche dietro filtri di rete aziendali
  (es. Forcepoint) che bloccano `unpkg.com`. Per aggiornarlo, ri-scarica:
  ```bash
  curl -L -o static/admin/sveltia-cms.js https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js
  ```
- Se l'interfaccia resta bianca: fai un **hard refresh** (Ctrl+F5) per scartare
  la cache della vecchia pagina, e verifica nella console del browser che
  `/admin/sveltia-cms.js` e `/admin/config.yml` rispondano 200.

## Passaggio alla produzione (GitHub Pages)

GitHub Pages non ha un backend: per l'editing online serve l'OAuth GitHub.

1. **Compilare il repo** in `static/admin/config.yml`:
   ```yaml
   backend:
     name: github
     repo: TUO-OWNER/TUO-REPO   # es. alfredodag/abruzzodivino
     branch: main
   ```
2. **OAuth** (consigliato: Cloudflare Worker gratuito):
   - Crea una **GitHub OAuth App** (Settings → Developer settings → OAuth Apps).
     Authorization callback URL = URL del worker (passo successivo) + `/callback`.
   - Deploya il worker [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)
     su Cloudflare con `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
   - In `config.yml` aggiungi sotto `backend:` →
     `base_url: https://<tuo-worker>.workers.dev`.
3. **Disattivare** `local_backend: true` (o lasciarlo: viene usato solo in locale).
4. Le modifiche dal CMS = **commit diretti** su `main` → il workflow
   `.github/workflows/hugo.yml` ribuilda e pubblica.

## Note tecniche

- **Immagini**: per i leaf bundle (cantine/vini/blog/sapori) la copertina è
  caricata nella cartella del contenuto e salvata nel campo `image`. I template
  usano `image` se presente, altrimenti il file `cover.*` (convenzione storica) —
  vedi [`layouts/partials/func/cover.html`](layouts/partials/func/cover.html).
- **Date**: salvate come `YYYY-MM-DD`. Per gli **eventi**, `date` = pubblicazione
  (tienila nel passato), `event_date` = data reale dell'evento (ordinamento).
- **Categorie blog**: il campo `categories` genera le pagine `/blog/categorie/…`.
- `static/admin/` ha `noindex`; resta fuori dall'indicizzazione.
