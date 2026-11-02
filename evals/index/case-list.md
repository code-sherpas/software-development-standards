# Index test cases — the list

30 cases: 10 description-only, 20 description+code. Standards are named by file name without `.md`. "Covers" is what the case is designed to make expected; the three labelling agents and the person set the final expected set.

**Broad standards** (apply to almost any code change; not inflated across cases, counted only where a case is designed around them): `automated-testing`, `business-logic`, `neverthrow-return-types`, `post-deploy-verification`, `pre-merge-gates`, `prefer-named-functions`. Labellers will likely add them to most code cases; see open question 1.

## 1. Cases

| Id | Title | Kind | Stack / area | Covers | Near miss for |
|---|---|---|---|---|---|
| C01 | Clients reschedule their own appointments from the booking page (raw request, clinics in Spain and Portugal) | description | Request intake | refining-work, built-in-temporal-types, internationalization | — |
| C02 | Split refined task: invoice CSV export plus renaming the customer 'phone' field to 'contact phone' | description | Planning | splitting-work-into-increments, expand-contract-schema-changes | — |
| C03 | Ship the increments of task PROJ-412: at most 4, 2 in parallel, stacking allowed | description | Agent workflow (coordinator) | shipping-increments, stacked-changes, pre-merge-gates, post-deploy-verification | — |
| C04 | Error-tracker issue pasted by support: 'TypeError: Cannot read properties of undefined (reading zone)' on /api/bookings, 312 events | description | Operations | fixing-reported-errors, failure-reporting | refining-work |
| C05 | Your PR is ready but main is red after another agent session's merge; its check fails on your branch | description | Agent workflow (builder) | collaborating-across-agent-sessions, pre-merge-gates | — |
| C06 | Make the onboarding prototype clickable for admin and member roles, check it in desktop and mobile viewports | description | Prototype | state-coherent-prototypes, accessibility, leave-nothing-running | — |
| C07 | Users type 'move my Tuesday standup to after lunch' into the calendar and it happens (raw request) | description | Model-interpreted feature, request intake | refining-work, model-interpreted-features, built-in-temporal-types | — |
| C08 | Split refined task: 'Summarize this thread' button that shows an AI-written summary as text, via an LLM provider | description | Planning, external service | splitting-work-into-increments, integration-logic, accessibility, internationalization | model-interpreted-features |
| C09 | You are the verifier of increment 3 of PROJ-412: checkout fix is deployed; you opened a headless browser and a tunnel to use it | description | Agent workflow (verifier) | shipping-increments, post-deploy-verification, leave-nothing-running | — |
| C10 | Rotate the payment webhook secret in the hosting platform's environment and turn on a feature flag in the flag tool; no repository change | description | Configuration, no code | post-deploy-verification | pre-merge-gates |
| C11 | Rename customers.phone to phone_number: one Prisma migration plus updated model and queries in the same PR | description+code | Schema migration (Prisma/Postgres) | expand-contract-schema-changes, write-persistence-representations, pre-merge-gates | — |
| C12 | New table invoice_reminders (nullable sent_at timestamptz, status @default("pending"), createdAt @default(now())) | description+code | Schema migration (Prisma/Postgres) | write-persistence-representations, utc-zoned-temporal-types, built-in-temporal-types | expand-contract-schema-changes |
| C13 | New Invoice aggregate with lines, referencing Customer by id; branded InvoiceId from randomUUID; markAsPaid returns a new instance; InvoiceTotalsService sums its own lines | description+code | Domain model (TypeScript) | domain-entity, aggregate-boundaries, domain-entity-reference-direction, domain-entity-reference-optionality, domain-entity-typed-ids, domain-entity-uuidv4-ids, immutable-domain-entities | domain-service |
| C14 | createAppointmentCommandHandler: auth, clinic permission, no double booking across clinician schedule and appointments, transaction, request context | description+code | Backend business logic (Next.js + Prisma) | business-logic, business-logic-typical-domain-entity-entry-points, business-logic-entry-point-command-query-separation, business-logic-entry-point-cqs-handler-signatures, business-logic-entry-point-colocate-types, business-logic-entry-point-primitive-input-types, business-logic-ensure-business-constraints, business-logic-ensure-authenticated-requester, business-logic-ensure-authorized-requester, business-logic-entry-point-execution-context, business-logic-entry-point-database-transaction, business-logic-entry-point-transaction-isolation-levels, business-logic-entry-point-use-repositories, business-logic-entry-point-repository-interface, business-logic-entry-point-prefer-top-level-functions, bounded-context-layout, domain-service | — |
| C15 | Review: OrderService class with create/update/findById/cancel, prisma.order calls inline, Order passed in command, OrderDto returned, types in a barrel, numeric autoincrement ids | description+code | Backend business logic, review (TypeScript) | business-logic-entry-point-one-per-module, business-logic-entry-point-prefer-top-level-functions, business-logic-entry-point-use-repositories, business-logic-entry-point-repository-interface, business-logic-entry-point-primitive-input-types, business-logic-entry-point-domain-entity-payload-types, business-logic-entry-point-colocate-types, business-logic-typical-domain-entity-entry-points, business-logic-entry-point-command-query-separation, domain-entity-typed-ids, domain-entity-uuidv4-ids | — |
| C16 | Kotlin/Spring JpaSubscriptionRepository: findActiveForBilling filters by trial rule and LocalDateTime.now(), save() upserts, returns JPA entities, reads tenant from request context; only the implementation changes | description+code | Persistence (Kotlin/Spring/JPA) | repository-no-business-logic, business-logic-entry-point-repository-domain-types, business-logic-entry-point-repository-operations, dependency-direction, business-logic-entry-point-execution-context, domain-entity-typed-ids | business-logic-entry-point-repository-interface |
| C17 | Transfer seats between two teams' subscriptions: team.seats.push in the entry point, seat.assignedMember nullable, owner-only | description+code | Backend business logic (TypeScript) | domain-service, business-logic, business-logic-ensure-business-constraints, business-logic-ensure-authorized-requester, domain-entity, immutable-domain-entities, domain-entity-reference-optionality | — |
| C18 | searchInvoicesQueryHandler for a customer page: READ COMMITTED transaction, Customer gains invoices[] for display, repo findManyByCustomerId returns Prisma rows, checkWhetherInvoiceCanBeVoided added | description+code | Backend query (Next.js + Prisma) | business-logic-entry-point-transaction-isolation-levels, business-logic-entry-point-database-transaction, business-logic-entry-point-domain-entity-payload-types, business-logic-typical-domain-entity-entry-points, business-logic-entry-point-cqs-handler-signatures, business-logic-entry-point-command-query-separation, business-logic-entry-point-repository-operations, business-logic-entry-point-repository-domain-types, business-logic-ensure-authenticated-requester, business-logic-ensure-authorized-requester, domain-entity-reference-direction, business-logic | — |
| C19 | Payment provider webhook route: verify signature, parse epoch 'created' into payment.paidAt, map to markInvoiceAsPaid, try/catch with console.error | description+code | Integration, inbound (Next.js route handler) | integration-logic, serialization-boundaries, built-in-temporal-types, utc-zoned-temporal-types, iso8601-millisecond-precision, dependency-direction, failure-reporting, neverthrow-wrap-exceptions | — |
| C20 | Client for the internal pricing service: fetch with timeout, ResultAsync, Sentry.captureException on 404, inline .map callbacks | description+code | Integration, outbound (TypeScript) | integration-logic, neverthrow-return-types, neverthrow-wrap-exceptions, failure-reporting, dependency-direction, serialization-boundaries, prefer-named-functions | — |
| C21 | Appointment form: datetime-local input plus clinic time-zone select; server action stores new Date(local) and returns a Date to the client | description+code | User interface (Next.js form + server action) | built-in-temporal-types, accessibility, internationalization, serialization-boundaries, iso8601-millisecond-precision | utc-zoned-temporal-types |
| C22 | Prototype in code: kanban board with drag-to-reorder, icon-only buttons, toasts, each screen with its own hard-coded state | description+code | Prototype (React) | state-coherent-prototypes, accessibility, prefer-named-functions | — |
| C23 | Python nightly job deletes expired export files: datetime.now() naive, repository decides the 7-day grace period, logs at error when none found | description+code | Background job (Python) | built-in-temporal-types, utc-zoned-temporal-types, dependency-direction, repository-no-business-logic, failure-reporting, business-logic, pre-merge-gates | accessibility, internationalization, leave-nothing-running |
| C24 | Natural-language invoice search ('unpaid from last quarter over 500 EUR') through an LLM tool call, with a corpus test file | description+code | Model-interpreted feature (TypeScript) | model-interpreted-features, automated-testing, integration-logic, built-in-temporal-types | — |
| C25 | Tests only: deterministic parser for 'next tuesday 3pm' with a fixed grammar; tests assert on a mocked clock call count | description+code | Test-only change | automated-testing, built-in-temporal-types | model-interpreted-features, post-deploy-verification |
| C26 | Docs only: ADR recording that Invoice and Customer are separate aggregates; API docs switch dates from epoch seconds to ISO 8601 | description+code | Documentation-only | aggregate-boundaries, iso8601-millisecond-precision | post-deploy-verification |
| C27 | CI workflow change so checks run on PRs based on other branches; your layer stacks on another session's open PR whose change breaks your check | description+code | Configuration (CI YAML), agent workflow | stacked-changes, collaborating-across-agent-sessions, pre-merge-gates | — |
| C28 | Move src/services/billing/* into src/billing/{domain,application,...}; invoice-use-cases.ts exports three entry points; shared/ imports a billing adapter | description+code | Repository layout (TypeScript) | bounded-context-layout, dependency-direction, business-logic-entry-point-one-per-module | — |
| C29 | Queue event InvoiceIssued: rename amount to amountCents and customer_id to customerId in producer and consumer in one deploy; consumer throws on bad payload | description+code | Messaging (TypeScript, queue) | expand-contract-schema-changes, serialization-boundaries, integration-logic, domain-entity-uuidv4-ids, neverthrow-return-types | — |
| C30 | Fix for issue BOOK-77: null zone guarded at the adapter, 400 validation errors no longer reported to Sentry, regression test added | description+code | Operations fix (Next.js) | fixing-reported-errors, automated-testing, failure-reporting | — |

## 2. Coverage

| Standard | Expected in | Count | Near miss in |
|---|---|---|---|
| accessibility | C06, C08, C21, C22 | 4 | C23 |
| aggregate-boundaries | C13, C26 | 2 | — |
| automated-testing (broad) | C24, C25, C30 | 3 | — |
| bounded-context-layout | C14, C28 | 2 | — |
| built-in-temporal-types | C01, C07, C12, C19, C21, C23, C24, C25 | 8 | — |
| business-logic-ensure-authenticated-requester | C14, C18 | 2 | — |
| business-logic-ensure-authorized-requester | C14, C17, C18 | 3 | — |
| business-logic-ensure-business-constraints | C14, C17 | 2 | — |
| business-logic-entry-point-colocate-types | C14, C15 | 2 | — |
| business-logic-entry-point-command-query-separation | C14, C15, C18 | 3 | — |
| business-logic-entry-point-cqs-handler-signatures | C14, C18 | 2 | — |
| business-logic-entry-point-database-transaction | C14, C18 | 2 | — |
| business-logic-entry-point-domain-entity-payload-types | C15, C18 | 2 | — |
| business-logic-entry-point-execution-context | C14, C16 | 2 | — |
| business-logic-entry-point-one-per-module | C15, C28 | 2 | — |
| business-logic-entry-point-prefer-top-level-functions | C14, C15 | 2 | — |
| business-logic-entry-point-primitive-input-types | C14, C15 | 2 | — |
| business-logic-entry-point-repository-domain-types | C16, C18 | 2 | — |
| business-logic-entry-point-repository-interface | C14, C15 | 2 | C16 |
| business-logic-entry-point-repository-operations | C16, C18 | 2 | — |
| business-logic-entry-point-transaction-isolation-levels | C14, C18 | 2 | — |
| business-logic-entry-point-use-repositories | C14, C15 | 2 | — |
| business-logic (broad) | C14, C17, C18, C23 | 4 | — |
| business-logic-typical-domain-entity-entry-points | C14, C15, C18 | 3 | — |
| collaborating-across-agent-sessions | C05, C27 | 2 | — |
| dependency-direction | C16, C19, C20, C23, C28 | 5 | — |
| domain-entity | C13, C17 | 2 | — |
| domain-entity-reference-direction | C13, C18 | 2 | — |
| domain-entity-reference-optionality | C13, C17 | 2 | — |
| domain-entity-typed-ids | C13, C15, C16 | 3 | — |
| domain-entity-uuidv4-ids | C13, C15, C29 | 3 | — |
| domain-service | C14, C17 | 2 | C13 |
| expand-contract-schema-changes | C02, C11, C29 | 3 | C12 |
| failure-reporting | C04, C19, C20, C23, C30 | 5 | — |
| fixing-reported-errors | C04, C30 | 2 | — |
| immutable-domain-entities | C13, C17 | 2 | — |
| integration-logic | C08, C19, C20, C24, C29 | 5 | — |
| internationalization | C01, C08, C21 | 3 | C23 |
| iso8601-millisecond-precision | C19, C21, C26 | 3 | — |
| leave-nothing-running | C06, C09 | 2 | C23 |
| model-interpreted-features | C07, C24 | 2 | C08, C25 |
| neverthrow-return-types (broad) | C20, C29 | 2 | — |
| neverthrow-wrap-exceptions | C19, C20 | 2 | — |
| post-deploy-verification (broad) | C03, C09, C10 | 3 | C25, C26 |
| prefer-named-functions (broad) | C20, C22 | 2 | — |
| pre-merge-gates (broad) | C03, C05, C11, C23, C27 | 5 | C10 |
| refining-work | C01, C07 | 2 | C04 |
| repository-no-business-logic | C16, C23 | 2 | — |
| serialization-boundaries | C19, C20, C21, C29 | 4 | — |
| shipping-increments | C03, C09 | 2 | — |
| splitting-work-into-increments | C02, C08 | 2 | — |
| stacked-changes | C03, C27 | 2 | — |
| state-coherent-prototypes | C06, C22 | 2 | — |
| utc-zoned-temporal-types | C12, C19, C23 | 3 | C21 |
| write-persistence-representations | C11, C12 | 2 | — |

Standards below 2: none.

## 3. Near-miss cases (10 cases)

- **C04** — refining-work — looks like a request to work on, but a reported error is explicitly out of its scope (Fixing Reported Errors owns it).
- **C08** — model-interpreted-features — an AI feature, but generation shown as text with no downstream action is out of scope.
- **C10** — pre-merge-gates — a production change, but no route into the main branch; post-deploy-verification still applies.
- **C12** — expand-contract-schema-changes — a migration, but adding a table with nullable columns is not destructive.
- **C13** — domain-service — a class named *Service, but the logic stays inside one aggregate and belongs on its root.
- **C16** — business-logic-entry-point-repository-interface — repository work, but only the implementation changes, which the standard excludes.
- **C21** — utc-zoned-temporal-types — a time is stored, but it is a civil time a person chose in a place, which the UTC standard leaves out (built-in-temporal-types governs it).
- **C23** — accessibility and internationalization — a background job whose only text is log lines; leave-nothing-running — the scheduled job is the deliverable, not a leftover.
- **C25** — model-interpreted-features — interprets natural-language dates, but with a fixed grammar (a parser); post-deploy-verification — test-only change is exempt.
- **C26** — post-deploy-verification — documentation-only change is exempt.

## 4. Open questions for the person

1. Broad standards (pre-merge-gates, post-deploy-verification, automated-testing, prefer-named-functions, neverthrow-return-types, business-logic): should labellers mark them expected in every code case where they technically apply, or only where the case is about them? This changes how many failures the test reports.
1. Near misses: should the CI test fail when the agent selects a near-miss standard (false positive), or only report it? The constraint as stated fails only on misses.
1. C14 and C18 each carry 12–17 standards. Keep them as dense "full entry point" cases, or split each into two smaller cases (at the cost of the 30-case ceiling)?
1. For agent-workflow cases (C03, C05, C09, C27), should the case text include the role prompt the agent would actually receive (coordinator, builder, reviewer, verifier), or only the situation?
1. Stack variety: two cases are non-TypeScript (C16 Kotlin, C23 Python). Is that enough, or should the main stack be even more dominant / less?

## Decisions on the open questions (David, 2026-11-02)

1. Broad standards are labelled expected in **every** case where they apply, not only in the cases built around them.
2. Dense cases (C14, C18) are **not** split: real increments touch 15–25 standards, and that is where a standard is most easily missed. The small cases already cover each standard for diagnosis.
3. Every case includes what the agent would really receive: the hook's instruction to read the index and, in code cases, its role's brief (builder or reviewer; verifier or coordinator in agent-workflow cases).
4. Two non-TypeScript cases are enough.
5. Choosing a near-miss standard is only reported, never a failure.
