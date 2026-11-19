# UNIS Steel Baltija (unis-steel.lt): demo dizainas

Naujos **unis-steel.lt** svetainės demonstracinis maketas klientui parodyti prieš pilną projektą „WordPress“ XStore temoje. Trys puslapiai: pradžia, svorio skaičiuoklė ir užklausos forma. Turinys paimtas iš dabartinės svetainės. Pavyzdys pagal kliento norą: lineja.com (švaru, solidi firminė spalva, didelis vaizdas viršuje), bet dizainas savas ir susietas su plieno prekyba.

## Peržiūra

- **Gyva versija:** <https://arvydastry.github.io/unis/> („GitHub Pages“ iš saugyklos <https://github.com/arvydastry/unis> `main` šakos šaknies; failas `.nojekyll` išjungia „Jekyll“). Tiesioginės nuorodos: [skaičiuoklė](https://arvydastry.github.io/unis/skaiciuokle.html), [užklausos forma](https://arvydastry.github.io/unis/uzklausa.html).
- Atnaujinimas: `python3 build.py`, tada `git add -A`, `git commit` ir `git push`. „Pages“ persigeneruoja maždaug per minutę.
- Vietoje: `python3 serve.py` ir atverti <http://localhost:8163/> (`.claude/launch.json` konfigūracija „unis“).
- Puslapiai: `index.html` (pradžia), `skaiciuokle.html` (skaičiuoklė), `uzklausa.html` (užklausa).
- `?static=1` prie adreso išjungia judesį (patogu ekrano nuotraukoms).
- Puslapiai turi `noindex, nofollow`. Užklausos forma demonstracinė: tikrina laukus ir parodo patvirtinimą, bet duomenų niekur nesiunčia.
- Pakeitus `src/` failus: `python3 build.py` (surenka puslapius ir `assets/js/data.js`).

## Kas padaryta

**1. Pradžios puslapis.** Tikra UNIS sandėlio nuotrauka per visą ekraną, po ja keturios produktų grupės. Asortimentas su skirtukais: prie kiekvieno gaminio matosi standartas, plieno markės ir **matmenų intervalas iš tikrų lentelių** (pvz., „⌀ 21,3–1219 mm, sienelė 2–30 mm“, „IPE 80–IPE 600, 13 iš 18 laikoma sandėlyje“), du mygtukai „Matmenys ir svoris“ ir „Pateikti užklausą“. Toliau veikianti mini skaičiuoklė, išskirtinumas, logistika, projektų sprendimai, įmonės istorija laiko juostoje, kokybė (ISO 14001 sertifikatas, įvertinimai) ir kontaktai pagal padalinius.

**2. Svorio skaičiuoklė.** 11 profilių (apvalus, kvadratinis ir stačiakampis vamzdis, lakštas, juosta, apvalus ir kvadratinis strypas, armatūra, sija, lovis, kampuotis) ir visos 28 UNIS gaminių linijos.
- Matmenys parenkami vienu paspaudimu iš **UNIS asortimento** (3 333 matmenų deriniai, perrašyti iš dabartinės svetainės lentelių). Storiai, kurių pasirinktam skersmeniui nėra, išjungiami.
- Galima įvesti ir savo matmenis: tada svoris skaičiuojamas pagal formulę. Jei toks matmuo yra kitame UNIS gaminyje (pvz., 48,3 × 3,2 nėra konstrukcinių vamzdžių lentelėje, bet yra vandens dujų), skaičiuoklė tai pasako ir leidžia perjungti vienu paspaudimu.
- **Gyvas pjūvio brėžinys** su matmenų linijomis persibraižo pagal įvestus matmenis.
- Sijoms ir loviams rodoma **„Laikoma sandėlyje“ arba „Tiekiama pagal užsakymą“** (šis požymis dabartinėje svetainėje užkoduotas lentelės eilučių spalva).
- **Kiekis vienetais, metrais arba tonomis**: įvedus 120 m arba 2 t, skaičiuoklė pati suskaičiuoja, kiek tai vienetų po 6 ar 12 m.
- Rezultatai: metro svoris, vieneto svoris, bendras ilgis ir svoris, metrai tonoje, išorinio paviršiaus plotas (dažymui ar cinkavimui), tonos kainos perskaičiavimas į metro kainą ir atvirkščiai (tai, ką dabar daro „Paskaičiuokite vieno metro kainą“).
- Mygtukas **„Pridėti į užklausą“**: pozicijos kaupiasi sąraše ir keliauja į užklausos formą. Sąrašą galima nukopijuoti į „Excel“ arba atspausdinti. Telefone rezultatas ir mygtukas visada matomi apačioje.
- Pirmą kartą atvėrus rodomas pavyzdys (aiškiai pažymėtas), kad iškart matytųsi, kaip viskas atrodo.

**3. Užklausos forma.** Viena forma trims situacijoms, užtenka užpildyti bent vieną dalį:
- **Pozicijos**: tas pats konfigūratorius kaip skaičiuoklėje (gaminys, matmenys, markė, ilgis, kiekis vienetais, metrais ar tonomis, pastaba pozicijai), svoris suskaičiuojamas automatiškai. Čia atsiranda ir skaičiuoklėje pridėtos pozicijos. Nestandartiniai matmenys ir profiliai „pagal užsakymą“ sąraše pažymimi, kad vadybininkas iškart matytų.
- **Sąrašas arba brėžiniai**: failų įkėlimas (PDF, Excel, Word, DWG, DXF, nuotrauka).
- **Aprašykite poreikį**: temos (kaina ir terminas, konsultacija, projekto komplektavimas, tiekimas tiesiai iš gamintojo, nuolatinis tiekimas) ir laisvas tekstas.
- Pristatymo būdas (dar nenuspręsta, pristatyti adresu, atsiimti Šiauliuose ar Vilniuje), terminas, kontaktai. Šone visada matoma santrauka.
- Išsiuntus rodoma **užklausos kopija**: taip, kaip ją gautų vadybininkas, su galimybe atspausdinti arba išsaugoti PDF.

## Dabartinės svetainės problemos (patikrinta 2026-11-19)

1. **Visos 28 matmenų lentelės yra paveikslėliai.** Jų neranda paieška, neperskaito ekrano skaitytuvai, telefone jos neįskaitomos, o keisti galima tik perpiešiant.
2. **Lentelėse yra klaidų** (žr. „Lentelių neatitikimai“): sukeisti skaitmenys, pasislinkusi eilutė, neteisingos eilučių žymės.
3. Pradžios puslapyje „JAU 10 metų“ ir poraštėje „(c) 2015“, nors įmonė dirba nuo 2005 m.
4. Užklausos forma turi tik vardą, el. paštą ir pastabas, o **be sutikimo su našumo slapukais iš viso neveikia** („Google reCAPTCHA“).
5. „Google Analytics“ kodas senas (`UA-71617976-1`). „Universal Analytics“ duomenų nebeapdoroja nuo 2023 m. liepos, tad statistika greičiausiai nerenkama.
6. Puslapio „Magistraliniai“ antraštė naršyklėje: „4 tipas - UNIS STEEL“. ISO puslapio antraštė tuščia („ - UNIS STEEL“).
7. Nė vienas puslapis neturi `meta description`, nenurodyta puslapio kalba.
8. Neveikia nuoroda `/padalinys-klaipedoje` (404, nors yra svetainės žemėlapyje), nerodomas ISO 9001 sertifikato paveikslėlis (404).
9. `robots.txt` sugadintas (viskas vienoje eilutėje), svetainės žemėlapyje `http://` adresai.
10. Sena techninė bazė: XHTML 1.0, „jQuery“ 1.11 (2014 m.), iš karto dvi „Swiper“ versijos, langas „Your browser is not supported“ senoms „Internet Explorer“ versijoms, kompiuteryje priverstinai nustatomas 1360 px plotis.
11. Kontaktuose tebėra fakso numeriai.

## Turinys

**Perkelta iš unis-steel.lt:** visas produktų medis (4 grupės, 26 gaminiai, 28 matmenų lentelės) su standartais, plieno markėmis ir aprašymais; „Mūsų išskirtinumas“, „Logistika“, „Efektyvūs projektų sprendimai“; „Apie mus“ istorija; kokybės ir aplinkos apsaugos politika (ISO 9001, ISO 14001); ISO 14001:2015 sertifikatas (TNV, galioja iki 2028-09-22); įvertinimai („Stipriausi Lietuvoje“ 2011, 2012, 2015, „Gazelė“ 2014); visi kontaktai (bendras numeris, trys padaliniai, vadovai); logotipas; tikros sandėlio ir transporto nuotraukos iš galerijos. Visi telefonai, el. pašto adresai, metai, standartai ir markės sutikrinti su dabartine svetaine.

**Pataisyta:**
- „Daugiau nei 10 metų patirtis“ pakeista į „Daugiau nei 20 metų“ (nuo 2005 m.). *Patvirtinti su klientu.*
- Apvaliems strypams svetainėje nurodytas EN 10058 (tai juostų standartas, tekstas nukopijuotas). Makete: nekalibruoti EN 10060, kalibruoti EN 10278. *Patvirtinti su klientu.*
- IPE aprašyme vietoje „dvitėjiniai H profiliai“ parašyta „dvitėjiniai profiliai lygiagrečiomis lentynomis“.
- Koncerno pavadinimas užrašytas „Klöckner Stahl- und Metallhandel GmbH“ (svetainėje „Klockner Stahl – und“).
- Atsisakyta fakso numerių. Vilniaus telefonas užrašytas +370 5 267 5960.
- Kai kurie sakiniai sutrumpinti ir parašyti paprasčiau („Apie mus“ įžanga, logistika, projektų sprendimai), rašyba, skyryba, lietuviškos kabutės.

**Papildyta (reikia kliento patvirtinimo):**
- hero tekstas ir trumpi paaiškinimai prie keturių išskirtinumo punktų;
- istorija sudėta į laiko juostą (tekstas sutrumpintas iš „Apie mus“);
- užklausos formos temos ir pristatymo pasirinkimai (iš to, ką įmonė pati siūlo svetainėje: konsultacijos, komplektavimas, tiekimas iš gamintojų, daliniai ir pilni kroviniai, sandėliai Šiauliuose ir Vilniuje);
- skaičiuoklės paaiškinimai.

**Ko neįtraukta:** produktų vidiniai puslapiai (bus pilname projekte, lentelės jau paruoštos kaip duomenys), galerija, duomenų apsaugos puslapis (nuoroda veda į dabartinį), anglų kalba (mygtukas EN yra, bet neveikia), darbo laikas ir rekvizitai (svetainėje nenurodyti), darbuotojų skaičius („apie trisdešimt“ dabartinėje svetainėje yra iš seno teksto).

**Klausimai klientui:**
- Ar buvęs pavadinimas rašomas UAB „Klockner Baltija“, ar „Klöckner Baltija“?
- Tikslus darbuotojų skaičius ir ar Klaipėdoje yra atsakingas vadybininkas (svetainėje asmuo nenurodytas).
- Darbo laikas, įmonės rekvizitai, el. pašto adresai užklausoms pagal padalinius.
- Ar teikiamos papildomos paslaugos (pjovimas, sertifikatai EN 10204 3.1 ir pan.), kurias verta pridėti prie užklausos formos kaip varneles?
- Ar sandėlio požymį („laikoma sandėlyje“ arba „pagal užsakymą“) norima rodyti ir vamzdžiams, lakštams bei strypams?
- Armatūros lentelėje ⌀4 ir ⌀5 svoriai (0,092 ir 0,144 kg/m) atitinka vielos, ne B500B strypų nominalias mases (0,099 ir 0,154). Ar tai viela? Makete palikta kaip lentelėje.
- Karšto valcavimo lakštų markė S355MC priklauso EN 10149-2, ne EN 10025. Ar papildyti standartą?
- ISO 9001 sertifikato kopija (dabartinėje svetainėje paveikslėlis nerodomas) ir naujesni įvertinimai nei 2015 m.
- Tikros aukštos raiškos nuotraukos ir, jei yra, sandėlio vaizdo įrašas pradžios puslapiui.

## Lentelių neatitikimai

Visos 28 lentelės perrašytos iš paveikslėlių į `src/data/tables/*.json` ir patikrintos pagal teorinio svorio formules bei standartus (`python3 tools/verify_tables.py`). Perrašytos reikšmės su formulėmis sutampa (mediana 1,000), todėl likę neatitikimai yra pačių dabartinių lentelių klaidos. Makete naudojama patikslinta reikšmė, o skaičiuoklė prie tokio matmens parodo, kas buvo svetainėje. Visas sąrašas sugeneruojamas į `src/data/table-issues.json`:

| Lentelė | Vieta | Svetainėje | Makete | Pastaba |
|---|---|---|---|---|
| Vandens dujų | 42,4 × 4,0 | 3,97 | 3,79 | sukeisti skaitmenys |
| Vandens dujų, cinkuoti | 42,4 × 4,0 | 4,25 | 4,05 | ta pati klaida su cinko priedu |
| Preciziniai apvalūs | eilutė 15, storiai 1,4–2,5 | pasislinkusi per stulpelį | pagal formulę | 15 × 2,5 svoris nenurodytas iš viso |
| Preciziniai apvalūs | eilutės žymė „19.5“ | 19,5 | 19,05 | svoriai atitinka 3/4 colio vamzdį |
| Preciziniai stačiakampiai | 30 × 10 × 2,0 | 1,142 | 1,124 | sukeisti skaitmenys (toks pat perimetras kaip 25 × 15) |
| Konstrukciniai apvalūs | eilutės žymė „1068.0“ | 1068 | 1168 | svoriai atitinka 1168 mm |
| Konstrukciniai apvalūs | 1219 × 16,0 | 457 | 475 | sukeisti skaitmenys |
| Konstrukciniai apvalūs cinkuoti | 88,9 × 6,0 | 12,30 | 13,1 | įrašytas svoris be cinko |
| Kvadratiniai EN 10219 | 25 × 25 × 2,5 | 1,34 | 1,64 | |
| Kvadratiniai EN 10210 | 140 × 140 × 10,0 | 50,90 | 40,0 | didesnis nei 12,5 mm sienelės svoris |
| Stačiakampiai EN 10219 | 50 × 35 × 3,0 | 3,45 | 3,54 | sukeisti skaitmenys |
| Stačiakampiai EN 10219 | 180 × 120 × 6,3 ir 200 × 100 × 6,3 | 25,40 | 27,4 | mažiau nei 6,0 mm sienelės svoris |
| Stačiakampiai EN 10210 | 160 × 80 × 14,2 | 16,90 | pašalinta | tai 180 × 100 × 4,0 svoris, įrašytas ne toje eilutėje |
| Stačiakampiai EN 10210 | 180 × 100 × 4,0 | tuščia | 16,9 | perkelta iš eilutės aukščiau |
| HEA sijos | HEA 600 | 179 | 178 | standartinė masė 178 kg/m |
| UPN loviai | UPN 65 | 7,04 | 7,09 | standartinė masė 7,09 kg/m |
| Nelygiašoniai kampuočiai | 45 × 30 × 4 | 2,55 | 2,25 | pagal EN 10056 |
| Nelygiašoniai kampuočiai | 75 × 50 × 10 | 9,27 | 9,07 | pagal EN 10056 |
| Plieno juostos | 55 × 4 | 1,76 | 1,73 | |
| Kalibruoti strypai | ⌀3 ir ⌀5 | 0,06 ir 0,15 | 0,0555 ir 0,154 | lentelėje suapvalinta iki šimtųjų |

Kitos pastabos:
- lakštų lentelėse svoris skaičiuotas 8,0 kg/m² vienam storio milimetrui (ne 7,85), skaičiuoklė lakštams taiko tą patį ir tai nurodo;
- cinkuotų vamzdžių svoriai apie 7 % didesni už juodųjų (cinko danga), skaičiuoklė nestandartiniams cinkuotiems matmenims taiko tą patį koeficientą ir tai nurodo;
- tiksliųjų kvadratinių ir stačiakampių vamzdžių lentelės sudarytos pagal savą kampų užapvalinimo modelį, skaičiuoklė nestandartiniams matmenims taiko tą patį;
- kvadratinių EN 10219 lentelėje 18 × 18 × 1,5 (0,77 kg/m) palikta kaip yra: tai ne standartinis EN 10219 matmuo;
- lygiašonių kampuočių 140 × 140 eilutėje 11 ir 12 mm langeliai uždengti baltu stačiakampiu.

## Kaip tikrinta

- Lenteles iš paveikslėlių perrašė atskiri agentai (kiekvieną lentelę perskaitė du kartus), tada visi langeliai automatiškai palyginti su svorio formulėmis.
- Nepriklausoma peržiūra penkiais kampais: skaičiavimų tikslumas (228 atvejai pagal EN 10255, EN 10219-2, EN 10210-2, EN 10056-1, EN 10058/59/60, EN 10080 ir sijų bei lovių mases), lietuviški tekstai ir faktai, prieinamumas, „JavaScript“ klaidos (atsitiktinių veiksmų ir netinkamų reikšmių testai), pirkėjo ir vadybininko patirtis. Radiniai sutvarkyti.
- Sąmoningai palikta vėlesniam etapui: kiekio taisymas tiesiai sąrašo eilutėje (dabar poziciją reikia pašalinti ir pridėti iš naujo), varnelės sertifikatams ar pjovimui (kol klientas nepatvirtino paslaugų), užklausos nukreipimas konkrečiam padaliniui.
- Naršyklėje patikrinta 375, 768, 1024, 1180 ir 1440 px pločiuose; visa grandinė skaičiuoklė → sąrašas → užklausa → patvirtinimas.
- Kontrastai tikrinami surenkant (`build.py` išveda WCAG santykius pagrindinėms spalvų poroms).

## Dizaino kryptis „Pjūvis“

Solidus, aiškus, B2B: daug baltos erdvės, viena firminė spalva, tikros sandėlio nuotraukos, techninio brėžinio motyvas (profilių pjūviai ir matmenų linijos).

| | |
|---|---|
| Firminė mėlyna | `#00305E` (iš logotipo), tamsesnė `#021427` poraštei ir nuotraukos uždangai |
| Fonai | balta, šviesus plieno pilkšvas `#F4F7FA`, šviesiai mėlynas `#EEF3F9` |
| Akcentas | įkaitusio plieno oranžinė `#F26B1D`: tik pagrindiniam veiksmui („Pateikti užklausą“, „Pridėti į užklausą“), brėžinio matmenų linijos tamsesnės oranžinės |
| Šriftai | **Archivo** (kintamo storio ir pločio: antraštės siauresnės ir storos, tekstas 17 px) ir **IBM Plex Mono** (matmenys, standartai, svoriai). Abu su lietuviškais rašmenimis, savi failai |
| Motyvas | profilio pjūvio ženklai: pagal juos pirkėjas atpažįsta gaminį meniu, asortimente, skaičiuoklėje ir užklausos sąraše |
| Kampai | mygtukai, laukai ir žymos 4 px, kortelės ir nuotraukos 6 px |

Judesys santūrus: hero įėjimas, blokų atsiradimas slenkant. `prefers-reduced-motion` ir `?static=1` viską išjungia. Valdymas klaviatūra: skirtukai, matmenų žymos (rodyklėmis), meniu; „Enter“ kiekio lauke prideda poziciją.

## Failai

```
index.html, skaiciuokle.html, uzklausa.html   surinkti puslapiai (nekeisti ranka)
build.py                 surinkimas: src/ -> puslapiai ir assets/js/data.js
serve.py                 peržiūros serveris (portas 8163)
src/pages/               puslapių turinys
src/partials/            bendras šablonas: antraštė, poraštė, piktogramos, profilių ženklai
src/data/catalog.json    produktų katalogas (grupės, gaminiai, standartai, markės)
src/data/tables/         28 matmenų lentelės, perrašytos iš unis-steel.lt paveikslėlių
src/data/fixes.json      rankiniai lentelių pataisymai ir sandėlio požymiai
src/data/table-issues.json   sugeneruotas lentelių neatitikimų sąrašas
tools/verify_tables.py   lentelių patikra pagal svorio formules
assets/css/style.css     dizaino sistema ir blokai
assets/js/data.js        asortimentas skaičiuoklei (sugeneruotas)
assets/js/engine.js      svorio formulės, lentelių paieška, užklausos sąrašo saugykla
assets/js/draw.js        pjūvio brėžinys (SVG)
assets/js/configurator.js   gaminio konfigūratorius (bendras skaičiuoklei ir formai)
assets/js/calc.js, inquiry.js, main.js   puslapių logika
assets/fonts/            Archivo, IBM Plex Mono (licencijos OFL-*.txt)
assets/img/brand/        logotipas (originalus ir baltas), favicon
assets/img/foto/         nuotraukos iš kliento svetainės (unis-*)
assets/img/doc/          ISO 14001 sertifikato kopija
assets/video/            vieta hero vaizdo įrašui (kol kas tuščia)
```

Piktogramos: „Phosphor Icons“ (MIT licencija), įdėtos į `src/partials/icons.html`.

## Nuotraukos ir video

Visos nuotraukos makete yra **tikros kliento nuotraukos** iš unis-steel.lt galerijos ir puslapių antraščių (`unis-*.jpg`; hero nuotrauka `unis-hero.jpg` padaryta iš galerijos nuotraukos). Logotipas `brand/logo-unis.png` iškirptas iš svetainės logotipo (be šūkio), iš jo padaryta balta versija. Logotipo raiška maža (343 × 72 px), o galerijos nuotraukos 1000 px pločio: pilnam projektui reikės vektorinio logotipo ir didesnės raiškos nuotraukų.

**„Pexels“ video.** Ieškota vaizdo įrašo pradžios puslapiui, bet tinkamo plieno sandėlio ar vamzdžių vaizdo ten nerasta: geriausi rasti kadrai rodo gelžbetonio gaminių aikštelę, o plieno pirkėjas tai pastebėtų. Todėl hero palikta tikra UNIS sandėlio nuotrauka, ji ir autentiškesnė. Vieta vaizdo įrašui paruošta: įrašius failus į `assets/video/` ir nurodžius juos `src/pages/index.html` (`data-src-1920`, `data-src-1280`), įrašas pats atsiranda virš nuotraukos, groja tik matomas ir gauna stabdymo mygtuką. Geriausia būtų trumpas tikras kliento sandėlio vaizdo įrašas.

## Perkėlimas į „WordPress“ XStore

- Dizaino sistema (`style.css` kintamieji, šriftai, mygtukai, laukai) perkeliama į XStore antrinę temą; puslapio blokai sudedami „Elementor“ arba „WPBakery“ priemonėmis, sudėtingesni (hero, asortimento skirtukai, laiko juosta) kaip atskiri šablonai ar trumpieji kodai.
- **Skaičiuoklė ir konfigūratorius** yra grynas „JavaScript“ be priklausomybių: įdedami kaip trumpasis kodas (pvz., `[unis_skaiciuokle]`), o `data.js` generuojamas iš tų pačių lentelių. Lenteles patogu laikyti kaip įrašų tipą arba ACF laukus, kad klientas pats galėtų jas keisti.
- **Užklausos sąrašas** atitinka „užklausos krepšelio“ logiką („WooCommerce“ papildiniai „Request a Quote“) arba formų papildinį su kartojamomis eilutėmis. Forma siunčia el. laišką atsakingam padaliniui ir išsaugo užklausą administravimo aplinkoje.
- Produktų puslapiai: matmenų lentelės iš `src/data/tables/` rodomos kaip tikros HTML lentelės (paieška, rūšiavimas, mygtukas „Į užklausą“ kiekvienoje eilutėje).
