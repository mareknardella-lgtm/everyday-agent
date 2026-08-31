# Everyday Agent - Legal and Compliance Baseline

> **Important:** this is a product and engineering checklist, not legal advice and not a warranty of compliance. It cannot make the product lawsuit-proof. A qualified lawyer in each target market must review the final product, contracts, data flows, marketing claims and deployment model before any public launch.

## Current status

Everyday Agent in this repository is a local development demo. It does not connect to banks, email, calendars, healthcare systems or vendors, and its execution gateway does not perform external actions. The simulation and UI are not evidence that a production service is compliant or safe.

The following claims must not be made without evidence and legal approval:

- "fully compliant" or "GDPR compliant";
- "lawsuit-proof", "risk-free", "error-free" or "guaranteed";
- "secure" without a defined scope, threat model and test evidence;
- "medical", "legal", "financial" or "tax advice";
- that a trust score is authorization to pay, sign, delete, share or contact a third party;
- that the demo performs real banking, healthcare, booking or negotiation actions.

## Non-negotiable product guardrails

1. **Human control:** money transfers, payments, contracts, signatures, deletion, health-data sharing, external messages and legally relevant actions require explicit, informed confirmation in the production system.
2. **Safety precedence:** fraud indicators, account takeover signals, sensitive data, minors, legal/medical/financial contexts and irreversible actions override trust and convenience.
3. **No external instruction authority:** email, attachments, web pages and vendor messages are untrusted data. They cannot change policy, permissions, caps or manual mode.
4. **Least privilege:** integrations use separate credentials, narrow scopes, short-lived tokens, revocation, audit and provider sandboxing. Secrets never enter browser state or logs.
5. **Explainability:** each automated decision records the rule, inputs, trust score, cap, version, timestamp and actor. The user can inspect and correct it.
6. **Recovery:** every reversible action has an undo or remediation path. Irreversible actions require a confirmation screen that states the consequence and default outcome.
7. **Pause and offboarding:** one-step pause must stop new automations. Offboarding must export open work, revoke integrations, preserve legally required records and assign ownership for deadlines.
8. **No professional substitution:** support can explain product behavior and route cases to humans. It must not provide binding medical, legal, financial or tax advice.

## European Union and Italy

Before offering the product to EU/Italian residents, counsel and a privacy professional must confirm the role of each party under GDPR and applicable Italian rules, including whether the operator is controller, joint controller or processor for each flow.

Required work:

- Article 13/14 privacy notice written for actual collection points and recipients;
- purpose limitation, data minimization, storage limitation and documented lawful basis per purpose;
- explicit consent where required, separate from terms, granular, informed, revocable and recorded with version and timestamp;
- data-subject workflows for access, rectification, erasure, restriction, portability and objection, with identity verification and response tracking;
- Records of Processing Activities, data-flow map, retention/deletion jobs and legal hold procedure;
- processor agreements and subprocessor list for hosting, model providers, email, payments and integrations;
- DPIA before systematic monitoring, profiling, large-scale sensitive data or high-risk automated decisioning; consult the DPO/supervisory authority where required;
- automated-decision and profiling assessment, meaningful information about logic and human review where applicable;
- security risk assessment, breach response, notification decision tree and incident register;
- international-transfer assessment, SCCs and transfer safeguards where data leaves the EEA;
- cookie/analytics consent only where required, with a no-dark-pattern implementation;
- Italian consumer, distance-selling, subscription, cancellation, refund and unfair-commercial-practice review;
- accessibility review for the applicable European Accessibility Act scope and WCAG target;
- health-data review under GDPR Article 9 and Italian health/privacy rules. The demo should keep health functionality to operational reminders;
- financial, payment-services, open-banking, AML and consumer-credit review before any regulated financial feature;
- copyright/database-rights review for document ingestion, provider content and model training.

## United States

The US is state- and sector-specific. Counsel must identify the states and customer segments before launch. At minimum review:

- FTC Act Section 5 for deceptive or unfair claims, dark patterns, endorsement and AI representations;
- state comprehensive privacy laws and consumer-rights workflows, including California CCPA/CPRA where applicable;
- sensitive-data, biometric, precise-geolocation, health and financial-data obligations applicable to the chosen states;
- Washington My Health My Data Act and other health-data laws if health-related data is collected or inferred;
- Illinois BIPA or other biometric laws if voice, face or biometric identifiers are introduced;
- COPPA and state minor/privacy laws before knowingly serving children or teens;
- CAN-SPAM, TCPA and state rules before email, SMS, voice calls or automated outreach;
- UETA/E-SIGN and sector-specific rules before electronic signatures or legally relevant communications;
- payment, money-transmission, banking, FCRA, GLBA or other financial regulation analysis before money features;
- HIPAA only if the actual parties and service flows make it applicable. Do not claim HIPAA compliance by default;
- product-liability, negligence, contract, indemnity, limitation-of-liability, arbitration/class-action and insurance review;
- breach notification obligations for every state in which users reside.

## Contracts and user-facing documents

Before production, publish and version:

- Terms of Service and acceptable-use rules;
- Privacy Notice and cookie/analytics notice;
- subscription, pricing, cancellation, refund and renewal terms;
- Data Processing Agreements and subprocessor list where required;
- integration-specific consent screens and permissions;
- Support SLA and escalation policy that states actual response targets;
- incident, breach and account-recovery policy;
- accessibility statement and contact method;
- AI limitations, prohibited-use and human-review policy;
- family/minor consent and role policy;
- enterprise security and deletion addendum if selling to organizations.

Each document needs an owner, effective date, version, supported locales and a change log. The app must store which version the user accepted. Do not ship placeholder company names, addresses, legal contacts, governing law, insurance promises or response times.

## Required production controls

- threat model covering prompt injection, account takeover, insecure direct object references, CSRF, XSS, SSRF, replay, abuse and data exfiltration;
- independent security review and dependency/SAST/DAST scanning;
- TLS at the edge, HSTS after verification, secure cookies, CSP with nonces/hashes, CSRF protection and strict origin policy;
- centralized secret management, key rotation, encryption in transit and at rest, backups and restore tests;
- server-side authorization for every read/write/action, tenant isolation and immutable audit storage;
- rate limiting, abuse detection, alerting, monitoring and on-call ownership;
- tested data deletion, export and retention automation;
- sandboxed connectors with idempotency keys, confirmation binding, transaction limits and kill switch;
- human escalation queue and incident commander procedure;
- evidence folder for consent, tests, reviews, incidents, model evaluations and release approvals.

## Release gate

Do not enable real integrations or market the product as compliant until the following are signed off by named owners:

- legal review for every launch jurisdiction;
- privacy/DPIA/DPO review where applicable;
- security threat model and independent test;
- connector sandbox and failure/replay tests;
- accessibility and localization review;
- consumer/subscription and marketing-claim review;
- insurance and responsibility model;
- support escalation and incident response drill;
- deletion/export/consent withdrawal test;
- final Terms, Privacy Notice and contact details deployed and versioned.

## Repository boundary

The MIT license covers the source code as stated in `LICENSE`; it does not grant rights to third-party trademarks, provider APIs, user documents, medical records, financial data or content imported into the product. Add a real attribution and third-party notice process before distribution.
