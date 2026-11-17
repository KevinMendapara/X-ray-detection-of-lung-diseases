# PulmoVision – Explainable Lung X-Ray Analysis

> **Academic Research & Educational Decision-Support Prototype**  
> *Hybrid Deep Learning (DenseNet121) + Maximum-Margin Classifier (SVM) + Explainable AI (Grad-CAM++)*  
> *Trained and evaluated on the Indian Council of Medical Research (ICMR) National Tuberculosis Registry (INTBTR) for research and education*

---

> **Repository contents:** Patient records, uploaded radiographs, generated reports, source datasets, sample clinical images, and trained model weight files are excluded from Git. Prepare an appropriately authorized dataset and train the model locally before running inference.

## 1. Project Overview

**PulmoVision** is an academic research and educational decision-support prototype for analyzing chest radiographs for pulmonary tuberculosis (TB). It combines a DenseNet121 feature extractor, an SVM classifier, and Grad-CAM++ visual explanations. It is not a diagnostic device and does not replace review by a qualified clinician. 

The application utilizes a **hybrid machine learning architecture**:
1. **DenseNet121 (Feature Extractor):** A deep 121-layer densely connected convolutional neural network pretrained on ImageNet that extracts rich 1,024-dimensional spatial structural embeddings across multiple receptive fields (apical haziness, consolidations, infiltrates).
2. **Support Vector Machine (SVM):** A maximum-margin classifier utilizing a Radial Basis Function (RBF) kernel with Platt-calibrated decision probabilities to classify extracted feature vectors into **TB Suspected**, **TB Not Detected by Model**, or **Inconclusive**.
3. **Grad-CAM++ (Explainable AI):** An analytical second- and third-order gradient visualization technique that generates high-resolution transparent attention heatmaps across 5 radiological lung zones (Right Lung, Left Lung, Upper Zone, Middle Zone, Lower Zone).
4. **Hospital-Grade PDF Medical Reports:** Automated generation of formal clinical analysis documents embedded with patient clinical demographics, preprocessed radiographs, heatmaps, zone activation tables, and cautious medical observations.

---

## 2. Technology Stack

### Frontend
- **Framework:** React.js 18 with Vite
- **Routing:** React Router DOM v6
- **Styling:** Custom Healthcare Design System & Tailwind CSS tokens
  - *Primary Medical Blue:* `#1769AA`
  - *Secondary Tint:* `#EAF4FC`
  - *Accent Teal:* `#17A2A4`
  - *Dark Navy:* `#183153`
  - *Page Canvas:* `#F8FAFC`
- **Icons:** Lucide React
- **Data Visualization:** Chart.js, HTML5 Canvas, KaTeX-ready math

### Backend
- **Framework:** Python 3.11 with FastAPI (Asynchronous REST API)
- **Database:** SQLite3 with Custom `DBManager` Layer (Zero external DLL dependencies)
- **Authentication & Security:** JWT (HMAC-SHA256) + BCrypt password hashing + Role-Based Access Control
- **Document Generation:** ReportLab 5.1 (Automated PDF Medical Engine)

### AI and Machine Learning
- **Deep Learning Framework:** TensorFlow 2.21 / Keras 3
- **Base Architecture:** DenseNet121 (`pooling='avg'`, 1024-dim features)
- **Machine Learning Library:** NumPy RBF SVM with SMO optimization and validation-set probability calibration
- **Explainable AI:** Analytical Grad-CAM++ with higher-order partial derivatives
- **Medical Imaging:** PyDICOM (16-bit to 8-bit contrast windowing), OpenCV, Pillow, NumPy, Pandas

---

## 3. System Architecture Workflow

```text
               +--------------------------------------+
               |      Input Chest Radiograph (CXR)    |
               |      (DICOM, PNG, JPG, or JPEG)      |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |     Image Preprocessing & Windowing  |
               |      (224x224 RGB, Percentile Stretch)|
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |          DenseNet121 Backbone        |
               |    (Deep Spatial Feature Extraction) |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |       1,024-dim Feature Vector       |
               |        (StandardScaler Scaled)       |
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |        SVM Classifier (RBF Kernel)   |
               |    (Hyperplane Margin Decision Score)|
               +--------------------------------------+
                                  |
                                  v
               +--------------------------------------+
               |   TB Suspected / Not Detected / Inc   |
               |     (Calibrated Confidence Score %)  |
               +--------------------------------------+
                     /                        \
                    v                          v
+-----------------------------+   +-----------------------------+
|    Grad-CAM++ Visualizer    |   | Hospital-Grade PDF Report   |
| (5-Zone Lung Attention CAM) |   | (ReportLab Clinical Engine) |
+-----------------------------+   +-----------------------------+
```

---

## 4. ICMR Dataset & Held-Out Split Evaluation

The system was trained and evaluated on authentic clinical chest radiographs from the **Indian Council of Medical Research (ICMR) – National Institute for Research in Tuberculosis (NIRT)** national registry:
- **Normal Control Cohort:** `intbtr99` (307 radiographs)
- **Pulmonary TB Cohort:** `intbtr253` (377 radiographs)
- **Dataset Partition:** Patient-level stratified split across all 684 radiographs (70% Train: 477, 15% Validation: 103, 15% Held-out Test: 104).

### Held-Out Split Evaluation Results (104 cases)
*These metrics were calculated on unseen patients from the same cohort. This is a dataset hold-out result, not external clinical validation:*

| Metric | Hold-out Value | Clinical Significance |
| :--- | :---: | :--- |
| **Accuracy** | **100.00%** | Overall correct classification rate |
| **Sensitivity (Recall)** | **100.00%** | No false negatives observed in this held-out split; this does not establish clinical sensitivity |
| **Specificity (TNR)** | **100.00%** | No false positives observed in this held-out split |
| **Precision (PPV)** | **100.00%** | Positive predictive value on this held-out split |
| **F1-Score** | **1.0000** | Harmonic balance between precision & recall |
| **ROC-AUC** | **1.0000** | Ranking performance within this held-out split |
| **Confusion Matrix** | **TN=47, FP=0, FN=0, TP=57** | Held-out test split ($N=104$) |

---

## 5. All 12 Completed Website Pages

1. **Page 1: Home Page (`/`)**
   - Professional healthcare-themed hero section: *"AI-Powered Tuberculosis Detection Through Chest X-Ray Analysis"*
   - DenseNet121 + SVM + Grad-CAM++ feature breakdown
   - Quick "Upload X-Ray" & "Learn More" call-to-actions
   - Verified ICMR performance telemetry statistics
   - Interactive 4-step pipeline workflow illustration
   - Regulatory medical disclaimer banner & comprehensive footer

2. **Page 2: About Us (`/about`)**
   - Clinical problem statement: Global & Indian national TB burden
   - Project objectives: Decision support, explainability, democratization of CXR screening
   - Detailed justification of the Triad Architecture (DenseNet121, SVM, Grad-CAM++)
   - ICMR dataset provenance details and complete technology stack documentation

3. **Page 3: Patient Registration (`/register-patient`)**
   - Auto-generated Patient ID (`PT-2026-XXXX`)
   - Demographics: Full name, age, gender, contact number, email
   - Clinical intake: Symptoms checklist (cough > 2 weeks, hemoptysis, night sweats, weight loss), prior TB history, duration of chief complaints
   - Secure input validation and immediate one-click redirection to CXR upload

4. **Page 4: Patient Dashboard (`/dashboard`)**
   - KPI metrics: Total Enrolled Patients, Analyses Performed, TB Suspected, Normal Controls, Hold-out Accuracy
   - Patient directory with live search and filter
   - Recent analysis activity feed with visual overlay thumbnails and report links

5. **Page 5: X-Ray Upload Page (`/upload`)**
   - Modern drag-and-drop file ingestion zone (PNG, JPG, JPEG, DICOM)
   - Real-time pre-analysis preview and file dimension validation
   - Patient selector dropdown (assign scan to enrolled subject)
   - **One-Click Authentic ICMR Test Cases:** Instantly test with verified ICMR Normal or TB positive samples
   - Animated 5-stage inference progress indicator:
     `Normalization -> DenseNet121 -> SVM Classifier -> Grad-CAM++ -> PDF Report`

6. **Page 6: AI Detection Results (`/results/:id`)**
   - Status banner: **TB Suspected** / **TB Not Detected by Model** / **Inconclusive**
   - Calibrated model confidence gauge & SVM hyperplane distance score
   - Side-by-side visualization: Original CXR vs Preprocessed Tensor vs Heatmap Overlay
   - **Critical Safety Guardrail:** Clarifies that confidence is a mathematical distance, not individual biological probability; negative results do not rule out TB

7. **Page 7: Grad-CAM++ Explainable AI Visualization (`/gradcam/:id`)**
   - Dedicated Explainability Studio with 3 display modes:
     1. *Side-by-Side Comparison*
     2. *Interactive Blend Overlay* (with dynamic 0–100% opacity slider)
     3. *Pure Attention Heatmap*
   - Color gradient legend: Blue (Minimal) &rarr; Green (Moderate) &rarr; Yellow (Elevated) &rarr; Red (Peak)
   - **5-Zone Radiological Dissection:**
     - Anatomical Right Lung (Viewer's Left)
     - Anatomical Left Lung (Viewer's Right)
     - Upper Lung Zones (Apical / Subapical)
     - Middle Lung Zones (Hilar / Perihilar)
     - Lower Lung Zones (Basilar)
   - Overall highlighted area percentage (&ge; 40% threshold)
   - Downloadable visualization graphic

8. **Page 8: Detailed AI Analysis Report (`/report/:id`)**
   - Comprehensive hospital-grade clinical report:
     - *Section A:* Patient Demographics & Clinical Symptoms
     - *Section B:* CXR Preprocessing & Resolution Check
     - *Section C:* AI Classification & Margin Output
     - *Section D:* 5-Zone Attention Metrics Table
     - *Section E:* Automated Radiologic Observations
     - *Section F:* Recovery, Treatment Facts (DOTS, strict adherence, nutrition, non-self-medication)
     - *Section G:* Prominent Medical Disclaimer
   - Action buttons: Download PDF Report, Print Report, View Grad-CAM++, Return to Dashboard

9. **Page 9: Report History (`/history`)**
   - Searchable, filterable archive of all patient evaluations
   - Filter by classification outcome (All, TB Suspected, Normal, Inconclusive)
   - Direct download links for generated PDF reports

10. **Page 10: Educational TB Information (`/education`)**
    - Medically reviewed guide on *Mycobacterium tuberculosis* etiology and airborne transmission
    - Clinical presentation & symptoms checklist
    - Diagnostic pathways: Chest X-rays, Sputum Smear Microscopy, CBNAAT / GeneXpert molecular testing
    - Standard 6-month DOTS treatment regimen (HRZE & HRE phases) and MDR-TB prevention
    - Clinical warning signs for seeking urgent medical attention

11. **Page 11: Contact Us (`/contact`)**
    - Academic inquiry form: Name, Email, Subject, Message
    - Research team information, ICMR registry credits, and clinical emergency guidance

12. **Page 12: Admin Dashboard (`/admin`)**
    - Role-based clinical governance console
    - Held-out Confusion Matrix visualizer ($N=104$)
    - Hyperparameter audit (RBF Kernel, $C=1.0$, $\gamma=\text{scale}$)
    - ICMR dataset partition telemetry (477 train, 103 val, 104 test)
    - Full system audit trail log
    - Clinical staff directory

---

## 6. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new clinical staff member |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT bearer token |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user |
| `POST` | `/api/patients` | Register new patient & generate unique `PT-2026-XXXX` ID |
| `GET` | `/api/patients` | Retrieve list of enrolled patients with search |
| `GET` | `/api/patients/{id}` | Retrieve patient details and prior analyses |
| `GET` | `/api/xray/samples` | List bundled ICMR sample radiographs for one-click testing |
| `POST` | `/api/xray/upload` | Upload CXR file (PNG, JPG, JPEG, DICOM) |
| `POST` | `/api/predict` | Execute DenseNet121 + SVM inference & Grad-CAM++ |
| `POST` | `/api/xray/gradcam` | Retrieve detailed zone-wise Grad-CAM++ attention data |
| `GET` | `/api/reports` | List historical analysis reports with filters |
| `GET` | `/api/reports/{id}` | Retrieve full report details (JSON) |
| `GET` | `/api/reports/{id}/pdf` | Download official PDF medical report |
| `GET` | `/api/dashboard/stats` | System KPIs, model evaluation metrics, and demographic data |
| `GET` | `/api/admin/metrics` | Full model parameters, confusion matrix, and ROC curve |
| `GET` | `/api/admin/logs` | Security & operational audit trail |
| `GET` | `/api/health` | Service health status |

---

## 7. Installation & Quick Start

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** & **npm**

### Step 1: One-Click Startup (Windows)
Double-click:
```bat
start_all.bat
```
*This starts the FastAPI backend on `http://127.0.0.1:8000`, the React frontend on `http://localhost:3000`, and opens your default web browser automatically.*

---

### Step 2: Manual Startup (PowerShell)

#### Terminal 1 — Backend Server
```powershell
# Navigate to project directory
cd "c:\Users\Hp\SEMINAR PROJECT"

# Start FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2 — Frontend Application
```powershell
# Navigate to frontend directory
cd "c:\Users\Hp\SEMINAR PROJECT\frontend"

# Ensure Node is in PATH and run Vite dev server
$env:PATH = "C:\Users\Hp\AppData\Local\Programs\nodejs;" + $env:PATH
.\node_modules\.bin\vite.cmd --port 3000 --host
```

*Open your web browser and navigate to `http://localhost:3000`.*

---

## 8. Default Staff Login Credentials

To access the administrative panel or staff portal:
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Chief Medical Officer & Administrator

---

## 9. Regulatory & Medical Disclaimer

> **IMPORTANT CLINICAL NOTICE:**  
> This web application is an artificial intelligence research and educational prototype. It is not a certified medical device and its output does **not** constitute a confirmed medical diagnosis. AI predictions and Grad-CAM++ visualizations may contain inaccuracies. A negative result does not exclude active tuberculosis or extrapulmonary disease. Always consult a certified radiologist, pulmonologist, or medical professional for clinical interpretation, and confirm findings using standard microbiological investigations (sputum smear microscopy and CBNAAT/GeneXpert assays).




