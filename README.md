# Shuraksha: Disaster Response

---

FINAL WEBSITE GENERATION PROMPT

---

You are a Senior Full-Stack Engineer, Product Architect, and UI/UX Designer. Your task is to design and generate a complete, production-ready disaster management web application called "Shuraksha", a unified platform for citizen reporting and authority resource coordination during floods, cyclones, and landslides.

Build this system for real-world deployment with a focus on scalability, resilience, and a clear, branded user experience. The design must be based on the provided logo and its color palette.

==================================================

ROLE DEFINITION

==================================================

Act as:

- Lead Product Architect

- Senior Frontend Engineer

- Full-Stack Developer (using Firebase as backend)

- UI/UX Designer

- Systems Integration Specialist

You must produce clean, maintainable, fully deployable code for a web application.

==================================================

SYSTEM CONSTRAINTS

==================================================

Frontend:

- React (Vite)

- TypeScript

- Tailwind CSS

- ShadCN UI

- Leaflet.js (for maps)

Backend & Database:

- Firebase (Firestore + Realtime Database)

- Authentication: Firebase Auth (Email/Password + Google OAuth)

State Management & Data Fetching:

- TanStack Query / React Query

- Firebase SDKs

Hosting & Deployment:

- Frontend: Vercel 

- Backend: Firebase Hosting + Cloud Functions (optional)

APIs & Integrations:

- Twilio for SMS/IVR (webhook setup)

- LLM API (OpenAI/Claude) for text severity scoring

- (Optional) Vision-capable LLM API for photo analysis

Constraints:

- No custom backend server. Use Firebase and serverless functions.

- Map: Leaflet with OpenStreetMap tiles (no API key needed).

- Real-time updates must be powered by Firestore onSnapshot listeners.

==================================================

FUNCTIONAL REQUIREMENTS

==================================================

AUTHENTICATION

- Email/password signup

- Google OAuth

- Password reset

- Two user roles: "citizen" and "authority" (e.g., local admin / SDMA level)

- JWT sessions via Firebase Auth

CITIZEN REPORT FLOW (CORE)

1. Citizen opens the app/dashboard.

2. Pins a location on the map or uses GPS.

3. Selects report type (flood, cyclone, landslide, etc.).

4. Adds a short text description.

5. (Optional) Uploads a photo.

6. Submits the report.

7. Report is saved to Firestore.

8. LLM processes the text (and photo if available) to assign a severity score.

9. The report appears live on the authority dashboard.

10. Citizen receives a confirmation and can see their report on a "My Reports" list.

AUTHORITY DASHBOARD & RESOURCE ALLOCATION (CORE)

1. Authority user logs in.

2. Views a live map with two layers:

   - Citizen Reports (color-coded by severity).

   - Available Resources (shelters, NDRF teams, supplies).

3. The "Allocation Engine" automatically suggests the nearest available resource for each high-severity report.

   - Suggestion is weighted by distance AND severity.

4. Authority clicks "Confirm" to dispatch a resource.

   - Resource status updates live (e.g., capacity decreases).

   - Report status updates to "Assigned" or "En Route".

5. Authority can manually reassign resources with one click.

ADMIN PANEL

- User management (citizen and authority roles).

- Live usage analytics (reports per hour, type, location).

- View logs of system activity (report processing, resource changes).

- Manual resource creation (adding shelters/NDRF teams).

==================================================

NON-FUNCTIONAL REQUIREMENTS

==================================================

- Real-time updates: Report submission < 2s latency to dashboard.

- 99.5% uptime for core services.

- HTTPS everywhere.

- Offline capability: PWA with service worker caching. Citizen app queues reports when offline and auto-syncs when connection returns.

- Mobile-first responsive design.

- WCAG 2.1 AA compliance.

- Graceful error handling with user-friendly messages.

- Retry mechanisms for API calls (e.g., LLM, Twilio).

==================================================

PAGE STRUCTURE

==================================================

PUBLIC

- Landing page (with hero, features, how-it-works)

- Login

- Register

- Forgot Password

CITIZEN (Logged In)

- Dashboard (Live map of nearby incidents)

- Report Submission (Map + Form)

- My Reports (History list + statuses)

- Profile / Settings

AUTHORITY (Logged In)

- Dashboard (Live map with reports + resources)

- Resource Allocation View (List of suggested matches)

- Resource Management (Add/Edit/View resources)

- Reports Management (View all reports, filter, assign)

- Analytics (Charts for reports/resources)

- Settings

ADMIN

- Admin Dashboard (User, Report, Resource stats)

- User Management (View, Edit, Delete Users)

- System Logs

==================================================

UI / UX DESIGN SYSTEM

==================================================

Theme & Branding: (Based on Provided Logo)

- Primary Color (Dominant Logo Color): #0EA5FF (Blue/Teal)

- Secondary Color (Supporting Logo Color): #22D3EE (Cyan)

- Accent Color (Highlight from Logo): #F59E0B (Yellow/Amber) or #C084FC (Purple)

- Background: #F8FAFC (Light) or #0F172A (Dark)

- Text: #1E293B (Dark) / #E5E7EB (Light)

- Muted: #94A3B8

- Error: #EF4444

Design Rules:

- Clean, professional, safety-oriented aesthetic.

- Map should be the primary visual element on dashboards.

- Clear visual hierarchy with large, readable fonts.

- High contrast for accessibility.

- Rounded corners: 12px.

- Subtle shadows for cards.

- Prominent, easy-to-find CTAs ("Report Now", "Confirm Dispatch", "View on Map").

- Status indicators (Severity: Low, Medium, High, Critical) with clear colors.

- Skeleton loaders for map and list elements.

- Toast notifications for report submission and dispatching.

Typography:

- Inter (Body) / Poppins (Headings)

Layout:

- Full-screen map dashboard for authority.

- Mobile-friendly card-based layout for citizen reports.

==================================================

TECHNICAL STACK

==================================================

Frontend:

- React (Vite)

- TypeScript

- Tailwind CSS

- ShadCN UI

- TanStack Query

- Firebase SDK (Auth, Firestore)

- Leaflet.js (React-Leaflet wrapper)

- Axios

- React Hook Form

- Zod

Backend / Automation:

- Firebase (Firestore, Auth, Hosting)

- (Optional) Firebase Cloud Functions for backend logic (e.g., webhooks).

- (Alternative) n8n / Pipedream for webhook-based workflow (if using external LLM APIs).

Third-party Services:

- LLM API (OpenAI / Claude) for text severity scoring.

- Twilio (SMS/IVR).

- (Optional) Cloudinary for photo storage.

==================================================

INTEGRATION LOGIC

==================================================

LLM SEVERITY SCORING (Webhook/Function Triggered)

1. Report submitted to Firestore (status: 'pending').

2. Firestore trigger (Cloud Function) or webhook (n8n) listens for new reports.

3. Extracts text (and optional photo URL).

4. Calls LLM API with prompt: "Classify severity (Low/Medium/High/Critical), extract hazard type, number of people affected."

5. Receives structured response.

6. Updates report document with severity_score and structured info.

7. Triggers Allocation Engine.

ALLOCATION ENGINE (Webhook/Function)

1. Triggered after severity scoring.

2. Queries Firestore for high-severity reports (Medium/High/Critical).

3. Queries Firestore for available resources (NDRF teams, shelters, supplies).

4. For each resource, calculates distance (Haversine formula) from report location.

5. Computes a combined score: (1 / distance) * severity_weight.

6. Suggests the top resource match to the authority dashboard.

7. Authority confirms, updates resource capacity and report status.

TWILIO SMS/IVR WEBHOOK (Publicly Accessible)

- Endpoint `/api/twilio/incoming` receives SMS or IVR calls.

- Parses message or voice input.

- Writes a new report to Firestore (status: 'pending', source: 'sms' or 'ivr').

- Triggers the same severity scoring and allocation flow.

DATABASE SCHEMA (FIRESTORE)

Reports Collection (documents):

- id: string (auto)

- userId: string (null if from SMS/IVR)

- source: 'app' | 'sms' | 'ivr' | 'imd' (future)

- location: GeoPoint

- address: string (reverse geocoded)

- type: 'flood' | 'cyclone' | 'landslide' | 'other'

- description: string

- photoUrl: string (optional)

- severity: 'low' | 'medium' | 'high' | 'critical' (LLM generated)

- severityScore: number (1-10)

- hazardType: string (LLM extracted)

- peopleAffected: string (LLM extracted)

- status: 'pending' | 'assigned' | 'en_route' | 'resolved'

- assignedResourceId: string (optional)

- timestamp: timestamp

- createdAt: timestamp

- updatedAt: timestamp

Resources Collection (documents):

- id: string (auto)

- type: 'shelter' | 'ndrf' | 'supply' | 'equipment'

- name: string

- location: GeoPoint

- address: string

- capacity: number

- availableCount: number (for NDRF teams / supplies)

- status: 'available' | 'deployed' | 'depleted'

- createdAt: timestamp

- updatedAt: timestamp

Users Collection (extends Firebase Auth):

- uid: string

- email: string

- role: 'citizen' | 'authority' | 'admin'

- displayName: string

- phone: string (optional)

- createdAt: timestamp

System Logs Collection:

- id: string (auto)

- type: 'report_created' | 'severity_scored' | 'resource_allocated' | 'error'

- details: object

- timestamp: timestamp

==================================================

OUTPUT EXPECTATIONS

==================================================

Generate:

- Complete React + Vite codebase with a clean, modular folder structure.

- Typed services for all Firebase and external API interactions.

- Reusable UI components (buttons, cards, modals, toasts).

- Authentication system with role-based routing.

- Map component with Leaflet, showing live markers for reports and resources.

- Report submission form with map pinning and photo upload.

- Authority dashboard with live map and allocation suggestion list.

- Firestore security rules.

- Environment variable templates (.env.example).

- A working n8n workflow (JSON) or Firebase Cloud Function example for the LLM integration.

- README with setup, environment variables, and deployment instructions.

- Mock data seed script for resources (NDRF teams, shelters) to demo the system.

- Schema definitions for Firestore.

- Twilio webhook endpoint handler code (Node/Express or Firebase Function).

Code Quality:

- SOLID principles.

- Fully typed with TypeScript.

- ESLint compliant.

- Production-ready with no mock logic, placeholders, or hardcoded secrets.

- Responsive and accessible.

==================================================

RESTRICTIONS

==================================================

DO NOT:

- Build a custom backend server. Use Firebase.

- Add features not related to disaster reporting, resource management, or the core loop.

- Store images permanently without a clear TTL (use Cloudinary or Firebase Storage with expiration).

- Implement complex flood prediction models (out of scope).

- Build native mobile apps (focus on responsive web).

- Include unnecessary animations that slow down the map.

- Use heavy, proprietary GIS libraries.

Focus only on the disaster management platform as described.

==================================================

PROJECT GOAL

==================================================

Deliver a scalable, secure, production-ready disaster management platform optimized for real-time citizen reporting and authority-side resource coordination. The final output must be immediately deployable for a hackathon or pilot demonstration.

The system must clearly demonstrate the core loop: Citizen Report -> LLM Severity Scoring -> Resource Allocation Engine -> Authority Confirmation -> Live Status Update.

Use the Attached Image as the Logo

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b1ccd3b2-38c2-4f09-813b-6e30a681ea9f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
