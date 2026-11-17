import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Layers, Cpu, Eye, FileText, CheckCircle2,
  AlertCircle, ShieldCheck, Database, Award, ArrowRight, BarChart3
} from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AboutPage() {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { adminAPI.getMetrics().then(setMetrics).catch(() => setMetrics(null)); }, []);
  const evaluation = metrics?.evaluation || {};
  const percent = (value) => Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : '—';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#1769AA]">
          <Activity className="w-3.5 h-3.5" />
          Academic & Clinical Research Documentation
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#183153] tracking-tight">
          About PulmoVision
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          An explainable medical AI research project combining DenseNet121 deep convolutional feature extraction, Support Vector Machine (SVM) decision hyperplanes, and Grad-CAM++ transparent attention mapping for pulmonary tuberculosis screening.
        </p>
      </div>

      {/* Model Transparency & Evaluation Context */}
      <section className="health-card p-6 sm:p-7 space-y-5" aria-labelledby="evaluation-context-heading">
        <div className="flex items-start gap-3"><span className="w-10 h-10 rounded-xl bg-teal-50 text-[#17A2A4] flex items-center justify-center shrink-0"><BarChart3 className="w-5 h-5" /></span><div><div className="text-[10px] uppercase tracking-wider font-bold text-[#17A2A4]">MODEL TRANSPARENCY</div><h2 id="evaluation-context-heading" className="text-lg font-extrabold text-[#183153] mt-1">Held-out evaluation snapshot</h2><p className="text-xs text-slate-500 mt-1">Metrics loaded from this project’s saved evaluation record.</p></div></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{[['Test images', evaluation.test_samples ?? '—'], ['Accuracy', percent(evaluation.accuracy)], ['Sensitivity', percent(evaluation.sensitivity ?? evaluation.recall)], ['Specificity', percent(evaluation.specificity)], ['Precision', percent(evaluation.precision)], ['ROC–AUC', Number.isFinite(Number(evaluation.roc_auc)) ? Number(evaluation.roc_auc).toFixed(3) : '—']].map(([label,value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[9px] text-slate-500">{label}</div><strong className="mt-1 block text-lg text-[#203f55]">{value}</strong></div>)}</div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[10px] leading-relaxed text-amber-900"><strong>Evaluation context:</strong> {metrics?.dataset_name || 'ICMR–NIRT INTBTR cohort'} · {evaluation.test_samples ?? '—'} held-out test images ({evaluation.confusion_matrix?.true_negative ?? '—'} true negatives, {evaluation.confusion_matrix?.false_positive ?? '—'} false positives, {evaluation.confusion_matrix?.false_negative ?? '—'} false negatives, {evaluation.confusion_matrix?.true_positive ?? '—'} true positives). These are results from the saved project evaluation and do not establish performance on other hospitals, scanners, or populations; independent external validation is needed. This research prototype is not a diagnostic device.</div>
      </section>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="health-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            Clinical Problem Statement
          </div>
          <h2 className="text-lg font-bold text-slate-800">The Global & National Tuberculosis Burden</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pulmonary Tuberculosis (TB), caused by <em>Mycobacterium tuberculosis</em>, remains one of the world's leading infectious killers, causing over 1.3 million deaths annually. In high-burden countries like India, diagnostic delays lead to ongoing community transmission, disease progression, and development of Multi-Drug Resistant TB (MDR-TB).
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chest radiography (CXR) is the primary first-line imaging triage tool recommended by the WHO and ICMR. However, severe shortages of specialized thoracic radiologists in rural and primary healthcare centers create critical diagnostic bottlenecks and variable interpretation.
          </p>
        </div>

        <div className="health-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#1769AA] font-bold text-sm">
            <Award className="w-5 h-5" />
            Project Objectives
          </div>
          <h2 className="text-lg font-bold text-slate-800">Research & Educational Goals</h2>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#17A2A4] flex-shrink-0 mt-0.5" />
              <span><strong>Decision Support:</strong> Provide automated second-opinion screening triage for chest radiographs to accelerate patient referrals.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#17A2A4] flex-shrink-0 mt-0.5" />
              <span><strong>Explainable AI (XAI):</strong> Move beyond black-box models by using Grad-CAM++ to render clear anatomical activation heatmaps.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#17A2A4] flex-shrink-0 mt-0.5" />
              <span><strong>Hybrid Architecture:</strong> Exploit the strengths of deep convolutional representations (DenseNet121) coupled with maximum-margin SVM classifiers.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#17A2A4] flex-shrink-0 mt-0.5" />
              <span><strong>Authentic Validation:</strong> Validate on verified Indian Council of Medical Research (ICMR) clinical cohorts rather than synthetic data.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Triad Model Architecture */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#183153]">The Hybrid Triad Architecture</h2>
          <p className="text-xs text-slate-600 mt-1">Why DenseNet121 + SVM + Grad-CAM++ was selected for this clinical task.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* DenseNet121 */}
          <div className="health-card p-6 space-y-3 border-t-4 border-t-[#1769AA]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769AA] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">1. DenseNet121 (Feature Extractor)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dense Convolutional Networks connect each layer to every other layer in a feed-forward fashion. This mitigates the vanishing gradient problem, encourages feature reuse across scales (subtle opacities, consolidations, apical haziness), and yields a rich 1,024-dimensional feature vector.
            </p>
            <div className="text-[11px] font-semibold text-[#1769AA] pt-2">
              Parameters: 7.03M • Resolution: 224x224x3
            </div>
          </div>

          {/* SVM */}
          <div className="health-card p-6 space-y-3 border-t-4 border-t-[#17A2A4]">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#17A2A4] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">2. Support Vector Machine (Classifier)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              SVM constructs optimal hyperplanes that maximize the geometric margin between positive TB and normal control features in high-dimensional Hilbert space. Using an RBF kernel, SVM resists overfitting on medical cohorts and provides well-calibrated confidence estimates.
            </p>
            <div className="text-[11px] font-semibold text-[#17A2A4] pt-2">
              Kernel: RBF • Hyperparameters tuned via 5-Fold CV
            </div>
          </div>

          {/* Grad-CAM++ */}
          <div className="health-card p-6 space-y-3 border-t-4 border-t-indigo-600">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">3. Grad-CAM++ (Explainable AI)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard Grad-CAM fails when multiple occurrences of visual patterns appear in an image. Grad-CAM++ uses a weighted average of the second and third-order partial derivatives to provide superior localization of subtle infiltrates and cavitation zones.
            </p>
            <div className="text-[11px] font-semibold text-indigo-600 pt-2">
              Anatomical mapping: 5-zone lung dissection
            </div>
          </div>

        </div>
      </div>

      {/* Dataset Provenance */}
      <div className="health-card p-8 bg-slate-900 text-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17A2A4] uppercase tracking-wider">
              <Database className="w-4 h-4" />
              Dataset Authenticity & Validation
            </div>
            <h3 className="text-xl font-bold text-white">ICMR-NIRT National Tuberculosis CXR Registry</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The model is trained and evaluated on authentic clinical chest radiographs from the Indian Council of Medical Research (ICMR) and National Institute for Research in Tuberculosis (NIRT), specifically the INTBTR cohort (intbtr99 normal controls & intbtr253 confirmed pulmonary tuberculosis cases).
            </p>
            <p className="text-xs text-slate-400">
              Strict patient-level data partitioning (70% train, 15% validation, 15% independent test) was maintained to prevent data leakage and guarantee genuine real-world generalization.
            </p>
          </div>
          <div className="lg:col-span-4 bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Total Cohort:</span>
              <span className="font-bold text-white">684 DICOM CXRs</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">Normal Controls:</span>
              <span className="font-bold text-emerald-400">307 Cases</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-400">TB Positive:</span>
              <span className="font-bold text-rose-400">377 Cases</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Independent Test AUC:</span>
              <span className="font-bold text-[#17A2A4]">{Number.isFinite(Number(evaluation.roc_auc)) ? Number(evaluation.roc_auc).toFixed(4) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Technology Stack */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-[#183153]">Complete Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="health-card p-4 space-y-2">
            <div className="font-bold text-slate-800 text-sm">Frontend</div>
            <ul className="space-y-1 text-slate-600">
              <li>• React.js 18 (Vite)</li>
              <li>• React Router DOM v6</li>
              <li>• Lucide React Icons</li>
              <li>• Chart.js & Framer Motion</li>
              <li>• Custom Healthcare UI</li>
            </ul>
          </div>
          <div className="health-card p-4 space-y-2">
            <div className="font-bold text-slate-800 text-sm">Backend</div>
            <ul className="space-y-1 text-slate-600">
              <li>• Python 3.11</li>
              <li>• FastAPI REST Engine</li>
              <li>• SQLite3 / DBManager</li>
              <li>• ReportLab PDF Engine</li>
              <li>• JWT & BCrypt Security</li>
            </ul>
          </div>
          <div className="health-card p-4 space-y-2">
            <div className="font-bold text-slate-800 text-sm">AI / Machine Learning</div>
            <ul className="space-y-1 text-slate-600">
              <li>• TensorFlow / Keras 3</li>
              <li>• DenseNet121 Architecture</li>
              <li>• Scikit-learn SVM (RBF)</li>
              <li>• Grad-CAM++ analytical map</li>
              <li>• OpenCV & Pillow</li>
            </ul>
          </div>
          <div className="health-card p-4 space-y-2">
            <div className="font-bold text-slate-800 text-sm">Imaging & Data</div>
            <ul className="space-y-1 text-slate-600">
              <li>• PyDICOM Medical Parser</li>
              <li>• 16-bit Windowing / Stretch</li>
              <li>• 5-Zone Lung Dissection</li>
              <li>• ICMR National CXR Dataset</li>
              <li>• Automated Audit Trail</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="pt-4 flex justify-center">
        <Link to="/upload" className="btn-primary text-sm px-6 py-3">
          Try the System with Sample CXRs
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
