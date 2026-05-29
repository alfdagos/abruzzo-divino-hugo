# Contesto: abruzzodivino.it (nuovo Hugo)

Migrazione da Lovable React/Vite a Hugo statico.

## Path
- Sorgente sola lettura: ../lovable-source/
- Nuovo sito Hugo: . (questa cartella)

## Stack target
- Hugo (static site generator)
- Tailwind via Hugo Pipes
- Deploy su GitHub Pages tramite GitHub Actions

## Brand
- Nome: Abruzzo diVino
- Payoff: "L'eleganza del vino abruzzese in ogni calice"
- Dominio: abruzzodivino.it
- Tema editoriale: enogastronomia abruzzese (vini, cantine, sapori, territorio, eventi)
- Lingua contenuti: italiano

## Design
- Palette: copiare 1:1 da ../lovable-source/src/index.css (variabili HSL wine/gold/cream)
- Font: Playfair Display (titoli) + Lato (corpo) — Google Fonts
- Niente JS pesante: solo CSS + IntersectionObserver per animazioni scroll

## Convenzioni progetto
- Markdown post in content/{vini,sapori,territorio,eventi,blog}/
- Front matter con: title, date, categories, tags, vitigno, provincia (dove applicabile)
- Immagini in static/images/{sezione}/
- Tassonomie attive: cantine, vitigni, province, stagioni

## Obiettivo finale
Blog auto-generato da un agente AI (Python su GitHub Actions) che pubblica
contenuti enogastronomici settimanalmente. Monetizzazione via affiliate
(Tannico, Callmewine), AdSense, sponsor cantine.