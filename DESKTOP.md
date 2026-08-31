# Desktop e background

Everyday Agent è già predisposta come PWA installabile e mantiene i dati locali offline tramite `app/sw.js`.

## Cosa funziona ora

- Dashboard installabile dal browser come app.
- Cache offline per la shell dell’app.
- Dati salvati in localStorage.
- Promemoria locali compatibili con il service worker.
- `desktop-app.mjs` avvia un processo locale persistente che può essere usato da un wrapper desktop.

## Avvio locale

```bash
PORT=4174 node preview-server.mjs
```

Su Windows PowerShell:

```powershell
$env:PORT="4174"; node preview-server.mjs
```

## Installazione PWA

1. Avvia il server locale.
2. Apri `http://127.0.0.1:4174/` in un browser compatibile.
3. Usa il pulsante **Installa app** nella barra degli indirizzi.
4. Consenti le notifiche quando richiesto.

## Limiti attuali

Un service worker del browser non garantisce l’esecuzione continua quando il browser viene terminato. Per tray, avvio automatico al login e notifiche affidabili a finestra chiusa serve un wrapper desktop nativo (Electron, Tauri o WebView2) e un installer firmato.

Non dichiarare il supporto come un’app desktop nativa completa finché non sono stati aggiunti wrapper, tray, installer, gestione aggiornamenti e test sui sistemi operativi supportati.
