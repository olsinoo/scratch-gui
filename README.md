#### Scratch GUI je set React komponentov, vďaka ktorým vieme vytvoriť a spustiť projektu prostredia Scratch 3.0

## Inštalácia
Vyžaduje mať nainštalovaný NodeJS a Git.

V konzole/termináli spustíme príkaz:
```bash
git clone https://github.com/olsinoo/scratch-gui.git
git clone https://github.com/olsinoo/scratch-vm.git
```
**Toto bude chvílu trvať, nakoľko pôvodný modul Scratch-GUI z ktorého sme vychádzali obsahuje [veľké súbory vo svojej histórii](https://github.com/LLK/scratch-gui/issues/5140).**

Nainštalujeme scratch-gui a scratch-vm:
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

Namiesto **npm install** bude možno potrebné **npm install --force**, nakoľko občas vznikne problém so závislosťami súborov.

Následne scratch-vm prepojíme ho so scratch-gui:
```bash
cd scratch-gui
npm link
cd ..
cd scratch-vm
npm link scratch-gui
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
