# Pre-launch lifecycle simulation

## Scopo

Questo esperimento simula 6, 12 o 24 mesi di vita sintetica di un utente per cercare contraddizioni tra fiducia dinamica, sicurezza, notifiche e Supporto prima di collegare servizi reali. Il risultato non è una previsione dell'utente reale: è un test di comportamento riproducibile.

## Ruoli simulati

- **Utente**: configurabile dal laboratorio (nome, reddito mensile, famiglia, fornitore fidato e abitudini); il profilo resta sintetico e locale. Di default è Marta Rossi, persona distratta che alterna approvazioni veloci, risposte lente e rifiuti.
- **Agente operativo**: applica il punteggio per azione, controparte e contesto, il decadimento e i tetti assoluti.
- **Supporto**: interviene su errori, frodi, fiducia persa e decisioni che richiedono spiegazione o escalation.
- **Avversario**: inietta istruzioni malevole in email, propone un fornitore fraudolento e tenta di superare i tetti economici.

## Esecuzione

La simulazione è offline e senza dipendenze.

```bash
py -3 lifecycle_simulation.py --days 365 --seed 20260831 --output simulation-report.json
```

Per usare uno scenario personalizzato da terminale, passa un oggetto JSON con `--scenario-json`:

```bash
py -3 lifecycle_simulation.py --days 365 --seed 20260831 --scenario-json '{"name":"Giulia","monthly_income_eur":2800,"partner":"Andrea","child":"Sofia","pet":"cane","trusted_provider":"Idraulica Rossi","habits":["risponde tardi","approva la spesa ricorrente"]}' --output simulation-report.json
```

I campi accettati sono `name`, `monthly_income_eur`, `partner`, `child`, `pet`, `trusted_provider` e `habits`. I valori vengono normalizzati e limitati localmente; non sono credenziali né dati inviati fuori dal progetto. Dalla dashboard puoi modificare gli stessi campi in **Governance > Pre-launch lab > Scenario personalizzato**. Il report salva la configurazione usata nella proprietà `scenario_config`, così ogni risultato è riproducibile.

Dalla dashboard: apri `Governance`, seleziona 6, 12 o 24 mesi e premi `Esegui simulazione`. Il server locale esegue `lifecycle_simulation.py` e restituisce il report temporaneo a `/simulation-report.json`; il report non modifica la memoria dell’utente. Il pulsante di download salva una copia locale.

## Precedenza verificata

Le correzioni emerse dallo scenario sono espresse come ordine operativo:

1. **Safety override**: sospetto, frode o accesso non autorizzato richiede verifica immediata.
2. **Tetti assoluti**: denaro, salute, contratti e documenti non possono diventare esecuzione silenziosa con fiducia alta.
3. **Contenuto esterno non autorizza**: email, allegati e istruzioni di un fornitore sono dati da verificare, non comandi di policy.
4. **Non disturbare**: rimanda solo il non urgente dopo i controlli di sicurezza.
5. **Fiducia dinamica**: determina la banda operativa solo dopo le protezioni precedenti.
6. **Supporto umano**: frode, danno economico o richiesta esplicita dell’utente passano a un canale umano.

## Come leggere il risultato

Controllare soprattutto:

- notifiche totali e notifiche del periodo di calibrazione;
- percentuale di decisioni Level 3 e quante richiedono Supporto;
- azioni avversarie bloccate;
- contraddizioni trovate e regola che le risolve;
- profili che crescono con approvazioni ma decadono senza interazioni;
- assenza di Level 1 per gli eventi sensibili o avversari.

Un risultato positivo non autorizza il lancio. Prima di servizi reali servono test di integrazione, test con utenti, threat modeling, privacy review, autenticazione, audit server-side e procedure di responsabilità.

## Risultato di riferimento

Il seed predefinito è `20260831`. Il report va rigenerato dopo ogni modifica alle policy; non si deve considerare valido un vecchio log dopo una modifica al motore. Le correzioni sono suggerimenti da approvare nel documento master, non patch applicate automaticamente dal simulatore.
