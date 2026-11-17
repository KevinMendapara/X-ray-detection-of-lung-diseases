"""Small NumPy-only scaler and RBF SVM for inference without sklearn binaries."""
import numpy as np


class StandardScaler:
    def fit(self, X):
        X = np.asarray(X, dtype=np.float64)
        self.mean_ = X.mean(axis=0)
        scale = X.std(axis=0)
        scale[scale == 0] = 1.0
        self.scale_ = scale
        return self

    def transform(self, X):
        return ((np.asarray(X, dtype=np.float64) - self.mean_) / self.scale_).astype(np.float32)


class RbfSVM:
    """Binary soft-margin RBF SVM trained with Platt's SMO algorithm."""
    def __init__(self, C=1.0, gamma=None, tolerance=1e-3, max_passes=6, max_sweeps=10000):
        self.C = float(C)
        self.gamma = gamma
        self.tolerance = float(tolerance)
        self.max_passes = int(max_passes)
        self.max_sweeps = int(max_sweeps)

    @staticmethod
    def _kernel(A, B, gamma):
        A = np.asarray(A, dtype=np.float64)
        B = np.asarray(B, dtype=np.float64)
        dist2 = np.maximum((A * A).sum(axis=1)[:, None] + (B * B).sum(axis=1)[None, :] - 2.0 * A @ B.T, 0.0)
        return np.exp(-gamma * dist2)

    def fit(self, X, y, validation_X=None, validation_y=None):
        X = np.asarray(X, dtype=np.float64)
        y = np.asarray(y, dtype=np.int8)
        if set(np.unique(y).tolist()) != {0, 1}:
            raise ValueError("RbfSVM requires both classes encoded as 0 and 1")
        self.n_features_in_ = X.shape[1]
        gamma = self.gamma
        if gamma is None or gamma == "scale":
            variance = float(X.var())
            gamma = 1.0 / (X.shape[1] * variance) if variance > 0 else 1.0 / X.shape[1]
        self.gamma_ = float(gamma)
        K = self._kernel(X, X, self.gamma_)
        signs = np.where(y == 1, 1.0, -1.0)
        alpha = np.zeros(len(y), dtype=np.float64)
        bias = 0.0
        errors = -signs.copy()
        passes = 0
        for sweep in range(self.max_sweeps):
            changed = 0
            for i in range(len(y)):
                Ei = errors[i]
                yi = signs[i]
                if not ((yi * Ei < -self.tolerance and alpha[i] < self.C - 1e-10) or
                        (yi * Ei > self.tolerance and alpha[i] > 1e-10)):
                    continue
                deltas = np.abs(Ei - errors)
                deltas[i] = -1.0
                j = int(np.argmax(deltas))
                if deltas[j] < 0:
                    continue
                Ej = errors[j]
                yj = signs[j]
                ai, aj = alpha[i], alpha[j]
                if yi != yj:
                    low = max(0.0, aj - ai)
                    high = min(self.C, self.C + aj - ai)
                else:
                    low = max(0.0, ai + aj - self.C)
                    high = min(self.C, ai + aj)
                if high - low < 1e-12:
                    continue
                eta = 2.0 * K[i, j] - K[i, i] - K[j, j]
                if eta >= -1e-12:
                    continue
                new_aj = float(np.clip(aj - yj * (Ei - Ej) / eta, low, high))
                if abs(new_aj - aj) < 1e-7:
                    continue
                new_ai = ai + yi * yj * (aj - new_aj)
                old_bias = bias
                b1 = bias - Ei - yi * (new_ai - ai) * K[i, i] - yj * (new_aj - aj) * K[i, j]
                b2 = bias - Ej - yi * (new_ai - ai) * K[i, j] - yj * (new_aj - aj) * K[j, j]
                if 1e-10 < new_ai < self.C - 1e-10:
                    bias = b1
                elif 1e-10 < new_aj < self.C - 1e-10:
                    bias = b2
                else:
                    bias = 0.5 * (b1 + b2)
                alpha[i], alpha[j] = new_ai, new_aj
                errors += yi * (new_ai - ai) * K[:, i] + yj * (new_aj - aj) * K[:, j] + (bias - old_bias)
                changed += 1
            passes = passes + 1 if changed == 0 else 0
            if (sweep + 1) % 10 == 0:
                print(f"  SMO sweep {sweep + 1}: {changed} pair updates", flush=True)
            if passes >= self.max_passes:
                break

        support = alpha > 1e-7
        if not np.any(support):
            raise RuntimeError("SVM optimization found no support vectors")
        self.support_vectors_ = X[support].astype(np.float32)
        self.dual_coef_ = (alpha[support] * signs[support]).astype(np.float64)
        self.intercept_ = float(bias)
        self.n_iter_ = sweep + 1
        self.n_support_ = int(support.sum())
        self.prob_a_ = -1.0
        self.prob_b_ = 0.0
        if validation_X is not None and validation_y is not None:
            self.fit_probability_calibration(validation_X, validation_y)
        return self

    def decision_function(self, X):
        K = self._kernel(np.asarray(X), self.support_vectors_, self.gamma_)
        return K @ self.dual_coef_ + self.intercept_

    def predict(self, X):
        return (self.decision_function(X) >= 0).astype(np.int64)

    def fit_probability_calibration(self, X, y, max_iter=100):
        margins = self.decision_function(X).astype(np.float64)
        y = np.asarray(y, dtype=np.float64)
        A, B = -1.0, 0.0
        for _ in range(max_iter):
            z = np.clip(A * margins + B, -40, 40)
            p = 1.0 / (1.0 + np.exp(-z))
            q = p * (1.0 - p)
            g = np.array([np.sum((p - y) * margins), np.sum(p - y)])
            H = np.array([
                [np.sum(q * margins * margins) + 1e-8, np.sum(q * margins)],
                [np.sum(q * margins), np.sum(q) + 1e-8]
            ])
            try:
                step = np.linalg.solve(H, g)
            except np.linalg.LinAlgError:
                break
            A -= float(step[0])
            B -= float(step[1])
            if float(np.max(np.abs(step))) < 1e-6:
                break
        self.prob_a_, self.prob_b_ = float(A), float(B)

    def predict_proba(self, X):
        z = np.clip(self.prob_a_ * self.decision_function(X) + self.prob_b_, -40, 40)
        positive = 1.0 / (1.0 + np.exp(-z))
        return np.column_stack((1.0 - positive, positive))
