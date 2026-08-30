# Shuraksha — ML Integration

## Overview

Shuraksha integrates a machine-learning severity classification service to automatically assess the severity of disaster incident reports.

The ML integration is designed to classify incidents into four severity levels:

| Severity Code | Severity |
|---|---|
| 1 | Low |
| 2 | Moderate |
| 3 | High |
| 4 | Critical |

The current model is **Shuraksha ML Model V4**.

---

## ML Model

The trained model is stored separately from the application frontend.

**Model file:**

`shuraksha_severity_model_v4.joblib`

The model was trained using a structured incident dataset containing information such as:

- Incident description
- Incident type
- Location context
- People affected
- People injured
- People trapped
- Immediate danger
- Whether the situation is worsening
- Evacuation required
- Rescue required

The V4 training dataset contains **2,028 records**.

### V4 Training Results

- Training records: **1,622**
- Testing records: **406**
- Accuracy: **99.51%**

### Classification Performance

| Severity | Precision | Recall | F1-score |
|---|---:|---:|---:|
| Low | 1.00 | 0.99 | 0.99 |
| Moderate | 0.99 | 1.00 | 1.00 |
| High | 1.00 | 0.99 | 1.00 |
| Critical | 0.99 | 1.00 | 1.00 |

---

## ML API

The ML model is exposed through a FastAPI service.

### Start the API

From the `ml_api` directory:

```bash
uvicorn app:app --reload --port 8000
```

The API runs locally at:

```text
http://127.0.0.1:8000
```

Health check:

```text
GET /
```

Prediction endpoint:

```text
POST /predict
```

---

## Prediction Request

The API accepts structured incident information.

Example:

```json
{
  "description": "Several people are trapped inside a flooded building and water is rising rapidly.",
  "incident_type": "flood",
  "location_context": "residential area",
  "people_affected": 8,
  "people_injured": 1,
  "people_trapped": 4,
  "immediate_danger": 1,
  "worsening": 1,
  "evacuation_required": 1,
  "rescue_required": 1
}
```

The API converts the request into a pandas DataFrame before passing it to the trained scikit-learn pipeline.

This is important because the V4 model was trained using structured tabular data rather than a single text string.

---

## Example Response

```json
{
  "severity": "Critical",
  "severity_code": 4,
  "confidence": 0.9999,
  "incident": {
    "description": "Several people are trapped inside a flooded building and water is rising rapidly.",
    "incident_type": "flood",
    "location_context": "residential area",
    "people_affected": 8,
    "people_injured": 1,
    "people_trapped": 4,
    "immediate_danger": 1,
    "worsening": 1,
    "evacuation_required": 1,
    "rescue_required": 1
  }
}
```

---

## Frontend Integration

The frontend collects the incident report through the report form.

The report contains information such as:

- Location
- Hazard type
- Description
- Optional photo

The report is passed through the application's severity-scoring layer.

The integration uses:

```text
scoreSeverityWithFallback()
        ↓
scoreSeverityWithAI()
        ↓
ML API /predict
        ↓
Shuraksha V4 Model
        ↓
Severity + confidence
```

If the ML service is unavailable, the application can fall back to its existing heuristic severity scoring.

---

## Severity Output

The ML API returns both a human-readable severity and a numeric severity code.

```text
1 → Low
2 → Moderate
3 → High
4 → Critical
```

This allows the frontend and backend to use the severity consistently for:

- Incident prioritization
- Response coordination
- Resource allocation
- Emergency escalation
- Citizen-facing status information

---

## Testing

The V4 model was tested using both adversarial and unseen incident cases.

The adversarial test suite achieved:

**100% accuracy on the supplied 20-case adversarial test set.**

Additional unseen cases were also tested to observe model behaviour on reports that were not part of the labelled evaluation set.

---

## Project Structure

A simplified structure is:

```text
Shuraksha/
├── ml_api/
│   ├── app.py
│   └── requirements.txt
│
├── ML MODEL/
│   └── shuraksha_severity_model_v4.joblib
│
└── src/
    ├── routes/
    ├── services/
    └── lib/
```

---

## Important Note

The ML model is a supporting component of Shuraksha's disaster-response system. Its predictions should assist prioritization and response workflows rather than replace human emergency-response decisions.

