# PLANKO · v0.1.0 🪵

**Stavěj. Zkoušej. Tvoř.** PLANKO je mobilní stavební hra inspirovaná jednoduchými dřevěnými destičkami v poměru 1 : 3 : 15. Bez reklam, účtů a internetu.

## Hratelný prototyp

* Klepnutím na stavební plochu nebo vrchní stěnu destičky polož další destičku.
* Vyber naplocho, na hranu, nebo nastojato; otočením přepneš směr o 90°.
* Tažením otáčej 3D kameru, dvěma prsty přibližuj.
* Destičky padají, hledají podporu a při špatném vyvážení se mohou převrátit.
* Odebrání podporující destičky způsobí pád destiček nad ní.
* Sandbox má až 180 destiček. Výzva: věž 35 cm z maximálně 18 destiček.
* Hra automaticky ukládá stavbu a výškový rekord na zařízení.

## Jak spustit

### Android

1. Otevři záložku **Actions** a workflow „Sestavení Android APK“.
2. Po úspěšném běhu stáhni artefakt **PLANKO-Android-v0.1**.
3. Rozbal ZIP, otevři `app-debug.apk` na telefonu a nainstaluj aplikaci. Jde o testovací sestavení, ne publikaci v Google Play.

Lokální sestavení: Android SDK 35, JDK 17 a Gradle 8.9. V kořeni projektu spusť `gradle :app:assembleDebug`. Výstup je `app/build/outputs/apk/debug/app-debug.apk`.

### Prohlížeč (bez instalace)

Stáhni [index.html](app/src/main/assets/index.html) a otevři ho v moderním prohlížeči. Všechny herní zdroje jsou v jediném souboru; nejsou potřeba server ani knihovny.

## Technický návrh

| Část | Implementace |
| --- | --- |
| Android | Java Activity + lokální WebView |
| Vykreslování | Canvas 2D, vlastní ortografická 3D projekce |
| Fyzika | Diskrétní gravitace, osově orientované kolize, detekce podpory a zjednodušeného těžiště |
| Ovládání | Pointer Events (dotyk, myš, pinch zoom) |
| Ukládání | localStorage, pouze lokální data |
| Sestavení | Gradle a GitHub Actions |

### Známé limity prototypu

Nejde zatím o plnohodnotný engine tuhých těles: tření a impulzní kolize nejsou dynamicky simulovány; převrácení je aproximováno animací a následným pádem. Destičky mají diskrétní orientace a poloha se zarovnává do mřížky. Výškové jednotky jsou herní.

## Roadmapa

- [x] Samostatná 3D stavební plocha
- [x] Tři orientace destiček, rotace a kamera
- [x] Gravitace, podpora, převracení, odebrání
- [x] Sandbox, výzva, rekord a autosave
- [x] Android projekt a CI konfigurace
- [ ] Otestovat APK na fyzickém Android zařízení
- [ ] Přesnější rigid-body fyzika a tření
- [ ] Více výzev, šablony staveb a galerie
- [ ] Export vlastních projektů

PLANKO je nezávislý herní projekt a není oficiální aplikací žádné značky stavebnice.
