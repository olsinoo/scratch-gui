#### Scratch GUI je set React komponentov, vďaka ktorým vieme vytvoriť a spustiť projektu prostredia Scratch 3.0

## Inštalácia
Vyžaduje mať nainštalovaný NodeJS a Git.

V konzole/termináli spustíme príkaz:
```bash
git clone https://github.com/olsinoo/scratch-gui.git
git clone https://github.com/olsinoo/scratch-vm.git
```
**Toto bude chvílu trvať, nakoľko pôvodný modul `scratch-gui`, z ktorého sme vychádzali obsahuje [veľké súbory vo svojej histórii](https://github.com/LLK/scratch-gui/issues/5140).**

Nainštalujeme `scratch-gui` a `scratch-vm`:
```bash
cd scratch-gui
npm install
cd ..
```
```bash
cd scratch-vm
npm install
cd ..
```
Namiesto `npm install` bude možno potrebné `npm install --force`, nakoľko občas vznikne problém so závislosťami súborov.


Následne `scratch-vm` prepojíme ho so `scratch-gui`:
```bash
cd scratch-vm
npm link
cd ../scratch-gui
npm link scratch-vm
cd..
```

## Spustenie lokálneho servera
Spustenie projektu si vyžaduje nainštalovanie knižnice Node.js.
V Command Prompt alebo Terminal sa presuňte do priečinku s modulmi a spustite:
```bash
cd scratch-gui
npm start
```
Lokálny server bude dostupný na [http://localhost:8601/](http://localhost:8601/)

## Riešenie problémov
### Error pri inštalácii modulu
Ak by po spustení `npm install` vznikol nejaký error:
1. V priečinku inštalovaného modulu spustite `npm cache clean --force`
2. Vymažte priečinok **node_modules**
3. Vymažte súbor **package-lock.json**
4. Opäť spustite `npm install`

### Kompilácia projektu sa nepodarila (Failed to compile)
1. Vymažte celý priečinok `scratch-gui`.
2. V konzole/termináli spustíme príkaz:
```bash
git clone https://github.com/olsinoo/scratch-gui.git --depth=1
cd scratch-gui
npm install
```
3. Stiahnite si .zip zdrojového kódu zo [stránky](https://github.com/olsinoo/scratch-gui). Stiahnutý súbor rozzipujte.
4. Z rozzipovaného scratch-gui budeme potrebovať adresáre:
* src/components
* src/containers
* src/lib
5. Do adresára `src` naklonovaného projektu `scratch-gui` (z kroku 1.) vložíme tieto tri adresáre (pôvodné adresáre components, containers a lib vymažeme)
6. V konzole/termináli sa môžeme presunúť do adresára modulu `scratch-gui` a spustiť:
```bash
npm install
```
7. Po inštalácii treba opäť prepojiť `scratch-vm` a `scratch-gui`:
```bash
cd scratch-vm
npm link
cd ../scratch-gui
npm link scratch-vm
cd..
```
8. Projekt sa spúšťa z adresára `scratch-gui` použitím príkazu `npm start` (sekcia: [Spustenie lokálneho servera](#spustenie-lokálneho-servera)).
