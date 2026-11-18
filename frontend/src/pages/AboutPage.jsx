import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Layers, Cpu, Eye, FileText, CheckCircle2,
  AlertCircle, ShieldCheck, Database, Award, ArrowRight
} from 'lucide-react';

export default function AboutPage() {

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
              SVM constructs a decision boundary between TB-positive and normal-control feature vectors. This project uses an RBF kernel with probability calibration; calibrated outputs do not establish clinical accuracy or generalization.
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
              Dataset Sources & Partitions
            </div>
            <h3 className="text-xl font-bold text-white">ICMR-NIRT National Tuberculosis CXR Registry</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The model is trained and evaluated on authentic clinical chest radiographs from the Indian Council of Medical Research (ICMR) and National Institute for Research in Tuberculosis (NIRT), specifically the INTBTR cohort (intbtr99 normal controls & intbtr253 confirmed pulmonary tuberculosis cases).
            </p>
            <p className="text-xs text-slate-400">
              The dataset was divided at patient level into training, validation, and internal holdout partitions to reduce overlap between splits.
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
