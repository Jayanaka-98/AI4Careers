# AI4Careers

AI-powered career fair assistant for University of Michigan students: explore employers, align your resume to roles, practice pitches, and get coached through an AI chat. The backend is written in **Jac**; the frontend is **React**.

**Sample data**: UMich Fall 2025 Career Fair — Sept 22–23, 2025 (`evt_umich_fall_2025`)

---

## Features

### Landing & auth
- Public landing page with sign-up and log-in
- Session token stored in the browser; authenticated routes require login

### Dashboard
- Hub after login with links into Resume Lab, Companies, Chat, Profile, Experiences, and behavioral-question prep
- Setup / readiness-style guidance to encourage resume and profile completion

### Resume Lab (structured resume versions)
- **Upload** PDF/DOCX or paste plain text; the LLM parses into structured sections (summary, experience, projects, education, skills, certifications)
- **Multiple versions** per account with version title, **area** (role-focus) tags, and **company** tags for organization
- **Dashboard**: filter by area and company tag, sort by date or name; **preview** a version; open a version to edit
- **Editor**: edit content, reorder sections and bullets, **tailor** to a job description (optional save as new version), **match skills** to a JD, **cover letter** draft, bullet shorten/lengthen/rewrite
- **Metadata**: edit tags (area, company) from the detail view
- **Export**: print/PDF from the browser, **DOCX** download
- **Edit mode**: adjust version title, name on resume, and **custom section headings** (stored in parsed data); inline contact fields sync with saved parsed contact
- Fit scoring and chat can use your **latest** resume from either legacy `resumes` or Resume Lab `resume_versions` (whichever was updated most recently)

### Legacy profile resume (optional)
- **Profile** still supports the original PDF upload flow (`ResumeUpload`) for users who rely on that path
- `/resume-upload` redirects to **Resume Lab**

### Career fair browser
- Browse companies for the configured event with filters: fair day, position type, sponsorship, region, major search
- Company detail: description, positions, degree levels, majors, sponsorship, regions, links
- **Save** employers and save a **custom elevator pitch** per saved company
- Sponsorship badge on cards: **Sponsors Visas** / **No Sponsorship** / **Check Details**
- Deep link from Companies with a company context query param where supported

### AI-powered fit scoring (`RankCompanies` / card scores)
- **Rank companies** by fit with your resume (algorithm in `matching.jac` — **no LLM calls** for the score itself)
- Per-card fit scores use the same signals: skills, domain overlap, role type, sponsorship, degree, location — aligned with profile preferences where applicable
- Robust parsing when resume data mixes list vs string shapes (Resume Lab vs legacy)

### AI chatbot (`ChatWithAI`)
- Natural language plus slash commands:

| Command | What it does |
|---------|--------------|
| `/match` | Rank companies by resume fit |
| `/match [company name]` | Score fit for one employer |
| `/pitch` | Tailored elevator pitch |
| `/optimize` | Resume polish (keeps facts, improves clarity/structure) |
| `/visual` + image | Logo → identify company → fit context |

- **Quick-action** buttons under the transcript for `/match`, `/pitch`, `/optimize`
- Optional **image** attachment for `/visual`-style flows

### Visual company recognition
- Logo upload → LLM vision → match to fair roster (with alias handling)
- Visual model can be configured separately from the main chat model in `jac.toml` (OpenAI and/or Anthropic)

### Experiences & behavioral prep
- **Experiences**: structured work/project entries (add, edit, import from a resume version)
- **BQ prep**: STAR-style stories linked to experiences, AI-assisted story building and suggestions

### User profile & preferences
- Sponsorship need, work authorization, preferred locations, work modes, role types
- Used in matching and filtering logic
- **Resume Lab** contact block and parsed contact feed into exports when filled

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend language | **Jac (jaclang) 0.12.2** — version is critical |
| Backend AI | **byllm 0.5.7** via LiteLLM (OpenAI or Anthropic) |
| Database | SQLite at `.jac/data/ai4careers.db` |
| Frontend | **React 19.2.4**, React Router 7.13.1 |
| PDF parsing | pdfjs-dist 5.5.207 (browser-side) |
| HTTP client | axios 1.13.6 |
| Markdown rendering | react-markdown 10.1.0 + remark-gfm 4.0.1 |

---

## Setup

### Prerequisites

| Tool | Required version | Notes |
|------|-----------------|-------|
| Python | **3.12.x** | Must be 3.12 — tested with 3.12.8 |
| Node.js | **16+** | Tested with 23.7.0 |
| jaclang | **0.12.2** | Installed inside venv |
| byllm | **0.5.7** | Installed inside venv |

> **jaclang version is critical.** The walkers use `walker:pub` visibility and `by llm()` syntax that is version-specific. Do not upgrade without testing.

---

### 1. Enter the project directory

```bash
cd AI4Careers
```

### 2. Create a virtual environment with Python 3.12

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Jac and LLM support

```bash
.venv/bin/pip install "jaclang==0.12.2" "byllm==0.5.7"
```

Verify:
```bash
.venv/bin/jac --version    # must print 0.12.2
.venv/bin/pip show byllm   # must show Version: 0.5.7
```

### 4. Configure your LLM model

`jac.toml` is gitignored — each developer keeps their own. Start from the example:

```bash
cp jac.toml.example jac.toml
```

Open `jac.toml` and set your models. Two sections matter:

**`[plugins.byllm.model]`** — controls chat, matching, resume parsing, and pitch generation:
```toml
# OpenAI
default_model = "gpt-4o-mini"

# OR Anthropic
default_model = "claude-haiku-4-5-20251001"
```

**`[plugins.byllm.visual]`** — controls the `/visual` image recognition feature (separate from chat):
```toml
openai_model = "gpt-5.4-nano"
anthropic_model = "claude-3-5-haiku-20241022"
```

The visual feature automatically picks the model matching your available API key.

### 5. Set API keys

Create a `.env` file in the project root (already gitignored). This is loaded only when starting this project's backend and never affects your global shell:

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

You only need the key for whichever model you configured. Having both is fine.

### 6. Import career fair data

One-time step to load companies and roles into the database from `data/umich_fall_2025_company.csv`.

> **The backend must not be running** — both need exclusive SQLite access.

```bash
pkill -f 'jac start'   # stop backend if running

python3 - << 'PYEOF'
import csv, json, os, sqlite3
from uuid import uuid4

DB_PATH = '.jac/data/ai4careers.db'
CSV_PATH = 'data/umich_fall_2025_company.csv'
EVENT_ID = 'evt_umich_fall_2025'
EVENT_NAME = 'University of Michigan Fall 2025 Career Fair'
EVENT_TERM = 'Fall 2025'
EVENT_START = '2025-09-22'
EVENT_END = '2025-09-23'

def safe(v):
    if v is None: return ''
    t = str(v).strip(); return '' if t.lower() == 'nan' else t

def split_list(v):
    t = safe(v)
    if not t: return []
    parts = t.split('\n') if '\n' in t else t.split('|') if '|' in t else t.split(';') if ';' in t else t.split(',')
    seen = []; [seen.append(safe(p)) for p in parts if safe(p) and safe(p) not in seen]; return seen

def split_sp(v):
    t = safe(v)
    if not t: return []
    parts = t.split('\n') if '\n' in t else t.split('|') if '|' in t else t.split(';') if ';' in t else [t]
    seen = []; [seen.append(safe(p)) for p in parts if safe(p) and safe(p) not in seen]; return seen

def to_bool(v): return safe(v).lower() in ['true','1','yes','y']
def norm_url(v): t=safe(v); return t if not t or t.startswith('http') else 'https://'+t

def make_roles(row):
    titles = split_list(row.get('role_titles',''))
    pos = split_list(row['positions_recruited'])
    regions = split_list(row['regions_recruited'])
    sp = ', '.join(split_sp(row['work_authorization_sponsorship'])) or 'Unknown'
    desc = safe(row['description']); tags = pos + split_list(row['degree_levels_recruited'])
    if titles:
        return [{'title':t,'category':pos[0] if pos else '','location':', '.join(regions),'sponsorship':sp,'description':desc,'tags':tags} for t in titles]
    return [{'title':p+' Opportunity - '+safe(row['employer_name']),'category':p,'location':', '.join(regions),'sponsorship':sp,'description':desc,'tags':split_list(row['degree_levels_recruited'])} for p in pos]

os.makedirs('.jac/data', exist_ok=True)
conn = sqlite3.connect(DB_PATH)
conn.execute('PRAGMA journal_mode=WAL'); conn.execute('PRAGMA foreign_keys=ON')
c = conn.cursor()

c.execute('''CREATE TABLE IF NOT EXISTS events (event_id TEXT PRIMARY KEY, name TEXT, term TEXT, start_date TEXT, end_date TEXT)''')
c.execute('''CREATE TABLE IF NOT EXISTS companies (company_id TEXT PRIMARY KEY, event_id TEXT, name TEXT NOT NULL, icon_url TEXT DEFAULT '', fair_day TEXT DEFAULT '', is_multi_day INTEGER DEFAULT 0, website TEXT DEFAULT '', careers_url TEXT DEFAULT '', description TEXT DEFAULT '', positions TEXT DEFAULT '[]', degree_levels TEXT DEFAULT '[]', academic_years TEXT DEFAULT '[]', majors TEXT DEFAULT '[]', sponsorship TEXT DEFAULT '[]', sponsorship_notes TEXT DEFAULT '', sponsorship_flag TEXT DEFAULT 'No', sponsorship_status TEXT DEFAULT 'No', regions TEXT DEFAULT '[]', accepts_hardcopy INTEGER DEFAULT 0)''')
c.execute('''CREATE TABLE IF NOT EXISTS roles (role_id TEXT PRIMARY KEY, event_id TEXT, company_id TEXT DEFAULT '', title TEXT NOT NULL, category TEXT DEFAULT '', location TEXT DEFAULT '', work_mode TEXT DEFAULT '', sponsorship TEXT DEFAULT 'Unknown', description TEXT DEFAULT '', tags TEXT DEFAULT '[]', role_source_url TEXT DEFAULT '', role_last_checked TEXT DEFAULT '')''')

for col, typ in [('sponsorship_flag','TEXT DEFAULT "No"'),('sponsorship_status','TEXT DEFAULT "No"')]:
    if col not in [r[1] for r in c.execute('PRAGMA table_info(companies)').fetchall()]:
        c.execute(f'ALTER TABLE companies ADD COLUMN {col} {typ}')
for col, typ in [('company_id','TEXT DEFAULT ""'),('role_source_url','TEXT DEFAULT ""'),('role_last_checked','TEXT DEFAULT ""')]:
    if col not in [r[1] for r in c.execute('PRAGMA table_info(roles)').fetchall()]:
        c.execute(f'ALTER TABLE roles ADD COLUMN {col} {typ}')

c.execute('DELETE FROM roles WHERE event_id=?',(EVENT_ID,))
c.execute('DELETE FROM companies WHERE event_id=?',(EVENT_ID,))
c.execute('DELETE FROM events WHERE event_id=?',(EVENT_ID,))
c.execute('INSERT INTO events VALUES (?,?,?,?,?)',(EVENT_ID,EVENT_NAME,EVENT_TERM,EVENT_START,EVENT_END))

cc = rc = 0
with open(CSV_PATH,'r',encoding='utf-8-sig',newline='') as f:
    for row in csv.DictReader(f):
        cid = safe(row['company_id'])
        if not cid: continue
        flag = safe(row.get('sponsorship_flag','')) or 'No'
        status = safe(row.get('sponsorship_status','')) or 'No'
        fd = safe(row.get('fair_days', row.get('fair_day','')))
        c.execute('''INSERT INTO companies (company_id,event_id,name,icon_url,fair_day,is_multi_day,website,careers_url,description,positions,degree_levels,academic_years,majors,sponsorship,sponsorship_notes,sponsorship_flag,sponsorship_status,regions,accepts_hardcopy)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(company_id) DO UPDATE SET event_id=excluded.event_id,name=excluded.name,fair_day=excluded.fair_day,is_multi_day=excluded.is_multi_day,website=excluded.website,careers_url=excluded.careers_url,description=excluded.description,positions=excluded.positions,degree_levels=excluded.degree_levels,academic_years=excluded.academic_years,majors=excluded.majors,sponsorship=excluded.sponsorship,sponsorship_notes=excluded.sponsorship_notes,sponsorship_flag=excluded.sponsorship_flag,sponsorship_status=excluded.sponsorship_status,regions=excluded.regions,accepts_hardcopy=excluded.accepts_hardcopy''',
            (cid,EVENT_ID,safe(row['employer_name']),'',fd,1 if to_bool(row['is_multi_day_company']) else 0,
             norm_url(row['website']),norm_url(row['company_careers_website']),safe(row['description']),
             json.dumps(split_list(row['positions_recruited'])),json.dumps(split_list(row['degree_levels_recruited'])),
             json.dumps(split_list(row['academic_years_recruited'])),json.dumps(split_list(row['degrees_majors_recruited'])),
             json.dumps(split_sp(row['work_authorization_sponsorship'])),safe(row['work_authorization_notes']),
             flag,status,json.dumps(split_list(row['regions_recruited'])),1 if to_bool(row['accept_hardcopy_resumes']) else 0))
        cc += 1
        for role in make_roles(row):
            c.execute('INSERT INTO roles (role_id,event_id,company_id,title,category,location,work_mode,sponsorship,description,tags,role_source_url,role_last_checked) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                ('role_'+str(uuid4())[:8],EVENT_ID,cid,role['title'],role['category'],role['location'],'',
                 role['sponsorship'],role['description'],json.dumps(role['tags']),
                 norm_url(row.get('role_source_url','')),safe(row.get('role_last_checked',''))))
            rc += 1

conn.commit(); conn.close()
print(f'Done: {cc} companies, {rc} roles imported')
PYEOF
```

Expected output: `Done: 223 companies, 432 roles imported`

> **Note:** `jac run import_career_fair.jac` may fail with a SQLite disk I/O error due to a conflict with the Jac runtime's internal store. Use the Python script above instead.

### 7. Start the backend

```bash
cd AI4Careers
set -a && source .env && set +a
.venv/bin/jac start main.jac --port 8000
```

The `set -a / set +a` block exports `.env` into the process without polluting your global shell. Backend runs at `http://localhost:8000`.

### 8. Start the frontend

In a separate terminal:

```bash
cd AI4Careers/frontend
npm install    # first time only
npm start
```

Frontend runs at `http://localhost:3000` and opens in your browser automatically.

**API base URL** — If the backend is not at `http://localhost:8000`, create `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:8000
```

Restart `npm start` after changing env vars.

---

## Using the application (instructions)

1. **Create an account** — Sign up from the landing page, then log in. If you already have an old session token, log in still works: `Login` and `Signup` requests do not attach a stale token to the walker payload.
2. **Add a resume** — Open **Resume Lab** from the dashboard. Upload a file or paste text, set version name and tags, then open the version to review or edit. Use **Preview** / **PDF** / **DOCX** as needed.
3. **Set preferences** — Open **Profile** and fill sponsorship, locations, work modes, and role types so company ranking and filters match your situation.
4. **Explore employers** — Open **Companies**, use filters, open a company, save it, and generate or paste a **pitch** where offered.
5. **Rank by fit** — From chat, run `/match` or use **Match me with companies**, or use ranking elsewhere in the UI that calls `RankCompanies`. Ensure your latest resume is the one you want (Resume Lab or legacy upload).
6. **Chat** — Ask free-form questions or use `/pitch`, `/optimize`, `/visual` with an image when configured.
7. **Experiences & BQ** — Use **Experiences** to maintain entries and **BQ** (behavioral prep) for STAR stories and AI suggestions.

---

## Project Structure

```
AI4Careers/
├── main.jac                    # Entry — imports walkers from all modules
├── auth.jac                    # Signup, Login, Me, UpdatePreferences
├── resume.jac                  # ResumeUpload, GetResume, ListResumes, DeleteResume
├── resume_telling.jac          # Resume Lab: RTUploadResume, RTListResumes, RTGetResume,
│                               # RTDeleteResume, RTUpdate*, RTTailorResume, RTExportResume,
│                               # experiences, stories, BQ helpers, etc.
├── career_fair.jac             # ListEvents, ListCompanies, GetCompany, ListRoles,
│                               # SaveCompany, UnsaveCompany, ListSavedCompanies,
│                               # SavePitch, RankCompanies
├── ai_chat.jac                 # ChatWithAI, GenerateElevatorPitch
├── matching.jac                # Fit scoring (local), as_list helpers for JSON shapes
├── parsing.jac                 # Resume parsing helpers
├── visual_match.jac            # Company logo / visual match
├── db.jac                      # SQLite schema + queries (resumes + resume_versions, etc.)
├── security.jac                # Password hashing, tokens
├── import_career_fair.jac      # CSV importer (Jac); prefer Python script below if I/O errors
├── jac.toml                    # Local LLM config (gitignored)
├── jac.toml.example            # Copy to jac.toml
├── .env                        # API keys (gitignored)
├── data/
│   └── umich_fall_2025_company.csv
└── frontend/
    ├── public/
    │   └── pdf.worker.min.mjs
    └── src/
        ├── pages/
        │   ├── Landing.js, Login.js, Signup.js
        │   ├── Dashboard.js
        │   ├── ResumeLab.js        # Resume Lab list + version editor (large UI module)
        │   ├── Profile.js
        │   ├── Companies.js
        │   ├── ChatWithAI.js
        │   ├── Experiences.js
        │   └── BQPrep.js
        ├── components/
        │   ├── Layout.js, PrivateRoute.js
        │   └── ...
        ├── context/
        │   └── AuthContext.js
        └── services/
            └── api.js                # walkerPost, auth, career fair, RT*, experiences, stories
```

---

## Database Schema

SQLite at `.jac/data/ai4careers.db`, auto-initialized when the backend starts.

| Table | Key columns |
|-------|-------------|
| `users` | `user_id`, `email` (unique), `password_hash`, `name`, `needs_sponsorship`, `work_authorization[]`, `preferred_locations[]`, `work_modes[]`, `role_types[]` |
| `resumes` | Legacy uploads: `resume_id`, `user_id`, `filename`, `raw_text`, `pdf_data`, parsed JSON columns for skills, bullets, projects, education |
| `resume_versions` | Resume Lab: `rv_id`, `user_id`, `version_name`, `label`, `company_tag`, `file_name`, `raw_text`, `parsed_data`, `section_order`, timestamps |
| `experiences` | Structured experience entries for STAR / BQ flows |
| `stories` | Behavioral stories linked to experiences |
| `events` | `event_id`, `name`, `term`, `start_date`, `end_date` |
| `companies` | `company_id`, `event_id`, `name`, `fair_day`, `is_multi_day`, `positions[]`, `majors[]`, `sponsorship[]`, `sponsorship_flag`, `sponsorship_status`, `regions[]`, `website`, `careers_url`, `accepts_hardcopy` |
| `roles` | `role_id`, `event_id`, `company_id`, `title`, `category`, `location`, `sponsorship`, `tags[]`, `role_source_url`, `role_last_checked` |
| `saved_companies` | `user_id`, `company_id`, `event_id`, `pitch`, `saved_at` — unique on (user, company, event) |
| `fit_scores` | `user_id`, `role_id`, `score`, `matched_skills[]`, `explanation` |
| `artifacts` | `artifact_id`, `user_id`, `type`, `content`, `model`, `prompt_version`, `created_at` |

---

## API Endpoints

All endpoints are `POST /walker/<WalkerName>` at `http://localhost:8000`.

### Auth
| Walker | Required fields | Returns |
|--------|----------------|---------|
| `Signup` | `email`, `password`, `name` | `{ user_id }` |
| `Login` | `email`, `password` | `{ token }` |
| `Me` | `token` | user profile + `resume_count` + preferences |
| `UpdatePreferences` | `token`, `needs_sponsorship`, `work_authorization[]`, `preferred_locations[]`, `work_modes[]`, `role_types[]` | `{ ok: true }` |

### Resume
| Walker | Required fields | Returns |
|--------|----------------|---------|
| `ResumeUpload` | `token`, `filename`, `raw_text`, `pdf_data` (base64) | `{ resume_id, extraction_summary }` |
| `GetResume` | `token`, `resume_id` | full resume object incl. `pdf_data` |
| `ListResumes` | `token` | `[ { resume_id, filename, uploaded_at, skills_count } ]` |
| `DeleteResume` | `token`, `resume_id` | `{ ok: true }` |

### Career Fair
| Walker | Required | Optional | Returns |
|--------|----------|----------|---------|
| `ListEvents` | — | — | list of events |
| `ListCompanies` | `event_id` | `token`, `fair_day`, `position_type`, `sponsors`, `region`, `major_search`, `search` | list of companies with all fields |
| `GetCompany` | `event_id`, `company_id` | — | full company object |
| `ListRoles` | `event_id` | `token`, `company_id`, `location`, `work_mode`, `sponsors`, `search` | list of roles |
| `RankCompanies` | `token` | `event_id` | all companies sorted by resume fit score |
| `SaveCompany` | `token`, `company_id`, `event_id` | — | `{ ok: true }` |
| `UnsaveCompany` | `token`, `company_id`, `event_id` | — | `{ ok: true }` |
| `ListSavedCompanies` | `token`, `event_id` | — | saved companies with pitches |
| `SavePitch` | `token`, `company_id`, `event_id`, `pitch` | — | `{ ok: true }` |

### AI Chat
| Walker | Required | Optional | Returns |
|--------|----------|----------|---------|
| `ChatWithAI` | `token`, `question`, `history[]` | `event_id`, `image_data` (base64), `image_mime_type` | `{ answer }` |
| `GenerateElevatorPitch` | `token`, `company_id`, `event_id` | — | `{ pitch }` |

### Resume Lab & career prep (`resume_telling.jac`)
All of these expect `token` in the POST body (injected by the frontend for authenticated walkers). Highlights:

| Walker | Purpose |
|--------|---------|
| `RTUploadResume` | Create version from file (`file_data` base64) or `plain_text` |
| `RTListResumes` / `RTGetResume` / `RTDeleteResume` | List, load, delete versions |
| `RTUpdateResumeVersion` | `version_name`, `label`, `company_tag` (empty strings keep existing meta) |
| `RTUpdateResumeParsed` | Save full parsed JSON |
| `RTUpdateSectionOrder`, `RTMoveSectionItem` | Section order and bullet reorder |
| `RTAdjustBullet` | AI shorten/lengthen/rewrite a bullet |
| `RTTailorResume` / `RTSaveTailoredResume` | Tailor to JD; save as new version |
| `RTMatchSkills`, `RTGenerateCoverLetter` | JD skill match; cover letter |
| `RTExportResume` | DOCX bytes in response |
| `RTAddExperience`, `RTListExperiences`, … | Experience CRUD + import from resume |
| `RTBuildStory`, `RTListStories`, … | BQ / STAR story helpers |

See `resume_telling.jac` and `frontend/src/services/api.js` for full parameter lists.

---

## Fit Scoring Algorithm

Implemented in `matching.jac` — zero API calls, runs entirely locally.

```
score (0–10) =  0.40 × skill_overlap
              + 0.20 × domain_alignment
              + 0.15 × role_type_match
              + 0.15 × sponsorship_fit
              + 0.05 × degree_level_fit
              + 0.05 × location_fit
```

- **Skill overlap**: weighted match of resume skills/keywords vs. company description and role tags
- **Domain alignment**: inferred domains (software, data, ML, robotics, embedded, mechanical, civil, finance) matched between resume and company
- **Role type**: internship / co-op / full-time preference (from profile) vs. company's offered positions
- **Sponsorship fit**: user's `needs_sponsorship` flag vs. company's `sponsorship_flag` (Yes / No / Maybe)
- **Degree level**: inferred from resume education vs. company's `degree_levels`
- **Location**: user's `preferred_locations` (states) mapped to regions vs. company's `regions`

---

## Troubleshooting

**Backend won't start**
```bash
.venv/bin/jac --version          # must be 0.12.2
lsof -ti:8000 | xargs kill -9    # free the port if in use
ls jac.toml                      # must exist; if not: cp jac.toml.example jac.toml
```

**AI chat returns a random string (e.g. "OhbVrpoiVgRV")**
```bash
.venv/bin/pip install "byllm==0.5.7"
```

**AI chat or visual match returns AuthenticationError**
```bash
cat .env    # verify key is present and correct, then restart the backend
```

**No companies showing in the app**
```bash
pkill -f 'jac start'
# Re-run the import script from step 6
sqlite3 .jac/data/ai4careers.db "SELECT COUNT(*) FROM companies;"  # should be 223
```

**Login not working / token rejected**
```bash
sqlite3 .jac/data/ai4careers.db "SELECT email, user_id FROM users;"
# If empty: sign up first. If exists: clear browser localStorage and retry.
```

**`Login.__init__() got an unexpected keyword argument 'token'`**  
The frontend merges a stored session `token` into most walker bodies. **Login** and **Signup** are excluded so a stale token is not sent. Use a current `frontend/src/services/api.js` and hard-refresh the app.

**`RankCompanies` / fit scoring: `string indices must be integers, not 'str'`**  
Usually bad shapes in resume JSON (e.g. skills or bullets as strings vs lists). Fixed in `db.jac` (`get_latest_resume`) and `matching.jac` (`as_list`). Restart the backend after pulling changes.

**Jac: `'pass' is not supported`**  
Use a no-op in `except` blocks (e.g. assign to a dummy variable), not Python `pass`.

**Resume upload fails**
- Ensure `frontend/public/pdf.worker.min.mjs` matches `pdfjs-dist` version `5.5.207`
- Check the browser console for the specific error

**`jac run import_career_fair.jac` fails with disk I/O error**
- Known issue: Jac runtime's internal SQLite store conflicts with the app database
- Use the Python import script from step 6 instead

---

## Security Notes (MVP / Demo)

| Area | Current | Production recommendation |
|------|---------|--------------------------|
| Passwords | Simple prefix hash (`hash:password`) | bcrypt / argon2 |
| Tokens | Plaintext (`token:user_id`) | JWT with expiry + refresh |
| API keys | `.env` file | secrets manager / CI env injection |
| CORS | Not configured | restrict to frontend origin |

---

## License

University of Michigan EECS 449
