# Fyzika PLANKO Studio

## Jednotky

Jedna simulační jednotka je 10 cm. Destička má rozměry 1,17 × 0,234 × 0,078 simulačních jednotek (117 × 23,4 × 7,8 mm) a referenční hmotnost přibližně 10,7 g při hustotě dřeva 500 kg/m³. Gravitace v simulačních jednotkách je 98,0665 j·s⁻², tedy 9,80665 m·s⁻². Poměr rozměrů je 15 : 3 : 1.

## Řešení kontaktů

`cannon-es` představuje každou destičku nezávislým tuhým tělesem se šestí stupni volnosti. Těleso má kvádrový tvar, hmotnost, setrvačnost, lineární a úhlovou rychlost. Fyzikální svět používá SAP broadphase, Gauss-Seidelův řešič (22 iterací), integraci ve fixním kroku 1/120 s a kontaktové materiály. Tření dřevo–dřevo je nastavené na 0,52, dřevo–stůl 0,62 a restituci 0,035. Hodnoty jsou laděné herní parametry, nikoli laboratorní měření konkrétního výrobku.

Při položení je k přesnému náhledu přidána velmi malá poziční a úhlová odchylka analogická ručnímu položení. Volně padající destičky se mohou otáčet kolem libovolných os; nejsou po pádu nuceny do předem definovaných pozic. Šestistupňová fyzika umožňuje přirozený pád, sklouznutí, převrácení a řetězovou reakci při ztrátě opory.

## Ovládání a náhled

Náhled je pouze grafický objekt a do fyzikálního světa vstupuje až po potvrzení. Raycast přenáší dotyk do souřadnic 3D světa. Při určení výšky vyhledává povrch a používá AABB/OBB testy pro odhalení překryvu. Náhled je zelený, pokud jej lze položit, a červený při kolizi nebo pohybu podkladu. Ovládání je od rotace kamery zcela oddělené. Krok jemného posunu je 1 mm, přichycení k mřížce 3,9 mm, rotace 15°.

## Test stability

Zátěžová zkouška používá dočasnou vodorovnou složku gravitačního zrychlení (alternující, tlumený průběh). Je to aproximace setrvačných sil při otřesu podložky. Těla se probudí, fyzika běží a po odeznění otřesu se vyhodnotí ustálená výška a počet destiček. Nejde o strukturální inženýrský výpočet ani přesnou simulaci konkrétního zemětřesení.

## Výzvy

Výzva se neuzná při pouhém dosažení výšky během pádu. Konstrukce musí splnit více měřitelných podmínek a zůstat prakticky bez pohybu předepsanou dobu. Most navíc vyžaduje nosníky překračující mezeru a spočívající u výšky skutečných podstavců.

## Omezení

Stejně jako každý real-time rigid-body engine má simulace numerickou toleranci a zjednodušení: nezohledňuje detailní pružnost dřeva, mikrodrsnost, deformaci ani praskání. Při velkých stavbách může nastat numerické chvění. Parametry se budou ladit na základě testování na telefonu.
