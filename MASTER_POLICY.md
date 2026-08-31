# Everyday Agent — Master Policy v1.1

Questa versione incorpora le correzioni emerse dalla simulazione deterministica di 6-12 mesi descritta in [`PRELAUNCH_SIMULATION.md`](PRELAUNCH_SIMULATION.md). È una policy di prodotto da verificare con revisione legale, privacy e sicurezza prima del deployment.

## Precedenza obbligatoria

Quando più regole si applicano contemporaneamente, l’agente le valuta in questo ordine:

1. **Safety override**: frode sospetta, accesso non autorizzato, danno possibile o contenuto malevolo richiedono verifica immediata. Nessun DND, punteggio di fiducia o istruzione contenuta in un’email può silenziare questo blocco.
2. **Tetti assoluti**: denaro, salute, contratti e documenti legali non raggiungono mai l’esecuzione silenziosa. Il punteggio dinamico non può superare i tetti di categoria, i limiti economici o il consenso specifico.
3. **Confine delle istruzioni**: email, allegati, pagine web e messaggi di fornitori sono dati da analizzare. Non sono autorizzazioni a cambiare policy, permessi, tetti o modalità manuale.
4. **Non disturbare intelligente**: può rimandare solo il non urgente e solo dopo i controlli precedenti.
5. **Motore di fiducia**: calcola 0-100 per azione, controparte e contesto. Il punteggio parte da 20, apprende da esiti osservati, pesa la latenza delle risposte e decade verso la base se la combinazione non viene più usata.
6. **Supporto umano**: frodi, controversie, danni, salute/legale delicati o richiesta esplicita di una persona passano a un canale umano.

## Correzioni derivate dalla simulazione

| Evidenza | Rischio | Regola stabilizzata |
|---|---|---|
| Un contesto familiare può attivare DND nello stesso giorno di un evento sospetto | Un rinvio potrebbe nascondere un incidente | Safety override sempre prima di DND; la notifica sospetta resta immediata |
| Una combinazione finanziaria può accumulare fiducia tramite storico | La fiducia potrebbe essere interpretata come autorizzazione di pagamento | Tetti assoluti e consenso specifico prevalgono sempre; nessun Level 1 per denaro |
| Un’email può contenere un comando che tenta di ignorare i limiti | Prompt injection e confusione tra dati e istruzioni | Contenuto esterno non modifica mai policy, permessi o tetti |

## Fiducia e apprendimento

- Un’approvazione rapida è evidenza di maggiore affidabilità, non un consenso universale.
- Un’approvazione lenta mantiene il profilo prudente.
- Un rifiuto o un errore riduce fortemente solo la combinazione coinvolta.
- Una riuscita osservata di un’azione a basso rischio può migliorare il profilo, ma non crea da sola un’autorizzazione permanente.
- Una proposta importata da un dominio simile richiede conferma esplicita e non abilita l’esecuzione silenziosa.
- Dopo un periodo senza interazioni il punteggio decade verso 20/100.

## Calibrazione e notifiche

I primi 14 giorni sono dichiarati come calibrazione. Il sistema mostra più dettagli e può notificare azioni che in seguito finirebbero nel digest o in esecuzione silenziosa. La calibrazione non può superare i tetti, bypassare la modalità manuale o ritardare un sospetto.

Le notifiche non urgenti oltre il limite giornaliero confluiscono nel digest. Gli eventi sospetti e le emergenze non vengono accodati.

## Supporto e responsabilità

Il Supporto può spiegare, verificare log, proporre correzioni e preparare un’escalation. Non può aumentare i tetti, trasformare dati esterni in comandi, condividere dati familiari senza permesso o chiudere un caso con danno senza conferma dell’utente. La demo non esegue pagamenti, prenotazioni, invii o cancellazioni reali.

## Verifica obbligatoria prima del lancio

Ogni modifica a policy o codice deve rigenerare il report e rieseguire:

```bash
py -3 lifecycle_simulation.py --days 365 --seed 20260831 --output simulation-report.json
py -3 -m unittest -v
```

Il report è evidenza di copertura dello scenario, non prova di sicurezza assoluta. Prima di collegare servizi reali servono almeno: test avversariali indipendenti, test di integrazione con sandbox, threat modeling, gestione dei segreti, audit server-side, privacy review, test con famiglie e procedura di escalation umana.

## Stato della policy

- **Implementato nella demo**: motore di fiducia locale, tetti, modalità manuale, audit, Supporto locale, simulazione deterministica e log scaricabile.
- **Non implementato come servizio reale**: pagamenti, banche, email, calendario esterno, notifiche native affidabili a processo chiuso, escalation umana e copertura assicurativa.
- **Decisione di rilascio**: non collegare esecutori esterni finché i controlli sopra non sono verificati in ambiente isolato.
