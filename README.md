#  Shuraksha

### AI-Assisted Disaster Reporting & Emergency Response Platform

Shuraksha is a disaster-management platform designed to help citizens report emergencies and help response authorities understand, prioritize, and manage incidents efficiently.

The platform focuses on **floods, cyclones, landslides, fires, and other emergency situations**, providing a centralized system for incident reporting, location tracking, severity assessment, and emergency response coordination.

---

##  Problem

During disasters, emergency response teams often face several challenges:

- Reports arrive from multiple sources.
- Important information can be incomplete or inconsistent.
- Authorities need to identify the most urgent incidents quickly.
- Citizens may not know how or where to report an emergency.
- Response resources need to be assigned efficiently.
- Communication becomes difficult when infrastructure is affected.

Shuraksha aims to provide a single platform for collecting, organizing, and responding to disaster information.

---

##  Features

###  Citizen Incident Reporting

Citizens can submit emergency reports containing:

-  Incident location
-  GPS-based location
-  Hazard type
-  Incident description
-  Optional photograph
-  Incident status

Supported incident types include:

-  Flood
-  Cyclone / Storm
-  Landslide
-  Other hazards

###  Location-Based Reporting

Users can:

- Select an incident location directly on the map.
- Use their current GPS location.
- Add a landmark or address.
- View incidents geographically.

###  Incident Severity

Reports are organized into four severity levels:

| Level | Description |
|---|---|
| 🟢 Low | Limited danger or minor incident |
| 🟡 Moderate | Significant disruption requiring attention |
| 🟠 High | Serious incident requiring rapid response |
| 🔴 Critical | Immediate threat requiring urgent intervention |

Severity assessment considers information such as the incident description, people affected, injuries, trapped people, evacuation requirements, rescue requirements, and immediate danger.

---

##  Emergency Response Dashboard

Authorities can use the platform to:

- View reported incidents.
- Monitor incident locations.
- Identify high-priority emergencies.
- Track response status.
- Coordinate available resources.
- Monitor ongoing disaster situations.

---

##  Resource Management

Shuraksha supports emergency-resource coordination, including:

-  Shelters
-  Emergency response teams
-  Supplies
-  Equipment
-  Evacuation resources

Resources can be tracked based on availability, capacity, location, and deployment status.

---

##  User Roles

### Citizen

- Submit incident reports.
- Share their location.
- Upload incident photographs.
- Track submitted reports.

### Authority

- Monitor incidents.
- Review emergency reports.
- Manage response resources.
- Coordinate emergency operations.

### Admin

- Manage the platform.
- Manage users and system data.
- Oversee emergency-response operations.

---

##  Disaster Management Workflow

```text
Citizen
   ↓
Report Incident
   ↓
Location + Hazard Information
   ↓
Severity Assessment
   ↓
Priority Identification
   ↓
Authority Dashboard
   ↓
Resource Coordination
   ↓
Emergency Response
   ↓
Incident Resolution
```

---

##  System Architecture

```text
                    ┌───────────────────┐
                    │      Citizen      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Shuraksha Web   │
                    │      Platform     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
         Incident Data     Location        Photograph
              │
              ▼
       ┌─────────────────┐
       │ Backend / Data  │
       │    Services     │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Severity &      │
       │ Response Logic  │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Authorities &   │
       │ Response Teams  │
       └─────────────────┘
```

---

##  Technology Stack

### Frontend

- React
- TypeScript
- TanStack Router
- Tailwind CSS
- Lucide Icons
- Map-based visualization

### Backend & Services

- Firebase
- Firebase Authentication
- Firebase database services
- Firebase storage services
- FastAPI services

### API

- FastAPI
- Uvicorn
- Pydantic

### Deployment

- Vercel

---

## 📁 Project Structure

```text
Shuraksha/
│
├── src/
│   ├── components/
│   ├── lib/
│   ├── routes/
│   ├── services/
│   └── ...
│
├── ml_api/
│   ├── app.py
│   └── requirements.txt
│
├── public/
│
├── package.json
├── README.md
└── ...
```

---

##  Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Shuraksha
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local development URL shown in the terminal.

---

##  Safety & Reliability

Shuraksha is designed as an **emergency-management and decision-support platform**.

Information provided by users may be incomplete or inaccurate. Emergency decisions should always be verified by qualified authorities and emergency-response personnel.

The platform should not replace official emergency services.

---

##  Future Development

Planned improvements include:

-  Improved mobile experience
-  SMS-based incident reporting
-  IVR-based emergency reporting
-  Advanced disaster mapping
-  Automated resource recommendations
-  Real-time shelter availability
-  Advanced authority analytics
-  Real-time emergency notifications
-  Improved image-based incident assessment
-  Weather and disaster-risk integration
-  Scalable production infrastructure

---

##  Vision

Shuraksha aims to create a faster and more organized disaster-response ecosystem where:

```text
Report Faster
      ↓
Understand Faster
      ↓
Prioritize Faster
      ↓
Respond Faster
      ↓
Save Lives
```

> **Shuraksha — Report faster. Respond smarter. Save lives.**

---

##  Project Status

**Current Status:** Active Development

Shuraksha is being developed as an AI-assisted disaster-management platform connecting citizens, authorities, and emergency-response resources through a centralized system.

---

## Project

Shuraksha is focused on improving communication, incident reporting, prioritization, and coordination during natural disasters and other emergency situations.
