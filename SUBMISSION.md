# Hackathon Submission Pack

## Short description

Everyday Agent è un assistente operativo personale per persone e famiglie che vogliono ridurre il carico mentale della vita quotidiana. Organizza casa, denaro, salute, commissioni e calendario, ma non interrompe continuamente l'utente: impara una fiducia specifica per ogni combinazione di azione, controparte e contesto.

Una richiesta nuova parte prudente. Approvazioni, rifiuti, correzioni e tempi di risposta aggiornano il punteggio. Le azioni sensibili restano protette da tetti assoluti, consenso esplicito e permessi familiari. Ogni decisione è spiegabile, auditabile e correggibile.

## Who is it for?

- persone che gestiscono molte attività ricorrenti;
- famiglie che condividono scadenze ma non gli stessi permessi;
- utenti che vogliono automazione senza notifiche continue;
- utenti europei per cui privacy, consenso e controllo dei dati sono essenziali.

## Why it matters

Gli assistenti tradizionali ottimizzano la quantità di funzioni o notifiche. Everyday Agent ottimizza la fiducia: agisce in silenzio quando il rischio è basso e porta all'utente solo le decisioni reali. Il risultato è meno rumore, più controllo e un'autonomia che cresce solo attraverso comportamenti osservati.

## How to run

### Web demo

Requisiti: Node.js 18+ e Python 3.11+ per i test. Non sono richieste dipendenze npm.

```bash
node preview-server.mjs
```

Aprire `http://127.0.0.1:4173/` oppure usare Live Server in VS Code.

### Backend locale opzionale

```bash
python api_server.py --serve-static
```

Il backend usa SQLite locale, sessioni HttpOnly, CSRF e password derivate con scrypt. Non collega banche, email, salute o fornitori esterni.

### Test

```bash
py -3 -m unittest -v
node --check app.js
node --check preview-server.mjs
```

## Demo video: script massimo 5 minuti

### 0:00–0:35 — Problema

“Le persone non hanno bisogno di un altro chatbot che chiede attenzione. Hanno bisogno di qualcuno che gestisca il lavoro ripetitivo senza creare ansia. Le soglie fisse non funzionano: mi posso fidare del mio idraulico per 300 euro, ma non di un fornitore nuovo per 20.”

### 0:35–1:05 — Utenti e valore

“Everyday Agent è per persone e famiglie che gestiscono casa, scadenze, denaro e impegni. L’obiettivo è semplice: lavorare in silenzio e parlare solo quando c’è una decisione vera.”

### 1:05–2:15 — Demo

1. Mostrare l'onboarding e i confini dichiarati.
2. Inserire una richiesta per un fornitore nuovo: mostrare fiducia 20/100 e richiesta di conferma.
3. Approvare la richiesta più volte o mostrare un profilo fidato.
4. Mostrare come la fiducia cambia e come il digest riduce le interruzioni.
5. Aprire Governance e mostrare spiegazione, audit, tetti e permessi.

### 2:15–3:00 — Sicurezza

“Il punteggio non può superare i confini di sicurezza. Denaro, salute e documenti legali richiedono consenso e conferma. La demo non effettua pagamenti, non invia email e non accede a credenziali. Il modello decide cosa proporre; un executor separato dovrebbe applicare i permessi.”

### 3:00–3:40 — Architettura

Mostrare `ARCHITECTURE.md`: UI, motore di fiducia, policy, audit, backend locale ed executor separato.

### 3:40–4:25 — Perché è diverso

“Il vantaggio non è il numero di feature. È la memoria comportamentale specifica dell’utente: approvazioni, rifiuti, correzioni e decadimento nel tempo. Dopo un anno l’agente è calibrato sulla vita reale della persona, non su soglie generiche.”

### 4:25–5:00 — Chiusura

“Everyday Agent non promette zero errori o automazione totale. Promette trasparenza immediata, controllo reversibile e meno decisioni inutili. Non costruiamo l’agente con più funzioni: costruiamo quello di cui l’utente si fiderebbe anche se esistesse un’alternativa tecnicamente migliore.”

## Submission checklist

- [ ] Pubblicare questo repository su GitHub/GitLab e inserire l'URL pubblico nel form.
- [ ] Verificare che `LICENSE` sia visibile nel repository e nell'About: MIT.
- [ ] Verificare che README e `ARCHITECTURE.md` siano visibili senza accesso locale.
- [ ] Registrare il video demo entro 5 minuti, mostrando il progetto funzionante.
- [ ] Dichiarare nel video quali parti sono simulate e quali sono implementate.
- [ ] Inserire il proprio AWS Builder ID nel form ufficiale dell'hackathon.
- [ ] Non pubblicare segreti, password, database locali o file `.everyday-memory.json`.
- [ ] Aggiungere l'URL pubblico del repository alla submission, non l'URL `127.0.0.1` della preview.
