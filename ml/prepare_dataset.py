"""Prepare full ICMR-NIRT cohorts into a patient-level train/validation/test split."""
import csv
import io
import json
import math
import os
import random
import re
import zipfile
from collections import Counter

import numpy as np
import pydicom
from PIL import Image

NORMAL_ZIP = r"C:\Users\Hp\OneDrive\Desktop\intbtr99.zip"
ABNORMAL_ZIP = r"C:\Users\Hp\Downloads\intbtr253.zip"
OUTPUT_DIR = "ml/processed_dataset"
IMAGE_DIR = os.path.join(OUTPUT_DIR, "images")
MANIFEST_PATH = os.path.join(OUTPUT_DIR, "manifest.csv")
SAMPLE_DIR = "ml/data/sample_xrays"
FIELDNAMES = ["patient_id", "image_name", "relative_path", "label", "class_name", "cohort", "source_file", "split"]


def dicom_to_rgb(dcm_bytes, target_size=(224, 224)):
    ds = pydicom.dcmread(io.BytesIO(dcm_bytes))
    arr = ds.pixel_array.astype(np.float32)
    if getattr(ds, "PhotometricInterpretation", "MONOCHROME2") == "MONOCHROME1":
        arr = np.max(arr) - arr
    p1, p99 = np.percentile(arr, (1, 99))
    if p99 > p1:
        arr = np.clip(arr, p1, p99)
        arr = (arr - p1) / (p99 - p1) * 255.0
    else:
        arr = (arr - np.min(arr)) / (np.max(arr) - np.min(arr) + 1e-6) * 255.0
    image = Image.fromarray(arr.astype(np.uint8)).convert("RGB")
    return image.resize(target_size, Image.Resampling.LANCZOS) if target_size else image


def read_cohort(archive_path, label, class_name, cohort, prefix, sample_prefix):
    if not os.path.isfile(archive_path):
        raise FileNotFoundError(f"Dataset archive not found: {archive_path}")
    rows = []
    with zipfile.ZipFile(archive_path) as archive:
        names = sorted(n for n in archive.namelist() if n.lower().endswith(".dicom") and not n.startswith("__MACOSX/"))
        for i, name in enumerate(names):
            patient_id = os.path.splitext(os.path.basename(name))[0].split("_")[0]
            if not re.fullmatch(r"[A-Za-z0-9-]+", patient_id):
                raise ValueError(f"Unexpected patient ID in {name}")
            image_name = f"{prefix}_{patient_id}.png"
            try:
                image = dicom_to_rgb(archive.read(name))
            except Exception as exc:
                raise RuntimeError(f"Could not decode {name}: {exc}") from exc
            image.save(os.path.join(IMAGE_DIR, image_name), format="PNG", optimize=True)
            if i < 3:
                image.save(os.path.join(SAMPLE_DIR, f"{sample_prefix}_{i + 1}.png"), format="PNG", optimize=True)
            rows.append({
                "patient_id": patient_id, "image_name": image_name,
                "relative_path": f"images/{image_name}", "label": label,
                "class_name": class_name, "cohort": cohort,
                "source_file": name,
            })
            if (i + 1) % 50 == 0 or i + 1 == len(names):
                print(f"{class_name}: {i + 1}/{len(names)}", flush=True)
    if not rows:
        raise ValueError(f"No DICOM images found in {archive_path}")
    return rows


def assign_patient_splits(rows):
    ids = [row["patient_id"] for row in rows]
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate patient IDs found across the cohort; refusing a potentially leaky split")
    rng = random.Random(42)
    by_label = {}
    for row in rows:
        by_label.setdefault(row["label"], []).append(row)
    result = []
    for label in sorted(by_label):
        group = by_label[label]
        rng.shuffle(group)
        n_temp = math.ceil(len(group) * .30)
        n_test = math.ceil(n_temp * .50)
        test = group[:n_test]
        val = group[n_test:n_temp]
        train = group[n_temp:]
        result.extend(dict(row, split="train") for row in train)
        result.extend(dict(row, split="val") for row in val)
        result.extend(dict(row, split="test") for row in test)
    return result


def extract_and_prepare():
    os.makedirs(IMAGE_DIR, exist_ok=True)
    os.makedirs(SAMPLE_DIR, exist_ok=True)
    print("Preparing all ICMR-NIRT normal-control and TB-positive studies...", flush=True)
    rows = read_cohort(NORMAL_ZIP, 0, "Normal", "ICMR-NIRT Normal Control", "normal", "sample_normal")
    rows += read_cohort(ABNORMAL_ZIP, 1, "Tuberculosis", "ICMR-NIRT TB Positive", "tb", "sample_tb")
    rows = assign_patient_splits(rows)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    counts = Counter(row["split"] for row in rows)
    meta = {
        "dataset_name": "ICMR-NIRT Pulmonary Tuberculosis Chest X-Ray Cohort",
        "description": "Complete paired ICMR-NIRT normal-control and TB-positive DICOM cohort, standardized to 224x224 RGB PNG.",
        "total_images": len(rows),
        "normal_cases": sum(row["label"] == 0 for row in rows),
        "tb_positive_cases": sum(row["label"] == 1 for row in rows),
        "train_count": counts["train"], "val_count": counts["val"], "test_count": counts["test"],
        "image_size": "224x224 RGB",
        "modalities": "Chest radiograph (DICOM windowed to 8-bit PNG)",
        "source_cohorts": ["intbtr99 (Normal)", "intbtr253 (Abnormal TB)"],
        "split_method": "Stratified patient-level split (70/15/15), random_state=42",
    }
    with open(os.path.join(OUTPUT_DIR, "dataset_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    label_counts = Counter(row["label"] for row in rows)
    print(f"Manifest saved: {MANIFEST_PATH}", flush=True)
    print(f"Total {len(rows)} images: {label_counts[0]} normal, {label_counts[1]} TB-positive", flush=True)
    print(f"Split sizes: {dict(counts)}", flush=True)


if __name__ == "__main__":
    extract_and_prepare()
