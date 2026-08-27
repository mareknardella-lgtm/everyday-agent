# Everyday Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Un assistente operativo trust-first che riduce il carico mentale senza trasformarsi in un'altra fonte di notifiche.

**Hackathon submission:** [brief, pitch script e checklist](SUBMISSION.md) · [diagramma architetturale](ARCHITECTURE.md)

Dashboard web glassmorphism per l'agente operativo descritto nel prompt. Include i domini Casa, Denaro, Salute, Commissioni e Famiglia, il Motore di Fiducia Dinamico, decisioni in sospeso, digest, memoria, impostazioni privacy, integrazioni e assistente AI locale a regole.

## Demo web

Apri `index.html` direttamente in VS Code con Live Server oppure avvia un server statico locale. Non sono richieste dipendenze npm: `styles.css` e `app.js` vengono caricati dalla pagina e lo stato demo viene salvato in `localStorage`.

```bash
node preview-server.mjs
```

Poi apri <http://127.0.0.1:4173>.

La UI demo non accede a banche, email, calendari o sistemi sanitari: l'assistente e le integrazioni sono rappresentati localmente, senza chiamate a servizi esterni. Prima di collegare servizi reali servono autenticazione, permessi minimi, audit log e conferma esplicita per pagamenti, invii, cancellazioni, contratti e dati sanitari.

Implementazione locale, senza dipendenze esterne, dell'agente operativo descritto nel prompt. Gestisce classificazione dei task, memoria persistente JSON, digest, richieste di conferma, rifiuti persistenti, rilevamento di attività sospette, limite delle notifiche e apprendimento progressivo delle autorizzazioni.

## Avvio

```bash
cp agent.config.example.json agent.config.json
python everyday_agent.py task.json
```

Esempio `task.json`:

```json
{
  "title": "Scegliere preventivo idraulico",
  "category": "home",
  "action": "choose_quote",
  "amount_eur": 340,
  "reversible": true,
  "details": "80€ senza garanzia oppure 340€ con garanzia estesa",
  "options": ["80€ senza garanzia", "340€ con garanzia estesa"]
}
```

`options` viene mostrato nella richiesta di conferma. I campi supportati sono `title`, `category`, `action`, `amount_eur`, `reversible`, `preapproved`, `urgent`, `suspicious`, `details`, `options`, `context`, `default_outcome`, `recipient`, `permanent_authorization`, `affects_family`, `provider`, `counterparty`, `deadline`, `new_elements` e `created_at`.

## Motore di Fiducia Dinamico

Il motore sostituisce la soglia generale e i tre livelli come regola decisionale. Per ogni tripla esatta **tipo di azione + controparte + contesto** crea un profilo indipendente da 0 a 100:

- una combinazione nuova parte da **20/100**;
- un'approvazione entro un'ora aumenta molto il punteggio, un'approvazione lenta aumenta poco e un rifiuto lo riduce drasticamente;
- il punteggio decade verso 20 nel tempo (half-life predefinita: 365 giorni, cioè dodici mesi), così una vecchia automazione non resta affidabile per sempre;
- sopra 85/100, se reversibile e nel limite dinamico, la demo può eseguire senza interrompere; sopra 55/100 informa nel digest; sotto 55/100 chiede prima. Queste sono bande derivate dal punteggio, non soglie di spesa universali;
- il limite economico per i domini non sensibili cresce con il punteggio fino a €400. Un idraulico osservato a 92/100 può quindi arrivare a €400, mentre un fornitore nuovo a 20/100 richiede conferma anche per €30;
- denaro, salute e documenti legali hanno tetti assoluti configurabili e non possono mai raggiungere l'esecuzione silenziosa; una fiducia importata da una combinazione simile è scontata e richiede sempre conferma esplicita.

`DynamicTrustEngine` espone `profile()`, `evaluate()`, `update()`, `update_task()`, `set_score()` e `profiles()`. La memoria salva `trust_profiles`, `trust_interactions` e `trust_proposals`; le decisioni registrano punteggio, chiave, fonte, tetto e limite dinamico per rendere la scelta spiegabile. `trust_sensitive_caps` è un tetto di sicurezza, non una soglia che l'utente può superare con approvazioni ripetute.

La memoria viene salvata in `.everyday-memory.json` e non deve essere condivisa: può contenere preferenze, fornitori, soglie legacy, profili di fiducia, tempi di risposta, rifiuti espliciti e contesto familiare. Un rifiuto resta memorizzato e impedisce di riproporre la stessa azione senza nuovi elementi; `new_elements` consente una rivalutazione esplicita quando il contesto cambia. Le notifiche attive rispettano il limite giornaliero; le richieste non urgenti eccedenti restano nel digest.


## Integrazioni configurabili

La sezione Integrazioni espone tutti i connettori previsti, ciascuno con permessi espliciti e principio del minimo accesso:

- **Calendario**: calendario personale e familiare condiviso; lettura e creazione eventi, mai cancellazioni senza conferma.
- **Email**: lettura e organizzazione; nessun invio autonomo.
- **Conti bancari e carte**: sola lettura di saldi e movimenti; pagamenti sempre da confermare.
- **Liste e spesa**: lettura e aggiornamento delle liste autorizzate.
- **Casa domotica**: stato e comandi per dispositivi autorizzati.
- **Prenotazioni**: ricerca e preparazione; prenotazioni e cancellazioni richiedono conferma.
- **Cartella clinica e farmacia**: solo promemoria operativi; nessun consiglio clinico o condivisione automatica.
- **Documenti familiari**: scadenze scolastiche e familiari con accesso minimo e consenso per ogni condivisione.

Nella demo i toggle salvano solo la configurazione locale: non effettuano connessioni reali. Per collegare servizi esterni servono OAuth, gestione dei segreti, permessi granulari, audit log e conferma esplicita.

## Funzioni avanzate e sicurezza

La dashboard include superfici per costi silenziosi, radar delle scadenze nascoste, modalità Non disturbare intelligente, simulazione dell'esito se non rispondi, routing familiare e archiviazione documentale. La demo analizza solo dati locali forniti dall'utente: non contatta fornitori, non invia denaro o messaggi e non condivide dati sensibili. La negoziazione automatica è rappresentata come proposta da confermare; per renderla reale servono autenticazione, audit e permessi minimi.

## Governance e trasparenza

L'agente parte con un onboarding esplicito: chiede il nome, mostra la lista di ciò che non farà mai e avvia una calibrazione di 14 giorni. Durante la calibrazione segnala anche alcune azioni normalmente silenziose, così l'utente può correggere le soglie prima che il comportamento diventi più autonomo.

Ogni azione automatica conserva una spiegazione della regola applicata. Le azioni reversibili espongono `annulla` e `rifai`; nel motore Python `undo()` rifiuta correttamente le azioni dichiarate non reversibili invece di fingere un rollback esterno. La demo non paga, prenota, invia o cancella davvero: il rollback locale è uno storico di correzione, non una garanzia verso servizi terzi.

La matrice `family_permissions` separa i ruoli (`owner`, `partner`, `teen`) dai domini e viene verificata prima di ogni approvazione. Il routing familiare non concede da solo alcun potere. Gli errori di calendario, banca o altri connettori sono registrati come problemi tecnici separati dalle decisioni (`record_integration_failure()`), con stato e priorità propri.

La memoria registra preferenze esplicite, pattern osservati, profili e interazioni di fiducia, approvazioni, rifiuti e contesto familiare. Un rifiuto resta vincolante finché non arrivano nuovi elementi. I KPI locali misurano notifiche evitate, tempo stimato risparmiato e percentuale di decisioni che passano da conferma a gestione autonoma. I periodi stagionali possono essere anticipati con `seasonal_periods` e `upcoming_seasonal_periods()`.

La sezione GDPR dichiara conservazione, base giuridica, diritti di accesso/esportazione/cancellazione/rettifica/revoca del consenso e condivisione solo autorizzata. `export_personal_data()`, `purge_expired_data()` e `share_data()` rendono questi flussi testabili; per un prodotto reale serviranno comunque titolare, registro dei trattamenti, informative e consulenza privacy. Il pacchetto di offboarding contiene decisioni aperte, preferenze, documenti, scadenze e problemi tecnici prima della pausa o disattivazione.

Il file `agent.config.example.json` contiene un esempio completo per calibrazione, privacy, stagionalità, permessi, consenso per dominio, tetti economici, audit, business e monitoraggio event-driven. Tutte le integrazioni restano disattivate nella demo e non vengono contattati terzi.

## Documento master: esecuzione e responsabilità

Il master document è implementato come policy verificabile, non come promessa di integrazioni già operative. I domini restano separati tra sola lettura, assistenza con conferma e autonomia delimitata; il modello non possiede credenziali e un futuro esecutore dovrà applicare scope temporanei, matrice dei permessi, tetti e consenso prima di ogni azione esterna.

- **Consenso e tetti**: `grant_domain_consent()` concede autonomia solo per un dominio e scade dopo un periodo configurabile; `revoke_domain_consent()` la revoca subito. Denaro ha un tetto per transazione e cumulativo mensile, oltre all'opzione `autonomous_money_enabled` disattivata nella demo.
- **Audit e crisi**: ogni azione registrata produce un evento in una catena hash locale verificabile con `verify_audit_log()`. `record_execution_error()` comunica l'errore, riduce la fiducia solo della combinazione coinvolta e prepara i passi di correzione; non promette “zero errori” né simula rimborsi.
- **Cold start e consapevolezza**: `import_historical_data()` richiede consenso separato, poi passa alla calibrazione dichiarata. `dependency_check()` aumenta i riepiloghi quando rileva perdita di consapevolezza e `set_manual_mode(True)` consente di chiedere sempre conferma con un solo passaggio.
- **Business e sostenibilità**: i piani Base, Assistito, Autonomo e Famiglia sono descritti in `BUSINESS_PLANS`; `business_summary()` misura azioni, errori e costo del fondo, mentre `computational_metrics()` traccia unità e costo del monitoraggio event-driven. Non sono previsti advertising, vendita di dati o percentuali sui risparmi come default.
- **Offboarding**: il pacchetto include decisioni aperte, scadenze, documenti, regole, profili di fiducia, consensi, problemi tecnici, coda eventi e testa dell'audit. Prima di un backend reale va completata la revoca dei token, l'handover e la cancellazione secondo la policy di conservazione.

La parte legale e assicurativa richiede ancora un titolare del trattamento, informative, registro dei trattamenti, SLA, copertura realmente sottoscritta e revisione professionale prima del deployment. La demo espone i contratti tecnici e le guardrail, ma non sostituisce consulenza legale, finanziaria o sanitaria.

## Posizionamento strategico e difendibilità

Questo brief è una guida strategica complementare al codice: l'obiettivo non è avere l'agente con più funzioni, ma costruire un vantaggio cumulativo difficile e rischioso da abbandonare. Le decisioni di prodotto, comunicazione e integrazione vanno lette attraverso questi sette principi:

1. **Dato comportamentale accumulato > feature** — il valore difendibile è la cronologia delle micro-decisioni reali (approvazioni, rifiuti, correzioni e tempi di risposta). Ogni funzione deve rendere l'agente più preciso per quella persona e rendere visibile il valore già calibrato.
2. **Fiducia mai tradita > velocità di crescita** — spiegabilità, audit, rollback/undo, privacy e limiti di sicurezza hanno priorità assoluta rispetto a nuove superfici o crescita rapida. Un singolo errore grave pesa più di molte feature.
3. **Effetto rete familiare > effetto rete individuale** — permessi incrociati, routing e contesto condiviso devono aiutare più membri senza trasformare la disattivazione o la migrazione in una perdita di controllo.
4. **Poche integrazioni profonde > molte superficiali** — prima di aggiungere un connettore, valutare se approfondire banca, salute, scuola/utenze o calendario familiare crea più dipendenza utile e affidabile.
5. **Invisibilità come posizionamento** — misurare ansia ridotta, decisioni evitate e automazioni mai disattivate; non inseguire engagement, notifiche o frequenza d'uso senza un reale alleggerimento cognitivo.
6. **Conformità visibile come differenziatore** — GDPR, consenso, conservazione, esportazione, cancellazione e condivisione devono essere verificabili dall'utente in linguaggio semplice, non soltanto dichiarati nei termini.
7. **Tempo al primo “wow silenzioso”** — ogni sprint deve avvicinare il primo episodio in cui l'agente previene o organizza un problema reale e lo comunica serenamente nel digest, senza creare ansia nel frattempo.

### Scorecard per ogni nuova proposta

Prima di costruire una feature, integrazione o messaggio, documentare sempre:

1. quale dei sette principi rafforza (oppure dichiarare che non ne rafforza nessuno);
2. quale costo introduce in invisibilità, complessità o rischio di fiducia;
3. se un competitor può replicarla in meno di tre mesi;
4. una decisione netta: **procedere, rimandare o scartare**.

Non sono priorità strategiche le funzioni che aumentano solo le notifiche, le integrazioni ampie ma superficiali e le metriche di vanità. Preferire errori zero, tempo realmente risparmiato, fiducia mantenuta, automazioni non disattivate e percentuale di decisioni rese autonome dal comportamento osservato.

La frase guida è: **“Non stiamo costruendo l'agente con più funzioni. Stiamo costruendo l'agente di cui, dopo un anno, l'utente si fiderebbe a occhi chiusi anche se ne esistesse uno tecnicamente migliore.”**

Questo livello resta documentale e non modifica automaticamente la policy del Motore di Fiducia Dinamico: il motore continua a privilegiare sicurezza, consenso esplicito e tetti assoluti per i domini sensibili.

## Test

```bash
py -3 -m unittest -v
```
