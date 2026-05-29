# DECISIONS.md — decision log migrazione

Queste decisioni risolvono le "Domande aperte" del MIGRATION-PLAN.md.
Vanno seguite letteralmente nello scaffolding Hugo.

## Architettura & content

1. **Dark mode**: RIMOSSO. Niente blocco `.dark` nel CSS, niente toggle.
   Tutto luce: palette wine/gold/cream.
2. **Custom domain**: `baseURL = "https://abruzzodivino.it/"`. CNAME file
   in `static/CNAME` con valore `abruzzodivino.it`.
3. **Leaf bundle confermato** per `cantine/`, `vini/`, `blog/`, `sapori/`.
   Struttura: `content/<sezione>/<slug>/index.md` + `cover.jpg` (o webp).
4. **Tassonomie attive** in `hugo.toml`:
   - `cantine` (slug cantina → vini correlati)
   - `vitigni` (Montepulciano, Trebbiano, Pecorino, Passerina, ecc.)
   - `province` (CH, PE, AQ, TE)
   - `tipologie` (rosso/bianco/rosato/passito/spumante) — per vini
   - `stagioni` (predisposta vuota, sarà usata da agente AI)
   - `tags` + `categories` standard

## Pagine

5. **Pagina `/contatti/`**: NON CREATA. Niente form, niente dati personali.
   Rimossa anche dalla navbar.
6. **Pagina `/about/`**: mantenuta MA riscritta in terza persona, senza
   dati personali. Racconta brand e missione collettivamente.
7. **404 page**: riscritta in stile brand + italiano. Layout custom
   `layouts/404.html` con sfondo cream, titolo Playfair "Pagina non trovata",
   link a homepage e ai vini più letti.
8. **Sezione `/sapori/`**: predisposta vuota ora (layout list + single,
   voce in navbar). Verrà popolata dall'agente AI.

## Funzionalità

9. **Form contatti**: NON IMPLEMENTATO. Niente Formspree/Netlify/Worker.
10. **Newsletter**: NON IMPLEMENTATA per ora. Rimuovere TUTTI gli input email
    inline (homepage, blog, eventi). Re-aggiungeremo dopo con un partial.
11. **Filtro blog per categoria**: niente JS. Generare pagine statiche via
    tassonomia: `/blog/`, `/blog/categorie/territorio/`, `/categorie/degustazione/`,
    `/categorie/cultura/`. I bottoni diventano link.
12. **Search**: NON in scope MVP. Aggiungeremo Pagefind post-launch.

## Trust & contenuti fittizi

13. **Recensioni vini (James Suckling 95, Wine Spectator 93, Gambero Rosso
    3 Bicchieri)**: RIMOSSE completamente. Attribuzione falsa = rischio legale
    e perdita di credibilità.
14. **Esperienze in cantina (Visita €35, Vigna €50, Vertical €75)**: RIMOSSE
    completamente. In futuro renderle opzionali via front matter (solo cantine
    con accordi reali).
15. **Dati di contatto** (Via Minzoni 43, +39 0871 62929, info@abruzzodivino.it):
    placeholder Lovable, NON pubblicare.
16. **Open Graph image generica `lovable.dev`**: SOSTITUITA. Una OG image custom
    per la home (logo + payoff su sfondo vigneto). Per i post: generazione
    automatica via template, o fallback alla cover del post.

## Performance & SEO

17. **Image processing**: tutte le immagini > 200KB passano per Hugo Pipes,
    output WebP + srcset. Page bundle per cantine/vini/blog.
18. **Sitemap.xml** + **RSS** (root + per ogni sezione): generati default
    Hugo, da NON disabilitare.
19. **GA4 G-QKBXN56SPE**: mantenuto. Banner cookie GDPR: implementato con
    CookieConsent vanilla (no framework).
20. **Font**: Playfair Display + Lato via Google Fonts CDN come nell'originale
    (preconnect + display=swap). No self-hosting in questa fase.

## Animazioni & interattività

21. **Scroll fade-in**: vanilla JS + IntersectionObserver (~30 righe) in
    `assets/js/scroll-fade.js`. Elementi marcati con `data-scroll-fade`.
22. **Parallax hero**: vanilla JS con requestAnimationFrame.
23. **Navbar scroll-aware**: vanilla JS toggle classe `.scrolled`.
24. **Mobile menu**: vanilla JS toggle `aria-expanded`.
25. **Fade-in JS sui titoli hero**: NON applicato (Claude Code ha visto
    giusto: i titoli sono già in viewport al load, fade-in JS provoca
    lampeggio. Usiamo solo `animate-fade-in` CSS al load).
26. **Toast/Sonner, Accordion, Dialog, Carousel**: tutti RIMOSSI (non usati
    nelle 12 pagine reali).

## Stack tecnico

27. **Hugo extended** (per Tailwind via Hugo Pipes).
28. **Tailwind 3.x** processato da Hugo Pipes (`postcss.config.js` minimale).
29. **JS**: nessun framework. Solo `assets/js/*.js` con `js.Build` Hugo Pipes
    per minify.
30. **Deploy**: GitHub Actions → GitHub Pages. Workflow `.github/workflows/hugo.yml`.

## Vincoli operativi

- NON ripristinare contenuti fittizi anche se appaiono nel sorgente Lovable.
- NON installare dipendenze npm oltre tailwind/autoprefixer/postcss.
- NON usare componenti React-style (.jsx, .tsx) in Hugo: solo HTML + Go templates.
- Se trovi ambiguità nello scaffolding, fermati e chiedi.

## Convenzioni emerse durante lo scaffolding (da rispettare)

31. **Vini**: niente recensioni fittizie (DECISIONS #13). Il single mostra invece
    il blocco "Altri vini della stessa cantina" via param `cantina_slug`.
32. **Eventi**: usare `event_date` (ISO) nel front matter per ordinamento e calcolo
    futuro, e `date` come data di pubblicazione PASSATA. Hugo non costruisce
    contenuti con `date` futura (`buildFuture` resta false per non pubblicare in
    anticipo i post programmati del blog). `data_label` = stringa IT visualizzata.
    Niente bottoni "Prenota/Info" (CTA morte, nessun endpoint).
33. **Blog**: leaf bundle con `cover.jpg`. Autore = firma editoriale unica
    **"Redazione Abruzzo diVino"** (no nomi di persona inventati). `summary` nel
    front matter = lead/estratto; il corpo markdown = contenuto. Reading time da
    `.ReadingTime`. Categorie consentite: Territorio, Degustazione, Cultura.
34. **Filtro categorie blog**: pagine statiche sotto `/blog/categorie/<slug>/` via
    `[permalinks.term]` + `[permalinks.taxonomy]` su `categories`. Template termine
    custom in `layouts/categories/term.html` (Hugo 0.161 preferisce `term.html` al
    legacy `taxonomy.html`, usato invece per vitigni/province/ecc.). Barra filtri
    riutilizzabile: `partials/blog-filtri.html`.
35. **Icone**: i partial in `layouts/partials/icons/` hanno dimensione "baked" e
    non accettano classi. Dove serve una dimensione diversa (pagine bespoke come
    territorio/eventi/blog/about) inlinare l'SVG con le classi Tailwind corrette,
    senza modificare i partial esistenti.
36. **Pagine bespoke** (territorio, about): contenuti strutturati e prose nel front
    matter dell'`_index.md`/`about.md`; prose con `<strong>` emesse via `safeHTML`.
37. **About**: terza persona riferita al progetto editoriale. Rimossi i servizi
    fittizi dell'originale (eventi esclusivi, visite personalizzate, podcast,
    masterclass): il sito è un progetto editoriale/blog, non un organizzatore eventi.
38. **Sapori**: sezione predisposta vuota con empty-state ("Sezione in arrivo").
    Sarà popolata dall'agente AI con leaf bundle (`cover.jpg` + corpo markdown).
39. **Cookie/GA4 (GDPR)**: GA4 in Google Consent Mode v2, default `denied`
    (`anonymize_ip` attivo) in `head.html`. Banner in `baseof.html` +
    `assets/js/cookie-consent.js`; la scelta è salvata in `localStorage` con
    chiave `cookie_consent` (`granted`/`denied`) e fa il `consent update`.
    Banner e GA4 compaiono solo se `site.Params.ga4` è valorizzato.
40. **OG image**: cover del contenuto per i leaf bundle (cantine/vini/blog/sapori),
    fallback `images/hero/hero-vineyard.jpg` per home/list/pagine; generata a
    1200×630 WebP. Overlay testuale logo+payoff rimandato (serve un TTF locale,
    fuori scope per la fase font CDN — DECISIONS #20).
41. **Menu mobile**: markup `#mobile-menu` in `navbar.html`, toggle in
    `navbar.js`, stati `.is-open` / icona hamburger↔X via CSS in `base.css`.
42. **CMS = Sveltia CMS** (Git-based, schema Decap-compatibile) in
    `static/admin/`. Backend GitHub, branch `main`, commit diretti (no editorial
    workflow), `local_backend: true` per l'editing locale. Auth di produzione via
    OAuth (worker Cloudflare) da configurare con `base_url`. Vedi `CMS.md`.
43. **Copertine immagini**: i template leggono il param `image` se presente,
    altrimenti il file `cover.*` (partial `layouts/partials/func/cover.html`).
    Serve a far funzionare gli upload del CMS (che non rinominano i file in
    "cover") mantenendo la compatibilità coi contenuti esistenti.
44. **Niente copy hardcoded**: la homepage è data-driven (`content/_index.md`:
    hero + sezioni). Tutte le stringhe globali e ricorrenti dei template (menu
    navbar, footer, banner cookie, 404, titoli sezione, CTA, microcopy) stanno in
    `data/ui.yml`, lette via `hugo.Data.ui.*` ed editabili dal CMS. In `hugo.toml`
    restano solo config tecniche/SEO (baseURL, title, description, payoff, GA4).
45. **Accessor dati**: usare `hugo.Data` (NON `site.Data`/`.Site.Data`, deprecato
    in Hugo 0.156).