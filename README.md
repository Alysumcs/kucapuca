# Villa Kuca Puca — web

Statický web vily na ostrove Vir. Bez buildu, bez frameworku — čistý HTML/CSS/JS,
pripravený na nasadenie na Vercel (alebo hocijaký statický hosting).

Dizajn: krémová + námornícka modrá + zlatá, Figtree + Playfair Display italic akcenty,
plávajúce menu v bielej kapsule, hero fotka cez celú obrazovku, rolovacie odhaľovanie textu,
marquee pás a interaktívna mapa okolia.

---

## Stránky

| Súbor | Čo to je |
|---|---|
| `index.html` | Domov — hero, rolovacie tvrdenia, štatistiky na fotke, apartmány, vybavenie, ohlasy |
| `apartmany.html` | Kuca (APP1) a Puca (APP2) — parametre, galérie, **cenník**, priebeh rezervácie, **FAQ** |
| `okolie.html` | Ostrov Vir — **interaktívna mapa** s plážami a výletmi, cyklotrasy, tržnica v Zadare |
| `kontakt.html` | Kontakty, formulár dopytu, mapka polohy vily |
| `obsadenost.html` | Verejný kalendár obsadenosti oboch apartmánov |
| `admin.html` | Interná správa rezervácií (PIN) |
| `404.html` | Chybová stránka |

## Nasadenie

### GitHub
```bash
cd "Kuca Puca/web"
git add -A && git commit -m "Redizajn webu"
git remote add origin git@github.com:<tvoj-ucet>/kucapuca.git
git push -u origin main
```

### Vercel
1. **Add New → Project** a vyber repozitár.
2. Framework Preset: **Other**, Build Command: *(nechaj prázdne)*, Output Directory: `.`
3. Deploy. `vercel.json` už rieši `cleanUrls` (adresy bez `.html`), cache hlavičky a bezpečnostné hlavičky.
4. Doménu pridáš v **Settings → Domains**.

Po nasadení uprav `https://kucapuca.sk` v `sitemap.xml`, `robots.txt` a v `og:` metatagoch
na skutočnú doménu, ak bude iná.

---

## Rezervácie — ako to funguje

Zdrojom pravdy pre nasadený web je **`data/bookings.json`** v repozitári.
Pri prvom otvorení si ho prehliadač načíta a uloží do `localStorage` (`kp_bookings_v1`).
Admin aj verejný kalendár čítajú to isté.

**Pracovný postup:**
1. Otvor `admin.html`, zadaj PIN (**`0000`** — zmeníš v `assets/booking.js`, konštanta `PIN`).
2. Pridaj / uprav / zmaž rezervácie. Systém upozorní na prekrývajúce sa termíny.
3. Klikni **Stiahnuť data/bookings.json**, nahraď ním súbor v repozitári a pushni.
   Vercel nasadí novú verziu a všetci uvidia aktuálny kalendár.

Tlačidlo **Načítať zo súboru** zahodí lokálne zmeny a načíta znova `data/bookings.json`.
**Export / Import JSON** sú na zálohu a prenos medzi počítačmi.

**Platby**
Pri každej rezervácii vedieš dohodnutú cenu a zaplatenú čiastku. Tlačidlo **Platba**
otvorí rýchle voľby: záloha 30 %, doplatené v plnej výške, vynulovať alebo vlastná suma.
Stav sa premietne do odznaku (nezaplatené / záloha / zaplatené), do pruhu pri rezervácii
aj do prehľadu sezóny (dohodnuté / zaplatené / zostáva).
Pri zadávaní termínu ti formulár sám navrhne cenu za noci aj výšku zálohy.

**Potvrdenie pre hosťa**
Tlačidlo **Potvrdenie** zloží text e-mailu aj SMS z údajov rezervácie — apartmán, termín,
počet nocí a osôb, cena, zaplatené, zostatok, adresa a kontakt. Text sa dá pred odoslaním
upraviť. Tlačidlá otvoria správu v tvojom e-mailovom klientovi (`mailto:`) alebo
v aplikácii správ (`sms:`) s predvyplneným obsahom, prípadne text len skopíruješ.
Odoslané potvrdenie si označíš a pri rezervácii zostane odznak s dátumom.

Automatické odosielanie priamo z webu potrebuje backend — Resend alebo SendGrid na e-mail,
Twilio na SMS. To je krok až po presune na hosting s databázou; šablóny v
`assets/booking.js` (funkcia `sprava`) sa dajú použiť aj tam bez zmeny.

**Formát záznamu**
```json
{ "id":"s1", "apt":"app1", "from":"2026-06-13", "to":"2026-06-20",
  "name":"Rodina Horváthová", "status":"busy",
  "guests":6, "price":1050, "paid":1050,
  "email":"horvath@example.com", "phone":"+421903111222",
  "note":"", "confirmedAt":"2026-02-11" }
```
`apt`: `app1` (Kuca) / `app2` (Puca) · `status`: `busy` (obsadené) / `opt` (predbežná opcia)
`price` a `paid` sú v eurách · `confirmedAt` = dátum odoslania potvrdenia (prázdne = neodoslané)
Deň príchodu a odchodu sa kreslí ako šikmá polovica bunky, takže v ten istý deň môže
jeden hosť odísť a druhý prísť.

### Keď to má byť naozaj zdieľané
Prepíš `load()` a `save()` v `assets/booking.js` na volanie API — Vercel KV / Postgres,
Supabase alebo REST endpoint existujúceho WordPress pluginu (`kucapuca_public` / `kucapuca_admin`).
Zvyšok kódu ostáva bez zmeny.

---

## Mapa

`assets/map.js` — Leaflet (lokálne vo `vendor/`, verzia 1.9.4) + dlaždice priamo
z OpenStreetMap. **Žiadne CDN, žiadny API kľúč, žiadna registrácia.**
Tlmený krémový vzhľad robí CSS filter na `.leaflet-tile-pane`.
Body záujmu vrátane súradníc sú v poli `POI` na začiatku súboru — pridáš alebo upravíš
miesto jedným riadkom. Vzdialenosti od vily sa počítajú automaticky.
Na kontakte beží ten istý skript v režime `data-mode="vila"` (len mapka polohy).

## Fotky

`img/` — fotky z pôvodného webu prejdené cez Gemini: retuš svetla, farieb, ostrosti
a rovných línií. Kompozícia ani obsah sa nemenili. Originálne výrezy zostali lokálne
v `img/_src/` (do repozitára sa necommitujú, viď `.gitignore`).
`img/og.jpg` je náhľad pre sociálne siete (1200 × 630).

## Logo

`assets/logo.svg`, `logo-light.svg`, `mark.svg`, `mark-light.svg`.
Znak = kruh s tromi oblúkmi (arkáda vily) nad vlnou. V stránkach je logo vložené
priamo v HTML, aby chytilo webfont.

## Na doladenie

- **Cenník** v `apartmany.html` (sekcia `#cennik`) — over sumy a body v zoznamoch.
- **FAQ** v `apartmany.html` — over odpovede, najmä check-in časy a vybavenie.
- **Ohlasy** na domovskej — over, či ide o reálne hodnotenia.
- Galérie zniesli by viac fotiek, hlavne interiérov apartmánu Puca.
