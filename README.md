# AI4Careers

AI-powered career fair assistant for University of Michigan students. Helps students discover companies, match their skills to opportunities, and prepare personalized pitches.

## Tech Stack

- **Backend**: Jac (Jaseci language) 0.9.15
- **Frontend**: React 18
- **Database**: SQLite
- **API**: REST endpoints via Jac walkers

## Current Features

### Authentication System
- User signup with email/password
- Secure login with token-based authentication
- Password hashing with bcrypt
- Session management

### User Profile Management
- View user profile with preferences
- Update work preferences (sponsorship, locations, work modes)
- Store role type preferences

### Resume Upload (Backend Ready)
- Parse resume text
- Extract skills, experience, projects, education
- Store resume data per user
- *(Frontend UI coming soon)*

### Career Fair Data (Backend Ready)
- List career fair events
- Browse companies with filters
- View company details
- Filter by major, position type, sponsors, region
- *(Frontend UI coming soon)*

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 16+
- Jac CLI (`pip install jaclang`)

### Backend Setup

1. **Install Jac**:
   ```bash
   pip install jaclang
   ```

2. **Initialize database**:
   ```bash
   jac run main.jac
   ```

3. **Start backend server**:
   ```bash
   jac start main.jac
   ```
   Backend runs at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```
   Frontend runs at `http://localhost:3000`

## How to Use

### 1. Sign Up
1. Navigate to `http://localhost:3000`
2. Click "Sign Up"
3. Enter your email, password, and name
4. Click "Sign Up" to create account

### 2. Log In
1. Go to login page
2. Enter your email and password
3. You'll be redirected to the dashboard

### 3. View Profile
- After login, you'll see your dashboard
- Your profile information is displayed
- Current preferences are shown 

### 4. Update Preferences *(API ready, UI coming soon)*
Use the API directly:
```bash
curl -X POST http://localhost:8000/walker/UpdatePreferences \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_token_here",
    "needs_sponsorship": false,
    "work_authorization": "US Citizen",
    "preferred_locations": ["Ann Arbor", "San Francisco"],
    "work_modes": ["Remote", "Hybrid"],
    "role_types": ["Software Engineer", "Data Scientist"]
  }'
```

## API Endpoints

All endpoints are POST requests to `http://localhost:8000/walker/<WalkerName>`

### Authentication
- **POST /walker/Signup**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```

- **POST /walker/Login**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Returns: `{ "token": "token:user_id" }`

### Profile
- **POST /walker/Me**
  ```json
  {
    "token": "your_token"
  }
  ```
  Returns user profile with preferences

- **POST /walker/UpdatePreferences**
  ```json
  {
    "token": "your_token",
    "needs_sponsorship": false,
    "work_authorization": "US Citizen",
    "preferred_locations": ["City1", "City2"],
    "work_modes": ["Remote", "Hybrid"],
    "role_types": ["SWE", "PM"]
  }
  ```

### Resume (Backend Ready)
- **POST /walker/ResumeUpload**
  ```json
  {
    "token": "your_token",
    "filename": "resume.pdf",
    "raw_text": "Resume text content..."
  }
  ```

- **POST /walker/GetResume**
  ```json
  {
    "token": "your_token",
    "resume_id": "resume_id"
  }
  ```

### Career Fair (Backend Ready)
- **POST /walker/ListEvents**
  ```json
  {}
  ```

- **POST /walker/ListCompanies**
  ```json
  {
    "event_id": "event_id",
    "fair_day": "",
    "position_type": "",
    "sponsors": "",
    "region": "",
    "major_search": ""
  }
  ```

- **POST /walker/GetCompany**
  ```json
  {
    "event_id": "event_id",
    "company_id": "company_id"
  }
  ```

## Project Structure

```
AI4Careers/
├── main.jac              # Main entry point, imports all walkers
├── auth.jac              # Signup, Login walkers
├── profile.jac           # Me, UpdatePreferences walkers
├── resume.jac            # ResumeUpload, GetResume walkers
├── career_fair.jac       # ListEvents, ListCompanies, GetCompany walkers
├── db.jac                # Database operations
├── security.jac          # Password hashing, token management
├── parsing.jac           # Resume parsing utilities
├── data/                 # CSV data for career fairs
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Login, Signup, Dashboard pages
│   │   ├── context/      # AuthContext for state management
│   │   └── services/     # API client
│   └── package.json
└── .jac/                 # Jac runtime (contains SQLite database)
    └── data/
        └── ai4careers.db # User data, resumes, preferences
```

## Troubleshooting

### Backend won't start
- Make sure Jac is installed: `jac --version`
- Kill existing processes on port 8000: `lsof -ti:8000 | xargs kill -9`

### Frontend won't connect
- Verify backend is running at `http://localhost:8000`
- Check that `REACT_APP_API_URL` environment variable is set (or defaults to localhost:8000)

### Login not working
- Clear browser localStorage and try again
- Check browser console for errors
- Verify user exists in database: `sqlite3 .jac/data/ai4careers.db "SELECT * FROM users;"`

## Coming Soon

- [ ] Companies browse page with filters
- [ ] Resume upload UI
- [ ] AI-powered fit scoring
- [ ] Personalized pitch generation
- [ ] Company recommendations based on skills
- [ ] Enhanced security with JWT tokens

## Data

Career fair data sourced from University of Michigan Fall 2025 Career Fair (public data).

## License

MIT
