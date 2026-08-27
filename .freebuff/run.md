# Everyday Agent preview

## How to reproduce artifacts

- Usare il checkout della thread in `C:\Users\Marek\Desktop\Ai`.
- Non sono richiesti pacchetti npm, file `.env` o artefatti generati: il progetto è una pagina statica con `index.html`, `styles.css` e `app.js`.
- Se il checkout viene ricreato, ripristinare questi file dal repository prima dell'avvio.

## How to run the server

- Dalla root del progetto avviare `node.exe preview-server.mjs`.
- Il server ascolta di default su `http://127.0.0.1:4173/`; usare `PORT=<porta>` se la porta è occupata.
- In Windows la preview deve essere avviata detached con PowerShell `Start-Process`, scrivendo stdout e stderr in file distinti sotto `.freebuff`.
