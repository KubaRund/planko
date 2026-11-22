# PLANKO — plán vydání na Google Play

Stav k 22. 11. 2026: interní vývoj, nikoliv veřejná aplikace. Vydání je samostatný krok až po odsouhlasení vlastníkem.

## Technické předpoklady

- [x] Stabilní applicationId `cz.altivox.planko` (po publikaci neměnit).
- [x] `targetSdk 36` a `compileSdk 36`; nové telefonní aplikace musí podle aktuálních požadavků Play cílit nejméně API 36.
- [x] Sestavení APK pro testování a nepodepsaného release Android App Bundle (.aab).
- [x] Offline, bez reklam, účtů, analytiky a síťového oprávnění.
- [x] Informace o soukromí uvnitř aplikace.
- [ ] Dlouhodobý upload key (vygenerovat bezpečně mimo Git, zálohovat; nikdy necommitovat hesla nebo keystore).
- [ ] Podepsaný AAB a zapnutí Play App Signing; ověřit instalaci z interního testu.
- [ ] Testy na více fyzických zařízeních, tablet, starší Android, TalkBack a změny velikostí písma.
- [ ] Test herní kampaně reálnými hráči: ovládání bez vysvětlování, dosažitelnost všech úkolů, výkon při 100+ destičkách, žádné pády.
- [ ] Veřejná HTML stránka zásad soukromí s ověřenými údaji vydavatele a kontaktem; vyplnit Data safety, obsahové hodnocení, cílovou skupinu a deklarace Play Console.
- [ ] Dokončit obchodní prezentaci (ikona 512 × 512, feature graphic 1024 × 500, skutečné screenshoty, texty, případně anglická lokalizace).
- [ ] Interní a uzavřené testování. U nových osobních účtů vytvořených po 13. 11. 2023 Google vyžaduje alespoň 12 testerů nepřetržitě zapojených po dobu 14 dnů před žádostí o produkční přístup.

### Podepisování

Nepodepsaný AAB z CI je technický mezivýstup, nikoli hotový soubor pro nahrání do Play. Vlastník musí nastavit dlouhodobý upload klíč, nakonfigurovat Play App Signing a podepisovat pomocí bezpečného lokálního nebo schváleného CI postupu. Debug APK je oddělený testovací formát; starší debug instalace nemusí mít stejný podpis. Nikdy neodinstalovávat hráčovu jedinou kopii bez vědomí, že může přijít o uložené stavby.

## Návrh českého popisu obchodu

**Název:** PLANKO – Stavební studio

**Krátký popis:** Stav ze dřeva, řeš fyzikální výzvy a ověř stabilitu svých staveb.

**Dlouhý popis:** PLANKO přináší dřevěnou stavebnici do telefonu. Pokládej destičky jednu po druhé, otáčej je, buduj věže a mosty nebo tvoř vlastní konstrukce. Každý dílek má hmotnost a podléhá gravitaci, tření i kolizím. Získej hvězdy v osmnácti stavebních výzvách a vyzkoušej odolnost stavby při simulovaném otřesu. Hraj vlastním tempem, klidně bez připojení. PLANKO nemá reklamy, účet ani nákupy v aplikaci.

## Návrh informací o soukromí

Hra neodesílá osobní údaje, neobsahuje účty, reklamy ani analytické SDK. Postup a nastavení se ukládají do lokálního úložiště zařízení. Aplikace používá volitelnou vibraci a nenahlíží do kontaktů, polohy, kamery ani mikrofonu. Smazáním dat aplikace lze lokální údaje odstranit; odinstalace může znamenat ztrátu postupu. Před zveřejněním skutečné zásady doplnit o název vydavatele, kontaktní e-mail, datum účinnosti a ověřit shodu s finálním balíčkem.

## Ověřené oficiální zdroje

- [Požadavky na cílové API](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Testování nových osobních účtů](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Zásady ochrany údajů uživatelů](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Kompatibilita AGP 8.10](https://developer.android.com/build/releases/agp-8-10-0-release-notes)

Před skutečným vydáním znovu prověř aktuální požadavky; dokument nemůže zaručit schválení obchodu.
