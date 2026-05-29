# MIGRATION-PLAN.md — da Lovable React/Vite a Hugo

Documento di analisi pre-implementazione. Estratto da `../lovable-source/`
(commit corrente, sola lettura). Nessuna riga di codice Hugo è ancora stata
scritta: questo file serve a fissare lo stato dell'arte e ad allineare le
decisioni prima di toccare `content/`, `layouts/`, `assets/`.

---

## 1. Design system estratto

### 1.1 CSS variables — valori HSL (modalità light)

Tutti i valori sono copiati 1:1 da `../lovable-source/src/index.css` (righe 10–67).
Vanno riprodotti **identici** nel file CSS del nuovo sito Hugo (es. `assets/css/tokens.css`).

| Variabile          | HSL                  | Hex di riferimento | Uso principale                              |
|--------------------|----------------------|--------------------|---------------------------------------------|
| `--wine`           | `345 75% 31%`        | `#8B1538`          | colore primario brand (titoli, CTA, footer) |
| `--wine-light`     | `345 65% 45%`        | ~`#B83552`         | varianti / badge "Rosato"                   |
| `--wine-dark`      | `345 85% 20%`        | ~`#5E0A22`         | hover stati / gradient hero                 |
| `--gold`           | `45 75% 53%`         | `#D4AF37`          | accent (icone, link, badge "Bianco")        |
| `--gold-light`     | `45 85% 70%`         | ~`#EBCB7A`         | hover gold / testo citazioni footer         |
| `--cream`          | `60 56% 91%`         | `#F5F5DC`          | sfondo sezioni, testo su sfondo wine        |
| `--cream-dark`     | `40 30% 85%`         | ~`#DCD3BE`         | border default, input border                |
| `--background`     | `0 0% 100%`          | `#FFFFFF`          | sfondo pagina                               |
| `--foreground`     | `345 75% 10%`        | ~`#2C0610`         | testo corpo                                 |
| `--muted-foreground` | `345 20% 40%`      | —                  | sottotitoli, descrizioni                    |
| `--border`         | `40 30% 85%`         | —                  | border card / input                         |
| `--radius`         | `0.5rem`             | —                  | border-radius base (md = -2px, sm = -4px)   |

Definita anche una modalità `.dark` completa (righe 69–116). **Decisione aperta**: il
sito Lovable non monta in pratica il dark mode (nessun toggle, `next-themes`
importato ma non usato come provider in `App.tsx`). Vedere §6.

### 1.2 Font

Caricati da Google Fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
```

- **Playfair Display** (serif) — applicato di default a `h1…h6` via `@layer base`.
  Pesi usati nei file: 400 (italic citazioni), 600 (semibold), **700 (bold, dominante)**, 800 (display hero).
  Classe Tailwind: `font-playfair`.
- **Lato** (sans-serif) — applicato di default a `body`.
  Pesi: 300 (cream subtitle), **400 (regular)**, 700 (link navbar, button).
  Classe Tailwind: `font-lato`.

Per Hugo: caricare Google Fonts con `<link rel="preconnect">` come nell'originale,
oppure self-hostare con `hugo-google-fonts` o copia statica in `static/fonts/`.
La preconnect dà già abbastanza performance — proporrei replicare l'approccio originale.

### 1.3 Animazioni custom (`tailwind.config.ts` righe 83–115)

Keyframes definiti:

| Keyframe         | Animazione utility (alias)        | Dove viene usato                                                                 |
|------------------|-----------------------------------|----------------------------------------------------------------------------------|
| `accordion-down` | `animate-accordion-down 0.2s`     | shadcn Accordion (non usato nelle pagine attuali, dipendenza Radix)              |
| `accordion-up`   | `animate-accordion-up 0.2s`       | idem                                                                             |
| `fade-in`        | `animate-fade-in 0.6s ease-out`   | `About.tsx`, `CantinaDetail.tsx`, `BlogDetail.tsx`, `Eventi.tsx`, `Contatti.tsx`, `Territorio.tsx` (h1 hero) |
| `fade-in-up`     | `animate-fade-in-up 0.8s ease-out`| sottotitolo p sotto h1 in tutte le pagine hero                                   |
| `scale-in`       | `animate-scale-in 0.4s ease-out`  | `Index.tsx` (immagine wine-cellar), `Territorio.tsx` (immagine intro)            |
| `parallax`       | keyframe definito ma **non legato a una utility** | parallax dell'hero è fatto JS-side via `transform: translateY(scrollY*0.5)` |

Inoltre `index.css` definisce 3 utility custom:

- `.text-gradient-gold` — gradient `from-gold-light to-gold` con `bg-clip-text` (titolo hero "in ogni calice")
- `.hover-lift` — `transition-all hover:-translate-y-2 hover:shadow-2xl` (tutte le Card)
- `.parallax-slow` — solo `will-change: transform` (hint GPU per hero)

Tailwind animate utility `animate-bounce` (built-in) → chevron in fondo all'hero.

In Hugo (Tailwind via Hugo Pipes) tutti i keyframes vanno replicati nel file CSS o nel
config Tailwind. L'animazione `parallax` non serve come keyframe se il parallax resta
JS-driven (preferibile, vedi §5).

---

## 2. Inventario contenuto strutturato

### 2.1 `src/data/blog.ts` — 6 record

**Schema TypeScript:**

```ts
interface BlogPost {
  id: number;
  titolo: string;
  categoria: 'Territorio' | 'Degustazione' | 'Cultura';
  data: string;           // ISO YYYY-MM-DD
  autore: string;
  immagine: string;       // import statico, risolto a path bundlato
  estratto: string;
  contenuto: string;      // singolo paragrafo o blocco
  tags: string[];
}
```

**Esempio reale (id 1):**

```ts
{
  id: 1,
  titolo: "I Terroir del Montepulciano d'Abruzzo: dalla Costa ai Monti",
  categoria: "Territorio",
  data: "2024-03-15",
  autore: "Maria Rossi",
  immagine: terroirMontepulciano,
  estratto: "Un viaggio attraverso i microclimi che rendono unico il Montepulciano d'Abruzzo, dalle colline teramane alle pendici della Majella.",
  contenuto: "Il Montepulciano d'Abruzzo rappresenta l'essenza del territorio abruzzese, un vitigno che sa interpretare in modo sublime le diverse caratteristiche pedoclimatiche della regione. Dalle colline teramane, dove il vino acquisisce eleganza e finezza grazie all'influenza del mare Adriatico, fino alle pendici della Majella, dove le escursioni termiche donano struttura e complessità aromatica.",
  tags: ["Montepulciano", "Terroir", "Territorio"]
}
```

**Mapping proposto → `content/blog/i-terroir-del-montepulciano.md`:**

```markdown
---
title: "I Terroir del Montepulciano d'Abruzzo: dalla Costa ai Monti"
date: 2024-03-15
author: "Maria Rossi"
categories: ["Territorio"]
tags: ["Montepulciano", "Terroir", "Territorio"]
summary: "Un viaggio attraverso i microclimi che rendono unico il Montepulciano d'Abruzzo, dalle colline teramane alle pendici della Majella."
image: "/images/blog/terroir-montepulciano.jpg"
---

Il Montepulciano d'Abruzzo rappresenta l'essenza del territorio abruzzese...
```

Note: `id` numerico va scartato (Hugo usa slug dal nome file); `estratto` →
`summary` (Hugo lo usa per liste/OpenGraph); il `contenuto` attuale è
volutamente breve e va probabilmente espanso, ma quello che c'è va comunque
nel body del markdown.

### 2.2 `src/data/cantine.ts` — 6 record

**Schema:**

```ts
interface Cantina {
  id: string;             // slug-friendly, es. "tenuta-valle-reale"
  nome: string;
  località: string;       // "Popoli (PE)"
  descrizione: string;    // tagline breve
  storia: string;         // paragrafo storia
  immagine: string;
  vini: string[];         // 2-3 nomi di vini principali
  filosofia: string;
  ettari: number;
  fondazione: number;     // anno
  produzione: string;     // es. "180.000 bottiglie/anno"
}
```

**Esempio reale (Tenuta Valle Reale):**

```ts
{
  id: "tenuta-valle-reale",
  nome: "Tenuta Valle Reale",
  località: "Popoli (PE)",
  descrizione: "Eccellenza del Montepulciano d'Abruzzo sulle colline del Parco Nazionale del Gran Sasso",
  storia: "Fondata nel 1997, Valle Reale rappresenta l'avanguardia della produzione biologica abruzzese...",
  immagine: valleReale,
  vini: ["Montepulciano d'Abruzzo Vigne Nuove", "Trebbiano d'Abruzzo Superiore", "San Calisto Riserva"],
  filosofia: "Viticoltura biologica certificata, rispetto assoluto del territorio...",
  ettari: 55,
  fondazione: 1997,
  produzione: "180.000 bottiglie/anno"
}
```

**Mapping proposto → `content/cantine/tenuta-valle-reale/index.md`** (page bundle, così
l'immagine può vivere accanto):

```markdown
---
title: "Tenuta Valle Reale"
date: 2026-05-28
draft: false
localita: "Popoli"
provincia: "PE"
descrizione: "Eccellenza del Montepulciano d'Abruzzo sulle colline del Parco Nazionale del Gran Sasso"
ettari: 55
fondazione: 1997
produzione: "180.000 bottiglie/anno"
vini_principali:
  - "Montepulciano d'Abruzzo Vigne Nuove"
  - "Trebbiano d'Abruzzo Superiore"
  - "San Calisto Riserva"
filosofia: "Viticoltura biologica certificata..."
image: "valle-reale.jpg"   # nel page bundle
---

## La Storia
Fondata nel 1997, Valle Reale rappresenta l'avanguardia...
```

Nota: separare `provincia` da `località` come campo dedicato abilita il
filtro per provincia richiesto da CLAUDE.md (tassonomia `province`).

### 2.3 `src/data/vini.ts` — 7 record

**Schema:**

```ts
interface Vino {
  id: string;
  nome: string;
  cantina: string;        // nome cantina (no FK, è solo testo)
  tipologia: "Rosso" | "Bianco" | "Rosato" | "Passito" | "Spumante";
  vitigno: string;        // "Montepulciano d'Abruzzo 100%"
  annata?: string;        // opzionale
  descrizione: string;
  noteDiDegustazione: {
    vista: string;
    olfatto: string;
    gusto: string;
  };
  abbinamenti: string[];
  temperatura: string;    // "18-20°C"
  immagine: string;
}
```

**Esempio reale (San Calisto Riserva):**

```ts
{
  id: "montepulciano-san-calisto",
  nome: "San Calisto Riserva",
  cantina: "Valle Reale",
  tipologia: "Rosso",
  vitigno: "Montepulciano d'Abruzzo 100%",
  annata: "2018",
  descrizione: "Il vertice assoluto della produzione Valle Reale...",
  noteDiDegustazione: {
    vista: "Rosso rubino intenso con riflessi granati",
    olfatto: "Complesso bouquet di frutti rossi maturi, spezie dolci, tabacco e cioccolato fondente",
    gusto: "Pieno, elegante, con tannini setosi e lunghissima persistenza"
  },
  abbinamenti: ["Carni rosse alla griglia", "Brasati", "Formaggi stagionati", "Tartufo nero"],
  temperatura: "18-20°C",
  immagine: vinoValleRealeSanCalisto
}
```

**Mapping proposto → `content/vini/san-calisto-riserva/index.md`:**

```markdown
---
title: "San Calisto Riserva"
date: 2026-05-28
cantina: "Valle Reale"
cantina_ref: "tenuta-valle-reale"   # per link cross-section
tipologia: "Rosso"
vitigno: "Montepulciano d'Abruzzo"
percentuale_vitigno: 100
annata: "2018"
temperatura: "18-20°C"
abbinamenti:
  - "Carni rosse alla griglia"
  - "Brasati"
  - "Formaggi stagionati"
  - "Tartufo nero"
note_degustazione:
  vista: "Rosso rubino intenso con riflessi granati"
  olfatto: "Complesso bouquet di frutti rossi maturi, spezie dolci, tabacco e cioccolato fondente"
  gusto: "Pieno, elegante, con tannini setosi e lunghissima persistenza"
image: "san-calisto.jpg"
tags: ["Montepulciano", "Riserva"]
---

Il vertice assoluto della produzione Valle Reale. Maturazione in barrique per 18 mesi...
```

Tassonomie da abilitare in `hugo.toml`: `cantine`, `vitigni`, `province`,
`tipologie` (più `tags` e `categories` standard).

### 2.4 Contenuto non in `src/data/` ma inline

- **Eventi** (6 record) sono hardcoded in `src/pages/Eventi.tsx` righe 16–71.
  Schema: `id, titolo, data (stringa formattata IT), luogo, orario, descrizione, tipo`.
  Da spostare in `content/eventi/` come markdown.
- **"I Sapori dell'Abruzzo"** (6 prodotti, `Territorio.tsx` righe 277–283) sono inline.
  Andrebbero in `content/sapori/` per coerenza con CLAUDE.md (sezione `sapori/` prevista).
- **Recensioni vini** (3, `ViniDetail.tsx` righe 27–46) sono **fittizie e hardcoded
  per tutti i vini**. Sono identiche su ogni dettaglio: vedi §6.

---

## 3. Mappa pagine React → Hugo

12 pagine in `src/pages/`. Routes da `App.tsx` righe 28–41.

| File React              | Route                  | Scopo                                    | Equivalente Hugo                                                       | Partials/sezioni che usa                                                            |
|-------------------------|------------------------|------------------------------------------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `Index.tsx`             | `/`                    | Homepage                                 | `layouts/index.html`                                                   | Navbar, HeroSection, hero+CTA, grid cantine (6), grid vini (6), territorio, newsletter, Footer |
| `Cantine.tsx`           | `/cantine`             | Lista cantine                            | `layouts/cantine/list.html`                                            | Navbar, hero, grid cantine (loop su tutte), Footer                                  |
| `CantinaDetail.tsx`     | `/cantine/:id`         | Dettaglio cantina                        | `layouts/cantine/single.html`                                          | Navbar, hero con immagine, 3 stat card (fondazione/ettari/produzione), storia, filosofia+vini, esperienze (statiche), CTA, Footer |
| `Vini.tsx`              | `/vini`                | Lista vini                               | `layouts/vini/list.html`                                               | Navbar, hero, grid vini (loop), Footer                                              |
| `ViniDetail.tsx`        | `/vini/:id`            | Dettaglio vino                           | `layouts/vini/single.html`                                             | Navbar, hero immagine+meta, 3 card note (vista/olfatto/gusto), abbinamenti, recensioni (statiche), CTA, Footer |
| `Territorio.tsx`        | `/territorio`          | Pagina territorio                        | `layouts/page/territorio.html` o `content/territorio/_index.md` + layout custom | Navbar, hero, intro, 4 card "chiavi del successo", 3 zone vinicole, Costa Trabocchi, Gran Sasso, sapori (6), Footer |
| `Eventi.tsx`            | `/eventi`              | Lista eventi                             | `layouts/eventi/list.html`                                             | Navbar, hero, lista eventi (loop), newsletter, Footer                               |
| `Blog.tsx`              | `/blog`                | Lista articoli con filtro categoria      | `layouts/blog/list.html` + JS vanilla per filtro                       | Navbar, hero, filtro bottoni (Tutti / Territorio / Degustazione / Cultura), grid articoli, newsletter, Footer |
| `BlogDetail.tsx`        | `/blog/:id`            | Dettaglio articolo                       | `layouts/blog/single.html`                                             | Navbar, breadcrumb back, header (badge cat + titolo + meta), immagine 21:9, body markdown, box autore, "Articoli correlati" (stessa cat, max 3), Footer |
| `About.tsx`             | `/about`               | Chi siamo                                | `content/about.md` + `layouts/_default/single.html` o layout dedicato  | Navbar, hero, mission + 4 card valori, 3 card visione, blockquote, Footer           |
| `Contatti.tsx`          | `/contatti`            | Form contatti                            | `content/contatti.md` + layout custom                                  | Navbar, hero, 3 info card (email/tel/sede) + form, sezione orari, Footer            |
| `NotFound.tsx`          | `*`                    | 404                                      | `layouts/404.html`                                                     | Pagina minimale (attualmente molto spoglia, vedi §6)                                |

### 3.1 Copy italiano significativo (estratti)

Da preservare letteralmente:

- **Hero homepage**: "L'eleganza del vino abruzzese / in ogni calice" + sottotitolo: "Scopri le eccellenze enogastronomiche del territorio più autentico d'Italia. Un viaggio tra cantine prestigiose, vini iconici e sapori indimenticabili."
- **Footer**: citazione `"Il vino è la poesia della terra"` + disclaimer `"Bevi responsabilmente. La vendita di alcolici ai minori di 18 anni è vietata."`
- **About blockquote**: `"Il vino è la poesia della terra, e l'Abruzzo è un poeta che ancora ha molto da raccontare"` — La filosofia di Abruzzo diVino
- **Sezione Territorio** (homepage): 2 paragrafi sull'Abruzzo come "terra di contrasti" tra Gran Sasso e Adriatico.
- **Pagina Territorio**: tre testi lunghi e curati (Costa dei Trabocchi, Gran Sasso, intro). Vanno preservati integralmente, includono riferimenti culturali (D'Annunzio).
- **About**: blocchi Passione/Eccellenza/Autenticità/Comunità + 3 paragrafi visione (Luxury Winery Experience, Divulgazione, Sostenibilità).
- **Contatti**: indirizzo `Via Don Giovanni Minzoni, 43 – 66100 CHIETI`, tel `+39 0871 62929`, email `info@abruzzodiVino.it`. Da verificare che siano dati reali e non placeholder (§6).

---

## 4. Inventario asset

### 4.1 `src/assets/` — 24 immagini, tutte JPG

| File                                  | Dimensione | Usato in                                  | Note                          |
|---------------------------------------|-----------:|-------------------------------------------|-------------------------------|
| `hero-vineyard.jpg`                   |   229 096  | `HeroSection.tsx`                         | sopra la fold, critico        |
| `wine-cellar.jpg`                     |   129 308  | `Index.tsx` (sezione territorio)          |                               |
| `wine-bottle.jpg`                     |    66 597  | `Territorio.tsx`                          |                               |
| `costa-trabocchi.jpg`                 | **290 370** | `Territorio.tsx`                         | da ottimizzare (>250KB)       |
| `gran-sasso.jpg`                      | **293 581** | `Territorio.tsx`                         | da ottimizzare                |
| `cantina-valle-reale.jpg`             |   198 539  | dati cantine                              |                               |
| `cantina-masciarelli.jpg`             |   245 846  | dati cantine                              |                               |
| `cantina-emidio-pepe.jpg`             |   211 935  | dati cantine                              |                               |
| `cantina-valentini.jpg`               | **288 843** | dati cantine                             | da ottimizzare                |
| `cantina-tiberio.jpg`                 |   223 255  | dati cantine                              |                               |
| `cantina-torre-dei-beati.jpg`         | **258 212** | dati cantine                             | da ottimizzare                |
| `vino-valle-reale-san-calisto.jpg`    |    42 672  | dati vini (etichetta bottiglia)           |                               |
| `vino-valentini-trebbiano.jpg`        |    40 427  | dati vini                                 |                               |
| `vino-valentini-cerasuolo.jpg`        |    43 068  | dati vini                                 |                               |
| `vino-tiberio-pecorino.jpg`           |    48 943  | dati vini                                 |                               |
| `vino-torre-beati-cocciapazza.jpg`    | **276 226** | dati vini                                | da ottimizzare                |
| `vino-masciarelli-villa-gemma.jpg`    |    41 084  | dati vini                                 |                               |
| `vino-emidio-pepe-montepulciano.jpg`  |    11 146  | dati vini                                 | molto piccola                 |
| `blog-terroir-montepulciano.jpg`      |   206 860  | blog post id 1                            |                               |
| `blog-degustazione-montepulciano.jpg` |   116 441  | blog post id 2                            |                               |
| `blog-trebbiano-bianco.jpg`           |   103 681  | blog post id 3                            |                               |
| `blog-vinificazione-tradizionale.jpg` |   193 281  | blog post id 4                            |                               |
| `blog-pecorino-passerina.jpg`         |    69 176  | blog post id 5                            |                               |
| `blog-abbinamenti-cucina.jpg`         |   127 631  | blog post id 6                            |                               |

**Totale: ~3.85 MB**. Nessun PNG, nessun SVG, nessun WebP/AVIF.

### 4.2 `public/` — 3 file

| File              | Dimensione | Note                                              |
|-------------------|-----------:|---------------------------------------------------|
| `favicon.ico`     |      7 645 | da copiare in `static/`                           |
| `placeholder.svg` |      3 253 | shadcn default, probabilmente non serve           |
| `robots.txt`      |        174 | da rifare per il dominio nuovo                    |

### 4.3 Ottimizzazioni e collocazione

- **Tutte le immagini >200KB** vanno passate da Hugo Image Processing (`assets/images/`, non `static/`) per generare automaticamente WebP/AVIF e srcset responsive. In particolare le 6 immagini >250KB: `costa-trabocchi`, `gran-sasso`, `cantina-valentini`, `cantina-torre-dei-beati`, `vino-torre-beati-cocciapazza`, e potenzialmente `cantina-masciarelli` (a 245KB siamo borderline).
- **Bottiglie (file `vino-*.jpg`)**: 5 su 7 stanno già sotto i 50KB → ok in `static/images/vini/` senza pipeline.
- **Hero (`hero-vineyard.jpg`)**: 229KB. Va in `assets/images/` per generare versioni mobile/desktop e magari un placeholder LQIP.
- **Asset che vivono nei page bundle**: per cantine/vini/blog conviene mettere ogni immagine nella cartella del singolo content (page bundle `content/cantine/<slug>/cover.jpg`), così Hugo può processarla con `.Resources.GetMatch`.

**Proposta concreta di collocazione:**

```
assets/
  images/
    hero/hero-vineyard.jpg          ← Hugo Pipes (responsive + WebP)
    territorio/costa-trabocchi.jpg
    territorio/gran-sasso.jpg
    territorio/wine-bottle.jpg
content/
  cantine/<slug>/cover.jpg          ← page bundle
  vini/<slug>/cover.jpg
  blog/<slug>/cover.jpg
static/
  favicon.ico
  robots.txt
  (eventuali asset non processati)
```

---

## 5. Animazioni e interattività

### 5.1 `useScrollAnimation` — usato 9 volte

Hook custom (`src/hooks/use-scroll-animation.tsx`) basato su `IntersectionObserver`.
Quando l'elemento entra nel viewport con `threshold=0.2`, lo stato passa a
`isVisible: true` e l'elemento riceve `opacity-100 translate-y-0`; prima è
`opacity-0 translate-y-10`. Effetto: fade-in dal basso al primo scroll.

Usi:
- `Index.tsx`: 4 (cantineRef, viniRef, territorioRef, newsletterRef)
- `HeroSection.tsx`: 1 (titleRef)
- `Cantine.tsx`: 1 (titleRef)
- `Blog.tsx`: 1 (titleRef)
- (`ViniDetail`, `CantinaDetail`, `BlogDetail`, `Eventi`, `Contatti`, `About`, `Territorio` usano `animate-fade-in` Tailwind diretta — niente JS)

**Equivalente Hugo (vanilla JS)** in `assets/js/scroll-fade.js` (~30 righe):

```js
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('[data-scroll-fade]').forEach(el => obs.observe(el));
```

+ CSS:
```css
[data-scroll-fade] { opacity: 0; transform: translateY(2.5rem); transition: opacity 1s, transform 1s; }
[data-scroll-fade].is-visible { opacity: 1; transform: translateY(0); }
```

Markup: `<h2 data-scroll-fade>...`. Niente framework richiesto.

### 5.2 Parallax hero

`HeroSection.tsx` legge `window.scrollY` e applica `transform: translateY(scrollY*0.5)`
sull'immagine di sfondo (effetto parallax fino al 50% della scroll). Costa un listener
`scroll` su `window`.

**Equivalente Hugo (vanilla JS)** in `assets/js/parallax-hero.js` (~15 righe), usando
`requestAnimationFrame` per smoothing. Va su tutte le pagine con hero — opzionale: il
keyframe `parallax` definito in tailwind.config non è in realtà usato.

### 5.3 Navbar scroll-aware

`Navbar.tsx` legge `scrollY > 50` e cambia stile: trasparente → `bg-background/95
backdrop-blur-sm shadow-lg`, e contemporaneamente passa il colore logo da oro a wine.

**Equivalente Hugo (vanilla JS)** in `assets/js/navbar.js`: aggiunge/rimuove class
`.scrolled` sul `<nav>`, lo stile fa il resto via CSS. ~10 righe.

### 5.4 Mobile menu toggle

Navbar mobile menu è React state. **Equivalente Hugo**: click handler che toggle
`aria-expanded` su button e classe `.is-open` sul menu. ~5 righe.

### 5.5 Blog filter

`Blog.tsx` usa `useState` per filtrare blogPosts per categoria.

**Opzione A (preferita per SEO):** generare 4 pagine statiche separate (`/blog/`,
`/blog/categorie/territorio/`, `/blog/categorie/degustazione/`, `/blog/categorie/cultura/`)
tramite tassonomia Hugo `categories`. Niente JS.

**Opzione B:** mantenere SPA-like via JS — mostrare/nascondere card in base a un
data-attribute. Più rapido ma non SEO-friendly.

→ **Raccomando A**: i bottoni "Tutti / Territorio / Degustazione / Cultura" diventano
4 link a pagine differenti.

### 5.6 Carousel / Accordion / Dialog

**Nessun uso effettivo nelle pagine**. shadcn fornisce questi componenti (Radix sotto)
ma le 12 pagine non li usano. Niente da migrare.

### 5.7 Form contatti

Attualmente è puramente client-side (toast "messaggio inviato" senza chiamata reale).
Per Hugo + GitHub Pages serve un endpoint esterno (Formspree, Netlify Forms, Formspark,
o un Worker Cloudflare). Vedi §6.

### 5.8 Toast (Sonner)

Usato solo in `Contatti.tsx`. Sostituibile con un piccolo banner di conferma post-submit
inline, oppure rimosso se passiamo a Formspree (che ha la sua pagina di conferma).

---

## 6. Domande aperte

Punti da chiarire **prima** di iniziare a generare layouts/content:

1. **Dark mode**: il CSS è già pronto ma non c'è toggle. Lo vogliamo o lo rimuoviamo
   per ridurre superficie? (Hint: l'estetica "luxury winery" lavora meglio sul light;
   propongo di rimuovere `.dark` per ora.)

2. **Form contatti**: che endpoint? Formspree (free fino a 50/mese), Netlify Forms (no
   se siamo su GitHub Pages), un Cloudflare Worker custom, o un semplice `mailto:`? Più
   in generale: vogliamo davvero una pagina contatti o basta email + social del footer?

3. **Newsletter**: l'input email appare 3 volte (homepage, blog, eventi). Stesso endpoint
   per tutti? Mailchimp / Buttondown / Substack / Resend? È in scope per il MVP?

4. **Dati di contatto**: indirizzo `Via Don Giovanni Minzoni, 43 – 66100 CHIETI` e telefono
   `+39 0871 62929` sono reali (es. studio dell'autore) o placeholder generati da Lovable?
   Da confermare prima del go-live.

5. **GA4 in `index.html`**: il `G-QKBXN56SPE` viene caricato in `<head>`. Riproduciamo
   sullo stesso ID o ne creiamo uno nuovo dedicato? Vincolo GDPR: serve banner cookie?

6. **Routing GitHub Pages**: il sito vivrà su `abruzzodiVino.it` (root, custom domain) o
   `username.github.io/repo`? Cambia `baseURL` in `hugo.toml` e `basename` BrowserRouter
   (in React era `import.meta.env.BASE_URL`).

7. **Tassonomie**: CLAUDE.md elenca `cantine, vitigni, province, stagioni`. Aggiungo
   anche `tipologie` (rosso/bianco/rosato/passito/spumante) e `categorie_blog`? La
   tassonomia `stagioni` non ha esempi nel sorgente Lovable — la prevediamo solo per
   futuri post AI-generated? (Probabilmente sì.)

8. **Recensioni vini**: in `ViniDetail.tsx` ci sono 3 recensioni hardcoded **identiche
   per ogni vino** (James Suckling 95, Wine Spectator 93, Gambero Rosso 3 Bicchieri).
   È contenuto fittizio Lovable. Opzioni: (a) rimuovere la sezione, (b) renderla
   opzionale per vino via front matter, (c) lasciarla statica/generica come "esempio
   di valutazioni che potresti trovare". → Propongo (b).

9. **Esperienze in cantina** (`CantinaDetail.tsx` righe 117–162): 3 card hardcoded
   identiche per ogni cantina (Visita €35, Esperienza in Vigna €50, Vertical Tasting €75).
   Anche queste fittizie. Stesso trattamento delle recensioni: opzionale via front
   matter, oppure rimossa.

10. **404 page**: in `NotFound.tsx` lo stile è completamente fuori brand (bg-gray-100,
    text-blue-500 underline, scritta in inglese "Page not found"). Da rifare in stile
    sito con copy IT.

11. **Sezione "sapori"**: CLAUDE.md prevede `content/sapori/` ma il sito Lovable non ha
    una pagina dedicata: i 6 prodotti sono solo card statiche dentro Territorio. La
    creiamo come tipologia di content separata per blog post a tema ("Come si fanno gli
    arrosticini")? Sì, ma è scope agente AI, non migrazione.

12. **Page bundle vs leaf bundle**: per cantine/vini/blog mi orienterei su **leaf
    bundle** (`content/cantine/<slug>/index.md` + immagine accanto). OK?

13. **Search**: il sito React non ha ricerca. La aggiungiamo (Pagefind / Lunr /
    fuse.js)? Probabilmente non MVP.

14. **Sitemap & RSS**: Hugo li genera di default. Conferma che li vogliamo entrambi
    (RSS per /blog/ utile per gli aggregatori e per il futuro agente AI).

15. **Open Graph image**: attualmente punta a `https://lovable.dev/opengraph-image-p98pqg.png`
    (placeholder Lovable). Va sostituita con un'immagine brand custom.

16. **`useScrollAnimation` su titoli ripetitivi**: in molte pagine il `titleRef` usa
    `threshold: 0.2` ma il titolo è SEMPRE già nel viewport al caricamento (è in hero).
    Effetto: lampeggio. Nel migrare propongo di NON applicare il fade-in JS ai titoli
    hero — l'animazione CSS `animate-fade-in` già esistente è sufficiente.

---

Fine documento. In attesa di feedback su §6 prima di iniziare a scrivere
`hugo.toml`, layouts e content.
