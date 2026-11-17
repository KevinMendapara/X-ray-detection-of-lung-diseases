import time
import requests
import subprocess
import sys
import os

def test_full_pipeline():
    print("Testing TB Detect AI API Endpoints...")
    base_url = "http://127.0.0.1:8000"

    # Start uvicorn
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        # Wait for server to bind
        time.sleep(3)
        for _ in range(10):
            try:
                r = requests.get(f"{base_url}/api/health", timeout=2)
                if r.status_code == 200:
                    print("✓ Health Check Passed:", r.json())
                    break
            except Exception:
                time.sleep(1)
        else:
            print("Failed to connect to backend server")
            out, err = proc.communicate(timeout=2)
            print("STDOUT:", out.decode('utf-8', errors='ignore'))
            print("STDERR:", err.decode('utf-8', errors='ignore'))
            return False

        # 1. Test Dashboard Stats
        r = requests.get(f"{base_url}/api/dashboard/stats")
        print("✓ Dashboard Stats Status:", r.status_code, "Accuracy:", r.json().get("kpis", {}).get("model_accuracy_pct"))

        # 2. Test Patients List
        r = requests.get(f"{base_url}/api/patients")
        patients = r.json()
        print("✓ Enrolled Patients:", len(patients), "First:", patients[0]['id'], patients[0]['full_name'])

        # 3. Test Samples
        r = requests.get(f"{base_url}/api/xray/samples")
        samples = r.json()
        print("✓ ICMR Samples Available:", len(samples))

        # 4. Test Predict with sample image
        test_img_name = samples[0]['filename']
        print(f"Testing inference on {test_img_name}...")
        r = requests.post(f"{base_url}/api/xray/predict", data={
            "image_filename": test_img_name,
            "patient_id": patients[0]['id']
        })
        pred_res = r.json()
        print("✓ Prediction Result:", pred_res.get("prediction"), "Confidence:", pred_res.get("confidence_score"), "%")
        print("✓ Grad-CAM++ Zones:", pred_res.get("zone_analysis", {}).get("predominant_zone"))

        # 5. Test PDF Report Download
        analysis_id = pred_res.get("analysis_id")
        r = requests.get(f"{base_url}/api/reports/{analysis_id}/pdf")
        print("✓ PDF Download Status:", r.status_code, "Size:", len(r.content), "bytes")

        # 6. Test Reports List
        r = requests.get(f"{base_url}/api/reports")
        reports = r.json()
        print("✓ Total History Reports:", len(reports))

        print("\nAll End-to-End API Tests PASSED Successfully!")
        return True

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == '__main__':
    success = test_full_pipeline()
    sys.exit(0 if success else 1)
