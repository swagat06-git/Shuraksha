# Android SOS Integration — Future Production Phase

> **Status: Planned / Future Implementation**
>
> This document describes the Android-specific integration planned for the
> production mobile version of Shuraksha. The current Shuraksha web prototype
> intentionally does not attempt to read or intercept the user's native SMS
> messages.

## 1. Current Web Prototype

The current web application provides an SOS button that opens the device's
native SMS composer.

Current flow:

```text
Citizen
   |
   | Tap "Send SOS Alert"
   v
Native SMS composer
   |
   | Citizen sends emergency SMS
   v
Configured emergency recipient
```

The web application cannot reliably read the SMS after it has been sent from
the device's native Messages application.

Therefore, the current web prototype does **not** claim to automatically
convert an outgoing native SMS into a Shuraksha report.

---

## 2. Planned Android Application

When Shuraksha is developed as a native Android application, the Android
client can provide a dedicated emergency-integration layer.

The planned production flow is:

```text
Citizen
   |
   | Tap SOS
   v
Shuraksha Android App
   |
   | Emergency event + location
   v
Shuraksha Backend
   |
   | Create Report
   v
Firestore
   |
   v
Authority Dashboard
   |
   | Dispatch
   v
Response Resource
   |
   | Notify Citizen
   v
Citizen
```

The important design decision is that the Android layer should **reuse the
existing Shuraksha `Report` model and authority workflow** instead of creating
a separate SOS system.

---

## 3. Existing Report Model

The existing `Report` structure already contains the fields needed to
represent an SOS incident:

- `source: "sms"` — identifies an SMS-originated incident.
- `phone` — stores the citizen's phone number when available.
- `location` — stores the citizen's GPS coordinates.
- `status: "pending"` — makes the incident available for authority action.
- `citizenStatus: "needs_help"` — identifies that the citizen requires help.
- `severity` and `severityScore` — support prioritization.
- `createdAt` and `updatedAt` — support incident tracking.

No separate `SOSReport` collection is required for this design.

---

## 4. Planned Android SOS Event

The Android application should create an emergency event containing, at
minimum:

```text
SOS event
├── timestamp
├── latitude
├── longitude
├── citizen phone number (when available)
└── emergency message
```

The backend can then convert this event into the existing `Report` structure.

### Example mapping

```text
Android SOS event       -> Existing Report
------------------------------------------------
GPS latitude/longitude  -> location
Phone number            -> phone
Emergency message       -> description
"android_sos" / SMS     -> source
needs assistance        -> citizenStatus
pending                 -> status
timestamp               -> createdAt / updatedAt
```

---

## 5. Conceptual Android Implementation

The following is **pseudocode only**. It is intentionally not included in
the current web application because Android-specific permissions, lifecycle
handling, security, and platform APIs must be implemented when the native
Android application is built.

```kotlin
// FUTURE ANDROID IMPLEMENTATION
//
// This is conceptual pseudocode, not production code.
//
// fun triggerEmergency() {
//
//     // 1. Request/read the user's current GPS location
//     val location = getCurrentLocation()
//
//     // 2. Build the emergency event
//     val sosEvent = SosEvent(
//         timestamp = currentTimestamp(),
//         latitude = location.latitude,
//         longitude = location.longitude,
//         phone = currentUserPhone(),
//         message = "SHURAKSHA EMERGENCY"
//     )
//
//     // 3. Send the event securely to the Shuraksha backend
//     sendToShurakshaBackend(sosEvent)
//
//     // 4. Optionally use the Android telephony/SMS layer as an additional
//     //    emergency communication channel where appropriate.
//
//     // 5. The backend creates the normal Shuraksha Report.
// }
```

> **Important:** The exact Android implementation will depend on the final
> application architecture and the Android platform permissions/APIs available
> at the time of production development.

---

## 6. Backend Integration

The Android application should not directly write arbitrary data into the
authority dashboard.

Instead:

```text
Android App
     |
     v
Authenticated Backend API
     |
     v
Firestore
     |
     v
Existing Report
     |
     v
Existing Authority Dashboard
```

The backend should validate the request before creating the report.

Recommended validation includes:

- authenticated Android user/device
- valid latitude and longitude
- valid phone number when supplied
- server-generated timestamps
- server-controlled report status
- rate limiting / abuse protection

---

## 7. Authority Workflow

Once the backend creates the report, the authority workflow does not need a
separate SOS implementation.

The incident should appear alongside normal reports, with the UI clearly
identifying an emergency/SOS-originated incident.

Example:

```text
🚨 SOS EMERGENCY

Citizen needs assistance
Location: [GPS location]
Status: Pending
Severity: High/Critical

[ Dispatch ]

[ Notify Citizen ]
```

After dispatch:

```text
Authority
   |
   | Dispatch
   v
Response team/resource assigned
   |
   | Notify Citizen
   v
Citizen receives response notification
```

This reuses the existing Shuraksha response workflow.

---

## 8. Why This Is a Future Android Feature

The current project is a web application.

A normal web application cannot obtain unrestricted access to the user's
native SMS history or intercept every outgoing SMS from the device.

For that reason, the current prototype deliberately stops at the native SMS
composer.

The future Android application can provide deeper device-level integration,
subject to Android's platform permissions, security requirements, and
distribution policies.

---

## 9. SIH Prototype Scope

For the current SIH prototype:

```text
IMPLEMENTED
------------------------------
Web application
SOS button
Native SMS composer
GPS coordinates in SOS message
Existing Report model
Authority dashboard
Dispatch workflow
Notify Citizen workflow


FUTURE ANDROID PHASE
------------------------------
Native Android application
Android-specific emergency integration
Automatic SOS event -> backend
Automatic SOS event -> Firestore Report
Deeper device/telephony integration
Production-grade background/reliability handling
```

This separation keeps the prototype honest while showing that the production
architecture has already been considered.

---

## 10. Judge Explanation

### Short explanation

> "In the current prototype, the SOS button uses the phone's native SMS
> composer so a citizen can send an emergency message even without using the
> web application's messaging interface. A web application cannot reliably
> intercept the SMS after it leaves the native Messages application.
>
> In the production phase, we plan to provide a native Android application.
> That Android layer will integrate the emergency event and GPS location with
> our backend, which will create the same `Report` object already used by
> Shuraksha. The authority will then receive it through the existing dashboard
> and use the existing Dispatch and Notify Citizen workflow.
>
> So the Android application is an integration layer — not a separate
> emergency-response system."

---

## 11. Architecture Principle

The future Android implementation should preserve this principle:

> **One incident model, one backend, one authority workflow.**

The Android client should add device-level capabilities without duplicating
the existing Shuraksha reporting and response architecture.
