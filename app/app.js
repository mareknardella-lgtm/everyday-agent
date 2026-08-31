const STORAGE_KEY = "everyday-agent-state-v2";

const translations = {
  it: {
    nav_overview: "Panoramica",
    nav_decisions: "Decisioni",
    nav_calendar: "Calendario",
    nav_home: "Casa",
    nav_money: "Denaro",
    nav_health: "Salute",
    nav_errands: "Commissioni",
    nav_family: "Famiglia",
    nav_memory: "Memoria",
    nav_integrations: "Integrazioni",
    nav_support: "Supporto",
    nav_settings: "Impostazioni",
    nav_governance: "Governance",
    nav_workspace: "Workspace",
    nav_system: "Sistema",
    agent_active: "Agente attivo",
    agent_ready: "Spazio locale pronto",
    topbar_space: "Il tuo spazio",
    topbar_local: "Locale",
    hero_date: "Il tuo spazio personale",
    hero_title: "Il tuo spazio",
    hero_copy: "Partiamo da ciò che vuoi affidarmi.",
    add_task: "+ Aggiungi attività",
    space_ready: "Il tuo spazio è pronto",
    space_ready_desc: "Aggiungi una richiesta e deciderò insieme a te cosa fare.",
    customize: "Personalizza",
    today: "Oggi",
    agenda: "AGENDA",
    no_appointments: "Nessun impegno",
    calendar_empty: "Il calendario è vuoto",
    calendar_empty_desc: "Aggiungi il tuo primo evento quando vuoi.",
    open_calendar: "Apri calendario",
    silent_done: "FATTO IN SILENZIO",
    tasks_silent: "attività gestite senza interromperti",
    since_start: "Da quando inizi",
    month_spends: "SPESE DEL MESE",
    no_spends: "Nessuna spesa registrata",
    view_details: "Vedi dettagli",
    recent: "Attività recenti",
    recent_desc: "Le cose che l'agente gestirà per te",
    mark_read: "Segna tutto letto",
    no_activity: "Nessuna attività ancora",
    no_activity_desc: "Le azioni dell'agente appariranno qui.",
    next_digest: "PROSSIMO DIGEST",
    your_rules: "Secondo le tue regole",
    digest_desc: "Raccoglierò le attività non urgenti senza interromperti.",
    digest_will_include: "Il tuo digest includerà",
    elements: "elementi",
    preview_digest: "Anteprima digest",
    ai_title: "EVERYDAY AI",
    ai_subtitle: "Dimmi cosa vuoi delegare",
    ai_active: "attivo",
    ai_placeholder: "Es. ricordami il filtro acqua",
    ai_send: "Invia richiesta",
    ai_greeting: "Posso occuparmi delle piccole cose. Per le decisioni vere, ti chiederò prima.",
    domains: "Domini",
    domains_desc: "Organizza la tua quotidianità quando vuoi",
    domain_home: "Casa",
    domain_home_desc: "Manutenzione e scorte",
    domain_money: "Denaro",
    domain_money_desc: "Budget e pagamenti",
    domain_health: "Salute",
    domain_health_desc: "Promemoria operativi",
    domain_errands: "Commissioni",
    domain_errands_desc: "Liste e prenotazioni",
    domain_family: "Famiglia",
    domain_family_desc: "Persone e documenti",
    decisions_title: "Decisioni",
    decisions_subtitle: "Ogni scelta nasce dalla storia della singola combinazione.",
    decisions_eyebrow: "Fiducia dinamica · La tua attenzione",
    pending: "IN SOSPESO",
    notifications_today: "NOTIFICHE OGGI",
    no_action_done: "Nessuna azione è stata eseguita",
    trust_engine_title: "MOTORE DI FIDUCIA DINAMICO",
    trust_engine_desc: "Una fiducia diversa per ogni caso",
    trust_engine_subtitle: "Non esiste più una soglia uguale per tutti: osservo azione, controparte e contesto.",
    new_combo: "Nuova combinazione",
    new_combo_desc: "Parto prudente quando non ho ancora una storia affidabile.",
    execute_inform: "Eseguo e informo",
    execute_inform_desc: "La fiducia consente il digest, se l'azione è reversibile e nel limite dinamico.",
    can_act: "Posso agire",
    can_act_desc: "Solo per casi osservati, reversibili e fino al tetto calcolato dalla fiducia.",
    protection: "Protezione fissa:",
    protection_desc: "denaro, salute e documenti legali hanno un tetto assoluto e non arrivano mai all'esecuzione silenziosa.",
    calendar_eyebrow: "Agenda personale",
    calendar_desc: "Aggiungi gli impegni che vuoi tenere organizzati.",
    new_event: "+ Nuovo evento",
    home_eyebrow: "Manutenzione · Utenze · Scorte",
    home_desc: "Le piccole cose che fanno funzionare tutto.",
    add: "Aggiungi",
    in_progress: "IN CORSO",
    activities: "attività",
    no_deadline_yet: "Nessuna scadenza ancora",
    supplies: "SCORTE",
    products: "prodotti",
    empty_list: "Lista vuota",
    next_deadline: "PROSSIMA SCADENZA",
    none: "Nessuna",
    will_notify: "Ti avviserò in anticipo",
    money_eyebrow: "Budget · Pagamenti · Riconciliazione",
    money_desc: "Numeri chiari, decisioni solo quando servono.",
    register_expense: "+ Registra spesa",
    budget: "BUDGET",
    no_expense: "Nessuna spesa registrata",
    utilized: "utilizzato",
    recent_movements: "Movimenti recenti",
    last_7_days: "Ultimi 7 giorni",
    export: "Esporta",
    no_movement: "Nessun movimento registrato",
    movements_appear: "I movimenti appariranno quando collegherai un conto.",
    to_monitor: "Da monitorare",
    useful_signals: "Segnali utili",
    no_signal: "Nessun segnale da monitorare",
    will_notify_only: "Ti avviserò solo quando ci sarà qualcosa di utile.",
    health_eyebrow: "Appuntamenti · Terapie · Ricette",
    health_desc: "Promemoria chiari, nessun consiglio clinico.",
    add_appointment: "+ Aggiungi appuntamento",
    no_appointment: "Nessun appuntamento registrato",
    add_reminder: "Aggiungi un promemoria operativo, senza consigli clinici.",
    reminders: "Promemoria",
    operational_info: "Solo informazioni operative",
    no_reminder_yet: "Nessun promemoria ancora",
    reminders_organized: "Li terrò organizzati senza dare consigli clinici.",
    adherence: "Aderenza",
    this_week: "Questa settimana",
    no_reminder_adherence: "Nessun promemoria ancora",
    health_local: "I dati salute restano locali e non vengono condivisi.",
    errands_eyebrow: "Spesa · Prenotazioni · Consegne",
    errands_desc: "Raccolgo le cose da fare e le porto verso la fine.",
    add_errand: "+ Aggiungi commissione",
    shopping_list: "LISTA DELLA SPESA",
    your_list: "La tua lista",
    empty_shopping: "Lista vuota",
    add_first_product: "Aggiungi il primo prodotto da ricordare.",
    add_product: "+ Aggiungi prodotto",
    in_program: "In programma",
    bookings_deliveries: "Prenotazioni e consegne",
    no_errand: "Nessuna commissione in programma",
    errands_appear: "Le prenotazioni e i resi appariranno qui.",
    family_eyebrow: "Calendario · Scuola · Documenti",
    family_desc: "Tutti sincronizzati sulle cose importanti.",
    add_commitment: "+ Aggiungi impegno",
    no_member: "Nessun membro",
    add_people: "Aggiungi persone da coordinare",
    add_person: "Aggiungi persona",
    new_member: "Coordina un nuovo membro",
    upcoming_deadlines: "Prossime scadenze",
    docs_activities: "Documenti e attività",
    no_family_deadline: "Nessuna scadenza familiare",
    family_docs_appear: "Documenti e attività appariranno quando li aggiungerai.",
    shared_calendar: "Calendario condiviso",
    no_sync: "Nessuna sincronizzazione",
    no_person_synced: "Nessuna persona sincronizzata",
    memory_eyebrow: "Preferenze · Pattern · Regole",
    memory_desc: "Imparo come aiutarti senza dimenticare i tuoi confini.",
    manage_data: "Gestisci dati",
    local_memory: "MEMORIA LOCALE",
    no_preference_saved: "Nessuna preferenza salvata",
    memory_desc2: "Ogni regola resta sotto il tuo controllo.",
    explicit_prefs: "Preferenze esplicite",
    declared_by_you: "Dichiarate da te",
    no_explicit_prefs: "Nessuna preferenza salvata",
    prefs_appear: "Le tue regole appariranno qui dopo averle configurate.",
    observed_patterns: "Pattern osservati",
    autonomy_suggestions: "Suggerimenti di autonomia",
    no_pattern: "Nessun pattern osservato",
    agent_learn: "L'agente imparerà dalle tue scelte, senza automatizzare da solo.",
    silent_costs: "Costi silenziosi",
    monthly_digest: "Digest mensile dedicato",
    no_cost: "Nessun costo da verificare",
    unused_subscriptions: "Segnalerò abbonamenti inutilizzati da 90 giorni e possibili doppioni.",
    hidden_deadlines: "Radar scadenze nascoste",
    guarantees_bonus: "Garanzie · bonus · ferie",
    no_hidden_deadline: "Nessuna scadenza rilevata",
    will_track_deadlines: "Controllerò le scadenze che tendono a sfuggire.",
    integrations_eyebrow: "Connessioni sicure",
    integrations_desc: "Collega solo ciò che vuoi delegare.",
    calendar_int: "Calendario",
    calendar_int_desc: "Personale e familiare condiviso",
    calendar_int_perm: "Leggi e organizza · mai cancellare senza conferma",
    available: "Disponibile",
    email_int: "Email",
    email_int_desc: "Lettura e organizzazione",
    email_int_perm: "Nessun invio autonomo",
    bank_int: "Conti bancari e carte",
    bank_int_desc: "Saldo e movimenti in sola lettura",
    bank_int_perm: "Pagamenti solo con conferma esplicita",
    grocery_int: "Liste e spesa",
    grocery_int_desc: "Scorte e prodotti ricorrenti",
    grocery_int_perm: "Può aggiornare liste autorizzate",
    home_int: "Casa domotica",
    home_int_desc: "Termostato e sicurezza",
    home_int_perm: "Solo comandi autorizzati · nessun accesso a terzi",
    health_int: "Cartella e farmacia",
    health_int_desc: "Promemoria operativi",
    health_int_perm: "Nessun consiglio clinico o condivisione",
    booking_int: "Prenotazioni",
    booking_int_desc: "Ristoranti, servizi e trasporti",
    booking_int_perm: "Prenotazione o cancellazione sempre da confermare",
    family_docs_int: "Documenti famiglia",
    family_docs_int_desc: "Scuola, passaporti e scadenze",
    family_docs_int_perm: "Accesso minimo e consenso per ogni condivisione",
    your_data: "I tuoi dati, le tue regole",
    your_data_desc: "Le integrazioni leggono solo i dati necessari. Pagamenti, invii, cancellazioni e dati sanitari richiedono sempre autorizzazione esplicita per ogni caso.",
    real_connections: "Le connessioni reali richiedono consenso",
    real_connections_desc: "La demo salva solo la configurazione locale. Prima di collegare servizi servono autenticazione sicura, permessi minimi, audit e conferma per ogni azione sensibile.",
    settings_eyebrow: "Controllo dell'autonomia",
    settings_desc: "Decidi i confini; la fiducia si costruisce con le interazioni reali.",
    trust_engine: "Motore di fiducia",
    no_generic_threshold: "Nessuna soglia generale per tutti",
    dynamic_spending: "La soglia di spesa è dinamica",
    dynamic_spending_desc: "Ogni combinazione parte da 20/100. Il limite cresce solo con approvazioni osservate e decade nel tempo; il tetto massimo operativo è € 400 per i domini non sensibili.",
    cautious_base: "base prudente",
    observed_exec: "esecuzione osservata",
    decay_50: "decadimento 50%",
    active_notifications: "Notifiche attive",
    max_per_day: "Massimo al giorno, escluse emergenze",
    morning_digest: "Digest del mattino",
    non_urgent_summary: "Riepilogo non urgente",
    evening_digest: "Digest della sera",
    completed_summary: "Riepilogo delle attività concluse",
    notification_channel: "Canale notifiche",
    urgent_digest: "Per decisioni urgenti e digest",
    never_automate: "Argomenti mai automatizzati",
    comma_separated: "Separali con una virgola",
    save_rules: "Salva regole",
    important_boundaries: "Confini importanti",
    never_automate_desc: "Mai automatizzare senza di te",
    payments: "Pagamenti e trasferimenti",
    always_confirm: "Richiedi sempre conferma",
    health_data: "Dati sanitari",
    no_share: "Non condividere con terzi",
    contracts: "Contratti e firme",
    deletions: "Cancellazioni",
    confirm_before_delete: "Conferma esplicita prima di eliminare",
    governance_eyebrow: "Trasparenza · Controllo · Continuità",
    governance_desc: "Capisci cosa fa l'agente, correggilo e riprendi i dati quando vuoi.",
    calibration: "CALIBRAZIONE",
    trial_period: "Periodo di prova",
    calibration_active: "attiva",
    calibration_desc: "Sto ancora calibrando la fiducia per singola combinazione: potresti ricevere qualche notifica in più.",
    restart_calibration: "Riavvia calibrazione",
    kpi_title: "Controllo dei risultati",
    kpi_subtitle: "Misuro silenzio utile, non engagement.",
    notifications_avoided: "notifiche evitate",
    time_saved: "tempo stimato risparmiato",
    deescalation: "richieste rese autonome",
    error_rate: "errori per 1000 azioni",
    compute_cost: "costo computazionale demo",
    trust_memory: "MEMORIA DI FIDUCIA",
    known_combinations: "Le combinazioni che conosco",
    trust_memory_desc: "Ogni combinazione nuova parte prudentemente da 20/100.",
    global_manual: "Manuale globale",
    trust_active: "fiducia attiva",
    ask_always: "Chiedimi sempre",
    observed_combinations: "combinazioni osservate",
    safe_cap: "Tetto non sensibile · € 400 max",
    no_history_yet: "Nessuna storia ancora",
    build_first_profile: "Approva o rifiuta una richiesta per costruire il primo profilo.",
    fixed_caps: "Tetti fissi:",
    fixed_caps_desc: "denaro, salute e documenti legali non possono auto-espandere la propria autonomia, anche con fiducia 100/100.",
    family_perms: "PERMESSI FAMIGLIA",
    approval_matrix: "Matrice di approvazione",
    child_no_inherit: "Un figlio non eredita i poteri dell'utente principale.",
    partner_money: "Partner · denaro",
    no_power: "Nessun potere",
    can_approve: "Può approvare",
    can_manage: "Può gestire",
    partner_health: "Partner · salute",
    teen_errands: "Adolescente · commissioni",
    teen_money: "Adolescente · denaro",
    save_permissions: "Salva permessi",
    smart_dnd: "NON DISTURBARE INTELLIGENTE",
    protect_time: "Proteggi il tuo tempo",
    smart_dnd_desc: "Rimanda il non urgente nei momenti delicati.",
    normal: "normale",
    current_context: "Contesto attuale",
    current_context_desc: "Viaggio, festività o weekend in famiglia",
    auto_detection: "Rilevamento automatico",
    auto_detection_desc: "Le emergenze restano sempre immediate",
    save_context: "Salva contesto",
    integrations_title: "Problemi tecnici",
    integrations_subtitle: "Separati dalle decisioni dell'utente",
    no_tech_issue: "Nessun problema tecnico",
    expired_access: "Un accesso scaduto apparirà qui con priorità distinta.",
    simulate_failure: "Simula accesso scaduto",
    gdpr: "GDPR",
    data_transparency: "Trasparenza dati",
    audit_local: "audit locale",
    data_retention: "Conservo i dati locali per 90 giorni e il registro delle azioni per il periodo previsto. Base giuridica: consenso.",
    no_domain_consent: "Nessun consenso di dominio",
    always_renewable: "autonomia sempre rinnovabile",
    audit_pending: "Audit in attesa",
    audit_chain: "catena locale verificabile",
    export_data: "Esporta dati",
    delete_data: "Cancella dati",
    never_do_title: "COSA NON FARÒ MAI",
    declared_boundaries: "Confini dichiarati",
    shown_before: "Mostrati prima dell'attivazione",
    seasonal: "STAGIONALITÀ",
    anticipate_peaks: "Anticipa i picchi",
    recurring_period: "Periodo ricorrente",
    recurring_period_desc: "Nome, mese e giorno separati da virgole",
    add_period: "Aggiungi periodo",
    no_custom_period: "Nessun periodo personalizzato",
    offboarding: "OFFBOARDING",
    pause_or_deactivate: "Metti in pausa o disattiva",
    offboarding_desc: "Prima di spegnere l'agente preparo un pacchetto con decisioni aperte, preferenze e scadenze, revoco i token esterni e lascio a te il passaggio finale.",
    pause: "Metti in pausa",
    prepare_handover: "Prepara passaggio",
    no_handover: "Nessun pacchetto di passaggio creato.",
    cold_start: "COLD START",
    import_what_you_choose: "Importa solo ciò che scegli",
    cold_start_subtitle: "Prima importazione, poi calibrazione dichiarata.",
    import: "importazione",
    cold_start_desc: "Parto prudente da 20/100. Puoi importare pattern storici soltanto dopo un consenso separato.",
    money_consent: "Consenso denaro",
    simulate_import: "Simula importazione autorizzata",
    no_invented_data: "Nessun dato viene inventato o inviato a servizi esterni.",
    responsibility: "RESPONSABILITÀ",
    safety_first: "Prima sicurezza, poi autonomia",
    responsibility_desc: "Il modello propone; un esecutore separato applicherà permessi e tetti.",
    read_only: "Sola lettura",
    read_only_desc: "Calendari, email e conti tramite scope minimi.",
    human_loop: "Human-in-the-loop",
    human_loop_desc: "L'agente prepara; tu confermi con un tap.",
    limited_autonomy: "Autonomia delimitata",
    limited_autonomy_desc: "Solo dopo mesi di dati, consenso per dominio e audit verificabile.",
    demo_no_creds: "La demo non accede a credenziali, non effettua pagamenti e non contatta terzi.",
    sustainable_model: "MODELLO SOSTENIBILE",
    value_no_sell: "Valore senza vendere i dati",
    sustainable_desc: "Abbonamento per profondità di autonomia, non per rumore o feature.",
    base_plan: "Base",
    base_plan_desc: "sola lettura",
    assisted_plan: "Assistito",
    assisted_plan_desc: "conferma umana",
    autonomous_plan: "Autonomo",
    autonomous_plan_desc: "scope e tetti",
    family_plan: "Famiglia",
    family_plan_desc: "ruoli separati",
    actions_registered: "azioni registrate",
    automations_never_disabled: "automazioni mai disattivate",
    crisis_error: "CRISI DA ERRORE",
    crisis_title: "Trasparenza quando qualcosa va storto",
    no_error: "nessun errore",
    crisis_desc: "Se un errore viene registrato, la fiducia cala solo per quella combinazione, l'evento diventa immediato e il sistema mostra cosa è successo, cosa sta facendo e cosa puoi fare tu.",
    simulate_error: "Simula errore locale",
    verify_audit: "Verifica audit",
    crisis_footnote: "Promessa: correzione verificabile, non \"zero errori\".",
    awareness: "CONSAPEVOLEZZA",
    autonomy_check: "Controllo periodico dell'autonomia",
    awareness_desc: "Non lascio che la delega diventi automatica o opaca.",
    no_excessive: "Nessun segnale di affidamento eccessivo. Puoi sempre fermare tutto in un passaggio.",
    review_autonomy: "Rivedi autonomia",
    architecture: "ARCHITETTURA",
    sustainable_monitoring: "Monitoraggio sostenibile",
    architecture_desc: "Trigger di eventi prima del polling continuo.",
    events_processed: "eventi elaborati",
    demo_cost: "costo demo",
    event_driven: "event-driven",
    architecture_footnote: "Pattern matching locale e modelli piccoli per le attività ricorrenti; ragionamento solo quando serve.",
    onboarding_welcome: "Benvenuto in Everyday Agent",
    onboarding_name_title: "Come vuoi che ti chiami?",
    onboarding_name_desc: "Inserisci il tuo nome per personalizzare l'agente. Nei primi 14 giorni calibrerò la fiducia delle singole combinazioni e potresti ricevere qualche notifica in più.",
    onboarding_never_title: "Cosa non farò mai",
    onboarding_consent: "Ho letto e accetto questi confini operativi.",
    start_calibration: "Inizia la calibrazione",
    your_name: "Il tuo nome",
    language_select: "Scegli la lingua",
    lang_it: "Italiano",
    lang_en: "English",
    confirm: "Conferma",
  },
  en: {
    nav_overview: "Overview",
    nav_decisions: "Decisions",
    nav_calendar: "Calendar",
    nav_home: "Home",
    nav_money: "Money",
    nav_health: "Health",
    nav_errands: "Errands",
    nav_family: "Family",
    nav_memory: "Memory",
    nav_integrations: "Integrations",
    nav_support: "Support",
    nav_settings: "Settings",
    nav_governance: "Governance",
    nav_workspace: "Workspace",
    nav_system: "System",
    agent_active: "Agent active",
    agent_ready: "Local space ready",
    topbar_space: "Your space",
    topbar_local: "Local",
    hero_date: "Your personal space",
    hero_title: "Your space",
    hero_copy: "Let's start with what you want to delegate.",
    add_task: "+ Add task",
    space_ready: "Your space is ready",
    space_ready_desc: "Add a request and I'll decide with you what to do.",
    customize: "Customize",
    today: "Today",
    agenda: "AGENDA",
    no_appointments: "No appointments",
    calendar_empty: "Calendar is empty",
    calendar_empty_desc: "Add your first event whenever you want.",
    open_calendar: "Open calendar",
    silent_done: "DONE IN SILENCE",
    tasks_silent: "tasks handled without interrupting you",
    since_start: "Since you started",
    month_spends: "MONTHLY SPENDS",
    no_spends: "No expenses recorded",
    view_details: "View details",
    recent: "Recent activity",
    recent_desc: "Things the agent will handle for you",
    mark_read: "Mark all read",
    no_activity: "No activity yet",
    no_activity_desc: "Agent actions will appear here.",
    next_digest: "NEXT DIGEST",
    your_rules: "According to your rules",
    digest_desc: "I'll collect non-urgent tasks without interrupting you.",
    digest_will_include: "Your digest will include",
    elements: "elements",
    preview_digest: "Preview digest",
    ai_title: "EVERYDAY AI",
    ai_subtitle: "Tell me what you want to delegate",
    ai_active: "active",
    ai_placeholder: "e.g. remind me about the water filter",
    ai_send: "Send request",
    ai_greeting: "I can handle the small stuff. For real decisions, I'll ask you first.",
    domains: "Domains",
    domains_desc: "Organize your daily life whenever you want",
    domain_home: "Home",
    domain_home_desc: "Maintenance and supplies",
    domain_money: "Money",
    domain_money_desc: "Budget and payments",
    domain_health: "Health",
    domain_health_desc: "Operational reminders",
    domain_errands: "Errands",
    domain_errands_desc: "Lists and bookings",
    domain_family: "Family",
    domain_family_desc: "People and documents",
    decisions_title: "Decisions",
    decisions_subtitle: "Every choice comes from the history of the specific combination.",
    decisions_eyebrow: "Dynamic trust · Your attention",
    pending: "PENDING",
    notifications_today: "NOTIFICATIONS TODAY",
    no_action_done: "No action has been taken",
    trust_engine_title: "DYNAMIC TRUST ENGINE",
    trust_engine_desc: "A different trust for every case",
    trust_engine_subtitle: "There is no longer a one-size-fits-all threshold: I observe action, counterparty and context.",
    new_combo: "New combination",
    new_combo_desc: "I start cautiously when I don't have a reliable history yet.",
    execute_inform: "I execute and inform",
    execute_inform_desc: "Trust allows the digest, if the action is reversible and within the dynamic limit.",
    can_act: "I can act",
    can_act_desc: "Only for observed, reversible cases and up to the trust-calculated cap.",
    protection: "Fixed protection:",
    protection_desc: "money, health and legal documents have an absolute cap and never reach silent execution.",
    calendar_eyebrow: "Personal agenda",
    calendar_desc: "Add the appointments you want to keep organized.",
    new_event: "+ New event",
    home_eyebrow: "Maintenance · Utilities · Supplies",
    home_desc: "The little things that keep everything running.",
    add: "Add",
    in_progress: "IN PROGRESS",
    activities: "activities",
    no_deadline_yet: "No deadline yet",
    supplies: "SUPPLIES",
    products: "products",
    empty_list: "Empty list",
    next_deadline: "NEXT DEADLINE",
    none: "None",
    will_notify: "I'll notify you in advance",
    money_eyebrow: "Budget · Payments · Reconciliation",
    money_desc: "Clear numbers, decisions only when needed.",
    register_expense: "+ Register expense",
    budget: "BUDGET",
    no_expense: "No expenses recorded",
    utilized: "utilized",
    recent_movements: "Recent movements",
    last_7_days: "Last 7 days",
    export: "Export",
    no_movement: "No movements recorded",
    movements_appear: "Movements will appear when you connect an account.",
    to_monitor: "To monitor",
    useful_signals: "Useful signals",
    no_signal: "No signals to monitor",
    will_notify_only: "I'll only notify you when there's something useful.",
    health_eyebrow: "Appointments · Therapies · Prescriptions",
    health_desc: "Clear reminders, no clinical advice.",
    add_appointment: "+ Add appointment",
    no_appointment: "No appointments recorded",
    add_reminder: "Add an operational reminder, without clinical advice.",
    reminders: "Reminders",
    operational_info: "Operational information only",
    no_reminder_yet: "No reminders yet",
    reminders_organized: "I'll keep them organized without giving clinical advice.",
    adherence: "Adherence",
    this_week: "This week",
    no_reminder_adherence: "No reminders yet",
    health_local: "Health data stays local and is not shared.",
    errands_eyebrow: "Shopping · Bookings · Deliveries",
    errands_desc: "I collect things to do and bring them to completion.",
    add_errand: "+ Add errand",
    shopping_list: "SHOPPING LIST",
    your_list: "Your list",
    empty_shopping: "Empty list",
    add_first_product: "Add the first product to remember.",
    add_product: "+ Add product",
    in_program: "In progress",
    bookings_deliveries: "Bookings and deliveries",
    no_errand: "No errands in progress",
    errands_appear: "Bookings and returns will appear here.",
    family_eyebrow: "Calendar · School · Documents",
    family_desc: "Everyone synced on important things.",
    add_commitment: "+ Add commitment",
    no_member: "No members",
    add_people: "Add people to coordinate",
    add_person: "Add person",
    new_member: "Coordinate a new member",
    upcoming_deadlines: "Upcoming deadlines",
    docs_activities: "Documents and activities",
    no_family_deadline: "No family deadlines",
    family_docs_appear: "Documents and activities will appear when you add them.",
    shared_calendar: "Shared calendar",
    no_sync: "No synchronization",
    no_person_synced: "No person synced",
    memory_eyebrow: "Preferences · Patterns · Rules",
    memory_desc: "I learn how to help you without forgetting your boundaries.",
    manage_data: "Manage data",
    local_memory: "LOCAL MEMORY",
    no_preference_saved: "No preferences saved",
    memory_desc2: "Every rule stays under your control.",
    explicit_prefs: "Explicit preferences",
    declared_by_you: "Declared by you",
    no_explicit_prefs: "No preferences saved",
    prefs_appear: "Your rules will appear here after you configure them.",
    observed_patterns: "Observed patterns",
    autonomy_suggestions: "Autonomy suggestions",
    no_pattern: "No patterns observed",
    agent_learn: "The agent will learn from your choices, without automating on its own.",
    silent_costs: "Silent costs",
    monthly_digest: "Monthly dedicated digest",
    no_cost: "No costs to check",
    unused_subscriptions: "I'll flag subscriptions unused for 90 days and possible duplicates.",
    hidden_deadlines: "Hidden deadlines radar",
    guarantees_bonus: "Warranties · bonuses · vacations",
    no_hidden_deadline: "No deadlines detected",
    will_track_deadlines: "I'll track deadlines that tend to slip through.",
    integrations_eyebrow: "Secure connections",
    integrations_desc: "Connect only what you want to delegate.",
    calendar_int: "Calendar",
    calendar_int_desc: "Personal and shared family",
    calendar_int_perm: "Read and organize · never delete without confirmation",
    available: "Available",
    email_int: "Email",
    email_int_desc: "Reading and organization",
    email_int_perm: "No autonomous sending",
    bank_int: "Bank accounts and cards",
    bank_int_desc: "Balance and movements read-only",
    bank_int_perm: "Payments only with explicit confirmation",
    grocery_int: "Lists and shopping",
    grocery_int_desc: "Supplies and recurring products",
    grocery_int_perm: "Can update authorized lists",
    home_int: "Smart home",
    home_int_desc: "Thermostat and security",
    home_int_perm: "Only authorized commands · no third-party access",
    health_int: "Records and pharmacy",
    health_int_desc: "Operational reminders",
    health_int_perm: "No clinical advice or sharing",
    booking_int: "Bookings",
    booking_int_desc: "Restaurants, services and transport",
    booking_int_perm: "Booking or cancellation always requires confirmation",
    family_docs_int: "Family documents",
    family_docs_int_desc: "School, passports and deadlines",
    family_docs_int_perm: "Minimum access and consent for every sharing",
    your_data: "Your data, your rules",
    your_data_desc: "Integrations read only necessary data. Payments, sends, deletions and health data always require explicit authorization for each case.",
    real_connections: "Real connections require consent",
    real_connections_desc: "The demo saves only local configuration. Before connecting services you need secure authentication, minimum permissions, audit and confirmation for every sensitive action.",
    settings_eyebrow: "Autonomy control",
    settings_desc: "Set your boundaries; trust is built through real interactions.",
    trust_engine: "Trust engine",
    no_generic_threshold: "No generic threshold for everyone",
    dynamic_spending: "Spending threshold is dynamic",
    dynamic_spending_desc: "Each combination starts at 20/100. The limit grows only with observed approvals and decays over time; the maximum operational cap is €400 for non-sensitive domains.",
    cautious_base: "cautious base",
    observed_exec: "observed execution",
    decay_50: "50% decay",
    active_notifications: "Active notifications",
    max_per_day: "Maximum per day, excluding emergencies",
    morning_digest: "Morning digest",
    non_urgent_summary: "Non-urgent summary",
    evening_digest: "Evening digest",
    completed_summary: "Completed tasks summary",
    notification_channel: "Notification channel",
    urgent_digest: "For urgent decisions and digest",
    never_automate: "Topics never automated",
    comma_separated: "Separate with a comma",
    save_rules: "Save rules",
    important_boundaries: "Important boundaries",
    never_automate_desc: "Never automate without you",
    payments: "Payments and transfers",
    always_confirm: "Always require confirmation",
    health_data: "Health data",
    no_share: "Do not share with third parties",
    contracts: "Contracts and signatures",
    deletions: "Deletions",
    confirm_before_delete: "Explicit confirmation before deleting",
    governance_eyebrow: "Transparency · Control · Continuity",
    governance_desc: "Understand what the agent does, correct it and take back your data when you want.",
    calibration: "CALIBRATION",
    trial_period: "Trial period",
    calibration_active: "active",
    calibration_desc: "I'm still calibrating trust per combination: you might get some extra notifications.",
    restart_calibration: "Restart calibration",
    kpi_title: "Results control",
    kpi_subtitle: "I measure useful silence, not engagement.",
    notifications_avoided: "notifications avoided",
    time_saved: "estimated time saved",
    deescalation: "requests made autonomous",
    error_rate: "errors per 1000 actions",
    compute_cost: "demo compute cost",
    trust_memory: "TRUST MEMORY",
    known_combinations: "Known combinations",
    trust_memory_desc: "Each new combination starts cautiously at 20/100.",
    global_manual: "Global manual",
    trust_active: "trust active",
    ask_always: "Always ask me",
    observed_combinations: "observed combinations",
    safe_cap: "Non-sensitive cap · €400 max",
    no_history_yet: "No history yet",
    build_first_profile: "Approve or reject a request to build the first profile.",
    fixed_caps: "Fixed caps:",
    fixed_caps_desc: "money, health and legal documents cannot auto-expand their autonomy, even with 100/100 trust.",
    family_perms: "FAMILY PERMISSIONS",
    approval_matrix: "Approval matrix",
    child_no_inherit: "A child does not inherit the main user's powers.",
    partner_money: "Partner · money",
    no_power: "No power",
    can_approve: "Can approve",
    can_manage: "Can manage",
    partner_health: "Partner · health",
    teen_errands: "Teen · errands",
    teen_money: "Teen · money",
    save_permissions: "Save permissions",
    smart_dnd: "SMART DO NOT DISTURB",
    protect_time: "Protect your time",
    smart_dnd_desc: "Postpone non-urgent items during delicate moments.",
    normal: "normal",
    current_context: "Current context",
    current_context_desc: "Travel, holidays or family weekend",
    auto_detection: "Auto detection",
    auto_detection_desc: "Emergencies always remain immediate",
    save_context: "Save context",
    integrations_title: "Technical issues",
    integrations_subtitle: "Separate from user decisions",
    no_tech_issue: "No technical issues",
    expired_access: "An expired access will appear here with separate priority.",
    simulate_failure: "Simulate expired access",
    gdpr: "GDPR",
    data_transparency: "Data transparency",
    audit_local: "local audit",
    data_retention: "I keep local data for 90 days and the action log for the required period. Legal basis: consent.",
    no_domain_consent: "No domain consent",
    always_renewable: "autonomy always renewable",
    audit_pending: "Audit pending",
    audit_chain: "verifiable local chain",
    export_data: "Export data",
    delete_data: "Delete data",
    never_do_title: "WHAT I WILL NEVER DO",
    declared_boundaries: "Declared boundaries",
    shown_before: "Shown before activation",
    seasonal: "SEASONALITY",
    anticipate_peaks: "Anticipate peaks",
    recurring_period: "Recurring period",
    recurring_period_desc: "Name, month and day separated by commas",
    add_period: "Add period",
    no_custom_period: "No custom periods",
    offboarding: "OFFBOARDING",
    pause_or_deactivate: "Pause or deactivate",
    offboarding_desc: "Before turning off the agent I prepare a package with open decisions, preferences and deadlines, revoke external tokens and leave you the final handover.",
    pause: "Pause",
    prepare_handover: "Prepare handover",
    no_handover: "No handover package created.",
    cold_start: "COLD START",
    import_what_you_choose: "Import only what you choose",
    cold_start_subtitle: "First import, then declared calibration.",
    import: "import",
    cold_start_desc: "I start cautiously at 20/100. You can import historical patterns only after separate consent.",
    money_consent: "Money consent",
    simulate_import: "Simulate authorized import",
    no_invented_data: "No data is invented or sent to external services.",
    responsibility: "RESPONSIBILITY",
    safety_first: "Safety first, then autonomy",
    responsibility_desc: "The model proposes; a separate executor will apply permissions and caps.",
    read_only: "Read-only",
    read_only_desc: "Calendars, email and accounts via minimum scopes.",
    human_loop: "Human-in-the-loop",
    human_loop_desc: "The agent prepares; you confirm with a tap.",
    limited_autonomy: "Limited autonomy",
    limited_autonomy_desc: "Only after months of data, domain consent and verifiable audit.",
    demo_no_creds: "The demo does not access credentials, make payments or contact third parties.",
    sustainable_model: "SUSTAINABLE MODEL",
    value_no_sell: "Value without selling data",
    sustainable_desc: "Subscription for autonomy depth, not for noise or features.",
    base_plan: "Base",
    base_plan_desc: "read-only",
    assisted_plan: "Assisted",
    assisted_plan_desc: "human confirmation",
    autonomous_plan: "Autonomous",
    autonomous_plan_desc: "scopes and caps",
    family_plan: "Family",
    family_plan_desc: "separate roles",
    actions_registered: "actions registered",
    automations_never_disabled: "automations never disabled",
    crisis_error: "ERROR CRISIS",
    crisis_title: "Transparency when something goes wrong",
    no_error: "no errors",
    crisis_desc: "If an error is recorded, trust drops only for that combination, the event becomes immediate and the system shows what happened, what it's doing and what you can do.",
    simulate_error: "Simulate local error",
    verify_audit: "Verify audit",
    crisis_footnote: "Promise: verifiable correction, not \"zero errors\".",
    awareness: "AWARENESS",
    autonomy_check: "Periodic autonomy check",
    awareness_desc: "I don't let delegation become automatic or opaque.",
    no_excessive: "No signs of excessive reliance. You can always stop everything in one step.",
    review_autonomy: "Review autonomy",
    architecture: "ARCHITECTURE",
    sustainable_monitoring: "Sustainable monitoring",
    architecture_desc: "Event triggers before continuous polling.",
    events_processed: "events processed",
    demo_cost: "demo cost",
    event_driven: "event-driven",
    architecture_footnote: "Local pattern matching and small models for recurring activities; reasoning only when needed.",
    onboarding_welcome: "Welcome to Everyday Agent",
    onboarding_name_title: "What would you like to be called?",
    onboarding_name_desc: "Enter your name to personalize the agent. For the first 14 days I'll calibrate trust for each combination and you might get some extra notifications.",
    onboarding_never_title: "What I will never do",
    onboarding_consent: "I have read and accept these operational boundaries.",
    start_calibration: "Start calibration",
    your_name: "Your name",
    language_select: "Choose language",
    lang_it: "Italiano",
    lang_en: "English",
    confirm: "Confirm",
  }
};

let currentLang = "it";

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || (translations["it"] && translations["it"][key]) || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (text) {
      if (el.tagName === "INPUT" && el.type !== "checkbox") {
        el.placeholder = text;
      } else if (el.tagName === "OPTION") {
        el.textContent = text;
      } else {
        el.textContent = text;
      }
    }
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    const text = t(key);
    if (text) el.innerHTML = text;
  });
  document.documentElement.lang = currentLang;
}

const defaultState = {
  language: "it",
  // `threshold` resta solo per compatibilità con vecchi salvataggi: la policy
  // generale usa la fiducia per la combinazione azione/controparte/contesto.
  threshold: 50,
  notificationLimit: 3,
  trustBaselineScore: 20,
  trustAutoExecuteScore: 85,
  trustReportScore: 55,
  trustMaxSpendEur: 400,
  trustDecayHalfLifeDays: 365,
  trustImportDiscount: 0.35,
  trustSensitiveCaps: { money: 60, health: 50, legal: 45, contract: 45, documents: 45, familyDocs: 45 },
  trustProfiles: {},
  trustInteractions: [],
  trustProposals: [],
  domainConsents: {},
  auditLog: [],
  auditHead: "",
  coldStart: { phase: "import", historicalImported: false, importedAt: "", source: "" },
  executionErrors: [],
  crisisEvents: [],
  autonomyReviews: [],
  computeEvents: [],
  businessMetrics: { automationsNeverDisabled: 0, automationsDisabled: 0, actionsExecuted: 0, executionErrors: 0, guaranteeCostEur: 0, revenueEur: 0 },
  manualMode: false,
  autonomousMoneyEnabled: false,
  moneySingleTransactionCapEur: 100,
  moneyMonthlyCapEur: 300,
  autonomyConsentRenewalDays: 180,
  auditRetentionDays: 365,
  businessPlan: "base",
  eventDrivenMonitoring: true,
  computeCostTargetEur: 0,
  completed: 0,
  pending: [],
  dismissed: [],
  customTasks: [],
  calendarEvents: [],
  timeEntries: [],
  controlEvents: [],
  preferences: [],
  rejections: [],
  rejectionKeys: [],
  notificationsUsed: 0,
  notificationDate: "",
  queuedNotifications: [],
  deferred: [],
  digestTimes: ["08:00", "19:00"],
  boundaries: { payments: true, health: true, contracts: true, deletions: true },
  neverAutomate: [],
  integrations: { calendar: false, email: false, bank: false, grocery: false, home: false, health: false, bookings: false, familyDocs: false },
  notificationChannel: "push",
  context: "",
  smartDnd: true,
  subscriptions: [],
  silentCosts: [],
  hiddenDeadlines: [],
  documents: [],
  routingRules: {},
  emergencyDelegate: "",
  calibrationStartedAt: "",
  calibrationDays: 14,
  calibrationExtraNotifications: 2,
  paused: false,
  familyPermissions: { owner: { "*": ["all"] }, partner: {}, teen: {} },
  familyMembers: [],
  approvalCounts: {},
  automationSuggestions: [],
  technicalIssues: [],
  actionLog: [],
  undoLog: [],
  metrics: { notificationsAvoided: 0, timeSavedMinutes: 0, level3Total: 0, level3Deescalated: 0, level3Approved: 0, notificationsTotal: 0 },
  privacy: { retentionDays: 90, legalBasis: "consent", thirdPartySharing: false, policiesAcknowledged: false },
  seasonalPeriods: [
    { name: "Dichiarazione dei redditi", month: 5, day: 31, lead_days: 45 },
    { name: "Rientro a scuola", month: 9, day: 1, lead_days: 30 },
    { name: "Rinnovi di fine anno", month: 12, day: 1, lead_days: 45 }
  ],
  neverDo: [
    "Non parlerò mai con un medico, avvocato o consulente senza supervisione diretta.",
    "Non firmerò né accetterò mai contratti legalmente vincolanti in autonomia.",
    "Non modificherò mai testamenti o altri documenti legali.",
    "Non condividerò mai dati sanitari o finanziari senza il consenso del proprietario.",
    "Non supererò mai i tetti massimi di spesa, indipendentemente dalla fiducia.",
    "Non venderò né condividerò mai i tuoi dati per finalità commerciali.",
    "Non sostituirò mai una relazione umana né userò un framing affettivo."
  ],
  offboarding: { paused: false, handoverCreatedAt: "", handover: null, mode: "active" },
  simulationReport: null,
  simulationScenario: { name: "Marta Rossi", monthly_income_eur: 4200, partner: "Luca", child: "Nina", pet: "gatto", trusted_provider: "Idraulico Fidato", habits: ["approva rapidamente i fornitori conosciuti", "risponde tardi ai contratti", "controlla il budget la domenica"] },
  policiesAcknowledged: false,
};

const state = loadState();
let toastTimer;

const API_BASE = window.EVERYDAY_AGENT_API || "/api";
const backend = {
  available: false,
  authenticated: false,
  csrfToken: "",
  stateVersion: null,
  user: null,
  workspace: null,
  syncing: false,
  syncQueued: false,
  syncTimer: null,
  syncSuspended: false,
  status: "Backend locale non rilevato: la dashboard resta sul dispositivo."
};

function todayKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const today = todayKey();
    const hasStoredNotificationDate = Object.prototype.hasOwnProperty.call(stored, "notificationDate");
    const sameDay = !hasStoredNotificationDate || stored.notificationDate === today;
    return {
      ...defaultState,
      ...stored,
      notificationsUsed: sameDay ? Number(stored.notificationsUsed ?? defaultState.notificationsUsed) : 0,
      notificationDate: today,
      integrations: { ...defaultState.integrations, ...(stored.integrations || {}) },
      boundaries: { ...defaultState.boundaries, ...(stored.boundaries || {}) },
      trustBaselineScore: Number(stored.trustBaselineScore ?? defaultState.trustBaselineScore),
      trustAutoExecuteScore: Number(stored.trustAutoExecuteScore ?? defaultState.trustAutoExecuteScore),
      trustReportScore: Number(stored.trustReportScore ?? defaultState.trustReportScore),
      trustMaxSpendEur: Number(stored.trustMaxSpendEur ?? defaultState.trustMaxSpendEur),
      trustDecayHalfLifeDays: Number(stored.trustDecayHalfLifeDays ?? defaultState.trustDecayHalfLifeDays),
      trustImportDiscount: Number(stored.trustImportDiscount ?? defaultState.trustImportDiscount),
      trustSensitiveCaps: { ...defaultState.trustSensitiveCaps, ...(stored.trustSensitiveCaps || {}) },
      trustProfiles: stored.trustProfiles && typeof stored.trustProfiles === "object" ? stored.trustProfiles : {},
      trustInteractions: Array.isArray(stored.trustInteractions) ? stored.trustInteractions : [],
      trustProposals: Array.isArray(stored.trustProposals) ? stored.trustProposals : [],
      domainConsents: stored.domainConsents && typeof stored.domainConsents === "object" ? stored.domainConsents : {},
      auditLog: Array.isArray(stored.auditLog) ? stored.auditLog : [],
      auditHead: String(stored.auditHead || ""),
      coldStart: { ...defaultState.coldStart, ...(stored.coldStart || {}) },
      executionErrors: Array.isArray(stored.executionErrors) ? stored.executionErrors : [],
      crisisEvents: Array.isArray(stored.crisisEvents) ? stored.crisisEvents : [],
      autonomyReviews: Array.isArray(stored.autonomyReviews) ? stored.autonomyReviews : [],
      computeEvents: Array.isArray(stored.computeEvents) ? stored.computeEvents : [],
      businessMetrics: { ...defaultState.businessMetrics, ...(stored.businessMetrics || {}) },
      manualMode: Boolean(stored.manualMode),
      autonomousMoneyEnabled: Boolean(stored.autonomousMoneyEnabled),
      moneySingleTransactionCapEur: Number(stored.moneySingleTransactionCapEur ?? defaultState.moneySingleTransactionCapEur),
      moneyMonthlyCapEur: Number(stored.moneyMonthlyCapEur ?? defaultState.moneyMonthlyCapEur),
      autonomyConsentRenewalDays: Number(stored.autonomyConsentRenewalDays ?? defaultState.autonomyConsentRenewalDays),
      auditRetentionDays: Number(stored.auditRetentionDays ?? defaultState.auditRetentionDays),
      businessPlan: stored.businessPlan || defaultState.businessPlan,
      eventDrivenMonitoring: stored.eventDrivenMonitoring !== false,
      computeCostTargetEur: Number(stored.computeCostTargetEur ?? defaultState.computeCostTargetEur),
      digestTimes: Array.isArray(stored.digestTimes) ? stored.digestTimes : [...defaultState.digestTimes],
      pending: Array.isArray(stored.pending) ? stored.pending : [...defaultState.pending],
      dismissed: Array.isArray(stored.dismissed) ? stored.dismissed : [],
      customTasks: Array.isArray(stored.customTasks) ? stored.customTasks : [],
      calendarEvents: Array.isArray(stored.calendarEvents) ? stored.calendarEvents : [],
      timeEntries: Array.isArray(stored.timeEntries) ? stored.timeEntries : [],
      controlEvents: Array.isArray(stored.controlEvents) ? stored.controlEvents : [],
      rejections: Array.isArray(stored.rejections) ? stored.rejections : [],
      rejectionKeys: Array.isArray(stored.rejectionKeys) ? stored.rejectionKeys : [],
      neverAutomate: Array.isArray(stored.neverAutomate) ? stored.neverAutomate : [],
      notificationChannel: stored.notificationChannel || defaultState.notificationChannel,
      queuedNotifications: Array.isArray(stored.queuedNotifications) ? stored.queuedNotifications : [],
      deferred: Array.isArray(stored.deferred) ? stored.deferred : [],
      subscriptions: Array.isArray(stored.subscriptions) ? stored.subscriptions : [],
      silentCosts: Array.isArray(stored.silentCosts) ? stored.silentCosts : [],
      hiddenDeadlines: Array.isArray(stored.hiddenDeadlines) ? stored.hiddenDeadlines : [],
      documents: Array.isArray(stored.documents) ? stored.documents : [],
      routingRules: stored.routingRules && typeof stored.routingRules === "object" ? stored.routingRules : {},
      emergencyDelegate: stored.emergencyDelegate || "",
      calibrationStartedAt: stored.calibrationStartedAt || "",
      calibrationDays: Number(stored.calibrationDays || defaultState.calibrationDays),
      calibrationExtraNotifications: Number(stored.calibrationExtraNotifications ?? defaultState.calibrationExtraNotifications),
      paused: Boolean(stored.paused || stored.offboarding?.paused),
      familyPermissions: stored.familyPermissions && typeof stored.familyPermissions === "object" ? stored.familyPermissions : structuredClone(defaultState.familyPermissions),
      familyMembers: Array.isArray(stored.familyMembers) ? stored.familyMembers : [],
      approvalCounts: stored.approvalCounts && typeof stored.approvalCounts === "object" ? stored.approvalCounts : {},
      automationSuggestions: Array.isArray(stored.automationSuggestions) ? stored.automationSuggestions : [],
      technicalIssues: Array.isArray(stored.technicalIssues) ? stored.technicalIssues : [],
      actionLog: Array.isArray(stored.actionLog) ? stored.actionLog : [],
      undoLog: Array.isArray(stored.undoLog) ? stored.undoLog : [],
      metrics: { ...defaultState.metrics, ...(stored.metrics || {}) },
      privacy: { ...defaultState.privacy, ...(stored.privacy || {}) },
      seasonalPeriods: Array.isArray(stored.seasonalPeriods) ? stored.seasonalPeriods : JSON.parse(JSON.stringify(defaultState.seasonalPeriods)),
      neverDo: Array.isArray(stored.neverDo) ? stored.neverDo : [...defaultState.neverDo],
      offboarding: { ...defaultState.offboarding, ...(stored.offboarding || {}) },
      simulationReport: stored.simulationReport && typeof stored.simulationReport === "object" ? stored.simulationReport : null,
      simulationScenario: { ...defaultState.simulationScenario, ...(stored.simulationScenario || {}), habits: Array.isArray(stored.simulationScenario?.habits) ? stored.simulationScenario.habits : [...defaultState.simulationScenario.habits] },
      policiesAcknowledged: Boolean(stored.policiesAcknowledged || stored.privacy?.policiesAcknowledged),
      neverDo: Array.isArray(stored.neverDo) && stored.neverDo.length ? stored.neverDo : [...defaultState.neverDo]
    };
  } catch (error) {
    return { ...defaultState, notificationDate: todayKey(), integrations: { ...defaultState.integrations }, boundaries: { ...defaultState.boundaries } };
  }
}

function saveState() {
  state.notificationDate = todayKey();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleBackendStateSync();
}

function backendErrorMessage(error) {
  return error?.message || "Il backend locale non ha completato la richiesta.";
}

async function backendRequest(path, { method = "GET", body, csrf = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrf && backend.csrfToken) headers["X-CSRF-Token"] = backend.csrfToken;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (cause) {
    const error = new Error("Backend locale non raggiungibile. Avvialo con api_server.py --serve-static.");
    error.code = "backend_unavailable";
    error.cause = cause;
    throw error;
  }
  const raw = await response.text();
  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const detail = payload?.error || {};
    const error = new Error(detail.message || `Il backend ha risposto con ${response.status}.`);
    error.code = detail.code || `http_${response.status}`;
    error.details = detail.details || {};
    error.status = response.status;
    throw error;
  }
  return payload;
}

function setBackendSession(payload) {
  backend.available = true;
  backend.authenticated = Boolean(payload?.authenticated);
  backend.csrfToken = payload?.csrfToken || backend.csrfToken || "";
  backend.user = payload?.user || null;
  backend.workspace = payload?.workspace || null;
  backend.stateVersion = Number.isInteger(payload?.workspace?.stateVersion) ? payload.workspace.stateVersion : backend.stateVersion;
  backend.status = backend.authenticated
    ? `Connesso come ${backend.user?.name || "utente"}. I dati restano nel tuo backend locale.`
    : "Backend locale pronto: accedi o crea un account per sincronizzare lo spazio.";
  updateBackendAccountUI();
}

function mergeRemoteState(remote) {
  const stored = remote && typeof remote === "object" ? remote : {};
  return {
    ...defaultState,
    ...stored,
    integrations: { ...defaultState.integrations, ...(stored.integrations || {}) },
    boundaries: { ...defaultState.boundaries, ...(stored.boundaries || {}) },
    trustSensitiveCaps: { ...defaultState.trustSensitiveCaps, ...(stored.trustSensitiveCaps || {}) },
    trustProfiles: stored.trustProfiles && typeof stored.trustProfiles === "object" ? stored.trustProfiles : {},
    trustInteractions: Array.isArray(stored.trustInteractions) ? stored.trustInteractions : [],
    trustProposals: Array.isArray(stored.trustProposals) ? stored.trustProposals : [],
    domainConsents: stored.domainConsents && typeof stored.domainConsents === "object" ? stored.domainConsents : {},
    familyPermissions: stored.familyPermissions && typeof stored.familyPermissions === "object" ? stored.familyPermissions : structuredClone(defaultState.familyPermissions),
    metrics: { ...defaultState.metrics, ...(stored.metrics || {}) },
    privacy: { ...defaultState.privacy, ...(stored.privacy || {}) },
    businessMetrics: { ...defaultState.businessMetrics, ...(stored.businessMetrics || {}) },
    coldStart: { ...defaultState.coldStart, ...(stored.coldStart || {}) },
    offboarding: { ...defaultState.offboarding, ...(stored.offboarding || {}) },
    customTasks: Array.isArray(stored.customTasks) ? stored.customTasks : [],
    pending: Array.isArray(stored.pending) ? stored.pending : [],
    queuedNotifications: Array.isArray(stored.queuedNotifications) ? stored.queuedNotifications : [],
    deferred: Array.isArray(stored.deferred) ? stored.deferred : [],
    dismissed: Array.isArray(stored.dismissed) ? stored.dismissed : [],
    auditLog: Array.isArray(stored.auditLog) ? stored.auditLog : [],
    auditHead: String(stored.auditHead || ""),
    notificationDate: todayKey()
  };
}

function applyRemoteState(remote) {
  const next = mergeRemoteState(remote);
  backend.syncSuspended = true;
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  backend.syncSuspended = false;
  updatePersonalization();
  renderCustomTasks();
  renderCustomDecisions();
  updateDecisionCount();
  showOnboarding();
}

function updateBackendAccountUI() {
  const badge = document.getElementById("backendModeBadge");
  const status = document.getElementById("backendAccountStatus");
  const loginPanel = document.getElementById("backendUnauthenticatedPanel");
  const accountPanel = document.getElementById("backendAuthenticatedPanel");
  const identity = document.getElementById("backendIdentity");
  const version = document.getElementById("backendStateVersion");
  const syncStatus = document.getElementById("backendSyncStatus");
  if (badge) {
    badge.textContent = backend.authenticated ? "connesso" : backend.available ? "pronto" : "solo locale";
    badge.classList.toggle("active-badge", backend.authenticated);
  }
  if (status) status.textContent = backend.status;
  if (loginPanel) loginPanel.hidden = backend.authenticated;
  if (accountPanel) accountPanel.hidden = !backend.authenticated;
  if (identity) identity.textContent = backend.authenticated ? `${backend.user?.name || "Utente"} · ${backend.workspace?.role || "owner"}` : "";
  if (version) version.textContent = backend.authenticated ? `Versione spazio ${backend.stateVersion ?? 0}` : "";
  if (syncStatus) syncStatus.textContent = backend.authenticated ? backend.status : "I dati restano in localStorage finché non accedi al backend locale.";
  const topbarMode = document.getElementById("backendTopbarStatus");
  if (topbarMode) topbarMode.textContent = backend.authenticated ? "Backend locale" : "Locale";
}

function scheduleBackendStateSync() {
  if (!backend.authenticated || backend.syncSuspended || typeof window === "undefined") return;
  window.clearTimeout(backend.syncTimer);
  backend.syncTimer = window.setTimeout(() => { void syncStateToBackend(); }, 450);
}

async function syncStateToBackend({ notify = false } = {}) {
  if (!backend.authenticated || backend.syncSuspended) return false;
  if (backend.syncing) {
    backend.syncQueued = true;
    return false;
  }
  backend.syncing = true;
  try {
    const response = await backendRequest("/state", {
      method: "PUT",
      csrf: true,
      body: { state: JSON.parse(JSON.stringify(state)), version: backend.stateVersion ?? 0 }
    });
    backend.stateVersion = response.version;
    backend.status = `Sincronizzato nel backend locale alle ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}.`;
    if (notify) showToast("Spazio sincronizzato nel backend locale.");
    return true;
  } catch (error) {
    if (error.code === "state_conflict") {
      backend.stateVersion = Number.isInteger(error.details?.currentVersion) ? error.details.currentVersion : null;
      backend.status = "Un'altra sessione ha modificato lo spazio. Carica la copia server prima di salvare di nuovo.";
    } else if (error.code === "csrf_failed") {
      backend.status = "Sessione aggiornata: riprova la sincronizzazione.";
      await initializeBackend({ loadState: false, silent: true });
    } else {
      backend.status = backendErrorMessage(error);
    }
    if (notify) showToast(backend.status, "warning");
    return false;
  } finally {
    backend.syncing = false;
    updateBackendAccountUI();
    if (backend.syncQueued) {
      backend.syncQueued = false;
      void syncStateToBackend();
    }
  }
}

async function loadStateFromBackend({ initializeEmpty = false, notify = false } = {}) {
  if (!backend.authenticated) return false;
  try {
    const response = await backendRequest("/state");
    backend.stateVersion = response.version;
    const remote = response.state && typeof response.state === "object" ? response.state : {};
    if (Object.keys(remote).length) {
      applyRemoteState(remote);
      backend.status = "Spazio caricato dal backend locale.";
    } else if (initializeEmpty) {
      await syncStateToBackend({ notify: false });
      backend.status = "Nuovo spazio inizializzato con le regole presenti sul dispositivo.";
    } else {
      backend.status = "Lo spazio server è vuoto: puoi caricare i dati locali quando vuoi.";
    }
    if (notify) showToast(backend.status);
    updateBackendAccountUI();
    return true;
  } catch (error) {
    backend.status = backendErrorMessage(error);
    updateBackendAccountUI();
    if (notify) showToast(backend.status, "warning");
    return false;
  }
}

async function initializeBackend({ loadState = true, silent = false } = {}) {
  try {
    const session = await backendRequest("/session");
    setBackendSession(session);
    if (session.authenticated && loadState) await loadStateFromBackend({ initializeEmpty: false, notify: false });
  } catch (error) {
    backend.available = false;
    backend.authenticated = false;
    backend.csrfToken = "";
    backend.status = "Backend locale non rilevato: la dashboard resta sul dispositivo.";
    if (!silent) updateBackendAccountUI();
  }
}


function resetDailyNotifications() {
  if (state.notificationDate === todayKey()) return;
  state.notificationDate = todayKey();
  state.notificationsUsed = 0;
  state.queuedNotifications = [];
  saveState();
}

function getUserName() {
  return String(state.userName || "").trim();
}

function initialsFor(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || "EA").toUpperCase();
}

function updatePersonalization() {
  const name = getUserName();
  const date = new Date();
  const formattedDate = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(date);
  document.getElementById("dashboardDate")?.replaceChildren(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  document.getElementById("todayLabel")?.replaceChildren(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  const greeting = document.getElementById("greetingTitle");
  const copy = document.getElementById("greetingCopy");
  const initials = document.getElementById("profileInitials");
  if (greeting) greeting.innerHTML = `${name ? `Buongiorno, ${escapeHTML(name)}` : "Il tuo spazio"}<span class="title-period">.</span>`;
  if (copy) copy.textContent = name ? "Tutto pronto. Dimmi cosa vuoi delegare." : "Partiamo da ciò che vuoi affidarmi.";
  if (initials) initials.textContent = initialsFor(name);
}

function calibrationActive() {
  if (!state.calibrationStartedAt) return false;
  const elapsed = Date.now() - new Date(state.calibrationStartedAt).getTime();
  return Number.isFinite(elapsed) && elapsed < Number(state.calibrationDays || 14) * 86400000;
}

function calibrationMessage() {
  return calibrationActive() ? `Sto ancora calibrando la fiducia per singola combinazione: per i primi ${state.calibrationDays || 14} giorni potresti ricevere qualche notifica in più.` : "Calibrazione completata: ora applico la fiducia appresa caso per caso.";
}

function applyTranslationsToOnboarding() {
  currentLang = state.language || "it";
  applyTranslations();
}

function showOnboarding() {
  const backdrop = document.getElementById("onboardingBackdrop");
  if (!backdrop) return;
  if (getUserName() && state.policiesAcknowledged) {
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
    applyTranslationsToOnboarding();
    return;
  }
  const policyList = document.getElementById("onboardingNeverDoList");
  if (policyList) policyList.innerHTML = state.neverDo.map((item) => `<li>${escapeHTML(item)}</li>`).join("");
  const policyInput = document.getElementById("onboardingPoliciesAcknowledged");
  if (policyInput) policyInput.checked = Boolean(state.policiesAcknowledged);
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => document.getElementById("userNameInput")?.focus(), 80);
}

function setupOnboarding() {
  const backdrop = document.getElementById("onboardingBackdrop");
  const form = document.getElementById("onboardingForm");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("userNameInput")?.value.trim();
    const policiesAcknowledged = Boolean(document.getElementById("onboardingPoliciesAcknowledged")?.checked);
    if (!name || !policiesAcknowledged) return;
    state.userName = name;
    state.policiesAcknowledged = true;
    state.privacy = { ...state.privacy, policiesAcknowledged: true };
    const langSelect = document.getElementById("onboardingLanguageSelect");
    if (langSelect && langSelect.value) {
      state.language = langSelect.value;
    }
    if (!state.calibrationStartedAt) state.calibrationStartedAt = new Date().toISOString();
    saveState();
    currentLang = state.language || "it";
    applyTranslations();
    updatePersonalization();
    updateDecisionCount();
    backdrop?.classList.remove("open");
    backdrop?.setAttribute("aria-hidden", "true");
    const greeting = currentLang === "en" ? `Nice to meet you, ${name}.` : `Piacere di conoscerti, ${name}.`;
    showToast(greeting);
  });
  document.getElementById("editNameButton")?.addEventListener("click", () => {
    const input = document.getElementById("userNameInput");
    input.value = getUserName();
    const policyInput = document.getElementById("onboardingPoliciesAcknowledged");
    if (policyInput) policyInput.checked = Boolean(state.policiesAcknowledged);
    const langSelect = document.getElementById("onboardingLanguageSelect");
    if (langSelect) langSelect.value = state.language || "it";
    backdrop?.classList.add("open");
    backdrop?.setAttribute("aria-hidden", "false");
    input.focus();
  });
  const langSelect = document.getElementById("onboardingLanguageSelect");
  if (langSelect) langSelect.value = state.language || "it";
  applyTranslationsToOnboarding();
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.querySelector("p").textContent = message;
  toast.querySelector("span").textContent = type === "warning" ? "!" : "✓";
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function updateDecisionCount() {
  const count = state.pending.length;
  const badge = document.getElementById("decisionBadge");
  const pendingCount = document.getElementById("pendingCount");
  const used = document.getElementById("notificationsUsed");
  const limit = document.getElementById("notificationLimitSummary");
  const silentCount = document.getElementById("silentCount");
  if (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
  if (pendingCount) pendingCount.textContent = `${count} decision${count === 1 ? "e" : "i"}`;
  if (used) used.textContent = state.notificationsUsed;
  if (limit) limit.textContent = state.notificationLimit;
  if (silentCount) silentCount.textContent = state.completed;
  const digestElementCount = document.getElementById("digestElementCount");
  if (digestElementCount) {
    const count = state.customTasks.length + state.pending.length;
    digestElementCount.textContent = `${count} element${count === 1 ? "o" : "i"}`;
  }
  const memorySummary = document.getElementById("memorySummary");
  const memoryScore = document.getElementById("memoryScore");
  const preferenceCount = state.preferences.length + state.neverAutomate.length;
  const trustValues = Object.values(state.trustProfiles || {}).map((item) => decayedTrustScore(item.score, item.lastInteractionAt));
  const trustAverage = trustValues.length ? trustValues.reduce((total, value) => total + value, 0) / trustValues.length : Number(state.trustBaselineScore || 20);
  if (memorySummary) memorySummary.textContent = trustValues.length ? `${trustValues.length} combinazion${trustValues.length === 1 ? "e" : "i"} di fiducia osservat${trustValues.length === 1 ? "a" : "e"}` : preferenceCount ? `${preferenceCount} preferenz${preferenceCount === 1 ? "a" : "e"} salvata` : "Nessuna storia di fiducia salvata";
  if (memoryScore) memoryScore.textContent = `${trustAverage.toFixed(0)}/100`;
  document.getElementById("calibrationStatus")?.replaceChildren(calibrationMessage());
  document.getElementById("calibrationBadge")?.toggleAttribute("hidden", !calibrationActive());
  const avoided = document.getElementById("kpiNotificationsAvoided");
  const saved = document.getElementById("kpiTimeSaved");
  const deescalation = document.getElementById("kpiDeescalation");
  if (avoided) avoided.textContent = state.metrics.notificationsAvoided;
  if (saved) saved.textContent = `${state.metrics.timeSavedMinutes} min`;
  if (deescalation) deescalation.textContent = state.metrics.level3Total ? `${Math.round((state.metrics.level3Deescalated / state.metrics.level3Total) * 100)}%` : "0%";
  updateGovernanceUI();
}

function parseAmount(value) {
  const normalized = String(value).trim();
  if (!normalized || !/^[0-9][0-9.,]*$/.test(normalized)) return null;
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    return lastComma > lastDot ? Number(normalized.replace(/\./g, "").replace(",", ".")) : Number(normalized.replace(/,/g, ""));
  }
  if (lastDot > -1) return /^\d{1,3}(?:\.\d{3})+$/.test(normalized) ? Number(normalized.replace(/\./g, "")) : Number(normalized);
  if (lastComma > -1) return /^\d{1,3}(?:,\d{3})+$/.test(normalized) ? Number(normalized.replace(/,/g, "")) : Number(normalized.replace(",", "."));
  return Number(normalized);
}

function extractAmount(message) {
  const match = message.match(/(?:€|euro)\s*([0-9]+(?:[.,][0-9]+)*)/i) || message.match(/([0-9]+(?:[.,][0-9]+)*)\s*(?:€|euro)/i);
  return match ? parseAmount(match[1]) : null;
}

function smartDndActive() {
  if (state.smartDnd === false) return false;
  const context = `${state.context || ""} ${state.calendarContext || ""}`.toLowerCase();
  return /viaggio|vacanza|festiv|weekend.*famigli|famigli.*weekend/.test(context);
}

function normalizeTrustPart(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return normalized || fallback;
}

function trustKey(actionType, counterparty, context) {
  return [
    normalizeTrustPart(actionType, "monitor"),
    normalizeTrustPart(counterparty, "unknown"),
    normalizeTrustPart(context, "default")
  ].join("|");
}

function parseTrustDate(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) ? date : null;
}

function decayedTrustScore(score, lastInteractionAt, now = new Date()) {
  const baseline = Number(state.trustBaselineScore || 20);
  const last = parseTrustDate(lastInteractionAt);
  if (!last) return Math.max(0, Math.min(100, Number(score || baseline)));
  const days = Math.max(0, (now.getTime() - last.getTime()) / 86400000);
  const halfLife = Math.max(1, Number(state.trustDecayHalfLifeDays || 365));
  const factor = 0.5 ** (days / halfLife);
  return Math.max(0, Math.min(100, baseline + (Number(score || baseline) - baseline) * factor));
}

function trustActionGroup(actionType) {
  const normalized = normalizeTrustPart(actionType, "monitor");
  return ({ book: "booking", booking: "booking", reserve: "booking", repair: "home_service", maintenance: "home_service", renew: "renewal", renewal: "renewal", pay: "payment", payment: "payment", monitor: "monitoring" })[normalized] || normalized;
}

function inferActionType(message, category, explicitAction = "") {
  if (explicitAction) return normalizeTrustPart(explicitAction, "monitor");
  if (/prenot|ristorant|hotel|viaggi|trasport/.test(message)) return "book";
  if (/ripar|idraulic|manutenz|tecnic/.test(message)) return "repair";
  if (/rinnov|abbonament/.test(message)) return "renew";
  if (/pag|bollett|bonific|acquist|spes/.test(message)) return "pay";
  if (/lista|promemoria|archivi/.test(message)) return "update_list";
  return category === "general" ? "monitor" : "manage";
}

function extractCounterparty(message, explicitCounterparty = "") {
  if (explicitCounterparty) return String(explicitCounterparty).trim();
  const match = message.match(/(?:fornitore|idraulico|tecnico|gestore|ristorante|hotel|compagnia|presso|da)\s+([a-zà-ÿ0-9][a-zà-ÿ0-9 .'-]{1,42})/i);
  if (!match) return "unknown";
  const candidate = match[0].split(/\s+(?:per|con|nel|nella|entro|oggi|domani|e)\b/i)[0].trim();
  return candidate || "unknown";
}

function similarTrustProfile(actionType, counterparty, context) {
  const targetKey = trustKey(actionType, counterparty, context);
  const targetGroup = trustActionGroup(actionType);
  const candidates = Object.entries(state.trustProfiles || {}).map(([key, profile]) => {
    if (key === targetKey || !profile || trustActionGroup(profile.actionType || key.split("|")[0]) !== targetGroup) return null;
    const score = decayedTrustScore(profile.score, profile.lastInteractionAt);
    return score > Number(state.trustBaselineScore || 20) ? { key, profile, score } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  if (!candidates.length) return null;
  const source = candidates[0];
  const baseline = Number(state.trustBaselineScore || 20);
  const discount = Math.max(0, Math.min(1, Number(state.trustImportDiscount ?? 0.35)));
  return {
    key: targetKey,
    score: Number((baseline + (source.score - baseline) * discount).toFixed(2)),
    sourceKey: source.key,
    sourceScore: Number(source.score.toFixed(2)),
    discount,
    requiresExplicitConfirmation: true,
    neverLevelOne: true,
    reason: "fiducia importata da una combinazione simile, con sconto prudenziale"
  };
}

function getTrustProfile(actionType, counterparty = "unknown", context = "default") {
  const normalizedAction = normalizeTrustPart(actionType, "monitor");
  const normalizedCounterparty = normalizeTrustPart(counterparty, "unknown");
  const normalizedContext = normalizeTrustPart(context, "default");
  const key = trustKey(normalizedAction, normalizedCounterparty, normalizedContext);
  const stored = state.trustProfiles?.[key];
  if (stored && typeof stored === "object") {
    const score = decayedTrustScore(stored.score, stored.lastInteractionAt);
    return { actionType: normalizedAction, counterparty: normalizedCounterparty, context: normalizedContext, key, score: Number(score.toFixed(2)), rawScore: Number(stored.score || state.trustBaselineScore), interactions: Number(stored.interactions || 0), approvals: Number(stored.approvals || 0), rejections: Number(stored.rejections || 0), lastInteractionAt: stored.lastInteractionAt || "", source: stored.source || "observed", decayApplied: Number((Number(stored.score || state.trustBaselineScore) - score).toFixed(2)) };
  }
  const imported = similarTrustProfile(normalizedAction, normalizedCounterparty, normalizedContext);
  if (imported) return { actionType: normalizedAction, counterparty: normalizedCounterparty, context: normalizedContext, ...imported, rawScore: imported.score, interactions: 0, approvals: 0, rejections: 0, lastInteractionAt: "", source: "imported", decayApplied: 0 };
  return { actionType: normalizedAction, counterparty: normalizedCounterparty, context: normalizedContext, key, score: Number(state.trustBaselineScore || 20), rawScore: Number(state.trustBaselineScore || 20), interactions: 0, approvals: 0, rejections: 0, lastInteractionAt: "", source: "new", decayApplied: 0 };
}

function evaluateTrust({ actionType, counterparty, context, category }) {
  const profile = getTrustProfile(actionType, counterparty, context);
  const cap = state.trustSensitiveCaps?.[category];
  const effectiveScore = cap == null ? profile.score : Math.min(profile.score, Number(cap));
  const baseline = Number(state.trustBaselineScore || 20);
  const autoThreshold = Number(state.trustAutoExecuteScore || 85);
  const dynamicLimit = cap != null || effectiveScore <= baseline || autoThreshold <= baseline ? 0 : Number((effectiveScore >= autoThreshold ? Number(state.trustMaxSpendEur || 400) : Number(state.trustMaxSpendEur || 400) * (effectiveScore - baseline) / (autoThreshold - baseline)).toFixed(2));
  return { profile, actionType: profile.actionType, counterparty: profile.counterparty, context: profile.context, score: profile.score, effectiveScore, cap: cap == null ? null : Number(cap), dynamicSpendLimit: dynamicLimit, source: profile.source, importedProposal: profile.source === "imported" ? profile : null, hasSpecificCounterparty: profile.counterparty !== "unknown" };
}

function classifyRequest(message, metadata = {}) {
  resetDailyNotifications();
  const lower = String(message || "").toLowerCase();
  const amount = metadata.amount ?? extractAmount(lower);
  const category = metadata.category || (/ripar|idraulic|manutenz|tecnic|casa/.test(lower) ? "home" : /lista della spesa|prodott|comprare|ritiro|reso|prenot|consegna/.test(lower) ? "errands" : /bollett|budget|spes|pag|bonific|banc|assicur|abbonament|euro|€/.test(lower) ? "money" : /medic|salute|visita|ricetta|farmac|esam|terapia/.test(lower) ? "health" : /contratt|firma|legal|affitto|mutuo/.test(lower) ? "contract" : /famiglia|scuola|figli|compleanno|passaport/.test(lower) ? "family" : "home");
  const urgent = metadata.urgent ?? /urgent|subito|oggi|scade|scadenza|entro stasera|frode|sospett|anomalo/.test(lower);
  const suspicious = metadata.suspicious ?? /frode|sospett|anomalo|non riconosco|truff/.test(lower);
  const irreversible = metadata.irreversible ?? /cancell|elimin|annull|manda|invia denaro|bonific|firma|chiudi/.test(lower);
  const ambiguous = /non so|forse|consigliami|scegli tu|decidi tu|ambigua|ambiguità/.test(lower);
  const professionalAdvice = /diagnosi|diagnostic|cura|terapia|farmaco|dosaggio|sintomo|medico|consulenza legale|parere legale|avvocato|investi|investimento|consulenza finanziaria/.test(lower);
  const context = metadata.context || state.context || category;
  const counterparty = extractCounterparty(message, metadata.counterparty || metadata.provider || "");
  const actionType = inferActionType(lower, category, metadata.actionType || metadata.action || "");
  const trust = evaluateTrust({ actionType, counterparty, context, category });
  const contextDeferred = smartDndActive() && !urgent && !suspicious;
  const sensitive = ["money", "health", "contract", "legal", "documents", "familyDocs"].includes(category);
  const boundaryLocked = (category === "money" && state.boundaries?.payments !== false) || (category === "health" && state.boundaries?.health !== false) || (category === "contract" && state.boundaries?.contracts !== false);
  const permanentApproval = metadata.permanentAuthorization || /autorizzazione permanente|sempre autorizzat|in modo permanente|permanentemente/.test(lower);
  const explicitlyApproved = metadata.preapproved || /già autorizzat|autorizzazione permanente|sempre autorizzat|procedi autonomamente|come al solito|in modo permanente|permanentemente/.test(lower);
  const preapproved = explicitlyApproved && !irreversible && (!sensitive || (permanentApproval && !boundaryLocked));
  const trustLabel = `fiducia ${trust.score.toFixed(0)}/100 per ${trust.actionType} · ${trust.counterparty} · ${trust.context}`;
  let level = 3;
  let reason = "fiducia insufficiente per questa combinazione";

  if (state.paused) {
    reason = "agente in pausa: nessuna automazione viene eseguita";
  } else if (state.manualMode) {
    reason = "modalità manuale globale: hai scelto di approvare sempre";
  } else if (state.neverAutomate.some((item) => lower.includes(item.toLowerCase()))) {
    reason = "argomento escluso dall'automazione";
  } else if (state.rejectionKeys.includes(trust.profile.key) || (!state.rejectionKeys.length && state.rejections.some((item) => lower.includes(item.toLowerCase())))) {
    reason = "hai rifiutato in precedenza questa combinazione";
  } else if (suspicious) {
    reason = `attività sospetta: serve una verifica immediata · ${trustLabel}`;
  } else if (irreversible) {
    reason = `azione irreversibile o non reversibile · ${trustLabel}`;
  } else if (professionalAdvice) {
    reason = "richiesta sensibile: fornisco solo informazioni e rimando a un professionista";
  } else if (sensitive) {
    const cap = trust.cap == null ? "tetto di sicurezza attivo" : `tetto assoluto ${trust.cap}/100`;
    if (permanentApproval && !boundaryLocked) {
      level = 2;
      reason = `autorizzazione permanente registrata, ma ${cap}: mai esecuzione silenziosa`;
    } else {
      reason = `dominio sensibile: serve autorizzazione esplicita per questo caso · ${cap} · ${trustLabel}`;
    }
  } else if (urgent) {
    reason = `scadenza o evento urgente · ${trustLabel}`;
  } else if (contextDeferred && !sensitive && trust.effectiveScore >= Number(state.trustReportScore || 55)) {
    level = 2;
    reason = `Non disturbare intelligente attivo: attività non urgente rimandata al digest · ${trustLabel}`;
  } else if (ambiguous && !preapproved) {
    reason = `richiesta ambigua: serve una scelta esplicita · ${trustLabel}`;
  } else if (preapproved) {
    level = 1;
    reason = `autorizzazione esplicita già registrata e attività reversibile · ${trustLabel}`;
  } else if (trust.source === "imported") {
    reason = `${trustLabel}; proposta importata da una combinazione simile, serve conferma esplicita`;
  } else if (amount !== null && Number(amount) > trust.dynamicSpendLimit) {
    reason = `fiducia insufficiente: importo di € ${Number(amount).toFixed(2)} oltre il limite dinamico di € ${trust.dynamicSpendLimit.toFixed(2)} · ${trustLabel}`;
  } else if (trust.effectiveScore >= Number(state.trustAutoExecuteScore || 85) && trust.source !== "imported") {
    level = 1;
    reason = `fiducia sufficiente per agire autonomamente entro € ${trust.dynamicSpendLimit.toFixed(2)} · ${trustLabel}`;
  } else if (trust.effectiveScore >= Number(state.trustReportScore || 55)) {
    level = 2;
    reason = `fiducia sufficiente per eseguire e informare · ${trustLabel}`;
  } else if (!trust.hasSpecificCounterparty && amount === null && actionType === "monitor") {
    level = 2;
    reason = `attività locale a basso rischio · ${trustLabel}`;
  } else {
    reason = `${reason} · ${trustLabel}`;
  }

  return { category, amount, urgent, suspicious, ambiguous, professionalAdvice, irreversible, sensitive, contextDeferred, level, reason, notificationQueued: false, title: String(message || "").trim().replace(/^./, (char) => char.toUpperCase()), actionType, counterparty, trustContext: context, trustKey: trust.profile.key, trustScore: trust.score, trustEffectiveScore: trust.effectiveScore, trustCap: trust.cap, dynamicSpendLimit: trust.dynamicSpendLimit, trustSource: trust.source, importedTrustProposal: trust.importedProposal, hasSpecificCounterparty: trust.hasSpecificCounterparty, preapproved };
}

function defaultOutcomeForAnalysis(analysis) {
  if (analysis.suspicious) return "nessun pagamento viene eseguito finché non verifichi l'attività sospetta";
  if (/rinnov|abbonament/.test(analysis.title.toLowerCase())) return "il rinnovo resta fermo; se esiste un rinnovo automatico esterno, devi verificarne la scadenza con il fornitore";
  if (analysis.urgent) return "nessuna azione automatica viene eseguita e la scadenza resta a tuo carico";
  if (analysis.irreversible) return "l'azione irreversibile non viene eseguita";
  return "la richiesta resta in sospeso senza azioni esterne";
}

function assistantOptions(analysis) {
  if (analysis.professionalAdvice) return ["Mostro informazioni generali non vincolanti", "Rimando a un professionista qualificato"];
  if (analysis.suspicious) return ["Verifico la transazione e ti mostro i dettagli", "La segnalo come frode sospetta e non faccio altro"];
  if (analysis.category === "money") return ["La lascio in sospeso", "Confermo dopo aver controllato importo e beneficiario"];
  if (analysis.category === "health") return ["Creo solo il promemoria", "Ti mostro disponibilità e dettagli senza prenotare"];
  if (analysis.category === "home") return ["Rimando al fornitore preferito", "Confronto più opzioni prima di agire"];
  return ["Procedo con la richiesta", "La tengo nel prossimo digest"];
}

function buildAssistantReply(message, analysis) {
  const trustLine = `Fiducia dinamica: ${analysis.trustScore.toFixed(0)}/100 · ${analysis.actionType} · ${analysis.counterparty} · ${analysis.trustContext}`;
  if (analysis.level === 1) return `✅ Fiducia ${analysis.trustScore.toFixed(0)}/100 · ${analysis.title}\nLo gestisco in silenzio entro il limite dinamico di € ${analysis.dynamicSpendLimit.toFixed(0)}. La combinazione è reversibile e osservata.${calibrationActive() ? `\n${calibrationMessage()}` : ""}`;
  if (analysis.level === 2) return `✅ Fiducia ${analysis.trustScore.toFixed(0)}/100 · ${analysis.title}\n${analysis.contextDeferred ? "Modalità Non disturbare attiva: " : ""}Lo gestisco e lo includo nel prossimo digest. ${trustLine}`;
  const options = assistantOptions(analysis);
  const deadline = analysis.urgent ? "Scadenza: serve una risposta oggi." : "Scadenza: nessuna immediata.";
  const defaultOutcome = defaultOutcomeForAnalysis(analysis);
  const queueNote = analysis.notificationQueued ? "\nHo raggiunto il limite di notifiche attive: resta in coda nel digest." : "";
  const importedNote = analysis.trustSource === "imported" ? "\nHo importato solo una parte della fiducia da una combinazione simile: non abilita l'esecuzione silenziosa." : "";
  const capNote = analysis.trustCap == null ? "" : `\nTetto di sicurezza della categoria: ${analysis.trustCap}/100.`;
  return `⚠️ Serve una tua decisione · fiducia ${analysis.trustScore.toFixed(0)}/100: ${analysis.title}\nContesto: ${analysis.reason}.\nSe non rispondi: ${defaultOutcome}.\nOpzioni:\n1. ${options[0]}\n2. ${options[1]}\n${trustLine}${capNote}${importedNote}${deadline}${queueNote}${state.routingRules[analysis.category] ? `\nDelegata a: ${state.routingRules[analysis.category]}.` : ""}`;
}

function appendAssistantMessage(text, type = "agent-message") {
  const messages = document.getElementById("assistantMessages");
  if (!messages) return;
  const node = document.createElement("div");
  node.className = `assistant-message ${type}`;
  node.textContent = text;
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
}

function getTaskLevel(task) {
  return Number(task.level || (task.preapproved ? 1 : 3));
}

function createTaskId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function permissionAllows(member, category, action = "approve") {
  const role = String(member || "owner").toLowerCase();
  const domain = String(category || "general").toLowerCase();
  const matrix = state.familyPermissions || {};
  if (!Object.keys(matrix).length) return role === "owner";
  const rolePermissions = matrix[role] || {};
  const values = [];
  [rolePermissions[domain], rolePermissions["*"]].forEach((value) => {
    if (Array.isArray(value)) values.push(...value);
    else if (value) values.push(value);
  });
  return values.map((value) => String(value).toLowerCase()).some((value) => [action, "manage", "all"].includes(value));
}

function recordApproval(task) {
  const key = task.trustKey || trustKey(task.actionType || task.action || "monitor", task.counterparty || task.provider || "unknown", task.trustContext || task.context || task.category || "general");
  state.approvalCounts[key] = Number(state.approvalCounts[key] || 0) + 1;
  if (state.approvalCounts[key] >= 3 && !state.automationSuggestions.includes(task.title)) {
    state.automationSuggestions.push(task.title);
    return true;
  }
  return false;
}

function updateTrustProfile(task, outcome = "approved", responseTimeSeconds = null) {
  const actionType = task.actionType || inferActionType(String(task.title || "").toLowerCase(), task.category || "general", task.action || "");
  const counterparty = task.counterparty || task.provider || "unknown";
  const context = task.trustContext || task.context || task.category || "general";
  const key = task.trustKey || trustKey(actionType, counterparty, context);
  const current = getTrustProfile(actionType, counterparty, context);
  const before = Number(current.score || state.trustBaselineScore || 20);
  const normalizedOutcome = String(outcome).toLowerCase();
  const latency = responseTimeSeconds == null ? null : Math.max(0, Number(responseTimeSeconds));
  let delta = 0;
  if (["rejected", "reject", "no", "denied"].includes(normalizedOutcome)) delta = -30;
  else if (["error", "failed", "failure", "incident"].includes(normalizedOutcome)) delta = -40;
  else if (["approved", "approve", "yes", "accepted"].includes(normalizedOutcome)) {
    delta = latency == null ? 4 : latency <= 3600 ? 12 : latency <= 86400 ? 6 : latency <= 172800 ? 1 : 0;
  } else if (["deferred", "defer", "hesitated"].includes(normalizedOutcome)) delta = -2;
  const after = Math.max(0, Math.min(100, before + delta));
  const previous = state.trustProfiles[key] || {};
  state.trustProfiles[key] = {
    ...previous,
    actionType: normalizeTrustPart(actionType, "monitor"),
    counterparty: normalizeTrustPart(counterparty, "unknown"),
    context: normalizeTrustPart(context, "default"),
    score: Number(after.toFixed(2)),
    interactions: Number(previous.interactions || 0) + 1,
    approvals: Number(previous.approvals || 0) + (["approved", "approve", "yes", "accepted"].includes(normalizedOutcome) ? 1 : 0),
    rejections: Number(previous.rejections || 0) + (["rejected", "reject", "no", "denied"].includes(normalizedOutcome) ? 1 : 0),
    errors: Number(previous.errors || 0) + (["error", "failed", "failure", "incident"].includes(normalizedOutcome) ? 1 : 0),
    lastInteractionAt: new Date().toISOString(),
    lastResponseTimeSeconds: latency,
    source: "observed"
  };
  const interaction = { key, actionType: state.trustProfiles[key].actionType, counterparty: state.trustProfiles[key].counterparty, context: state.trustProfiles[key].context, outcome: normalizedOutcome, responseTimeSeconds: latency, scoreBefore: Number(before.toFixed(2)), delta, scoreAfter: Number(after.toFixed(2)), at: new Date().toISOString() };
  state.trustInteractions.unshift(interaction);
  task.trustScore = Number(after.toFixed(2));
  task.trustKey = key;
  task.trustSource = "observed";
  return interaction;
}

function trustInteractionLatency(task) {
  const createdAt = parseTrustDate(task.createdAt);
  return createdAt ? Math.max(0, (Date.now() - createdAt.getTime()) / 1000) : null;
}

function handleAssistantRequest(message) {
  const normalized = message.toLowerCase().trim();
  const requestedTitle = normalized.replace(/^(perché|perche|annulla|annullare|rifai|ripeti)\s*/, "").trim();
  if (/^(perché|perche)/.test(normalized)) {
    const target = state.customTasks.find((task) => requestedTitle && task.title.toLowerCase().includes(requestedTitle)) || state.customTasks.find((task) => task.status === "completed" || task.status === "approved");
    appendAssistantMessage(target ? `Spiegazione · ${target.title}: ${target.explanation || target.reason || "regola autorizzata e reversibile"}. Nessuna azione esterna viene eseguita dalla demo.` : "Non trovo ancora un'azione automatica da spiegare.");
    return;
  }
  if (/^(annulla|annullare)/.test(normalized)) {
    const target = state.customTasks.find((task) => requestedTitle && task.title.toLowerCase().includes(requestedTitle) && task.status !== "undone") || state.customTasks.find((task) => task.status === "completed" || task.status === "approved");
    if (target && (target.status === "completed" || target.status === "approved") && target.reversible !== false) {
      target.status = "undone";
      recordAuditEvent({ type: "action_undone", taskId: target.id });
      state.completed = Math.max(0, Number(state.completed || 0) - 1);
      state.undoLog.push({ taskId: target.id, action: "undo", at: new Date().toISOString(), source: "assistant" });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      appendAssistantMessage(`Ho annullato localmente “${target.title}”. Puoi dire “rifai” per ripristinarla.`);
    } else {
      appendAssistantMessage("Non posso annullare questa azione: richiede una procedura del servizio esterno o non è reversibile.");
    }
    return;
  }
  if (/^(rifai|ripeti)/.test(normalized)) {
    const target = state.customTasks.find((task) => requestedTitle && task.title.toLowerCase().includes(requestedTitle) && task.status === "undone") || state.customTasks.find((task) => task.status === "undone");
    if (target) {
      target.status = "completed";
      recordAuditEvent({ type: "action_redone", taskId: target.id });
      state.completed = Number(state.completed || 0) + 1;
      state.undoLog.push({ taskId: target.id, action: "redo", at: new Date().toISOString(), source: "assistant" });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      appendAssistantMessage(`Ho ripristinato localmente “${target.title}”.`);
    } else {
      appendAssistantMessage("Non trovo un'azione annullata da rifare.");
    }
    return;
  }
  const analysis = classifyRequest(message);
  const task = {
    id: createTaskId(),
    title: analysis.title,
    category: analysis.category,
    action: analysis.actionType,
    actionType: analysis.actionType,
    counterparty: analysis.counterparty,
    trustContext: analysis.trustContext,
    trustKey: analysis.trustKey,
    trustScore: analysis.trustScore,
    trustEffectiveScore: analysis.trustEffectiveScore,
    trustCap: analysis.trustCap,
    dynamicSpendLimit: analysis.dynamicSpendLimit,
    trustSource: analysis.trustSource,
    importedTrustProposal: analysis.importedTrustProposal,
    amount: analysis.amount,
    preapproved: analysis.preapproved,
    urgent: analysis.urgent,
    suspicious: analysis.suspicious,
    irreversible: analysis.irreversible,
    reversible: !analysis.irreversible,
    level: analysis.level,
    reason: analysis.reason,
    explanation: analysis.reason,
    notificationQueued: false,
    defaultOutcome: defaultOutcomeForAnalysis(analysis),
    routedTo: state.routingRules[analysis.category] || "",
    calibrationNotice: calibrationActive(),
    status: analysis.level === 3 ? "pending" : "completed",
    createdAt: new Date().toISOString()
  };
  if (analysis.importedTrustProposal && !state.trustProposals.some((item) => item.key === analysis.trustKey)) {
    state.trustProposals.unshift({ ...analysis.importedTrustProposal, createdAt: new Date().toISOString() });
  }
  state.customTasks.unshift(task);
  if (analysis.level === 1 || analysis.level === 2) {
    state.completed += 1;
    state.metrics.notificationsAvoided += calibrationActive() ? 0 : 1;
    state.metrics.timeSavedMinutes += analysis.level === 1 ? 5 : 3;
    state.businessMetrics.actionsExecuted = Number(state.businessMetrics.actionsExecuted || 0) + 1;
    state.businessMetrics.automationsNeverDisabled = Number(state.businessMetrics.automationsNeverDisabled || 0) + 1;
    state.computeEvents.push({ operation: "classify", units: 1, costEur: 0, model: "local-rules", at: new Date().toISOString() });
    if (calibrationActive()) state.metrics.calibrationNotifications = Number(state.metrics.calibrationNotifications || 0) + 1;
  } else {
    state.pending.push(task.id);
    state.metrics.level3Total += 1;
    if (analysis.urgent || analysis.suspicious || Number(state.notificationsUsed || 0) < Number(state.notificationLimit || 3)) {
      state.notificationsUsed = Number(state.notificationsUsed || 0) + 1;
      state.metrics.notificationsTotal += 1;
    } else {
      state.queuedNotifications.push(task.id);
      task.notificationQueued = true;
      analysis.notificationQueued = true;
    }
  }
  saveState();
  renderCustomTasks();
  renderCustomDecisions();
  updateDecisionCount();
  appendAssistantMessage(buildAssistantReply(message, analysis));
}

function navigate(viewName, updateHash = true) {
  const target = document.querySelector(`[data-view="${viewName}"]`);
  if (!target) return;
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active-view"));
  target.classList.add("active-view");
  document.querySelectorAll("[data-view-link]").forEach((link) => link.classList.toggle("active", link.dataset.viewLink === viewName));
  if (updateHash && window.location.hash !== `#${viewName}`) history.pushState({ view: viewName }, "", `#${viewName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector(".sidebar")?.classList.remove("open");
}

function bindNavigation() {
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.dataset.viewLink);
    });
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.viewTarget));
  });
  window.addEventListener("popstate", () => navigate(window.location.hash.slice(1) || "dashboard", false));
  window.addEventListener("hashchange", () => navigate(window.location.hash.slice(1) || "dashboard", false));
  if (window.innerWidth <= 840) {
    document.getElementById("mobileMenuButton")?.addEventListener("click", (event) => {
      event.stopPropagation();
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
  }
}

function setupModal() {
  const backdrop = document.getElementById("modalBackdrop");
  const close = () => {
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
  };
  const open = (domain = "Generale") => {
    document.getElementById("modalTitle").textContent = `Aggiungi a ${domain}`;
    document.getElementById("modalCopy").textContent = "Dimmi cosa vuoi tenere sotto controllo.";
    const categoryByDomain = { Casa: "home", Denaro: "money", Salute: "health", Commissioni: "errands", Famiglia: "family", Contratti: "contract" };
    document.getElementById("taskCategory").value = categoryByDomain[domain] || "general";
    if (document.getElementById("taskCounterparty")) document.getElementById("taskCounterparty").value = "";
    if (document.getElementById("taskContext")) document.getElementById("taskContext").value = "";
    backdrop.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    window.setTimeout(() => document.getElementById("taskTitle").focus(), 80);
  };
  document.getElementById("addTaskButton")?.addEventListener("click", () => open());
  document.querySelectorAll(".add-generic-button").forEach((button) => button.addEventListener("click", () => open(button.dataset.domain)));
  document.getElementById("addCalendarButton")?.addEventListener("click", () => open("Calendario"));
  document.getElementById("addGroceryButton")?.addEventListener("click", () => open("Casa"));
  document.getElementById("addShoppingItem")?.addEventListener("click", () => open("Commissioni"));
  document.getElementById("modalClose")?.addEventListener("click", close);
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  document.getElementById("taskForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    resetDailyNotifications();
    const title = document.getElementById("taskTitle").value.trim();
    const category = document.getElementById("taskCategory").value;
    const preapproved = document.getElementById("taskPreapproved").checked;
    const amountInput = document.getElementById("taskAmount").value.trim();
    const amount = amountInput ? parseAmount(amountInput) : null;
    const counterparty = document.getElementById("taskCounterparty")?.value.trim() || "unknown";
    const taskContext = document.getElementById("taskContext")?.value.trim() || category;
    const irreversible = document.getElementById("taskIrreversible").checked;
    const urgent = document.getElementById("taskUrgent").checked;
    if (!title) return;
    const analysis = classifyRequest(title, { category, amount, counterparty, context: taskContext, preapproved, irreversible, urgent });
    const createdAt = new Date().toISOString();
    const task = {
      title, category, amount, preapproved: analysis.preapproved, level: analysis.level,
      action: analysis.actionType, actionType: analysis.actionType, counterparty: analysis.counterparty,
      trustContext: analysis.trustContext, trustKey: analysis.trustKey, trustScore: analysis.trustScore,
      trustEffectiveScore: analysis.trustEffectiveScore, trustCap: analysis.trustCap,
      dynamicSpendLimit: analysis.dynamicSpendLimit, trustSource: analysis.trustSource,
      importedTrustProposal: analysis.importedTrustProposal, irreversible, reversible: !irreversible,
      urgent, suspicious: analysis.suspicious, sensitive: analysis.sensitive, familyImpact: category === "family",
      reason: analysis.reason, explanation: analysis.reason, notificationQueued: false,
      defaultOutcome: defaultOutcomeForAnalysis(analysis), id: createTaskId(), createdAt,
      status: analysis.level === 3 ? "pending" : "completed"
    };
    if (analysis.importedTrustProposal && !state.trustProposals.some((item) => item.key === analysis.trustKey)) {
      state.trustProposals.unshift({ ...analysis.importedTrustProposal, createdAt });
    }
    state.customTasks.unshift(task);
    addControlEvent({ type: "task", title, icon: analysis.level === 3 ? "!" : "✓", tone: analysis.level === 3 ? "warning" : "positive", meta: `${category} · fiducia ${analysis.trustScore.toFixed(0)}/100`, status: analysis.level === 3 ? "open" : "done", statusLabel: analysis.level === 3 ? "Decisione" : "Registrato" });
    if (analysis.level === 1 || analysis.level === 2) {
      state.completed += 1;
      state.metrics.notificationsAvoided += calibrationActive() ? 0 : 1;
      state.metrics.timeSavedMinutes += analysis.level === 1 ? 5 : 3;
      if (calibrationActive()) state.metrics.calibrationNotifications = Number(state.metrics.calibrationNotifications || 0) + 1;
      showToast(`“${title}” ${analysis.level === 1 ? "gestita in silenzio" : "inclusa nel digest"} · fiducia ${analysis.trustScore.toFixed(0)}/100`);
    } else {
      state.pending.push(task.id);
      state.metrics.level3Total += 1;
      if (urgent || analysis.suspicious || Number(state.notificationsUsed || 0) < Number(state.notificationLimit || 3)) {
        state.notificationsUsed = Number(state.notificationsUsed || 0) + 1;
        state.metrics.notificationsTotal += 1;
      } else {
        state.queuedNotifications.push(task.id);
        task.notificationQueued = true;
      }
      showToast(`“${title}” richiede una tua conferma · fiducia ${analysis.trustScore.toFixed(0)}/100`, "warning");
    }
    saveState();
    renderCustomTasks();
    renderCustomDecisions();
    updateDecisionCount();
    close();
    event.target.reset();
  });
}

function renderCustomDecisions() {
  const list = document.getElementById("decisionsList");
  if (!list) return;
  list.querySelectorAll(".custom-decision").forEach((node) => node.remove());
  const pendingTasks = state.customTasks.filter((task) => getTaskLevel(task) === 3 && state.pending.includes(task.id));
  list.querySelectorAll(":scope > .empty-list-state").forEach((node) => node.toggleAttribute("hidden", pendingTasks.length > 0));
  pendingTasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "decision-card custom-decision";
    card.dataset.decision = task.id;
    const defaultOutcome = task.defaultOutcome || "la richiesta resta in sospeso senza azioni esterne";
    const trust = getTrustProfile(task.actionType || task.action || "monitor", task.counterparty || task.provider || "unknown", task.trustContext || task.context || task.category || "general");
    const trustScore = Number(task.trustScore ?? trust.score ?? state.trustBaselineScore);
    const trustCap = task.trustCap ?? state.trustSensitiveCaps?.[task.category];
    const trustLimit = Number(task.dynamicSpendLimit ?? 0);
    const trustSource = task.trustSource === "imported" || trust.source === "imported" ? "importata con cautela" : trust.source === "new" ? "combinazione nuova" : "storia osservata";
    const routeNote = task.routedTo ? `<div class="decision-meta">Instradata a <strong>${escapeHTML(task.routedTo)}</strong> · i permessi saranno verificati prima dell'approvazione.</div>` : "";
    const trustNote = `<div class="decision-trust"><div class="trust-line"><span>FIDUCIA · ${escapeHTML(trust.actionType)} · ${escapeHTML(trust.counterparty)}</span><strong>${trustScore.toFixed(0)}/100</strong></div><div class="trust-meter"><span style="width:${Math.max(0, Math.min(100, trustScore))}%"></span></div><small>${escapeHTML(trustSource)}${trustLimit ? ` · limite dinamico € ${trustLimit.toFixed(0)}` : ""}${trustCap != null ? ` · tetto ${trustCap}/100` : ""}</small></div>`;
    const importedNote = task.importedTrustProposal || trust.source === "imported" ? `<div class="trust-proposal">↗ Fiducia importata da una combinazione simile: richiede conferma esplicita e non abilita l'esecuzione silenziosa.</div>` : "";
    card.innerHTML = `<div class="decision-card-head"><div class="decision-category"><span class="decision-icon coral-tile">!</span><div><span class="card-kicker">RICHIESTA · FIDUCIA DINAMICA</span><h3>${escapeHTML(task.title)}</h3></div></div><span class="${task.urgent ? "urgent-label" : "date-label"}">${task.urgent ? "Urgente" : "Da decidere"}</span></div><p>Richiesta ricevuta dall'assistente. ${escapeHTML(task.reason || "Serve una decisione prima di procedere")}.</p>${trustNote}${importedNote}<div class="decision-outcome"><span>Se non rispondi</span><strong>${escapeHTML(defaultOutcome)}</strong></div>${routeNote}<label class="approver-select"><span>Chi può approvare</span><select class="decision-actor"><option value="owner">Tu · proprietario</option><option value="partner">Partner</option><option value="teen">Adolescente</option></select></label><div class="options-grid"><button class="decision-option selected" data-option="confirm" type="button"><span class="option-radio"></span><span><strong>Conferma la richiesta</strong><small>Nessuna azione esterna viene eseguita dalla demo</small></span></button><button class="decision-option" data-option="defer" type="button"><span class="option-radio"></span><span><strong>Tienila nel digest</strong><small>Rimandata senza esecuzione</small></span></button></div><div class="decision-actions"><button class="primary-button approve-decision" type="button">Registra scelta</button><button class="ghost-button defer-decision" type="button">Rimanda</button><button class="ghost-button reject-decision" type="button">Rifiuta</button></div>`;
    list.appendChild(card);
    if (state.deferred.includes(task.id)) card.classList.add("deferred");
    bindDecisionCard(card);
  });
}

function addControlEvent(event) {
  state.controlEvents = Array.isArray(state.controlEvents) ? state.controlEvents : [];
  state.controlEvents.unshift({ id: createTaskId(), createdAt: new Date().toISOString(), ...event });
  state.controlEvents = state.controlEvents.slice(0, 100);
}

function renderControlFeed(filter = "all") {
  const feed = document.getElementById("controlFeed");
  if (!feed) return;
  const events = (state.controlEvents || []).filter((event) => filter === "all" || (filter === "open" && event.status !== "done") || (filter === "time" && event.type === "time"));
  if (!events.length) {
    feed.innerHTML = `<div class="empty-list-state"><span>◈</span><strong>Nessun evento nel feed</strong><small>Le tue attività collegate appariranno qui.</small></div>`;
    return;
  }
  feed.innerHTML = events.slice(0, 12).map((event) => `<article class="control-feed-row"><span class="feed-event-icon ${escapeHTML(event.tone || "neutral")}">${escapeHTML(event.icon || "•")}</span><div><strong>${escapeHTML(event.title)}</strong><small>${escapeHTML(event.meta || "Evento locale")}</small></div><time>${new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time><span class="feed-status ${escapeHTML(event.status || "open")}">${escapeHTML(event.statusLabel || "Aperto")}</span></article>`).join("");
}

function setupControlFeed() {
  document.querySelectorAll("[data-feed-filter]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-feed-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderControlFeed(button.dataset.feedFilter);
  }));
  renderControlFeed();
}

function renderCustomTasks() {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;
  activityList.querySelectorAll(".custom-activity").forEach((node) => node.remove());
  if (!state.customTasks.length) {
    if (!activityList.querySelector(":scope > .empty-list-state")) activityList.innerHTML = `<div class="empty-list-state"><span>✦</span><strong>Nessuna attività ancora</strong><small>Le azioni dell’agente appariranno qui.</small></div>`;
    return;
  }
  activityList.querySelectorAll(":scope > .empty-list-state").forEach((node) => node.remove());
  state.customTasks.slice(0, 5).forEach((task, index) => {
    const row = document.createElement("article");
    row.className = "activity-row custom-activity";
    const level = `Fascia ${getTaskLevel(task)}`;
    const levelClass = getTaskLevel(task) === 1 ? "level-one" : getTaskLevel(task) === 2 ? "level-two" : "level-three";
    const symbolClass = getTaskLevel(task) === 1 ? "mint-symbol" : getTaskLevel(task) === 2 ? "blue-symbol" : "coral-symbol";
    const symbol = getTaskLevel(task) === 1 ? "✓" : getTaskLevel(task) === 2 ? "◷" : "!";
    const profile = getTrustProfile(task.actionType || task.action || "monitor", task.counterparty || task.provider || "unknown", task.trustContext || task.context || task.category || "general");
    const trustScore = Number(task.trustScore ?? profile.score ?? state.trustBaselineScore);
    const isResolved = state.dismissed.includes(task.id) || task.status === "approved" || task.status === "completed";
    const isDeferred = state.deferred.includes(task.id) || task.status === "deferred";
    const isUndone = task.status === "undone";
    const status = isUndone ? "Annullata · puoi rifarla" : getTaskLevel(task) === 1 ? "Autorizzata" : isResolved ? "Scelta registrata" : isDeferred ? "Nel prossimo digest" : getTaskLevel(task) === 2 ? "Nel prossimo digest" : "In attesa di conferma";
    const actionButtons = isResolved || isUndone ? `<div class="activity-actions"><button class="mini-action explain-action" data-task-id="${escapeHTML(task.id)}" type="button">Perché?</button>${isUndone ? `<button class="mini-action redo-action" data-task-id="${escapeHTML(task.id)}" type="button">Rifai</button>` : task.reversible === false ? "" : `<button class="mini-action undo-action" data-task-id="${escapeHTML(task.id)}" type="button">Annulla</button>`}</div>` : "";
    row.innerHTML = `<div class="activity-symbol ${symbolClass}">${symbol}</div><div class="activity-main"><strong>${escapeHTML(task.title)}</strong><span>Aggiunta ora · ${status}</span>${actionButtons}</div><span class="activity-time">ora</span><span class="trust-tag" title="Fiducia per questa combinazione">${trustScore.toFixed(0)}/100</span>`;
    activityList.insertBefore(row, activityList.firstChild);
    row.querySelector(".explain-action")?.addEventListener("click", () => showToast(`Regola applicata: ${task.explanation || task.reason || "attività autorizzata e reversibile"}.`, "info"));
    row.querySelector(".undo-action")?.addEventListener("click", () => {
      task.status = "undone";
      recordAuditEvent({ type: "action_undone", taskId: task.id });
      state.completed = Math.max(0, Number(state.completed || 0) - 1);
      state.undoLog.push({ taskId: task.id, action: "undo", at: new Date().toISOString() });
      state.actionLog.push({ taskId: task.id, action: "undo", at: new Date().toISOString() });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      showToast(`“${task.title}” annullata localmente.`, "warning");
    });
    row.querySelector(".redo-action")?.addEventListener("click", () => {
      task.status = "completed";
      recordAuditEvent({ type: "action_redone", taskId: task.id });
      state.completed = Number(state.completed || 0) + 1;
      state.undoLog.push({ taskId: task.id, action: "redo", at: new Date().toISOString() });
      state.actionLog.push({ taskId: task.id, action: "redo", at: new Date().toISOString() });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      showToast(`“${task.title}” ripristinata.`);
    });
    if (index === 4) return;
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function bindDecisionCard(card) {
  card.querySelectorAll(".decision-option").forEach((option) => option.addEventListener("click", () => {
    card.querySelectorAll(".decision-option").forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
  }));
  card.querySelector(".approve-decision")?.addEventListener("click", () => {
    const choice = card.querySelector(".decision-option.selected") || card.querySelector(".decision-option");
    if (choice?.dataset.option === "defer") {
      card.querySelector(".defer-decision")?.click();
      return;
    }
    const customTask = state.customTasks.find((item) => item.id === card.dataset.decision);
    const actor = card.querySelector(".decision-actor")?.value || "owner";
    if (!customTask || !permissionAllows(actor, customTask.category)) {
      showToast("Questo membro non ha il permesso per approvare questo dominio.", "warning");
      return;
    }
    if (state.manualMode && actor !== "owner") {
      showToast("Modalità manuale globale: la conferma deve arrivare dal proprietario.", "warning");
      return;
    }
    const label = choice?.querySelector("strong")?.textContent || "opzione selezionata";
    state.pending = state.pending.filter((item) => item !== card.dataset.decision);
    state.queuedNotifications = state.queuedNotifications.filter((item) => item !== card.dataset.decision);
    state.deferred = state.deferred.filter((item) => item !== card.dataset.decision);
    if (!state.dismissed.includes(card.dataset.decision)) state.dismissed.push(card.dataset.decision);
    customTask.status = "approved";
    customTask.approvedBy = actor;
    updateTrustProfile(customTask, "approved", trustInteractionLatency(customTask));
    state.completed += 1;
    state.metrics.level3Approved += 1;
    state.businessMetrics.actionsExecuted = Number(state.businessMetrics.actionsExecuted || 0) + 1;
    state.businessMetrics.automationsNeverDisabled = Number(state.businessMetrics.automationsNeverDisabled || 0) + 1;
    recordAuditEvent({ type: "decision_approved", taskId: customTask.id, actor, trustScore: customTask.trustScore });
    const suggested = recordApproval(customTask);
    card.classList.add("completed");
    card.querySelector(".decision-actions").innerHTML = `<span class="trust-updated">Scelta registrata · ${escapeHTML(label)} · fiducia aggiornata a ${Number(customTask.trustScore || 0).toFixed(0)}/100</span>`;
    updateDecisionCount();
    saveState();
    renderCustomTasks();
    showToast(suggested ? "Approvazione ripetuta: vuoi trasformarla in una regola automatica?" : "Scelta registrata. Nessuna azione esterna è stata eseguita.");
  });
  card.querySelector(".defer-decision")?.addEventListener("click", () => {
    const customTask = state.customTasks.find((item) => item.id === card.dataset.decision);
    if (customTask) {
      customTask.status = "deferred";
      updateTrustProfile(customTask, "deferred", trustInteractionLatency(customTask));
    }
    if (!state.deferred.includes(card.dataset.decision)) state.deferred.push(card.dataset.decision);
    if (!state.queuedNotifications.includes(card.dataset.decision)) state.queuedNotifications.push(card.dataset.decision);
    saveState();
    updateDecisionCount();
    showToast("Va bene. Te lo ricorderò nel prossimo digest.");
    card.classList.add("deferred");
  });
  card.querySelector(".reject-decision")?.addEventListener("click", () => {
    const customTask = state.customTasks.find((item) => item.id === card.dataset.decision);
    if (!customTask) return;
    updateTrustProfile(customTask, "rejected", trustInteractionLatency(customTask));
    recordAuditEvent({ type: "decision_rejected", taskId: customTask.id });
    customTask.status = "rejected";
    if (!state.rejections.includes(customTask.title)) state.rejections.push(customTask.title);
    if (!state.rejectionKeys.includes(customTask.trustKey)) state.rejectionKeys.push(customTask.trustKey);
    state.pending = state.pending.filter((item) => item !== customTask.id);
    state.queuedNotifications = state.queuedNotifications.filter((item) => item !== customTask.id);
    state.deferred = state.deferred.filter((item) => item !== customTask.id);
    saveState();
    renderCustomDecisions();
    renderCustomTasks();
    updateDecisionCount();
    showToast(`Rifiuto memorizzato: la fiducia è scesa a ${Number(customTask.trustScore || 0).toFixed(0)}/100.`, "warning");
  });
}

function setupDecisions() {
  document.querySelectorAll(".decision-card").forEach(bindDecisionCard);
  state.deferred.forEach((id) => {
    const card = document.querySelector(`[data-decision="${id}"]`);
    if (card) card.classList.add("deferred");
  });
  state.dismissed.forEach((id) => {
    const card = document.querySelector(`[data-decision="${id}"]`);
    if (card) {
      card.classList.add("completed");
      const action = card.querySelector(".decision-actions");
      if (action) action.innerHTML = '<span class="level-tag level-one">Decisione già registrata</span>';
    }
  });
  renderCustomDecisions();
  updateDecisionCount();
}

function setupCalendar() {
  const calendar = document.getElementById("calendarDays");
  if (!calendar) return;
  const days = [27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6];
  const events = Array.isArray(state.calendarEvents) ? state.calendarEvents : [];
  days.forEach((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `calendar-day ${index < 5 || index > 35 ? "muted" : ""} ${day === 25 && index === 29 ? "today" : ""}`;
    button.innerHTML = `<span class="day-number">${day}</span>`;
    const dayEvent = events.find((event) => new Date(event.date).getDate() === day);
    if (dayEvent) button.innerHTML += `<small class="calendar-event-mark">${escapeHTML(dayEvent.title)} · ${escapeHTML(dayEvent.start)}–${escapeHTML(dayEvent.end)}</small>`;
    button.addEventListener("click", () => showToast(dayEvent ? `${dayEvent.title} · ${dayEvent.start}–${dayEvent.end}` : `${day} agosto 2026 · Puoi aggiungere un evento qui.`));
    calendar.appendChild(button);
  });
  document.getElementById("calendarPreviousButton")?.addEventListener("click", () => showToast("Mese precedente disponibile quando aggiungi il primo evento."));
  document.getElementById("calendarNextButton")?.addEventListener("click", () => showToast("Mese successivo disponibile quando aggiungi il primo evento."));
  document.getElementById("calendarTodayButton")?.addEventListener("click", () => showToast("Sei già sul periodo corrente."));
  document.getElementById("saveCalendarEventButton")?.addEventListener("click", () => {
    const title = document.getElementById("calendarEventTitle")?.value.trim();
    const date = document.getElementById("calendarEventDate")?.value;
    const start = document.getElementById("calendarEventStart")?.value || "09:00";
    const end = document.getElementById("calendarEventEnd")?.value || "10:00";
    if (!title || !date || start >= end) { showToast("Inserisci titolo, data e un orario valido.", "warning"); return; }
    state.calendarEvents = Array.isArray(state.calendarEvents) ? state.calendarEvents : [];
    state.calendarEvents.push({ id: createTaskId(), title, date, start, end, durationMinutes: (Number(end.slice(0,2)) * 60 + Number(end.slice(3)) - Number(start.slice(0,2)) * 60 - Number(start.slice(3))) });
    addControlEvent({ type: "calendar", title, icon: "▦", tone: "blue", meta: `${date} · ${start}–${end}`, status: "open", statusLabel: "In calendario" });
    saveState();
    renderControlFeed();
    showToast(`Evento “${title}” salvato: ${start}–${end}.`);
    calendar.innerHTML = "";
    setupCalendar();
  });
  document.querySelectorAll("[data-calendar-view]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-calendar-view]").forEach((item) => item.classList.toggle("active", item === button));
    showToast(button.dataset.calendarView === "week" ? "Vista settimana selezionata." : "Vista mese selezionata.");
  }));
}

function setupGrocery() {
  document.querySelectorAll(".check-line input").forEach((input) => input.addEventListener("change", () => {
    input.closest(".check-line").classList.toggle("checked", input.checked);
    const total = document.querySelectorAll(".check-line").length;
    const checked = document.querySelectorAll(".check-line input:checked").length;
    const progress = document.querySelector(".shopping-progress");
    const bar = document.querySelector(".shopping-progress-bar span");
    if (progress) progress.textContent = `${checked} / ${total}`;
    if (bar) bar.style.width = `${(checked / total) * 100}%`;
    showToast(input.checked ? "Prodotto segnato come acquistato." : "Prodotto rimosso dagli acquistati.");
  }));
}

function setupAssistant() {
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    appendAssistantMessage(message, "user-message");
    input.value = "";
    window.setTimeout(() => handleAssistantRequest(message), 180);
  });
  document.getElementById("assistantFab")?.addEventListener("click", () => {
    document.getElementById("assistantCard")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 350);
  });
}

function renderDigestPreview() {
  const content = document.getElementById("digestPreviewContent");
  if (!content) return;
  const pending = state.pending.length;
  const recent = state.customTasks.slice(0, 4);
  const queued = state.queuedNotifications.length;
  const elementCount = state.completed + pending + queued;
  document.getElementById("digestElementCount")?.replaceChildren(`${elementCount} element${elementCount === 1 ? "o" : "i"}`);
  content.innerHTML = `<div class="digest-preview-row"><span>✅ Fatto</span><strong>${state.completed} attività gestite</strong></div><div class="digest-preview-row"><span>👀 Da monitorare</span><strong>${pending} decision${pending === 1 ? "e" : "i"}</strong></div><div class="digest-preview-row"><span>🔕 In coda</span><strong>${queued} notific${queued === 1 ? "a" : "he"}</strong></div><div class="digest-preview-row"><span>🔒 Privacy</span><strong>Nessuna azione esterna</strong></div>${recent.length ? `<div class="digest-preview-list">${recent.map((task) => `<span>${escapeHTML(task.title)}</span>`).join("")}</div>` : ""}`;
}

function setupTimeTracker() {
  const display = document.getElementById("timeTrackerDisplay");
  const labelInput = document.getElementById("timeTrackerLabel");
  const startButton = document.getElementById("timeTrackerStartButton");
  const stopButton = document.getElementById("timeTrackerStopButton");
  const list = document.getElementById("timeEntryList");
  let startedAt = null;
  let timer = null;
  const format = (seconds) => [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((value) => String(value).padStart(2, "0")).join(":");
  const render = () => {
    if (list) list.innerHTML = state.timeEntries?.length ? state.timeEntries.slice(-8).reverse().map((entry) => `<div class="time-entry"><span>${escapeHTML(entry.label)}</span><strong>${format(entry.durationSeconds)}</strong></div>`).join("") : `<span class="muted-label">Nessuna sessione registrata.</span>`;
  };
  const tick = () => { if (display && startedAt) display.textContent = format(Math.floor((Date.now() - startedAt) / 1000)); };
  startButton?.addEventListener("click", () => { if (startedAt) return; startedAt = Date.now(); timer = window.setInterval(tick, 1000); startButton.disabled = true; stopButton.disabled = false; showToast("Timer avviato."); });
  stopButton?.addEventListener("click", () => { if (!startedAt) return; const durationSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000)); state.timeEntries = Array.isArray(state.timeEntries) ? state.timeEntries : [];    const label = labelInput?.value.trim() || "Sessione senza nome"; state.timeEntries.push({ label, startedAt: new Date(startedAt).toISOString(), durationSeconds }); addControlEvent({ type: "time", title: label, icon: "◷", tone: "purple", meta: `Sessione · ${format(durationSeconds)}`, status: "done", statusLabel: "Completato" }); saveState(); renderControlFeed(); window.clearInterval(timer); startedAt = null; if (display) display.textContent = "00:00:00"; startButton.disabled = false; stopButton.disabled = true; render(); showToast(`Sessione salvata: ${format(durationSeconds)}.`); });
  render();
}

function setupOfflineMonitoring() {
  const status = document.getElementById("offlineStatus");
  const showStatus = (message) => {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    window.clearTimeout(showStatus.timer);
    showStatus.timer = window.setTimeout(() => { status.hidden = true; }, 5000);
  };
  const update = () => {
    if (!navigator.onLine) showStatus("Modalità offline: i dati locali restano disponibili.");
    else if (status && !status.hidden) showStatus("Connessione ripristinata.");
  };
  window.addEventListener("offline", update);
  window.addEventListener("online", update);
  update();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      window.everydayScheduleReminder = ({ title, body, delayMs = 0 } = {}) => {
        registration.active?.postMessage({ type: "SCHEDULE_LOCAL_REMINDER", title, body, delayMs });
        showStatus("Promemoria locale programmato.");
      };
    }).catch(() => {});
  }
}

function setupSupport() {
  const form = document.getElementById("supportForm");
  const input = document.getElementById("supportInput");
  const category = document.getElementById("supportCategory");
  const answer = document.getElementById("supportAnswer");
  if (!form || !input || !answer) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      input.focus();
      showToast("Descrivi il problema prima di cercare una soluzione.", "warning");
      return;
    }
    const normalized = question.toLowerCase();
    const selectedCategory = category?.value || "info";
    let title = "Ho trovato un’indicazione nei documenti locali";
    let body = "Controlla README.md e run.md per i passaggi di avvio. Se il problema riguarda la dashboard, verifica di aver aperto il server sulla porta indicata e di usare la route principale.";
    let status = "Risolto: istruzioni disponibili";
    if (selectedCategory === "human" || normalized.includes("operatore") || normalized.includes("umano") || normalized.includes("frode")) {
      title = "La richiesta deve passare a un operatore";
      body = "Per frodi, accessi non autorizzati, controversie economiche, richieste legali formali o quando lo chiedi esplicitamente, il supporto AI non procede oltre. Usa il canale ufficiale del prodotto e conserva il riepilogo di questo caso.";
      status = "Passato a un operatore umano: il supporto AI non può gestire questo caso.";
    } else if (selectedCategory === "error" || normalized.includes("test") || normalized.includes("errore")) {
      title = "Prima verifichiamo cosa è successo";
      body = normalized.includes("test") ? "Apri il terminale nella cartella del progetto ed esegui: py -3 -m unittest -q. Per JavaScript usa node --check app/app.js. Un risultato OK indica che i test sono riusciti." : "Controlla l’attività nella sezione Governance e l’audit locale. Se l’errore ha coinvolto denaro, salute o documenti, non ripetere l’azione: annota l’orario e passa il caso a un operatore umano.";
      status = "In corso: verifica locale consigliata prima di qualsiasi correzione.";
    } else if (selectedCategory === "autonomy") {
      title = "Puoi ridurre l’autonomia subito";
      body = "Per ridurre l’autonomia, apri Impostazioni e attiva la modalità ‘Chiedimi sempre’ o modifica i confini del dominio. L’aggiornamento deve essere immediato e non richiede una conferma aggiuntiva. Per aumentarla, il motore verifica prima la storia specifica di azione, controparte e contesto.";
      status = "Risolto: il controllo è disponibile nelle Impostazioni.";
    } else if (selectedCategory === "frustration") {
      title = "La tua segnalazione resta sotto il tuo controllo";
      body = "Non userò la cronologia di fiducia contro di te. Posso spiegare la regola applicata, mostrare l’audit e guidarti verso una correzione. Se c’è un danno economico o sanitario, la richiesta va passata a un operatore umano.";
      status = "In corso: scegli se correggere l’autonomia o chiedere un operatore.";
    } else if (normalized.includes("preview") || normalized.includes("non apre") || normalized.includes("server")) {
      title = "Verifica il server della Preview";
      body = "Avvia il server con PORT=4174 node preview-server.mjs e apri http://127.0.0.1:4174/. La dashboard principale è disponibile anche su /app/.";
    } else if (normalized.includes("lingua") || normalized.includes("inglese") || normalized.includes("italiano")) {
      title = "Controlla la lingua nell’onboarding";
      body = "La lingua viene scelta nell’onboarding e salvata nel browser. Per ripetere la scelta, elimina la chiave everyday-agent-state-v2 dal Local Storage e ricarica la pagina.";
    } else if (normalized.includes("github") || normalized.includes("repository")) {
      title = "Controlla i file del repository";
      body = "README.md, LICENSE, ARCHITECTURE.md e SUBMISSION.md devono essere presenti nel repository pubblico. Dopo averli aggiunti, esegui commit e push da GitHub Desktop o dal terminale.";
    }
    answer.innerHTML = `<span class="support-answer-mark">${status.startsWith("Passato") ? "→" : "✓"}</span><div><strong>${title}</strong><p>${body}</p><small>Riepilogo: ${title}.<br>Stato: ${status}.<br>Prossimo passo: ${selectedCategory === "human" ? "contatta il canale ufficiale" : "segui le istruzioni indicate sopra"}.</small></div>`;
  });
}

function setupVisualActions() {
  document.querySelectorAll('[data-action="more"]').forEach((button) => button.addEventListener("click", () => showToast("Non ci sono altre azioni disponibili in questa demo.")));
  document.getElementById("searchButton")?.addEventListener("click", () => document.querySelector(".ops-search input")?.focus());
  document.getElementById("notificationButton")?.addEventListener("click", () => navigate("decisions"));
  document.getElementById("profileButton")?.addEventListener("click", () => navigate("settings"));
  document.querySelector(".workspace-switcher")?.addEventListener("click", () => showToast("Workspace locale attivo."));
  document.querySelectorAll(".integration-toggle").forEach((button) => button.title = "Attiva o disattiva integrazione locale");
}

function setupDigest() {
  const digestBackdrop = document.getElementById("digestBackdrop");
  const closeDigest = () => {
    digestBackdrop?.classList.remove("open");
    digestBackdrop?.setAttribute("aria-hidden", "true");
  };
  document.getElementById("previewDigestButton")?.addEventListener("click", () => {
    renderDigestPreview();
    digestBackdrop?.classList.add("open");
    digestBackdrop?.setAttribute("aria-hidden", "false");
  });
  document.getElementById("digestClose")?.addEventListener("click", closeDigest);
  document.getElementById("digestCloseButton")?.addEventListener("click", closeDigest);
  document.getElementById("clearActivityButton")?.addEventListener("click", (event) => {
    event.currentTarget.textContent = "Tutto letto ✓";
    showToast("Attività archiviate nel digest serale.");
  });
}

function setupBackendAccount() {
  const view = document.getElementById("view-settings");
  const settingsLayout = view?.querySelector(".settings-layout");
  if (!view || !settingsLayout || document.getElementById("backendAccountPanel")) return;
  const panel = document.createElement("section");
  panel.className = "glass-panel backend-account-panel";
  panel.id = "backendAccountPanel";
  panel.innerHTML = `
    <div class="section-heading no-margin">
      <div>
        <span class="card-kicker">BACKEND LOCALE</span>
        <h2>Spazio protetto</h2>
        <span class="muted-label">Account, sessioni e stato persistente sul tuo computer.</span>
      </div>
      <span class="governance-badge" id="backendModeBadge">solo locale</span>
    </div>
    <p class="backend-account-copy" id="backendAccountStatus">Avvia il backend locale per creare un account e salvare lo spazio in SQLite.</p>
    <div id="backendUnauthenticatedPanel" class="backend-auth-layout">
      <form class="backend-auth-form" id="backendRegisterForm">
        <strong>Crea account locale</strong>
        <label>Nome<input id="backendRegisterName" autocomplete="name" maxlength="80" required /></label>
        <label>Email<input id="backendRegisterEmail" autocomplete="email" type="email" maxlength="254" required /></label>
        <label>Password<input id="backendRegisterPassword" autocomplete="new-password" type="password" minlength="12" maxlength="256" required /></label>
        <label class="form-check backend-policy-check"><input id="backendRegisterPolicy" type="checkbox" required /> <span>Accetto i confini operativi e il salvataggio locale.</span></label>
        <button class="primary-button" type="submit">Crea spazio protetto</button>
      </form>
      <form class="backend-auth-form" id="backendLoginForm">
        <strong>Accedi al backend</strong>
        <label>Email<input id="backendLoginEmail" autocomplete="email" type="email" maxlength="254" required /></label>
        <label>Password<input id="backendLoginPassword" autocomplete="current-password" type="password" maxlength="256" required /></label>
        <button class="outline-button" type="submit">Accedi</button>
        <small>La password non viene memorizzata dalla dashboard; il server conserva solo un hash scrypt.</small>
      </form>
    </div>
    <div id="backendAuthenticatedPanel" class="backend-authenticated" hidden>
      <div><strong id="backendIdentity"></strong><small id="backendStateVersion"></small></div>
      <div class="backend-account-actions">
        <button class="outline-button" id="backendSyncButton" type="button">Sincronizza ora</button>
        <button class="ghost-button" id="backendLoadButton" type="button">Carica server</button>
        <button class="ghost-button" id="backendLogoutButton" type="button">Esci</button>
      </div>
    </div>
    <small class="backend-security-note" id="backendSyncStatus">I dati restano in localStorage finché non accedi al backend locale.</small>
    <div class="backend-security-note backend-boundary-note"><span>◈</span><span>Il backend non contiene token bancari, non contatta terzi e blocca esecuzioni esterne. Per la produzione servono TLS, vault dei segreti, OAuth/PSD2 e review di sicurezza.</span></div>
  `;
  settingsLayout.insertAdjacentElement("afterend", panel);

  const registerName = document.getElementById("backendRegisterName");
  if (registerName) registerName.value = getUserName();
  document.getElementById("backendRegisterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const response = await backendRequest("/auth/register", {
        method: "POST",
        body: {
          name: document.getElementById("backendRegisterName")?.value.trim(),
          email: document.getElementById("backendRegisterEmail")?.value.trim(),
          password: document.getElementById("backendRegisterPassword")?.value,
          policiesAcknowledged: Boolean(document.getElementById("backendRegisterPolicy")?.checked)
        }
      });
      setBackendSession(response);
      await syncStateToBackend({ notify: false });
      showToast("Spazio protetto creato e sincronizzato nel backend locale.");
    } catch (error) {
      showToast(backendErrorMessage(error), "warning");
    }
  });
  document.getElementById("backendLoginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const response = await backendRequest("/auth/login", {
        method: "POST",
        body: {
          email: document.getElementById("backendLoginEmail")?.value.trim(),
          password: document.getElementById("backendLoginPassword")?.value
        }
      });
      setBackendSession(response);
      await loadStateFromBackend({ initializeEmpty: false, notify: false });
      showToast("Accesso eseguito. Puoi scegliere se usare i dati server o sincronizzare quelli locali.");
    } catch (error) {
      showToast(backendErrorMessage(error), "warning");
    }
  });
  document.getElementById("backendSyncButton")?.addEventListener("click", () => { void syncStateToBackend({ notify: true }); });
  document.getElementById("backendLoadButton")?.addEventListener("click", () => { void loadStateFromBackend({ initializeEmpty: false, notify: true }); });
  document.getElementById("backendLogoutButton")?.addEventListener("click", async () => {
    try {
      await backendRequest("/auth/logout", { method: "POST", body: {}, csrf: true });
    } catch (error) {
      showToast(backendErrorMessage(error), "warning");
      return;
    }
    backend.authenticated = false;
    backend.csrfToken = "";
    backend.user = null;
    backend.workspace = null;
    backend.stateVersion = null;
    backend.status = "Sessione chiusa. La copia locale della dashboard resta sul dispositivo.";
    updateBackendAccountUI();
    showToast("Sessione backend chiusa.");
  });
  updateBackendAccountUI();
}

function setupSettings() {
  const threshold = document.getElementById("spendingThreshold");
  const limit = document.getElementById("notificationLimit");
  const channel = document.getElementById("notificationChannel");
  const neverAutomate = document.getElementById("neverAutomateInput");
  if (threshold) threshold.value = state.threshold;
  if (limit) {
    limit.value = state.notificationLimit;
    limit.textContent = state.notificationLimit;
  }
  const digestTimes = state.digestTimes || ["08:00", "19:00"];
  const morning = document.getElementById("morningDigestTime");
  const evening = document.getElementById("eveningDigestTime");
  if (morning) morning.value = digestTimes[0];
  if (evening) evening.value = digestTimes[1];
  if (channel) channel.value = state.notificationChannel || "push";
  if (neverAutomate) neverAutomate.value = state.neverAutomate.join(", ");
  document.querySelectorAll("[data-boundary]").forEach((input) => {
    input.checked = state.boundaries?.[input.dataset.boundary] !== false;
  });
  document.querySelectorAll("[data-stepper]").forEach((button) => button.addEventListener("click", () => {
    const direction = button.dataset.stepper === "up" ? 1 : -1;
    state.notificationLimit = Math.max(1, Math.min(10, state.notificationLimit + direction));
    if (limit) {
      limit.value = state.notificationLimit;
      limit.textContent = state.notificationLimit;
    }
  }));
  document.getElementById("saveSettingsButton")?.addEventListener("click", () => {
    if (threshold) state.threshold = Math.max(0, Number(threshold.value || 50));
    state.notificationLimit = Math.max(1, Math.min(10, Number(limit?.textContent || state.notificationLimit)));
    state.digestTimes = [morning?.value || "08:00", evening?.value || "19:00"];
    state.notificationChannel = channel?.value || "push";
    state.neverAutomate = (neverAutomate?.value || "").split(",").map((item) => item.trim()).filter(Boolean);
    state.boundaries = Object.fromEntries([...document.querySelectorAll("[data-boundary]")].map((input) => [input.dataset.boundary, input.checked]));
    saveState();
    updateDecisionCount();
    showToast("Regole salvate. La fiducia dinamica decide caso per caso; i tetti di sicurezza restano fissi.");
  });
}

function setupIntegrations() {
  document.querySelectorAll(".integration-card").forEach((card) => {
    const key = card.querySelector(".integration-toggle")?.getAttribute("aria-label")?.match(/calendario|email|conti|lista|casa|farmacia|prenotazioni|documenti famiglia/)?.[0];
    const integrationKey = { calendario: "calendar", email: "email", conti: "bank", lista: "grocery", casa: "home", farmacia: "health", prenotazioni: "bookings", "documenti famiglia": "familyDocs" }[key];
    const button = card.querySelector(".integration-toggle");
    if (button && integrationKey) button.classList.toggle("active", Boolean(state.integrations[integrationKey]));
    if (button && integrationKey) {
      card.classList.toggle("connected", Boolean(state.integrations[integrationKey]));
      const status = card.querySelector(".connection-state");
      if (status) {
        status.textContent = state.integrations[integrationKey] ? "Connesso" : "Disponibile";
        status.classList.toggle("muted-state", !state.integrations[integrationKey]);
      }
    }
    button?.addEventListener("click", () => {
      const active = button.classList.toggle("active");
      card.classList.toggle("connected", active);
      const status = card.querySelector(".connection-state");
      if (status) {
        status.textContent = active ? "Connesso" : "Disponibile";
        status.classList.toggle("muted-state", !active);
      }
      if (integrationKey) state.integrations[integrationKey] = active;
      showToast(active ? "Integrazione attivata localmente." : "Integrazione disconnessa.");
      saveState();
    });
  });
}

function renderTechnicalIssues() {
  const list = document.getElementById("technicalIssueList");
  if (!list) return;
  const issues = state.technicalIssues.filter((issue) => issue.status !== "resolved");
  list.innerHTML = issues.length ? issues.map((issue) => `<div class="technical-issue"><span class="technical-icon">⌁</span><div><strong>${escapeHTML(issue.connector || "Integrazione")}</strong><small>${escapeHTML(issue.message || "Accesso non disponibile")}</small></div><span class="technical-priority">${escapeHTML(issue.priority || "tecnico")}</span><button class="mini-action technical-resolve" data-issue-id="${escapeHTML(issue.id || "")}" type="button">Risolto</button></div>`).join("") : `<div class="empty-list-state"><span>⌁</span><strong>Nessun problema tecnico</strong><small>Un accesso scaduto apparirà qui con priorità distinta.</small></div>`;
  list.querySelectorAll(".technical-resolve").forEach((button) => button.addEventListener("click", () => {
    const issue = state.technicalIssues.find((item) => item.id === button.dataset.issueId);
    if (issue) issue.status = "resolved";
    saveState();
    updateGovernanceUI();
    showToast("Problema tecnico marcato come risolto.");
  }));
}

function renderSeasonalPeriods() {
  const list = document.getElementById("seasonalPeriodList");
  if (!list) return;
  list.innerHTML = state.seasonalPeriods.length ? state.seasonalPeriods.map((period) => `<span class="seasonal-chip"><strong>${escapeHTML(period.name)}</strong><small>${escapeHTML(period.day || 1)}/${escapeHTML(period.month)} · anticipo ${escapeHTML(period.lead_days || 30)} giorni</small></span>`).join("") : `<span class="muted-label">Nessun periodo personalizzato</span>`;
}

function renderTrustProfiles() {
  const list = document.getElementById("trustProfileList");
  const overall = document.getElementById("trustOverallScore");
  const count = document.getElementById("trustCombinationCount");
  const summary = document.getElementById("trustEngineSummary");
  const profiles = Object.keys(state.trustProfiles || {}).map((key) => {
    const stored = state.trustProfiles[key] || {};
    return getTrustProfile(stored.actionType || key.split("|")[0], stored.counterparty || key.split("|")[1], stored.context || key.split("|")[2]);
  }).sort((a, b) => b.score - a.score);
  const average = profiles.length ? profiles.reduce((total, profile) => total + profile.score, 0) / profiles.length : Number(state.trustBaselineScore || 20);
  if (overall) overall.textContent = `${average.toFixed(0)}/100`;
  if (count) count.textContent = `${profiles.length} combinazion${profiles.length === 1 ? "e" : "i"} osservat${profiles.length === 1 ? "a" : "e"}`;
  if (summary) summary.textContent = profiles.length ? "La fiducia resta specifica per azione, controparte e contesto." : "Ogni combinazione nuova parte prudentemente da 20/100.";
  if (!list) return;
  if (!profiles.length) {
    list.innerHTML = `<div class="empty-list-state"><span>◌</span><strong>Nessuna storia ancora</strong><small>Approva o rifiuta una richiesta per costruire il primo profilo.</small></div>`;
    return;
  }
  list.innerHTML = profiles.slice(0, 6).map((profile) => {
    const decay = profile.decayApplied > 0.5 ? ` · −${profile.decayApplied.toFixed(0)} nel tempo` : "";
    const source = profile.source === "imported" ? "importata" : profile.source === "new" ? "nuova" : "osservata";
    return `<article class="trust-profile-row"><div class="trust-profile-copy"><strong>${escapeHTML(profile.actionType)} · ${escapeHTML(profile.counterparty)}</strong><small>${escapeHTML(profile.context)} · ${source}${decay}</small></div><div class="trust-profile-score"><strong>${profile.score.toFixed(0)}</strong><small>/100</small></div><div class="trust-meter compact"><span style="width:${Math.max(0, Math.min(100, profile.score))}%"></span></div></article>`;
  }).join("");
}

function auditPayload(payload, previousHash = state.auditHead || "") {
  const entry = {
    sequence: state.auditLog.length + 1,
    at: new Date().toISOString(),
    event: payload,
    previousHash
  };
  // La UI locale non pretende di offrire un audit qualificato: conserva però
  // una catena hash per rendere rilevabili alterazioni accidentali.
  const canonical = JSON.stringify(entry);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) hash = Math.imul(hash ^ canonical.charCodeAt(index), 16777619);
  entry.hash = (hash >>> 0).toString(16).padStart(8, "0");
  state.auditLog.unshift(entry);
  state.auditHead = entry.hash;
  return entry;
}

function recordAuditEvent(event) {
  auditPayload(event);
  saveState();
}

function auditIsValid() {
  let previousHash = "";
  const entries = [...state.auditLog].reverse();
  return entries.every((entry, index) => {
    const expected = { sequence: index + 1, at: entry.at, event: entry.event, previousHash };
    const canonical = JSON.stringify(expected);
    let hash = 2166136261;
    for (let charIndex = 0; charIndex < canonical.length; charIndex += 1) hash = Math.imul(hash ^ canonical.charCodeAt(charIndex), 16777619);
    const expectedHash = (hash >>> 0).toString(16).padStart(8, "0");
    const valid = entry.sequence === expected.sequence && entry.previousHash === previousHash && entry.hash === expectedHash;
    previousHash = entry.hash;
    return valid;
  }) && (!state.auditLog.length || state.auditHead === state.auditLog[0].hash);
}

function recordDomainConsent(domain, scope = "autonomy", actor = "owner") {
  const normalized = String(domain || "general").toLowerCase();
  const consent = { domain: normalized, scope, actor, granted: true, grantedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + Number(state.autonomyConsentRenewalDays || 180) * 86400000).toISOString() };
  state.domainConsents[normalized] = consent;
  recordAuditEvent({ type: "domain_consent_granted", ...consent });
  return consent;
}

function updateGovernanceUI() {
  const status = document.getElementById("calibrationStatus");
  if (status) status.textContent = calibrationMessage();
  const badge = document.getElementById("calibrationBadge");
  if (badge) {
    badge.hidden = !calibrationActive();
    badge.textContent = calibrationActive() ? "attiva" : "completata";
  }
  const retention = document.getElementById("retentionDaysLabel");
  if (retention) retention.textContent = `${Number(state.privacy?.retentionDays || 90)} giorni`;
  const pauseButton = document.getElementById("pauseAgentButton");
  if (pauseButton) pauseButton.textContent = state.paused ? "Riprendi agente" : "Metti in pausa";
  const presence = document.querySelector(".agent-presence strong");
  const presenceCopy = document.querySelector(".agent-presence small");
  if (presence) presence.textContent = state.paused ? "Agente in pausa" : "Agente attivo";
  if (presenceCopy) presenceCopy.textContent = state.paused ? "Nessuna automazione" : "Spazio locale pronto";
  const dndBadge = document.getElementById("dndStatusBadge");
  if (dndBadge) {
    const active = smartDndActive();
    dndBadge.textContent = active ? "attivo" : "normale";
    dndBadge.classList.toggle("active-badge", active);
  }
  const consentLabel = document.getElementById("consentStatusLabel");
  if (consentLabel) {
    const consents = Object.values(state.domainConsents || {}).filter((consent) => consent?.granted && (!consent.expiresAt || new Date(consent.expiresAt) > new Date()));
    consentLabel.textContent = consents.length ? `${consents.length} consenso${consents.length === 1 ? "" : "i"} attivo${consents.length === 1 ? "" : "i"}` : "Nessun consenso di dominio";
  }
  const auditValid = auditIsValid();
  const auditBadge = document.getElementById("auditBadge");
  const auditStatus = document.getElementById("auditStatusLabel");
  if (auditBadge) auditBadge.textContent = state.auditLog.length ? (auditValid ? "audit verificato" : "audit da verificare") : "audit locale";
  if (auditStatus) auditStatus.textContent = state.auditLog.length ? (auditValid ? `${state.auditLog.length} eventi verificati` : "catena non valida") : "nessun evento ancora";
  const phase = document.getElementById("coldStartPhaseBadge");
  const coldStatus = document.getElementById("coldStartStatus");
  if (phase) phase.textContent = state.coldStart?.phase === "calibration" || calibrationActive() ? "calibrazione" : state.coldStart?.phase || "importazione";
  if (coldStatus) coldStatus.textContent = state.coldStart?.historicalImported ? "Pattern storici importati con consenso: ora la fiducia continua a calibrarsi sulle interazioni reali." : "Parto prudente da 20/100. Puoi importare pattern storici soltanto dopo un consenso separato.";
  const manualLabel = document.getElementById("manualModeLabel");
  const manualButton = document.getElementById("manualModeButton");
  const secondaryManual = document.getElementById("manualModeButtonSecondary");
  if (manualLabel) manualLabel.textContent = state.manualMode ? "modalità manuale globale" : "fiducia dinamica attiva";
  if (manualButton) manualButton.textContent = state.manualMode ? "Riattiva fiducia" : "Chiedimi sempre";
  if (secondaryManual) secondaryManual.textContent = state.manualMode ? "Riattiva fiducia" : "Chiedimi sempre";
  const errorRate = document.getElementById("kpiErrorRate");
  const computeCost = document.getElementById("kpiComputeCost");
  const businessActions = document.getElementById("businessActionsMetric");
  const businessAutomations = document.getElementById("businessAutomationMetric");
  const errorCount = Number(state.businessMetrics?.executionErrors || 0);
  const actionCount = Number(state.businessMetrics?.actionsExecuted || 0);
  if (errorRate) errorRate.textContent = `${actionCount ? ((errorCount / actionCount) * 1000).toFixed(1) : "0"}/1000`;
  if (computeCost) computeCost.textContent = `€${Number((state.computeEvents || []).reduce((total, item) => total + Number(item.costEur || 0), 0)).toFixed(2).replace(".", ",")}`;
  if (businessActions) businessActions.textContent = actionCount;
  if (businessAutomations) businessAutomations.textContent = Number(state.businessMetrics?.automationsNeverDisabled || 0);
  const crisisBadge = document.getElementById("crisisStatusBadge");
  const crisisStatus = document.getElementById("crisisStatusLabel");
  const openErrors = (state.executionErrors || []).filter((item) => item.status !== "resolved");
  if (crisisBadge) crisisBadge.textContent = openErrors.length ? `${openErrors.length} da gestire` : "nessun errore";
  if (crisisStatus) crisisStatus.textContent = openErrors.length ? openErrors[0].userMessage || "Errore registrato: revisione aperta." : "Promessa: correzione verificabile, non “zero errori”.";
  const offboardingStatus = document.getElementById("offboardingStatusLabel");
  if (offboardingStatus) offboardingStatus.textContent = state.offboarding?.handoverCreatedAt ? `Pacchetto creato il ${new Date(state.offboarding.handoverCreatedAt).toLocaleString("it-IT")}.` : "Nessun pacchetto di passaggio creato.";
  const dependencyStatus = document.getElementById("dependencyStatus");
  if (dependencyStatus) dependencyStatus.textContent = state.manualMode ? "Modalità manuale attiva: ogni richiesta richiede la tua decisione." : "Nessun segnale di affidamento eccessivo. Puoi sempre fermare tutto in un passaggio.";
  const computeEvents = document.getElementById("computeEventsMetric");
  const computeCostMetric = document.getElementById("computeCostMetric");
  if (computeEvents) computeEvents.textContent = (state.computeEvents || []).length;
  if (computeCostMetric) computeCostMetric.textContent = `€${Number((state.computeEvents || []).reduce((total, item) => total + Number(item.costEur || 0), 0)).toFixed(2).replace(".", ",")}`;
  renderTechnicalIssues();
  renderSeasonalPeriods();
  renderTrustProfiles();
}

function getSimulationScenarioFromForm() {
  const value = (id, fallback = "") => document.getElementById(id)?.value.trim() || fallback;
  const income = Number(document.getElementById("simulationIncome")?.value || 4200);
  return {
    name: value("simulationUserName", "Marta Rossi"),
    monthly_income_eur: Number.isFinite(income) ? Math.max(800, Math.min(100000, Math.round(income))) : 4200,
    partner: value("simulationPartner", "Luca"),
    child: value("simulationChild", "Nina"),
    pet: value("simulationPet", "gatto"),
    trusted_provider: value("simulationTrustedProvider", "Idraulico Fidato"),
    habits: value("simulationHabits", "approva rapidamente i fornitori conosciuti").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8)
  };
}

function renderSimulationScenario() {
  const scenario = state.simulationScenario || defaultState.simulationScenario;
  const values = {
    simulationUserName: scenario.name,
    simulationIncome: scenario.monthly_income_eur,
    simulationPartner: scenario.partner,
    simulationChild: scenario.child,
    simulationPet: scenario.pet,
    simulationTrustedProvider: scenario.trusted_provider,
    simulationHabits: (scenario.habits || []).join(", ")
  };
  Object.entries(values).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value ?? "";
  });
}

function renderSimulationReport() {
  const report = state.simulationReport;
  const badge = document.getElementById("simulationStatusBadge");
  const metrics = document.getElementById("simulationMetrics");
  const output = document.getElementById("simulationOutput");
  const download = document.getElementById("downloadSimulationButton");
  const clear = document.getElementById("clearSimulationButton");
  if (!metrics || !output) return;
  if (!report) {
    if (badge) { badge.textContent = "non eseguita"; badge.classList.remove("active-badge"); }
    metrics.innerHTML = "<span><strong>—</strong><small>azioni</small></span><span><strong>—</strong><small>notifiche</small></span><span><strong>—</strong><small>contraddizioni</small></span>";
    output.innerHTML = "<strong>Nessun ciclo eseguito</strong><small>L’esecuzione produrrà un log giorno per giorno e le correzioni di policy.</small>";
    if (download) download.disabled = true;
    if (clear) clear.disabled = true;
    return;
  }
  const summary = report.metrics || {};
  if (badge) { badge.textContent = "completata"; badge.classList.add("active-badge"); }
  metrics.innerHTML = `<span><strong>${Number(summary.actions || 0).toLocaleString("it-IT")}</strong><small>azioni</small></span><span><strong>${Number(summary.notifications_total || 0).toLocaleString("it-IT")}</strong><small>notifiche</small></span><span><strong>${Number(summary.contradictions_found || 0)}</strong><small>contraddizioni</small></span>`;
  const latest = (report.contradictions || []).slice(0, 3).map((item) => `<li><strong>Giorno ${escapeHTML(item.day)} · ${escapeHTML(item.title)}</strong><small>${escapeHTML(item.resolution)}</small></li>`).join("");
  output.innerHTML = `<strong>${escapeHTML(report.simulation?.months || 0)} mesi analizzati · seed ${escapeHTML(report.simulation?.seed || "")}</strong><small>${Number(summary.blocked_actions || 0)} azioni avversarie bloccate · ${Number(summary.support_cases || 0)} casi passati dal Supporto.</small>${latest ? `<ul>${latest}</ul>` : ""}`;
  if (download) download.disabled = false;
  if (clear) clear.disabled = false;
}

function setupSimulation() {
  renderSimulationScenario();
  renderSimulationReport();
  document.getElementById("resetSimulationScenarioButton")?.addEventListener("click", () => {
    state.simulationScenario = JSON.parse(JSON.stringify(defaultState.simulationScenario));
    saveState();
    renderSimulationScenario();
    showToast("Scenario demo ripristinato.");
  });
  document.getElementById("runSimulationButton")?.addEventListener("click", async () => {
    const button = document.getElementById("runSimulationButton");
    const duration = Number(document.getElementById("simulationDuration")?.value || 365);
    const scenario = getSimulationScenarioFromForm();
    state.simulationScenario = scenario;
    saveState();
    if (button) { button.disabled = true; button.textContent = "Simulazione in corso…"; }
    try {
      const params = new URLSearchParams({ days: String(duration), seed: "20260831", scenario: JSON.stringify(scenario), run: String(Date.now()) });
      const response = await fetch(`/simulation-report.json?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`simulation_${response.status}`);
      state.simulationReport = await response.json();
      saveState();
      renderSimulationReport();
      showToast(`Simulazione completata per ${scenario.name}: ${state.simulationReport.metrics.actions} azioni analizzate.`);
    } catch (error) {
      showToast("Simulazione non disponibile: avvia preview-server.mjs e riprova.", "warning");
    } finally {
      if (button) { button.disabled = false; button.textContent = "Esegui simulazione"; }
    }
  });
  document.getElementById("downloadSimulationButton")?.addEventListener("click", () => {
    if (state.simulationReport) downloadJSON("everyday-agent-simulation-report.json", state.simulationReport);
  });
  document.getElementById("clearSimulationButton")?.addEventListener("click", () => {
    state.simulationReport = null;
    saveState();
    renderSimulationReport();
    showToast("Risultato della simulazione cancellato.");
  });
}

function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function resetLocalState() {
  Object.keys(defaultState).forEach((key) => {
    const value = defaultState[key];
    state[key] = value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  });
  state.notificationDate = todayKey();
  saveState();
  updatePersonalization();
  updateDecisionCount();
  renderCustomTasks();
  renderCustomDecisions();
  showOnboarding();
}

function setupGovernance() {
  const contextInput = document.getElementById("smartContextInput");
  const dndToggle = document.getElementById("smartDndToggle");
  if (contextInput) contextInput.value = state.context || "";
  if (dndToggle) dndToggle.checked = state.smartDnd !== false;
  document.getElementById("saveDndButton")?.addEventListener("click", () => {
    state.context = contextInput?.value.trim() || "";
    state.smartDnd = dndToggle?.checked !== false;
    saveState();
    updateGovernanceUI();
    showToast(state.context && state.smartDnd ? "Non disturbare intelligente aggiornato." : "Rilevamento Non disturbare disattivato.");
  });
  const setManualMode = () => {
    state.manualMode = !state.manualMode;
    recordAuditEvent({ type: "manual_mode_changed", enabled: state.manualMode });
    updateGovernanceUI();
    showToast(state.manualMode ? "Modalità manuale attiva: ti chiederò sempre." : "Fiducia dinamica riattivata.");
  };
  document.getElementById("manualModeButton")?.addEventListener("click", setManualMode);
  document.getElementById("manualModeButtonSecondary")?.addEventListener("click", () => {
    if (!state.manualMode) state.manualMode = true;
    recordAuditEvent({ type: "manual_mode_changed", enabled: true });
    updateGovernanceUI();
    showToast("Modalità manuale attiva: ti chiederò sempre.");
  });
  document.getElementById("grantMoneyConsentButton")?.addEventListener("click", () => {
    const consent = recordDomainConsent("money");
    showToast(`Consenso locale per denaro valido fino al ${new Date(consent.expiresAt).toLocaleDateString("it-IT")}.`);
    updateGovernanceUI();
  });
  document.getElementById("importHistoryButton")?.addEventListener("click", () => {
    state.coldStart = { ...state.coldStart, phase: "calibration", historicalImported: true, importedAt: new Date().toISOString(), source: "demo locale" };
    recordAuditEvent({ type: "historical_import", source: "demo locale", imported: 1 });
    updateGovernanceUI();
    showToast("Importazione dimostrativa registrata con consenso. Nessun dato esterno è stato letto.");
  });
  document.getElementById("simulateErrorButton")?.addEventListener("click", () => {
    const task = { title: "Aggiornamento locale", category: "home", actionType: "repair", counterparty: "fornitore demo", trustContext: "manutenzione" };
    const profile = getTrustProfile(task.actionType, task.counterparty, task.trustContext);
    const previous = Number(profile.score || state.trustBaselineScore);
    const error = { id: createTaskId(), type: "execution_error", task, domain: task.category, error: "Il servizio demo ha restituito un risultato inatteso.", detectedAt: new Date().toISOString(), severity: "standard", trustKey: profile.key, trustBefore: previous, trustAfter: Math.max(0, previous - 40), status: "open", userMessage: "Ho rilevato un errore: ho ridotto la fiducia solo per questa combinazione e aperto una revisione." };
    state.executionErrors.unshift(error);
    state.crisisEvents.unshift({ errorId: error.id, at: error.detectedAt, trustReduced: true });
    state.businessMetrics.executionErrors = Number(state.businessMetrics.executionErrors || 0) + 1;
    recordAuditEvent({ type: "execution_error", errorId: error.id, domain: error.domain });
    updateGovernanceUI();
    showToast("Errore registrato e fiducia locale ridotta solo per questa combinazione.", "warning");
  });
  document.getElementById("viewAuditButton")?.addEventListener("click", () => showToast(auditIsValid() ? `Audit verificato: ${state.auditLog.length} eventi nella catena locale.` : "Audit non valido: controlla la cronologia locale.", auditIsValid() ? "success" : "warning"));
  const legalBackdrop = document.getElementById("legalBackdrop");
  const closeLegal = () => { legalBackdrop?.classList.remove("open"); legalBackdrop?.setAttribute("aria-hidden", "true"); };
  document.getElementById("openLegalDocsButton")?.addEventListener("click", () => { legalBackdrop?.classList.add("open"); legalBackdrop?.setAttribute("aria-hidden", "false"); });
  document.getElementById("legalClose")?.addEventListener("click", closeLegal);
  document.getElementById("legalCloseButton")?.addEventListener("click", closeLegal);
  legalBackdrop?.addEventListener("click", (event) => { if (event.target === legalBackdrop) closeLegal(); });
  document.getElementById("runDependencyCheckButton")?.addEventListener("click", () => {
    const message = state.manualMode ? "Modalità manuale già attiva: nessuna autonomia resta attiva." : "Revisione completata: puoi ridurre l'autonomia in un solo passaggio.";
    showToast(message, "info");
    updateGovernanceUI();
  });
  document.querySelectorAll("[data-permission-member]").forEach((select) => {
    const member = select.dataset.permissionMember;
    const domain = select.dataset.permissionDomain;
    const value = state.familyPermissions?.[member]?.[domain];
    select.value = Array.isArray(value) && value.includes("manage") ? "manage" : Array.isArray(value) && value.includes("approve") ? "approve" : "none";
  });
  document.getElementById("savePermissionMatrixButton")?.addEventListener("click", () => {
    document.querySelectorAll("[data-permission-member]").forEach((select) => {
      const member = select.dataset.permissionMember;
      const domain = select.dataset.permissionDomain;
      state.familyPermissions[member] = state.familyPermissions[member] || {};
      if (select.value === "none") delete state.familyPermissions[member][domain];
      else state.familyPermissions[member][domain] = [select.value];
    });
    saveState();
    showToast("Matrice dei permessi salvata.");
  });
  document.getElementById("simulateFailureButton")?.addEventListener("click", () => {
    const issue = { id: createTaskId(), connector: "Conti bancari", message: "Accesso scaduto: rinnova l'autorizzazione", priority: "tecnico", status: "open", at: new Date().toISOString() };
    state.technicalIssues.unshift(issue);
    saveState();
    updateGovernanceUI();
    showToast("Problema tecnico registrato separatamente dalle decisioni.", "warning");
  });
  document.getElementById("restartCalibrationButton")?.addEventListener("click", () => {
    state.calibrationStartedAt = new Date().toISOString();
    state.metrics.calibrationNotifications = 0;
    saveState();
    updateGovernanceUI();
    showToast("Periodo di calibrazione riavviato.");
  });
  document.getElementById("exportDataButton")?.addEventListener("click", () => {
    downloadJSON("everyday-agent-dati.json", { exportedAt: new Date().toISOString(), privacy: state.privacy, state });
    showToast("Esportazione GDPR preparata sul dispositivo.");
  });
  document.getElementById("deleteDataButton")?.addEventListener("click", () => {
    if (!window.confirm("Cancellare tutti i dati locali e le automazioni? Questa azione non si può annullare.")) return;
    resetLocalState();
    showToast("Dati locali cancellati. Puoi ricominciare dalla calibrazione.", "warning");
  });
  document.getElementById("saveSeasonalButton")?.addEventListener("click", () => {
    const input = document.getElementById("seasonalPeriodInput");
    const [name, monthText, dayText] = (input?.value || "").split(",").map((item) => item.trim());
    const month = Number(monthText);
    const day = Number(dayText || 1);
    if (!name || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
      showToast("Inserisci nome, mese (1-12) e opzionalmente giorno.", "warning");
      return;
    }
    state.seasonalPeriods.push({ name, month, day, lead_days: 30 });
    saveState();
    renderSeasonalPeriods();
    input.value = "";
    showToast(`Periodo “${name}” aggiunto al radar stagionale.`);
  });
  document.getElementById("pauseAgentButton")?.addEventListener("click", () => {
    state.paused = !state.paused;
    state.offboarding = { ...state.offboarding, paused: state.paused, mode: state.paused ? "paused" : "active" };
    saveState();
    updateGovernanceUI();
    showToast(state.paused ? "Agente in pausa: le nuove richieste resteranno ferme." : "Agente riattivato.");
  });
  document.getElementById("offboardAgentButton")?.addEventListener("click", () => {
    const createdAt = new Date().toISOString();
    const handover = { createdAt, pending: state.pending.map((id) => state.customTasks.find((task) => task.id === id)).filter(Boolean), queuedNotifications: state.queuedNotifications, preferences: state.preferences, automationSuggestions: state.automationSuggestions, deadlines: state.hiddenDeadlines, documents: state.documents, technicalIssues: state.technicalIssues, trustProfiles: state.trustProfiles, activeConsents: state.domainConsents, nextStep: "assegna manualmente le scadenze aperte, revoca i token esterni e conferma il passaggio" };
    state.offboarding = { paused: true, mode: "offboarding", handoverCreatedAt: createdAt, handover, externalTokensToRevoke: true, automationsCancelled: false };
    state.paused = true;
    recordAuditEvent({ type: "offboarding_package_created", createdAt, pendingCount: handover.pending.length });
    downloadJSON("everyday-agent-passaggio.json", handover);
    updateGovernanceUI();
    showToast("Pacchetto di passaggio creato: nessuna scadenza viene persa.", "warning");
  });
  updateGovernanceUI();
}

function setupSearch() {
  const popover = document.getElementById("searchPopover");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  const searchable = [];
  document.getElementById("searchButton")?.addEventListener("click", () => {
    popover.classList.toggle("open");
    if (popover.classList.contains("open")) input.focus();
  });
  input?.addEventListener("input", () => {
    const query = input.value.toLowerCase().trim();
    results.innerHTML = "";
    searchable.filter(([title, meta]) => !query || `${title} ${meta}`.toLowerCase().includes(query)).forEach(([title, meta]) => {
      const result = document.createElement("button");
      result.type = "button";
      result.className = "search-result";
      result.innerHTML = `<strong>${title}</strong><small>${meta}</small>`;
      result.addEventListener("click", () => { popover.classList.remove("open"); showToast(`Aperto: ${title}`); });
      results.appendChild(result);
    });
  });
  input?.dispatchEvent(new Event("input"));
  document.addEventListener("click", (event) => {
    if (!popover.contains(event.target) && event.target.id !== "searchButton") popover.classList.remove("open");
  });
}

function setupSecondaryActions() {
  document.getElementById("notificationButton")?.addEventListener("click", () => navigate("decisions"));
  document.getElementById("profileButton")?.addEventListener("click", () => navigate("settings"));
  document.getElementById("clearMemoryButton")?.addEventListener("click", () => {
    if (!window.confirm("Cancellare preferenze e regole apprese da questo dispositivo?")) return;
    state.preferences = [];
    state.rejections = [];
    state.rejectionKeys = [];
    state.neverAutomate = [];
    saveState();
    showToast("Memoria locale cancellata.", "warning");
  });
  document.getElementById("addPreferenceButton")?.addEventListener("click", () => showToast("Scrivi una preferenza nella prossima attività da aggiungere."));
  document.querySelectorAll(".edit-button").forEach((button) => button.addEventListener("click", () => showToast("Preferenza pronta per la modifica.")));
  document.querySelectorAll(".small-action").forEach((button) => button.addEventListener("click", () => showToast("Regola pronta: conferma prima di automatizzare.")));
  document.querySelectorAll(".view-toggle").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".view-toggle").forEach((item) => item.classList.remove("active")); button.classList.add("active"); showToast(`${button.textContent} selezionata.`); }));
}

function init() {
  bindNavigation();
  setupOnboarding();
  updatePersonalization();
  setupModal();
  setupDecisions();
  setupCalendar();
  setupGrocery();
  setupDigest();
  setupAssistant();
  setupSupport();
  setupOfflineMonitoring();
  setupTimeTracker();
  setupControlFeed();
  setupVisualActions();
  setupSettings();
  setupBackendAccount();
  setupIntegrations();
  setupGovernance();
  setupSimulation();
  setupSearch();
  setupSecondaryActions();
  renderCustomTasks();
  renderCustomDecisions();
  updateDecisionCount();
  navigate(window.location.hash.slice(1) || "dashboard", false);
  renderTrustProfiles();
  applyTranslationsToOnboarding();
  showOnboarding();
  void initializeBackend();
}

if (typeof window !== "undefined") {
  window.everydayAgent = {
    classifyRequest,
    getTrustProfile,
    evaluateTrust,
    updateTrustProfile,
    trustKey,
    decayedTrustScore,
    getState: () => state,
    backend: () => ({ available: backend.available, authenticated: backend.authenticated, stateVersion: backend.stateVersion, status: backend.status })
  };
}

document.addEventListener("DOMContentLoaded", init);
