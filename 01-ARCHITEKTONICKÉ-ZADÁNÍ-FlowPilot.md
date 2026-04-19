# FlowPilot — Architektonické zadání
## Komplexní projektový a fakturační systém

---

**Verze:** 1.0  
**Datum:** 19. dubna 2026  
**Autor zadání:** Jakub Prošek (James Powiz)  
**Status:** Pracovní verze k diskusi  

---

## 0. Executive Summary

FlowPilot je ambiciózní **self-hosted ERP/PM systém** kombinující:

- **Projektové řízení** (Freelo-style)
- **Časový tracking** s podporou různých typů prací
- **Fakturační modul** (české standardy, QR kódy, SPLAT/SPAYD)
- **AI integrace** (předpřipravené úkoly, návrhy, automatizace)
- **REST API** + **MCP/skills** pro AI agenty
- **Modulární architektura** s oddělenými doménami

Cíl: Nahradit kombinaci Freelo + fakturační nástroj + Google Docs + AI asistenta jedním koherentním systémem běžícím na Synology v Dockeru.

---

## 1. Analýza trhu a benchmark

### 1.1 Referenční nástroje

#### Freelo (CZ referenční produkt)
- **Silné stránky:** Přehledný UI, dobrý UX, česky, rozumná cena (400–1500 Kč/měsíc), kombinuje PM + time tracking + fakturaci
- **Slabší stránky:** Omezené API, žádný Gantt, žádná AI integrace, cloud-only
- **Klíčové funkce k inspirování:**
  - Kanban board s rychlým přepínáním
  - Time tracking přímo na úkolech
  - Rozpočty projektů s hodinovými sazbami
  - Kombinace úkolů a fakturace
  - Kalendářní pohled na deadline úkolů

#### ClickUp
- **Silné stránky:** Velmi bohaté funkce, 15+ view typů, time tracking, AI (ClickUp Brain), rozumné API
- **Slabší stránky:** Překombinovaný, pomalý, hodně konfigurovatelný = hodně času na nastavení
- **Klíčové funkce k inspirování:**
  - Více view současně (List + Calendar + Gantt)
  - Custom fields s typy (čísla, dropdowny, data, uživatele)
  - Automations (triggery → akce)
  - Integrovaný AI asistent

#### Notion
- **Silné stránky:** Flexibilní databáze, dokumentace, šablony
- **Slabší stránky:** Slabý time tracking, žádná fakturace, pomalé API
- **Klíčové funkce k inspirování:**
  - Relační databáze (linked databases)
  - Templates
  - Cross-page linking

#### Odoo
- **Silné stránky:** Kompletní ERP, modulární, open-source, fakturace, sklad, CRM
- **Slabší stránky:** Extrémně komplexní nasazení, IT-intenzivní správa, náročný na server
- **Klíčové funkce k inspirování:**
  - Unified data model napříč moduly
  - Timesheety s analytickým účetnictvím
  - Workflow enginy

#### Invoice Ninja (self-hosted)
- **Silné stránky:** Open-source invoicing, PDF generování, multi-měna, REST API
- **Slabší stránky:** Oddělený od PM, slabý projekt management
- **Klíčové funkce k inspirování:**
  - Katalog produktů/služeb
  - Opakované faktury
  - Expense tracking
  - Client portal

#### EspoCRM
- **Silné stránky:** Open-source CRM, flexible entity model, kanban views, PHP/Laravel stack
- **Slabší stránky:** Zastaralý UI stack, slabý native time tracking, invoicing pouze přes pluginy
- **Důležité pro Jakuba:** Základní koncept flexible entity-manageru je hodnotný

#### OpenProject
- **Silné stránky:** Gantt, agile boards, time tracking, OpenSource
- **Slabší stránky:** Komplexní, slabé AI, žádná fakturace

### 1.2 Self-hosted specifika pro Synology

**Omezení Synology Docker:**
- Limitované zdroje (CPU, RAM) — nutné lightweight řešení
- Docker Compose funkční, ale bez Kubernetes
- Single-node provoz
- Doporučeno: PostgreSQL + Node.js/Python backend, Vue/React frontend
- Objektové úložiště: Synology NAS S3 compatible bucket

**Doporučené docker-only stacky:**
- NginX proxy s let's encrypt
- PostgreSQL 15+ pro hlavní DB
- Redis pro cache/sessions
- MinIO pro S3-compatible object storage (pro přílohy, PDF)
- Případně Caddy místo NginX (jednodušší konfigurace)

---

## 2. Funkční specifikace — Moduly

### 2.1 Základní architektura modulů

```
┌─────────────────────────────────────────────────────────────┐
│                      FlowPilot Core                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Auth &  │  │  Notifi- │  │   AI    │  │   API   │     │
│  │  Users   │  │  cations │  │ Engine  │  │ Gateway  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Projects │  │  Tasks   │  │   Time   │  │   Bill  │     │
│  │   Hub    │  │ Engine  │  │ Tracking │  │  Module │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Clients  │  │  Invoice │  │ Reports  │  │ Calendar│     │
│  │   CRM    │  │ Generator│  │ & Stats  │  │  View   │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Modul: Projects Hub

#### 2.2.1 Entity: Project

**Atributy:**
- `id` (UUID)
- `name` (string, max 255)
- `client_id` (FK → Client, nullable pro interní projekty)
- `status` (enum: draft, active, on_hold, completed, archived)
- `billing_type` (enum: fixed_price, time_and_materials, non_billable)
- `budget_hours` (decimal, nullable)
- `budget_amount` (decimal, nullable)
- `hourly_rate_default` (decimal, nullable — přepíše typ práce)
- `starts_at` (date, nullable)
- `ends_at` (date, nullable)
- `tags` (JSON array stringů)
- `description` (text)
- `created_at`, `updated_at`, `deleted_at`

**Vztahy:**
- 1 Project → N Tasks
- 1 Project → N TimeEntries
- 1 Project → N Invoices (částečně nebo fully invoiced)
- 1 Project → N ProjectMembers (user + role)

#### 2.2.2 Funkce

**CRUD operace:**
- Vytvoření projektu (s volbou šablony)
- Klonování projektu (kopíruje strukturu úkolů, ale ne time entries)
- Archivace (soft delete, skryje z aktivních pohledů)
- Přehledový dashboard projektu (budget vs. actual, progress)

**Šablony projektů:**
- Uživatel si definuje šablony projektů
- Šablona obsahuje: výchozí strukturu úkolů, workflow, billing type, defaultní sazby
- Při vytvoření nového projektu z šablony se předvyplní struktura

**Tagy a kategorizace:**
- Volné tagy na projektech
- Barevné označení
- Filtrace podle tagů napříč všemi views

---

### 2.3 Modul: Tasks Engine

#### 2.3.1 Entity: Task

**Atributy:**
- `id` (UUID)
- `project_id` (FK)
- `parent_task_id` (FK, nullable — pro sub-tasks/stromovou strukturu)
- `name` (string, max 255)
- `description` (text, markdown)
- `status` (enum: backlog, todo, in_progress, review, done, cancelled)
- `priority` (enum: low, medium, high, urgent)
- `assignee_id` (FK → User, nullable)
- `reporter_id` (FK → User)
- `estimated_hours` (decimal, nullable)
- `actual_hours` (decimal, computed z time entries)
- `due_date` (datetime, nullable)
- `start_date` (datetime, nullable)
- `track_time` (boolean — zda se na úkol trackuje čas)
- `billing_type` (inherit_from_project | custom; pokud custom, tak rate_override)
- `work_type_id` (FK → WorkType, nullable)
- `position` (integer — pro pořadí v kanbanu)
- `labels` (JSON array)
- `attachments` (JSON array — reference na MinIO objekty)
- `custom_fields` (JSON object)
- `created_at`, `updated_at`, `done_at`

**Sub-tasks (podúkoly):**
- Libovolná hloubka vnoření (doporučeno max 3)
- Aggregace: parent task spočítá total estimated/actual hours z children
- Sub-tasks se dědí: assignee, due_date, labels, work_type

#### 2.3.2 Task Dependencies

- `depends_on` (FK na jiný task)
- Typy závislostí: finish_to_start, start_to_start, finish_to_finish
- Gantt zobrazí závislosti jako šipky
- Pokud se změní due_date master úkolu, optionálně se posunou i závislé (podle nastavení)

#### 2.3.3 Workflow / Statuses

**Defaultní workflow (customizovatelné):**
```
Backlog → To Do → In Progress → Review → Done
                 ↘ Cancelled ↗
```

**Možnosti customizace:**
- Přidání vlastních statusů
- Změna pořadí
- Pro každý projekt lze mít vlastní workflow nebo sdílet globální
- Pravidla: kdo může přesouvat mezi statusy (např. pouze reporter může move to Done)

#### 2.3.4 Views — Task Views

**1. List View (rows)**
- Jako klasický spreadsheet
- Sloupce: check, name, assignee, status, priority, due date, estimated hours, actual hours, billing type
- Drag & drop pro změnu pořadí
- Bulk akce: hromadná změna statusu, assignee, smazání
- Inline editace (double-click na buňku)
- Group by: status, assignee, priority, due date, labels
- Sort by: jakýkoliv sloupec

**2. Kanban Board**
- Sloupce = statusy workflow
- Karty zobrazují: title, assignee avatar, due date badge, priority indicator, estimate vs actual
- Drag & drop mezi sloupci
- WIP limit na sloupce (max N cards in progress)
- Rychlý filtr: moje úkoly, dnes, tento týden, overdue
- Barevné pruhy podle projektu nebo priority

**3. Calendar View**
- Úkoly s due_date zobrazeny v kalendáři (de facto deadline kalendář)
- Alternativně: úkoly s start_date + duration zobrazeny jako bloky
- Barevné kódování podle projektu
- Click na den → vytvoření úkolu s tímto due_date

**4. Gantt Chart**
- Časová osa: denní / týdenní / měsíční / kvartální
- Závislosti jako šipky mezi úkoly
- Critical path highlighting (volitelně)
- Milestones (úkoly bez duration, pouze bod v čase)
- Zoom in/out
- Export do PNG/PDF

**5. Timeline View**
- Podobný Ganttu, ale horizontální layout s více projekty najednou
- Resource view: co má kdo rozpracované

**6. Table/Board toggle**
- Uložitelné view presety
- Rychlé přepínání mezi views

---

### 2.4 Modul: Time Tracking

#### 2.4.1 Entity: TimeEntry

**Atributy:**
- `id` (UUID)
- `task_id` (FK, nullable — lze trackovat i bez úkolu)
- `project_id` (FK)
- `user_id` (FK)
- `work_type_id` (FK → WorkType)
- `description` (string, max 500)
- `started_at` (datetime)
- `ended_at` (datetime, nullable — pokud běží timer)
- `duration_minutes` (integer, computed)
- `is_billable` (boolean)
- `invoice_id` (FK, nullable — pokud už je ofakturováno)
- `created_at`, `updated_at`

**Computed:**
- `duration_hours` = duration_minutes / 60
- `billing_amount` = duration_hours × work_type.hourly_rate (nebo task override)

#### 2.4.2 Typy práce (WorkType)

**Předdefinované příklady:**
- Programování (1500–2000 Kč/h)
- Administrativa (400–600 Kč/h)
- Analýza a konzultace (1200–1800 Kč/h)
- Grafika a design (800–1500 Kč/h)
- Management (1000–1500 Kč/h)
- Testování (700–1200 Kč/h)

**Atributy WorkType:**
- `id`, `name`, `hourly_rate`, `color` (pro vizuální rozlišení v reports), `is_active`

#### 2.4.3 Time Tracking Flow

**Způsoby zadání:**

1. **Timer (stopky):**
   - Start/stop button na tasku nebo v global header
   - Notifikace pokud timer běží příliš dlouho (8h)
   - Automatický stop po X hodinách neaktivity (nastavitelné)

2. **Manual entry:**
   - Zadání: datum, projekt, úkol, work type, popis, doba (HH:MM)
   - Rychlý vstup: pouze projekt + doba (pro jednoduché trackování)

3. **Bulk entry:**
   - Tabulka pro více záznamů najednou
   - Copy-paste z Excelu (rozpozná datum, čísla)

4. **Calendar entry:**
   - Drag na kalendáři = vytvoří time entry

#### 2.4.4 Reports a Statistiky

- **Daily/Weekly/Monthly timesheet** (per user, per project)
- **Billable vs non-billable** breakdown
- **Variance report:** estimated vs actual per task
- **Utilization:** kolik % času bylo billable
- **Export:** CSV, PDF, Excel
- **Goal tracking:** nastavení budget hours na projekt → alert při překročení % threshold

---

### 2.5 Modul: Clients CRM

#### 2.5.1 Entity: Client

**Atributy:**
- `id` (UUID)
- `name` (string — společnost nebo jméno osoby)
- `ic` (IČO, string, nullable)
- `dic` (DIČ, string, nullable)
- `is_company` (boolean)
- `email` (string)
- `phone` (string, nullable)
- `website` (string, nullable)
- `billing_address` (text — více řádků)
- `delivery_address` (text, nullable — liší-li se)
- `note` (text, nullable)
- `default_payment_terms_days` (integer, default 14)
- `default_invoice_note` (text)
- `vat_subject` (boolean — je plátce DPH)
- `country` (string, default 'CZ')
- `bank_name`, `bank_account`, `bank_iban`, `bank_swift` (pro QR kódy)
- `created_at`, `updated_at`

**Vztahy:**
- 1 Client → N Projects
- 1 Client → N Invoices
- 1 Client → N Contacts (osoby u klienta)

#### 2.5.2 Entity: Contact

**Atributy:**
- `id`, `client_id`, `name`, `email`, `phone`, `role`, `is_primary` (boolean)

---

### 2.6 Modul: Invoice Generator (Fakturaace)

#### 2.6.1 Entity: Invoice

**Atributy:**
- `id` (UUID)
- `invoice_number` (string — automatic dle sequence, např. "2026-04-001")
- `client_id` (FK)
- `project_id` (FK, nullable)
- `status` (enum: draft, sent, viewed, paid, overdue, cancelled)
- `issue_date` (date)
- `due_date` (date)
- `tax_point_date` (date — datum zdanitelného plnění)
- `currency` (string, default 'CZK')
- `exchange_rate` (decimal, default 1.0 — pro cizí měny)
- `subtotal` (decimal)
- `discount_percent` (decimal, default 0)
- `discount_amount` (decimal)
- `vat_percent` (decimal, default 21)
- `vat_amount` (decimal)
- `total` (decimal)
- `total_paid` (decimal, default 0)
- `bank_account_id` (FK → BankAccount)
- `payment_method` (enum: bank_transfer, cash, card, other)
- `qr_code_data` (string — SPAYD formát)
- `note` (text)
- `footer_note` (text — pro SPLAT/SPAYD poznámky)
- `pdf_path` (string — MinIO reference)
- `sent_at` (datetime, nullable)
- `paid_at` (datetime, nullable)
- `created_at`, `updated_at`

#### 2.6.2 Entity: InvoiceLineItem

**Atributy:**
- `id`, `invoice_id`, `task_id` (nullable, FK)
- `description` (text)
- `quantity` (decimal)
- `unit` (string — hodina, ks, den, kus)
- `unit_price` (decimal)
- `vat_percent` (decimal)
- `total` (decimal)
- `sort_order` (integer)

**Vztah k time entries:**
- InvoiceLineItem může vzniknout z time entries
- Vybere se: projekt + datum range + work type → automaticky se generují řádky
- Nebo ruční přidání položky

#### 2.6.3 Entity: BankAccount (mé účty)

**Atributy:**
- `id`
- `name` (alias, např. "FIO korporátní")
- `bank_name`
- `account_number` (string ve formátu "123456789/0100")
- `iban` (string)
- `swift` (string)
- `currency` (string)
- `is_default` (boolean)
- `is_active` (boolean)

#### 2.6.4 Catalog Služeb a Produktů

**Entity: Product/Service**

**Atributy:**
- `id`
- `name` (string)
- `description` (text)
- `unit` (string — hodina, ks, den, balíček)
- `default_unit_price` (decimal)
- `default_vat_percent` (decimal)
- `category` (string — pro organizaci)
- `is_active` (boolean)
- `created_at`

**Použití:**
- Při tvorbě faktury lze přidávat z katalogu
- Ukládá se historie použití (poslední cena)
- Rychlá fakturace opakovaných služeb

#### 2.6.5 Czech Invoice Compliance

**Požadované náležitosti dle zákona o DPH:**
- [ ] Označení fakturowaného subjektu (my) — jméno, sídlo, IČO, DIČ
- [ ] Označení odběratele — jméno, sídlo, IČO
- [ ] Evidenční číslo faktury
- [ ] Datum uskutečnění zdanitelného plnění (tax point)
- [ ] Datum vystavení
- [ ] Datum splatnosti
- [ ] Rozsah a předmět plnění
- [ ] Unit Price v CZK (pokud cizí měna, tak i měna)
- [ ] Base amount
- [ ] VAT rate and amount
- [ ] Total amount
- [ ] Currency
- [ ] For VAT subjects: VAT base + VAT amount broken down by rates
- [ ] Payment information: account number, bank, amount
- [ ] For cross-border EU: VAT ID, reverse charge notation

**QR Kod — SPAYD:**
- Struktura SPAYD string viz specifikace níže
- QR kód generovaný na PDF fakturu
- Nutno řešit: ikonu banky, české znaky v QR

**Specifikace SPAYD:**
```
SPD*1.0*ACC:CZ123456789012345678901234*AM:1500.50*CC:CZK*RN:2026-04-001*DT:2026-04-20*PT:14*MSG:FlowPilot faktura*
```
nebo varianta s více info. Nutno prozkoumat aktuální specifikaci na: https://github.com/spayd/spayd

#### 2.6.6 Invoice PDF Layout

**Standardní layout faktury (A4):**
```
┌────────────────────────────────────────┐
│  [Logo]   VYSTAVENÁ FAKTURA           │
│            Faktura č.: 2026-04-001    │
├────────────────────────────────────────┤
│  DODAVATEL          ODBĚRATEL          │
│  Jméno              Jméno               │
│  Adresa            Adresa              │
│  IČO: xxx          IČO: xxx            │
│  DIČ: xxx          DIČ: xxx            │
├────────────────────────────────────────┤
│  Datum vystavení: 20.4.2026            │
│  Datum splatnosti: 4.5.2026           │
│  ZPŮSOB PLATBY: bankovní převod       │
├────────────────────────────────────────┤
│  #  Popis         Množ.  Jedn.  Cena   │
│  ─────────────────────────────────────│
│  1  Programování    5    hod   1500   │
│  2  Administrativa   2    hod    500   │
├────────────────────────────────────────┤
│  Mezi součet:          8 500 Kč       │
│  DPH 21%:              1 785 Kč       │
│  CELKEM K ÚHRADĚ:      10 285 Kč     │
├────────────────────────────────────────┤
│  [QR KÓD]                               │
│  Platba: FIO banka, účet: xxx         │
│  Variabilní symbol: 2026-04-001       │
└────────────────────────────────────────┘
```

---

### 2.7 Modul: Reports & Analytics

#### 2.7.1 Typy Reportů

1. **Project Status Report**
   - Budget vs. actual (hours + money)
   - % dokončení úkolů
   - Časová osa (Gantt snapshot)
   - Risks/Issues

2. **Financial Summary**
   - Fakturovatelná vs. nefakturovatelná práce
   - Příjmy za období (podle data vystavení vs. data úhrady)
   - Outstanding invoices (splacení vs. overdue)
   - Client revenue breakdown

3. **Time Analysis**
   - Utilization rate per user
   - Time by project, by work type
   - Trend: průměrná denní/týdenní produktivita
   - Comparison vs. previous period

4. **Invoice Aging Report**
   - Open invoices by age
   - Predikce cash flow

5. **Custom Reports Builder**
   - Výběr dimenzí (project, user, work type, date range)
   - Agregace (sum, count, avg)
   - Vizualizace (bar chart, line chart, pie)
   - Export

---

### 2.8 Modul: AI Engine

#### 2.8.1 Koncept AI Integrace

AI engine je **abstraktní vrstva** nad LLM API. Uživatel si nastaví jeden nebo více providerů:

- OpenAI (GPT-4o, GPT-4o-mini)
- Google Gemini (Vertex AI)
- OpenRouter (agregátor 100+ modelů)
- GitHub Copilot (code-specific)

**Architektura:**
```
┌──────────────────────────────────────┐
│          AI Engine (Unified API)     │
├──────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ OpenAI │ │ Gemini │ │OpenRout│  │
│  │Provider│ │Provider│ │ er     │  │
│  └────────┘ └────────┘ └────────┘  │
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│            AI Skills                 │
│  (Pre-defined prompting patterns)     │
├──────────────────────────────────────┤
│  • task_decomposition                │
│  • project_planning                  │
│  • meeting_notes_to_tasks            │
│  • invoice_draft_generation          │
│  • client_email_draft               │
│  • risk_analysis                    │
│  • time_entry_suggestion             │
└──────────────────────────────────────┘
```

#### 2.8.2 AI Skills — konkrétní použití

**1. Task Decomposition ("rozděl úkol")**
- Input: jeden velký úkol
- Output: 3–7 sub-tasks s přibližnými odhady hodin
- Prompt: "Jsi projektový manažer. Rozděl následující úkol na menší, realistické úkoly..."

**2. Project Kickoff ("návrh struktury projektu")**
- Input: název projektu, popis, deadline
- Output: návrh struktury (fáze, milníky, key tasks)
- Prompt: "Jsi senior projektový manažer. Na základě [popisu] navrhni strukturu projektu..."

**3. Meeting Notes → Tasks ("přepiš poznámky na úkoly")**
- Input: volný text z meetingu
- Output: seznam tasks ve strukturovaném formátu
- Identifikuje: akce, deadline, assignee
- Prompt: "Z následujících poznámek z meetingu extrahuj úkoly ve formátu: [ ] Úkol | Deadline | Assignee"

**4. Invoice Draft ("návrh faktury")**
- Input: seznam time entries / služeb
- Output: strukturovaný návrh InvoiceLineItem
- Propojení s klientem, work types, sazbami

**5. Client Communication Draft ("návrh emailu klientovi")**
- Input: kontext (faktura, overdue, meeting), tone (formální/neformální)
- Output: email text
- Template-based prompting

**6. Risk Analysis ("analýza rizik projektu")**
- Input: seznam úkolů, deadline, resources
- Output: identifikovaná rizika, pravděpodobnost, dopad, mitigation

**7. Weekly Review Summary ("týdenní report")**
- Input: time entries za týden, dokončené úkoly
- Output: textový report pro klienta/management

#### 2.8.3 AI Configuration

**Per-user settings:**
- Preferred AI provider
- API key / credentials
- Monthly budget limit (token budget)
- Default model (quality vs speed tradeoff)

**Global settings:**
- System prompt base (instructions for all skills)
- Temperature, max_tokens defaults per skill

#### 2.8.4 AI Action Points (kde všude AI může zasáhnout)

- [ ] Tlačítko "AI Decompose" na tasku
- [ ] Right-click na text → "Create tasks via AI"
- [ ] Paste meeting notes → AI extraction
- [ ] "AI Assistant" panel v sidebar — chat s projektem/context
- [ ] AI suggestions při vytváření faktury
- [ ] Automatické summarizace long task descriptions
- [ ] Auto-tagging based on content

---

### 2.9 Modul: API Gateway

#### 2.9.1 REST API Design

**Base URL:** `/api/v1/`

**Autentifikace:**
- API Keys (bearer token) — per-user, per-scope
- OAuth2 pro externí integrace
- JWT tokens (short-lived access + refresh)

**Standardní response format:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 100
  },
  "error": null
}
```

**Error format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [{ "field": "name", "message": "required" }]
  }
}
```

#### 2.9.2 API Endpoints — domény

**Projects:**
```
GET    /projects                 — list (filter: status, client, tags)
POST   /projects                 — create
GET    /projects/:id             — get
PUT    /projects/:id             — update
DELETE /projects/:id             — soft delete
GET    /projects/:id/stats       — budget vs actual
POST   /projects/:id/clone       — clone with structure
```

**Tasks:**
```
GET    /projects/:project_id/tasks           — list
POST   /projects/:project_id/tasks           — create
GET    /tasks/:id                             — get
PUT    /tasks/:id                             — update
DELETE /tasks/:id                             — delete
PUT    /tasks/:id/move                       — change status (kanban)
PUT    /tasks/reorder                         — bulk reorder
GET    /tasks/:id/subtasks                    — list subtasks
POST   /tasks/:id/subtasks                   — create subtask
```

**Time Entries:**
```
GET    /time-entries              — list (filter: date_from, date_to, user, project)
POST   /time-entries              — create
PUT    /time-entries/:id          — update
DELETE /time-entries/:id          — delete
POST   /time-entries/start        — start timer
POST   /time-entries/stop         — stop timer
GET    /time-entries/running      — get active timer
GET    /time-entries/report       — aggregated report
```

**Clients:**
```
GET    /clients                   — list
POST   /clients                   — create
GET    /clients/:id               — get
PUT    /clients/:id               — update
DELETE /clients/:id               — delete
GET    /clients/:id/projects      — client's projects
GET    /clients/:id/invoices      — client's invoices
```

**Invoices:**
```
GET    /invoices                   — list (filter: status, client, date_range)
POST   /invoices                   — create
GET    /invoices/:id               — get
PUT    /invoices/:id               — update
DELETE /invoices/:id               — delete (draft only)
POST   /invoices/:id/send          — send to client (email)
POST   /invoices/:id/paid          — mark as paid
POST   /invoices/:id/pdf           — generate PDF
GET    /invoices/:id/pdf           — download PDF
POST   /invoices/from-entries     — create from time entries
```

**Work Types:**
```
GET    /work-types                 — list
POST   /work-types                 — create
PUT    /work-types/:id             — update
DELETE /work-types/:id             — delete
```

**Reports:**
```
GET    /reports/timesheet         — user timesheet
GET    /reports/project/:id       — project financial summary
GET    /reports/billing           — unbilled time
GET    /reports/invoice-aging     — overdue invoices
GET    /reports/utilization       — user utilization
```

**AI:**
```
POST   /ai/decompose-task          — AI task decomposition
POST   /ai/meeting-to-tasks       — AI meeting notes → tasks
POST   /ai/generate-tasks         — AI bulk task generation
POST   /ai/summarize              — AI text summarization
GET    /ai/models                 — available AI models
```

**Users:**
```
GET    /users                      — list
GET    /users/me                   — current user profile
PUT    /users/me                   — update profile
GET    /users/me/settings          — user settings
PUT    /users/me/settings          — update settings
```

#### 2.9.3 Webhooks

- Configurable webhooks na: invoice.created, invoice.paid, task.status_changed, time_entry.created
- Payload: event type + resource data
- Retry logic: 3 attempts with exponential backoff
- Secret for payload signing

---

### 2.10 Modul: MCP Server (Model Context Protocol)

#### 2.10.1 FlowPilot MCP Server

FlowPilot bude poskytovat **MCP server**, který umožní AI agentům (včetně Hermes) přistupovat k FlowPilot datům a akcím.

**MCP Resources (read-only data):**
```
flowpilot://projects              — seznam projektů
flowpilot://projects/:id          — detail projektu
flowpilot://tasks?project=:id    — úkoly projektu
flowpilot://tasks/:id             — detail úkolu
flowpilot://clients               — seznam klientů
flowpilot://invoices?status=open — otevřené faktury
flowpilot://time-entries?date=today — dnešní time entries
flowpilot://my/assigned-tasks    — mé přiřazené úkoly
```

**MCP Tools (actions):**
```
flowpilot.create_task(project_id, name, ...)
flowpilot.update_task(task_id, ...)
flowpilot.create_time_entry(...)
flowpilot.get_uninvoiced_entries(project_id)
flowpilot.create_invoice_from_entries(...)
flowpilot.get_project_stats(project_id)
flowpilot.list_projects(status, client_id)
```

**MCP Prompts (pre-built):**
```
flowpilot://prompt/daily-review
  — "Based on today's tasks and time entries, summarize progress"

flowpilot://prompt/invoice-prep
  — "Review unbilled time entries and draft invoice summary"

flowpilot://prompt/meeting-notes
  — "Convert meeting transcript to structured tasks"
```

#### 2.10.2 Hermes Integration (Skills)

Pro Hermes Agent se vytvoří **FlowPilot skill** (`flowpilot`):
- Load: `skill_view("flowpilot")`
- Capability: plná kontrola přes MCP tools
- Use case: "vytvoř úkol na základě emailu", "spočti kolik jsem nachytal na projektu X tento měsíc"

---

### 2.11 Modul: Notifications & Activity

#### 2.11.1 Notification Types

- **In-app:** live-updating notification center
- **Email:** dle preference (immediate, daily digest, off)
- **Telegram:** přes Hermes gateway (if user wants)

#### 2.11.2 Triggers

- Task assigned to you
- Task due date approaching (24h, 1h before)
- Task overdue
- Comment added to your task
- Invoice paid (or overdue)
- Project budget 80% consumed
- Weekly timesheet reminder

#### 2.11.3 Activity Log

- Pro každou entitu (task, project, invoice): activity feed
- Who → what → when
- Audit trail for invoices (created, sent, viewed, paid)

---

### 2.12 Modul: Calendar & Scheduling

#### 2.12.1 Calendar Views

- **Deadline calendar:** úkoly s due_date jako barová událost
- **Time tracking calendar:** time entries jako bloky (časová osa)
- **Project timeline:** všechny projekty jako horizontální bloky

#### 2.12.2 Calendar Integration

- ICS export (standard iCal)
- Google Calendar two-way sync (volitelné, přes OAuth)
- Outlook Calendar sync (volitelné)

---

## 3. Datový Model — ER Diagram (textově)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    User     │      │   Client    │      │  BankAccount│
├─────────────┤      ├─────────────┤      ├─────────────┤
│ id          │      │ id          │      │ id          │
│ email       │      │ name        │      │ name        │
│ name        │      │ ic, dic     │      │ bank_name   │
│ avatar_url  │      │ address...   │      │ account_no  │
│ role        │      │ contacts[]  │      │ iban, swift │
└──────┬──────┘      └──────┬──────┘      └─────────────┘
       │                   │
       │ 1:N               │ 1:N
       ▼                   ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ProjectMember│      │  Project    │      │   Invoice   │
├─────────────┤      ├─────────────┤      ├─────────────┤
│ user_id     │      │ id          │◄─────│ client_id   │
│ project_id  │      │ client_id   │      │ project_id  │
│ role        │      │ name        │      │ number      │
└─────────────┘      │ status      │      │ status      │
                     │ billing_type│      │ total       │
                     └──────┬──────┘      └──────┬──────┘
                            │ 1:N                │ 1:N
                            ▼                    ▼
                     ┌─────────────┐      ┌─────────────┐
                     │    Task     │      │InvoiceLineIt│
                     ├─────────────┤      ├─────────────┤
                     │ id          │      │ invoice_id   │
                     │ project_id  │      │ description  │
                     │ parent_id   │      │ qty, price  │
                     │ name        │      └──────────────┘
                     │ status      │
                     │ priority    │
                     │ assignee_id │
                     │ due_date    │
                     └──────┬──────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │TimeEntry    │  │ TaskDepend  │  │ Subtask     │
    ├─────────────┤  ├─────────────┤  └─────────────┘
    │ task_id     │  │ task_id     │
    │ user_id     │  │ depends_on  │
    │ work_type_id│  │ type        │
    │ started_at  │  └─────────────┘
    │ duration_min│
    └─────────────┘

    ┌─────────────┐
    │  WorkType   │
    ├─────────────┤
    │ id          │
    │ name        │
    │ hourly_rate │
    │ color       │
    └─────────────┘
```

---

## 4. Technologický Stack (návrh — k ověření s programátory)

### 4.1 Doporučený Stack

**Backend:**
- **Language:** TypeScript (Node.js 20+) nebo Python 3.12+ (FastAPI)
- **Framework:** NestJS (TS) nebo FastAPI (Python)
- **ORM:** Prisma (TS) nebo SQLAlchemy 2.0 + Pydantic v2 (Python)
- **Database:** PostgreSQL 15+ (host na Synology nebo externě)
- **Cache:** Redis (sessions, cache, real-time)
- **Queue:** BullMQ (background jobs: PDF generování, emaily, AI calls)
- **File Storage:** MinIO (S3-compatible, na Synology volume)

**Frontend:**
- **Framework:** Vue 3 + Composition API nebo React 18+
- **UI Library:** PrimeVue (Vue) nebo shadcn/ui (React) — oboje good DX
- **State:** Pinia (Vue) nebo Zustand (React)
- **Charts:** Chart.js, ApexCharts, nebo Apache ECharts
- **Kanban:** Vue Flow nebo React Flow (nebo specializované libs jako dnd-kit pro React)
- **Gantt:** DHTMLX Gantt nebo bryntum-gantt
- **PDF Generation:** Puppeteer (headless Chrome) nebo @react-pdf/renderer

**DevOps:**
- **Docker:** Multi-container (app, postgres, redis, minio, nginx/caddy)
- **Docker Compose:** Hlavní orchestration
- **Reverse Proxy:** Caddy (automatické HTTPS) nebo NginX + Certbot
- **Backup:** pg_dump → Synology, MinIO backup na externí disk

### 4.2 Alternativní Stacky (k diskusi)

**Option A — PHP/Laravel stack:**
- Výhoda: Bližší EspoCRM, hodně Czech PHP dev
- Nevýhoda: Ekosystém pro real-time/AI méně přirozený
- Stack: Laravel 11, Vue 3, PostgreSQL, Pusher (real-time)

**Option B — Python FastAPI:**
- Výhoda: Skvělý pro AI integrace, Pydantic, async
- Nevýhoda: Méně Czech devů
- Stack: FastAPI, SQLAlchemy 2.0, Vue 3 nebo React, Celery

**Option C — Full JS/TS (NestJS + React):**
- Výhoda: Unified language, good TypeScript coverage
- Nevýhoda: React state management complexity
- Stack: NestJS, React + tRPC nebo REST, Prisma, PostgreSQL

### 4.3 Synology-specific deploy

```
Synology NAS (DSM 7.x)
├── Docker (Container Manager)
│   ├── flowpilot-app        (Node.js/FastAPI)
│   ├── flowpilot-worker     (background jobs)
│   ├── flowpilot-nginx      (reverse proxy)
│   ├── postgres:15           (database)
│   ├── redis:7               (cache)
│   └── minio                  (S3 storage)
└── Shared folder
    ├── /docker/volumes/postgres  → persist
    ├── /docker/volumes/minio     → persist
    └── /docker/volumes/app       → logs, uploads
```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load < 2s (basic views)
- Kanban drag-drop < 100ms response
- API response < 500ms (95th percentile)
- PDF generování < 10s

### 5.2 Security
- All traffic over HTTPS (Caddy automatic)
- Passwords: bcrypt with cost factor 12+
- API keys: SHA-256 hashed
- Session tokens: short-lived JWT (15 min) + refresh token
- CSRF protection on all state-changing endpoints
- Input validation on all endpoints (Zod/Pydantic)
- SQL injection prevention via ORM
- Rate limiting: 100 req/min per user

### 5.3 Scalability
- Single-instance pro 1–50 users (Synology limit)
- Database: sharding not needed at this scale
- File storage: MinIO local, 100GB+ per year

### 5.4 Availability
- Designed for single-user primary use case
- No HA/clustering required
- Backup: daily pg_dump, weekly MinIO backup

### 5.5 Compatibility
- Modern browsers: Chrome, Firefox, Safari, Edge (last 2 versions)
- Mobile: responsive design (no native app)
- No IE11 support

---

## 6. User Experience — Key Flows

### 6.1 Morning Standup Flow
1. User opens FlowPilot → Dashboard
2. Vidí: today's tasks, running timer, overdue items, unread notifications
3. Click na task → start timer → work → stop timer
4. System auto-logged time entry

### 6.2 Project Creation Flow
1. Click "New Project"
2. Modal: name, client (dropdown), billing type
3. Optional: choose template (from pre-defined)
4. Create → navigates to project view
5. AI suggests initial task structure (optional, powered by AI)

### 6.3 Invoice Generation Flow
1. Select project → "Create Invoice"
2. System shows unbilled time entries for that project
3. User selects entries to include
4. User can add manual line items
5. System generates invoice number, calculates totals
6. Preview PDF → edit if needed
7. Send via email or download

### 6.4 AI Task Decomposition Flow
1. User creates task with name "Implement login flow"
2. Clicks "AI Decompose" button
3. AI returns: 5 subtasks with estimates
4. User reviews, edits, confirms
5. Subtasks added to task list

### 6.5 Meeting Notes → Tasks Flow
1. User pastes meeting notes into AI panel
2. AI extracts: 8 action items with suggested assignees and deadlines
3. User maps to projects/tasks
4. Bulk create

---

## 7. Open Questions (k diskusi s programátory/architekty)

### 7.1 Architecture Decisions

1. **Monolit vs. Microservices:** Pro Synology deployment doporučuji monolitickou app + separate workers. Microservices by přidaly overhead. Kdy by mělo smysl microservices? Až při 100+ simultánních uživatelích.

2. **Real-time updates:** Použít WebSockets (Socket.io) nebo Server-Sent Events (SSE)? SSE je simpler pro unidirectional (notifications, timer updates). WebSakes pro bidirectional (collaborative editing — ale to u single-user není potřeba).

3. **PDF generování:** Client-side (JS library) vs. Server-side (Puppeteer/Chromium)? Server-side dává konzistentnější výstup, ale spotřebuje více RAM. Na Synology s omezenými zdroji bych preferoval server-side, ale s queue — user click → job queued → PDF ready in seconds.

4. **AI Integration pattern:** Hub-and-spoke (vše přes unified AI engine) vs. direct provider calls? Hub-and-spoke je lepší pro switching providers, caching, rate limiting, fallback.

5. **Database:** PostgreSQL vs. SQLite (pro jednodušší Synology backup)? Rozhodně PostgreSQL. SQLite není vhodný pro concurrent access, web apps, a nelze ho snadno backupovat online.

6. **Frontend framework:** Vue 3 vs. React — oboji je validní. Vue má lepší DX pro menší team, lepší documentation česky. React má širší job market. Doporučuji Vue 3 + PrimeVue.

### 7.2 Scope Questions

7. **Multi-user vs. single-user:** Primárně single-user (Jakub). Má se počítat i s multi-user (až 5 userů)? Multi-user přidává complexity: ACL, team views, user management. Dopručuji single-user MVP, multi-user jako v2.

8. **File attachments:** Mít? Na úkolech, na fakturách? Attachments = MinIO storage. Pro single-user to dává smysl, ale přidává složitost (upload, preview, storage management).

9. **Comments/Discussion:** Mít comments na úkolech? Pro single-user primarily not needed, ale pro client communication ("schválil/a jste to?") by se hodilo. Může být v2.

10. **Recurring invoices:** Automatické opakované faktury (např. měsíční support)? Pro freelancera možná užitečné.

11. **Expense tracking:** Sledování výdajů (doprava, materiál) kromě time? Souvisí s invoice, ale oddělené od time tracking. Může být v2 pokud bude potřeba.

12. **Estimates/Quotes:** Nějaká forma odhadu (quote) před tím než se začne fakturovat? V2.

### 7.3 Third-Party Integrations

13. **Email sending:** Přímé z FlowPilot (SMTP) nebo přes external service (SendGrid, Postmark)? Pro Czech env bych doporučil SMTP přes WEDOS (který už máš), ale external service je reliable.

14. **Calendar sync:** ICS export je trivial zdarma. Google/Outlook sync vyžaduje OAuth a je complex. Začít s ICS only.

15. **Payment gateway:** Umožnit online platby přes GoPay, Comgate, Stripe? QR kód na faktuře je zdarma, platba pak manuálně. Online platby = transakční poplatky. Pro začátek ne.

16. **E-invoicing (ISDOC, FA*3):** Czech specific e-invoice formaty. Pro běžné B2B fakturaci zatím not required, ale pro v2 služby státu by bylo potřeba.

---

## 8. Roadmap — Fáze vývoje

### Phase 1: MVP (3–4 měsíce)
**Cíl:** Funkční základ bez AI
- [ ] Auth + Users (single-user)
- [ ] Projects CRUD + Templates
- [ ] Tasks CRUD + Subtasks + Dependencies
- [ ] Kanban View + List View
- [ ] Time Entries (manual + timer)
- [ ] Work Types
- [ ] Basic Reports (timesheet, project stats)
- [ ] REST API (basic)
- **Delivery:** Working Docker on Synology

### Phase 2: Billing Core (2 měsíce)
**Cíl:** Plnohodnotná fakturace
- [ ] Clients CRUD
- [ ] Invoice Generator (CZ compliant)
- [ ] QR Code / SPAYD
- [ ] PDF generation
- [ ] Product/Service catalog
- [ ] Invoice email sending
- [ ] Bank accounts

### Phase 3: Views Expansion (1–2 měsíce)
- [ ] Calendar View
- [ ] Gantt Chart
- [ ] Dashboard
- [ ] Advanced filters + saved views

### Phase 4: AI Integration (2–3 měsíce)
**Cíl:** AI as core differentiator
- [ ] AI Engine (multi-provider)
- [ ] Task decomposition skill
- [ ] Meeting notes → tasks skill
- [ ] MCP Server
- [ ] AI chat panel in UI
- [ ] Hermes skill for FlowPilot

### Phase 5: Polish & Scale (v2)
- [ ] Multi-user support
- [ ] Comments/Discussion
- [ ] File attachments
- [ ] Mobile responsive polish
- [ ] Mobile-optimized views
- [ ] Advanced automation/rules
- [ ] Third-party integrations (calendar sync, email)

---

## 9. Appendix: Czech Invoice Legal Requirements

### 9.1 Zákon o DPH — požadované údaje na faktuře

Dle § 29 zákona č. 235/2004 Sb., o dani z přidané hodnoty:

1. **Označení fakturowaného a odběratele** — jméno/název, adresa, IČO, DIČ (pokud je)
2. **Evidenční číslo faktury** — unikátní v rámci podnikatel
3. **Datum uskutečnění zdanitelného plnění** (nebo termín, pokud nelze určit)
4. **Datum vystavení** faktury
5. **Rozsah a předmět plnění** — popis co bylo poskytnuto
6. **Měrná jednotka** a množství (pro dodání zboží)
7. **Jednotková cena** bez DPH
8. **Základ daně** a **sazba daně** a **výše daně** (rozepsáno dle sazeb)
9. **Celková částka** k úhradě
10. **Měna** pokud není CZK
11. **Pro reverse charge:** označení, že je uplatněno reverse charge

### 9.2 SPAYD QR Kód Specifikace

SPAYD (Short Payment Descriptor) je český standard pro QR platby.

**Formát stringu (verze 1.0):**
```
SPD*1.0*ACC:CZ123456789012345678901234*AM:1500.50*CC:CZK*RN:2026-0001*DT:20260420*PT:14*MSG:Platba faktury 2026-0001*
```

**Klíčové parametry:**
- `ACC` — číslo účtu v IBAN formátu
- `AM` — částka (max 2 desetinná místa)
- `CC` — měna (CZK, EUR, etc.)
- `RN` — variabilní symbol (ideálně faktura číslo)
- `DT` — datum splatnosti (YYYYMMDD)
- `PT` — počet dní do splatnosti (slouží jako backup)
- `MSG` — zpráva pro příjemce

**Doporučené generování:**
- Použít hotovou lib: `spayd-js` nebo `python-spayd`
- Ověřit proti specifikaci: https://github.com/spayd/spayd
- QR kód: PNG, 300x300px, error correction level M

### 9.3 Data pro QR kód (příklad)

```
ACC: CZ123456789012345678901234
AM: 10285.00
CC: CZK
RN: 2026-04-001
DT: 20260504
PT: 14
MSG: FlowPilot - faktura 2026-04-001
```

---

## 10. Appendix: Competitive Analysis Summary

| Funkce | Freelo | ClickUp | Odoo | FlowPilot (cíl) |
|--------|--------|---------|------|-----------------|
| Kanban | ✅ | ✅ | ✅ | ✅ |
| Gantt | ❌ | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ | ✅ |
| Time Tracking | ✅ | ✅ | ✅ | ✅ |
| Invoicing | ✅ | ❌ | ✅ | ✅ |
| Czech QR/SPAY | ❌ | ❌ | add-on | ✅ |
| AI Integration | ❌ (limited) | ✅ | ❌ | ✅ |
| MCP/Skills | ❌ | ❌ | ❌ | ✅ |
| REST API | limited | ✅ | ✅ | ✅ full |
| Self-hosted | ❌ | ❌ | ✅ | ✅ |
| Czech localization | ✅ | ❌ | ✅ | ✅ |
| Esign | ❌ | ❌ | ✅ | v2 |

---

## 11. Otevřené otázky k diskuzi s Jakubem

Před předáním tohoto zadání programátorům potřebuji od Jakuba ověřit:

1. **Priorita fází:** Je roadmap v pořadku, nebo chceš fakturaci dříve než Gantt?
2. **Multi-user:** Počítáme s více uživateli od začátku nebo single-user MVP?
3. **AI scope:** Které AI skills jsou prioritu? (task decomposition vs. meeting notes vs. email drafts)
4. **Budget/time:** Jaký je realistický časový rámec? Jsou programátoři k dispozici full-time nebo jen parts?
5. **Tech stack preference:** Nějaké zásadní preference (PHP/Laravel vs. JS/TS vs. Python)?
6. **Integrace:** Co je must-have hned v MVP? (Email, Calendar, jiné?)
7. **Design/UX:** Reference na UI které se ti líbí? (Freelo? Notion? Linear? Jira?)

---

*Připravil: Hermes Agent pro Jakuba Proška (James Powiz)*  
*Datum: 20. dubna 2026*
