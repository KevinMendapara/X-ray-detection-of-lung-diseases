import os
import json
import numpy as np
import cv2
from PIL import Image
import joblib

os.environ['KERAS_HOME'] = r'C:\Users\Hp\.keras'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

tf = None
DenseNet121 = None
preprocess_input = None

def _ensure_tf():
    global tf, DenseNet121, preprocess_input
    if tf is None:
        try:
            import tensorflow as _tf
            from tensorflow.keras.applications.densenet import DenseNet121 as _DenseNet121, preprocess_input as _preprocess_input
            tf = _tf
            DenseNet121 = _DenseNet121
            preprocess_input = _preprocess_input
        except Exception as e:
            print(f"TensorFlow import warning: {e}")
            # Fallback normalizer
            preprocess_input = lambda x: (x / 127.5) - 1.0

class MLEngine:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        print("Initializing TB Detect AI ML Engine...")
        _ensure_tf()
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        weights_path = os.path.join(base_dir, "models", "densenet121_weights.h5")
        svm_path = os.path.join(base_dir, "models", "svm_tb_classifier.joblib")
        scaler_path = os.path.join(base_dir, "models", "scaler.joblib")
        metrics_path = os.path.join(base_dir, "models", "model_metrics.json")

        self.feature_model = None
        if tf is not None and DenseNet121 is not None:
            try:
                self.densenet_full = DenseNet121(weights=None, include_top=False, input_shape=(224, 224, 3))
                if os.path.exists(weights_path):
                    self.densenet_full.load_weights(weights_path)
                    print(f"Loaded DenseNet121 weights from {weights_path}")
                inp = self.densenet_full.input
                target_conv_layer = self.densenet_full.get_layer("relu")
                self.conv_layer_output = target_conv_layer.output
                self.pooled_features = tf.keras.layers.GlobalAveragePooling2D()(self.conv_layer_output)
                self.feature_model = tf.keras.Model(inputs=inp, outputs=[self.conv_layer_output, self.pooled_features])
            except Exception as e:
                print(f"Warning: Could not build full DenseNet graph: {e}")

        # 2. Load SVM & Scaler
        self.svm = joblib.load(svm_path) if os.path.exists(svm_path) else None
        self.scaler = joblib.load(scaler_path) if os.path.exists(scaler_path) else None
        print("Loaded trained SVM classifier & StandardScaler.")

        # 3. Load Metrics
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                self.metrics = json.load(f)
        else:
            self.metrics = {}

    def preprocess_image(self, img_path, target_size=(224, 224)):
        img = Image.open(img_path).convert('RGB')
        orig_w, orig_h = img.size
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        arr = np.array(img_resized, dtype=np.float32)
        arr_preprocessed = preprocess_input(arr)
        arr_batch = np.expand_dims(arr_preprocessed, axis=0)
        return img, img_resized, arr_batch, (orig_w, orig_h)

    def compute_gradcam_plusplus(self, arr_batch, target_class_idx=1, feature_outputs=None):
        """Compute Grad-CAM++ for the trained RBF-SVM class score.

        DenseNet121 ends with global average pooling. That structure lets us
        compute the exact first, second, and third derivatives of the RBF-SVM
        margin with respect to each pooled feature, then map them back to each
        spatial activation in the final convolutional feature map.
        """
        if self.feature_model is None or self.svm is None or self.scaler is None:
            raise RuntimeError("Grad-CAM++ requires the loaded DenseNet121, scaler, and trained SVM artifacts.")
        if target_class_idx not in (0, 1):
            raise ValueError("target_class_idx must be 0 (Normal) or 1 (TB).")

        if feature_outputs is None:
            feature_outputs = self.feature_model.predict(arr_batch, verbose=0)
        conv_batch, pooled_batch = feature_outputs
        activations = np.asarray(conv_batch[0], dtype=np.float64)
        pooled = np.asarray(pooled_batch[0], dtype=np.float64)
        height, width, channels = activations.shape
        spatial_count = float(height * width)

        support_vectors = np.asarray(self.svm.support_vectors_, dtype=np.float64)
        dual_coef = np.asarray(self.svm.dual_coef_, dtype=np.float64).reshape(-1)
        intercept = float(np.asarray(self.svm.intercept_, dtype=np.float64).reshape(-1)[0])
        gamma = getattr(self.svm, "gamma_", None)
        if gamma is None:
            gamma = getattr(self.svm, "_gamma", None)
        if gamma is None:
            raise RuntimeError("The loaded classifier does not expose an RBF kernel parameter.")
        gamma = float(gamma)

        mean = np.asarray(self.scaler.mean_, dtype=np.float64).reshape(-1)
        scale = np.asarray(self.scaler.scale_, dtype=np.float64).reshape(-1)
        scale = np.where(scale == 0.0, 1.0, scale)
        if pooled.size != support_vectors.shape[1] or pooled.size != scale.size:
            raise RuntimeError("DenseNet feature, SVM support-vector, and scaler dimensions do not match.")

        # The SVM decision function is positive for TB (class 1). Negate it to
        # explain the Normal class (class 0) while keeping positive evidence.
        target_sign = 1.0 if target_class_idx == 1 else -1.0
        standardized = (pooled - mean) / scale
        delta = standardized[None, :] - support_vectors
        kernels = np.exp(-gamma * np.sum(delta * delta, axis=1))
        weighted_kernels = target_sign * dual_coef * kernels

        # Exact derivatives of sum_i beta_i exp(-gamma ||z - SV_i||^2)
        # with respect to each standardized feature z_j.
        first_z = np.sum(weighted_kernels[:, None] * (-2.0 * gamma * delta), axis=0)
        second_z = np.sum(
            weighted_kernels[:, None] * (4.0 * gamma * gamma * delta * delta - 2.0 * gamma), axis=0
        )
        third_z = np.sum(
            weighted_kernels[:, None] * (12.0 * gamma * gamma * delta - 8.0 * gamma ** 3 * delta ** 3),
            axis=0
        )

        # Chain rule through StandardScaler and DenseNet's global average pool.
        first = (first_z / scale / spatial_count).reshape(1, 1, channels)
        second = (second_z / (scale * scale) / (spatial_count * spatial_count)).reshape(1, 1, channels)
        third = (third_z / (scale ** 3) / (spatial_count ** 3)).reshape(1, 1, channels)

        # Grad-CAM++ alpha weights use the actual second/third partials.
        weighted_activation_sum = np.sum(activations, axis=(0, 1), keepdims=True)
        denominator = 2.0 * second + weighted_activation_sum * third
        alpha = np.divide(second, denominator, out=np.zeros_like(second), where=np.abs(denominator) > 1e-12)
        channel_weights = np.sum(alpha * np.maximum(first, 0.0), axis=(0, 1)).reshape(-1)
        cam = np.maximum(np.sum(activations * channel_weights[None, None, :], axis=-1), 0.0)
        cam_max = float(np.max(cam)) if cam.size else 0.0
        if not np.isfinite(cam_max) or cam_max <= 1e-12:
            return np.zeros((height, width), dtype=np.float32)
        return (cam / cam_max).astype(np.float32)
    def analyze_lung_zones(self, heatmap):
        """
        Radiological lung zone dissection:
        - Viewer's Left (X: 0% to 50%) is Anatomical Right Lung
        - Viewer's Right (X: 50% to 100%) is Anatomical Left Lung
        - Upper Zone (Y: 0% to 33%)
        - Middle Zone (Y: 33% to 66%)
        - Lower Zone (Y: 66% to 100%)
        """
        h, w = heatmap.shape
        threshold = 0.40 # Defined activation threshold

        # Right Lung (Anatomical Right = Left side of image)
        right_lung = heatmap[:, :w//2]
        # Left Lung (Anatomical Left = Right side of image)
        left_lung = heatmap[:, w//2:]

        # Zones
        h_third = h // 3
        upper_zone = heatmap[:h_third, :]
        mid_zone = heatmap[h_third:2*h_third, :]
        lower_zone = heatmap[2*h_third:, :]

        total_pixels = h * w
        high_act_pixels = np.sum(heatmap >= threshold)
        overall_highlight_pct = round(float((high_act_pixels / total_pixels) * 100), 2)

        def get_zone_stats(zone_arr):
            mean_act = float(np.mean(zone_arr)) * 100
            max_act = float(np.max(zone_arr)) * 100
            high_pct = float(np.sum(zone_arr >= threshold) / zone_arr.size) * 100
            return {
                "mean_activation_pct": round(mean_act, 1),
                "max_activation_pct": round(max_act, 1),
                "highlighted_area_pct": round(high_pct, 1),
                "clinical_status": "Elevated Suspicion" if mean_act > 45 else ("Moderate Activity" if mean_act > 25 else "Low Activity")
            }

        return {
            "overall_highlighted_area_pct": overall_highlight_pct,
            "threshold_used": threshold,
            "anatomical_right_lung": get_zone_stats(right_lung),
            "anatomical_left_lung": get_zone_stats(left_lung),
            "upper_lung_zone": get_zone_stats(upper_zone),
            "middle_lung_zone": get_zone_stats(mid_zone),
            "lower_lung_zone": get_zone_stats(lower_zone),
            "predominant_zone": "Upper Lung Zone" if np.mean(upper_zone) >= max(np.mean(mid_zone), np.mean(lower_zone)) else ("Middle Lung Zone" if np.mean(mid_zone) >= np.mean(lower_zone) else "Lower Lung Zone")
        }

    def render_heatmaps_and_overlays(self, orig_pil_img, heatmap_2d, output_dir, file_prefix):
        """
        Renders:
        1. Processed grayscale normalized X-ray
        2. High-resolution Grad-CAM++ colored heatmap (Blue -> Green -> Yellow -> Red)
        3. Heatmap overlay on original CXR
        """
        os.makedirs(output_dir, exist_ok=True)

        w, h = orig_pil_img.size
        # Resize heatmap to match original image size
        heatmap_resized = cv2.resize(heatmap_2d, (w, h), interpolation=cv2.INTER_CUBIC)
        heatmap_uint8 = np.uint8(255 * heatmap_resized)

        # Apply JET colormap (Blue=lowest, Green=moderate, Yellow=high, Red=highest)
        colored_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Convert original PIL to BGR OpenCV
        orig_bgr = cv2.cvtColor(np.array(orig_pil_img), cv2.COLOR_RGB2BGR)

        # Blend overlay: 60% original CXR, 40% heatmap
        overlay = cv2.addWeighted(orig_bgr, 0.60, colored_heatmap, 0.40, 0)

        # Save files
        proc_path = os.path.join(output_dir, f"{file_prefix}_processed.png")
        heatmap_path = os.path.join(output_dir, f"{file_prefix}_heatmap.png")
        overlay_path = os.path.join(output_dir, f"{file_prefix}_overlay.png")

        cv2.imwrite(proc_path, orig_bgr)
        cv2.imwrite(heatmap_path, colored_heatmap)
        cv2.imwrite(overlay_path, overlay)

        return proc_path, heatmap_path, overlay_path

    def analyze(self, img_path, output_dir, file_prefix):
        """Run DenseNet features, SVM inference, and classifier-conditioned Grad-CAM++."""
        orig_img, resized_img, arr_batch, dims = self.preprocess_image(img_path)
        if self.feature_model is None or self.svm is None or self.scaler is None:
            raise RuntimeError("The trained DenseNet121/SVM model is unavailable; Grad-CAM++ cannot be generated.")

        feature_outputs = self.feature_model.predict(arr_batch, verbose=0)
        feats = feature_outputs[1]
        feats_scaled = self.scaler.transform(feats)
        probs = self.svm.predict_proba(feats_scaled)[0]
        tb_prob = float(probs[1])
        normal_prob = float(probs[0])
        decision_score = float(self.svm.decision_function(feats_scaled)[0])

        if tb_prob >= 0.55:
            pred_label = "TB Suspected"
            confidence = round(tb_prob * 100, 2)
        elif tb_prob <= 0.45:
            pred_label = "TB Not Detected by Model"
            confidence = round(normal_prob * 100, 2)
        else:
            pred_label = "Inconclusive"
            confidence = round(max(tb_prob, normal_prob) * 100, 2)

        target_class_idx = 1 if tb_prob >= normal_prob else 0
        heatmap = self.compute_gradcam_plusplus(
            arr_batch,
            target_class_idx=target_class_idx,
            feature_outputs=feature_outputs,
        )
        zone_analysis = self.analyze_lung_zones(heatmap)
        zone_analysis["explanation_target"] = "TB" if target_class_idx == 1 else "Normal"
        zone_analysis["explanation_method"] = "RBF-SVM decision score"
        zone_analysis["feature_layer"] = "DenseNet121 final convolutional feature maps"
        proc_p, heat_p, over_p = self.render_heatmaps_and_overlays(orig_img, heatmap, output_dir, file_prefix)

        return {
            "prediction": pred_label,
            "confidence_score": confidence,
            "tb_probability_pct": round(tb_prob * 100, 2),
            "normal_probability_pct": round(normal_prob * 100, 2),
            "svm_decision_score": round(decision_score, 4),
            "zone_analysis": zone_analysis,
            "processed_image_path": proc_p,
            "heatmap_image_path": heat_p,
            "overlay_image_path": over_p,
            "model_architecture": "Hybrid DenseNet121 (ImageNet Deep Features) + RBF Support Vector Machine",
            "model_version": "TB-Detect-v2.1 (SVM-conditioned Grad-CAM++)",
            "explanation_target": "TB" if target_class_idx == 1 else "Normal",
        }

def get_ml_engine():
    return MLEngine.get_instance()





