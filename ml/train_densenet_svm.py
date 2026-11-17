"""Train DenseNet121 feature extractor + RBF SVM using the prepared ICMR manifest."""
import csv
import json
import os
import sys
from datetime import datetime, timezone

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
os.environ["KERAS_HOME"] = r"C:\Users\Hp\.keras"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.applications.densenet import DenseNet121, preprocess_input
import joblib

from ml.svm_compat import RbfSVM, StandardScaler


def load_manifest(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_image(path):
    image = Image.open(path).convert("RGB").resize((224, 224), Image.Resampling.LANCZOS)
    return preprocess_input(np.asarray(image, dtype=np.float32))


def metric_report(y_true, y_pred, probs):
    y_true = np.asarray(y_true, dtype=np.int64)
    y_pred = np.asarray(y_pred, dtype=np.int64)
    probs = np.asarray(probs, dtype=np.float64)
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    specificity = tn / (tn + fp) if tn + fp else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    positives, negatives = probs[y_true == 1], probs[y_true == 0]
    auc = float(np.mean((positives[:, None] > negatives[None, :]) + .5 * (positives[:, None] == negatives[None, :])))
    order = np.argsort(-probs, kind="mergesort")
    sorted_y = y_true[order]
    tp_cum = np.cumsum(sorted_y == 1)
    fp_cum = np.cumsum(sorted_y == 0)
    fpr, tpr = [0.0], [0.0]
    last_score = None
    for idx, score in enumerate(probs[order]):
        if last_score is not None and score != last_score:
            fpr.append(float(fp_cum[idx - 1] / max(1, tn + fp)))
            tpr.append(float(tp_cum[idx - 1] / max(1, tp + fn)))
        last_score = score
    fpr.append(1.0)
    tpr.append(1.0)
    return {
        "test_samples": int(len(y_true)),
        "accuracy": float(np.mean(y_true == y_pred)),
        "sensitivity": float(recall), "recall": float(recall),
        "specificity": float(specificity), "precision": float(precision),
        "f1_score": float(f1), "roc_auc": auc,
        "confusion_matrix": {"true_negative": tn, "false_positive": fp, "false_negative": fn, "true_positive": tp},
        "roc_curve": {"fpr": [round(x, 6) for x in fpr], "tpr": [round(x, 6) for x in tpr]},
    }


def main():
    print("TB Detect AI — DenseNet121 + RBF SVM training", flush=True)
    manifest_path = os.path.join("ml", "processed_dataset", "manifest.csv")
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")
    rows = load_manifest(manifest_path)
    if not rows:
        raise ValueError("Dataset manifest is empty")
    split_counts = {}
    for row in rows:
        split_counts[row["split"]] = split_counts.get(row["split"], 0) + 1
    print(f"Manifest: {len(rows)} images; splits {split_counts}", flush=True)
    print(f"TensorFlow {tf.__version__}; GPU devices: {tf.config.list_physical_devices('GPU')}", flush=True)
    try:
        tf.config.threading.set_intra_op_parallelism_threads(10)
        tf.config.threading.set_inter_op_parallelism_threads(2)
    except RuntimeError:
        pass

    model = DenseNet121(weights=None, include_top=False, input_shape=(224, 224, 3), pooling="avg")
    weights_path = os.path.join("backend", "models", "densenet121_weights.h5")
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Required local DenseNet121 weights not found: {weights_path}")
    model.load_weights(weights_path)
    print(f"Loaded pretrained DenseNet121 weights: {weights_path}", flush=True)

    features = []
    labels = []
    splits = []
    batch_size = 8
    for start in range(0, len(rows), batch_size):
        batch_rows = rows[start:start + batch_size]
        batch = np.stack([load_image(os.path.join("ml", "processed_dataset", row["relative_path"])) for row in batch_rows])
        features.append(model(batch, training=False).numpy())
        labels.extend(int(row["label"]) for row in batch_rows)
        splits.extend(row["split"] for row in batch_rows)
        processed = min(start + len(batch_rows), len(rows))
        print(f"Feature extraction: {processed}/{len(rows)}", flush=True)
    X = np.vstack(features).astype(np.float32)
    y = np.asarray(labels, dtype=np.int64)
    split = np.asarray(splits)
    train, val, test = split == "train", split == "val", split == "test"
    if not all(np.any(y[mask] == label) for mask in (train, val, test) for label in (0, 1)):
        raise ValueError("Each data split must contain both classes")

    scaler = StandardScaler().fit(X[train])
    X_train, X_val, X_test = scaler.transform(X[train]), scaler.transform(X[val]), scaler.transform(X[test])
    y_train, y_val, y_test = y[train], y[val], y[test]
    print(f"Features {X.shape}; train={len(y_train)}, validation={len(y_val)}, test={len(y_test)}", flush=True)

    svm = RbfSVM(C=1.0, gamma="scale", tolerance=1e-3, max_passes=6, max_sweeps=10000)
    svm.fit(X_train, y_train)
    print(f"SVM training complete: {svm.n_support_} support vectors in {svm.n_iter_} sweeps", flush=True)
    svm.fit_probability_calibration(X_val, y_val)
    val_pred = svm.predict(X_val)
    print(f"Validation accuracy: {np.mean(val_pred == y_val) * 100:.2f}%", flush=True)

    test_probs = svm.predict_proba(X_test)[:, 1]
    test_pred = (test_probs >= .5).astype(np.int64)
    evaluation = metric_report(y_test, test_pred, test_probs)
    print("Held-out test metrics:", json.dumps(evaluation, indent=2), flush=True)

    os.makedirs(os.path.join("backend", "models"), exist_ok=True)
    joblib.dump(svm, os.path.join("backend", "models", "svm_tb_classifier.joblib"))
    joblib.dump(scaler, os.path.join("backend", "models", "scaler.joblib"))
    metrics = {
        "model_architecture": "DenseNet121 (pretrained local weights) + RBF-kernel SVM (SMO)",
        "dataset_name": "Indian Council of Medical Research (ICMR) - NIRT Tuberculosis Cohort",
        "dataset_source": "INTBTR (intbtr99 Normal & intbtr253 TB Positive)",
        "feature_extractor": "DenseNet121 Global Average Pooling (1024-dim)",
        "classifier": "RBF SVM (C=1.0; gamma=scale; Platt probability calibration on validation split)",
        "evaluation": evaluation,
        "dataset_breakdown": {
            "total_samples": int(len(y)), "normal_samples": int(np.sum(y == 0)), "tb_samples": int(np.sum(y == 1)),
            "train_set": int(np.sum(train)), "val_set": int(np.sum(val)), "test_set": int(np.sum(test)),
        },
        "hyperparameters": {"C": 1.0, "kernel": "rbf", "gamma": svm.gamma_, "solver": "Platt SMO", "support_vectors": svm.n_support_},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    with open(os.path.join("backend", "models", "model_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print("Saved SVM, scaler, and evaluation metrics under backend/models/", flush=True)


if __name__ == "__main__":
    main()

