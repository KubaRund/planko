# PLANKO Studio · v0.3.0 🪵

Digitální dřevěná stavebnice pro Android. Stav pomocí skutečně padajících a otáčejících se destiček, nebo projdi kariéru stavitele s osmnácti úlohami. Bez reklam, účtů a internetu.

## Nové ovládání

| Režim / ovládací prvek | Funkce |
| --- | --- |
| **Stavět** | Dotykem nebo tažením umísti průhledný náhled. Samotný dotyk žádnou destičku nepoloží. |
| **POLOŽIT** | Potvrď přesné umístění náhledu. |
| **Kamera** | Jedním prstem otáčej kameru. Křížek přepne panování. |
| **Dvěma prsty** | Otáčej a přibližuj kameru v každém režimu. |
| **Odebrat** | Vyber destičku z jakékoliv strany a potvrď odstranění. |
| **Přesně** | Čtyři šipky pro jemné posuny po 1 mm. |
| **Mřížka** | Volitelné přichycení k 3,9mm mřížce. |
| **Otočení** | Oběma směry po 15°; naplocho, na hranu, nastojato. |
| **Test otřesem** | Zkušební vodorovné zrychlení a vyhodnocení ustálení. |

Náhled při kolizi zčervená, při správné pozici zezelená. Kamera a stavění mají samostatné režimy, takže pohyb kamery nemůže vytvořit nechtěnou destičku. Android systémové pruhy jsou odečtené v nativní části.

## Obsah

* Sandbox: 180 destiček, volné stavění, automatické ukládání.
* 18 výzev s různými podmínkami, hodnocením od jedné do tří hvězd a samostatnými uloženými stavbami. Hlavní menu, průvodce první úrovní, doporučená další výzva a obrazovka výsledků.
* Vrácení až 12 kroků v aktuální relaci včetně odebrání destičky a zátěžové zkoušky. Konstrukce se ukládají mezi relacemi.
* 3D grafika s perspektivou, stíny a kresbou dřeva. Android používá kompatibilní projekci na Canvas bez inicializace WebGL; v prohlížeči se použije detailní WebGL, pokud je dostupné.
* Skutečný rigid-body engine: hmotnost, setrvačnost, tření, rotace, skluz a kolize.
* Výškové rekordy v centimetrech, fyzicky přepočtené rozměry destičky (117 × 23,4 × 7,8 mm).

### Výzvy

Výukový úvod: **První kroky** (tři destičky) a **Křížem přes sebe**. Následuje původních deset úloh a šest bonusových: Dřevěná zeď, Pevná platforma, Most pro náklad, Mikrověž, Odolná pevnost a Mrakodrap. Nové konstrukční úlohy zohledňují i propojenost destiček, aby nestačilo rozložit samostatné kousky po stole.

1. První konstrukce — 5 cm, alespoň 4 destičky.
2. Věž 20 — stabilní výška 20 cm.
3. Most přes propast — překlenutí 9,2 cm dvěma souběžnými nosníky.
4. Poctivé vrstvy — 15 cm bez stavění nastojato.
5. Méně je více — 25 cm z maximálně 12 destiček.
6. Architektura — konstrukce široká 25 cm a vysoká 8 cm.
7. Zátěžová zkouška — věž, která vydrží simulovaný otřes.
8. Úzká základna — 22 cm, maximálně dva prvky u podlahy.
9. Obří věž — 45 cm.
10. Mistr stavebník — 25 cm do výšky, 30 cm do šířky a nejméně 18 destiček.

## Stažení a sestavení

V záložce [Actions](https://github.com/KubaRund/planko/actions) vyber poslední úspěšný běh „Sestavení Android APK“, stáhni artefakt **PLANKO-Android-v0.3.0**, rozbal ZIP a nainstaluj `app-debug.apk`. Testovací APK není publikované v Google Play. Pokud Android odmítne aktualizaci kvůli odlišnému podpisu, nejdříve si uvědom, že odinstalování smaže lokální postup; vydání v Play bude mít vlastní stabilní podpis.

Lokálně (Node.js 22, Android SDK 36, JDK 17 a Gradle 8.11.1):

```sh
npm install
npm test
npm run build
gradle :app:assembleDebug :app:bundleRelease
```

Výstup: `app/build/outputs/apk/debug/app-debug.apk` a nepodepsaný release AAB. Sestavený herní balíček se vkládá do APK; runtime nemá internetové oprávnění a závislosti se nestahují za běhu. [Plán vydání na Google Play](docs/GOOGLE_PLAY.md).

Pokud chceš hru zkoušet v prohlížeči, po `npm run build` spusť `node tests/serve.mjs` a otevři `http://127.0.0.1:4173`. Testy ovládání: `npx playwright install chromium`, `npm run test:ui`.

## Architektura

| Část | Technologie |
| --- | --- |
| Android | Java Activity, lokální WebView, systémové lišty spravované Androidem; zotavení po pádu rendereru |
| Grafika | Three.js, Canvas 3D perspektivní projekce na Androidu, WebGL v prohlížeči |
| Fyzika | cannon-es, 120 Hz, kolizní materiály a rigid-body dynamika |
| Náhled | Raycaster + OBB, samostatná interakční vrstva |
| Výzvy | `src/challenges.js`, měření stabilního objektu a hvězdy |
| Ukládání | localStorage, profil pro každý režim; starý sandbox se migruje do nové simulace |
| Testy | Node, Chromium s WebGL i bez WebGL, Android API 35 a 36 s instalací APK; GitHub Actions |

Podrobný popis: [fyzika, jednotky a stabilita](docs/PHYSICS.md).

## Vývoj

- **0.3.0** — hlavní menu, výuková úroveň, kariéra s 18 výzvami, výsledky a hvězdy, vrácení akcí, propojenost konstrukcí, úspornější překreslování a příprava Android App Bundle pro Google Play; cílení API 36.
- **0.2.1** — oprava startu Androidu: kompatibilní projekce bez WebGL, zotavení při pádu WebView, nativní chybová obrazovka a opakovaný start, standardní systémové lišty, testy na Android emulátoru.
- **0.2.0** — skutečná 3D fyzika, vizuál, kompletní změna ovládání podle zpětné vazby z telefonu, katalog deseti výzev, test otřesem, nové ukládání a systémové insets.
- **0.1.1** — mobilní prototyp s aproximovanou fyzikou a testovacím APK.
- **0.1.0** — první hratelné vydání.

Další možné kroky: ladění solveru na reálném telefonu, šablony staveb, galerie, více typů úloh a export staveb. Simulace není laboratorní ani inženýrské měření. PLANKO je nezávislý projekt, nikoliv oficiální aplikace výrobce dřevěné stavebnice.
