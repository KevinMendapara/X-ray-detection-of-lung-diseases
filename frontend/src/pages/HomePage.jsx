import React from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud, Activity, ShieldCheck, Cpu, Eye,
  FileCheck2, Database, ArrowRight, CheckCircle2, ChevronRight,
  TrendingUp, Microscope, Stethoscope, AlertTriangle
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF4FC] via-white to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-xs font-bold text-[#1769AA]">
                <Activity className="w-3.5 h-3.5 text-[#17A2A4]" />
                Hybrid DenseNet121 + SVM + Grad-CAM++ Architecture
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#183153] leading-tight tracking-tight">
                AI-Powered <span className="text-[#1769AA]">Tuberculosis Detection</span> Through Chest X-Ray Analysis
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                An explainable medical AI decision-support prototype. Extracting 1,024 deep spatial radiograph representations via DenseNet121, classifying optimal hyperplanes with Support Vector Machines, and projecting visual transparent feature attention using Grad-CAM++.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/upload" className="btn-primary text-sm px-6 py-3 shadow-md shadow-blue-500/20">
                  <UploadCloud className="w-4 h-4" />
                  Upload X-Ray Image
                </Link>
                <Link to="/about" className="btn-secondary text-sm px-6 py-3">
                  Learn More Architecture
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#17A2A4]" />
                  <span>Trained on Official ICMR Cohort</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#1769AA]" />
                  <span>Explainable Visual Heatmaps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Downloadable PDF Reports</span>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#1769AA] to-[#17A2A4] opacity-30 blur-lg"></div>
                <div className="relative health-card p-6 bg-white overflow-hidden shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <Microscope className="w-4 h-4 text-[#1769AA]" />
                      <span className="text-xs font-bold text-slate-800">CXR AI Inference Pipeline</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">System Ready</span>
                  </div>

                  {/* Flow Diagram Mini Preview */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="w-7 h-7 rounded-md bg-blue-100 text-[#1769AA] flex items-center justify-center font-bold">1</div>
                      <div>
                        <div className="font-bold text-slate-800">Chest X-Ray Preprocessing</div>
                        <div className="text-[11px] text-slate-500">224x224 Windowing & Normalization</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="w-7 h-7 rounded-md bg-teal-100 text-[#17A2A4] flex items-center justify-center font-bold">2</div>
                      <div>
                        <div className="font-bold text-slate-800">DenseNet121 Deep Extractor</div>
                        <div className="text-[11px] text-slate-500">1024-Dimensional Dense Feature Vector</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">3</div>
                      <div>
                        <div className="font-bold text-slate-800">SVM Hyperplane Classifier</div>
                        <div className="text-[11px] text-slate-500">RBF Kernel Decision Margin Mapping</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold">4</div>
                      <div>
                        <div className="font-bold text-slate-800">Grad-CAM++ Transparent Heatmap</div>
                        <div className="text-[11px] text-slate-500">5-Zone Anatomical Attention Heatmap</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Target: Pulmonary TB</span>
                    <span className="font-bold text-[#1769AA]">DenseNet121 + SVM</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Key System Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#183153]">Key Clinical & Technological Highlights</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Engineered with transparent medical machine learning principles to empower radiologists and clinical screening teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="health-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769AA] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Hybrid Feature Pipeline</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Combines deep convolutional feature extractors (DenseNet121) with high-margin Support Vector Machines to classify radiographs with robust generalization and minimal overfitting.
            </p>
          </div>

          <div className="health-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#17A2A4] flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Grad-CAM++ Explainability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Higher-order gradients highlight exactly which lung zones contributed most to the model’s prediction with an interactive 4-color gradient (Blue to Red).
            </p>
          </div>

          <div className="health-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Automated PDF Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates a complete hospital-grade medical report covering patient demographics, quality checks, zone activations, cautious observations, and recovery facts.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Flow */}
      <section className="bg-white py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#183153]">How PulmoVision Works</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">Four streamlined steps from chest radiograph upload to clinical decision report.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-[#1769AA] uppercase tracking-wider">Step 01</div>
              <h4 className="font-bold text-sm text-slate-800">Upload Radiograph</h4>
              <p className="text-xs text-slate-500">Upload PNG, JPG, or DICOM chest X-ray. Real-time resolution check ensures diagnostic readability.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-[#17A2A4] uppercase tracking-wider">Step 02</div>
              <h4 className="font-bold text-sm text-slate-800">Dense Feature Extraction</h4>
              <p className="text-xs text-slate-500">Image is normalized and passed through DenseNet121, outputting 1,024 deep structural CXR feature weights.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 03</div>
              <h4 className="font-bold text-sm text-slate-800">SVM Classification</h4>
              <p className="text-xs text-slate-500">Scaled features are evaluated against the trained SVM margin boundary to produce calibrated decision probability.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Step 04</div>
              <h4 className="font-bold text-sm text-slate-800">Grad-CAM++ & Report</h4>
              <p className="text-xs text-slate-500">Generates activation heatmaps across 5 lung zones and compiles a downloadable medical-style PDF report.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grad-CAM++ Explanation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="health-card p-8 bg-gradient-to-r from-blue-50/70 via-white to-teal-50/50 border border-blue-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1769AA] uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                Explainable AI Architecture
              </div>
              <h3 className="text-2xl font-extrabold text-[#183153]">Why Explainability Matters in Tuberculosis Screening</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Black-box AI models cannot be safely trusted in clinical workflows. Grad-CAM++ calculates second and third-order partial derivatives of the target classification score with respect to convolutional feature maps, pinpointing exact anatomical regions (Apical, Mid-zone, Basilar) that influenced the SVM decision.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <Link to="/upload" className="btn-teal text-xs">
                  Experience Grad-CAM++ Live
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="text-xs font-bold text-slate-700">Heatmap Activation Gradient</div>
              <div className="gradcam-colorbar"></div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span className="text-blue-700">Blue: Minimal</span>
                <span className="text-emerald-700">Green: Moderate</span>
                <span className="text-amber-700">Yellow: High</span>
                <span className="text-red-700">Red: Peak</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Highlights model feature attention without fabricating radiological lesions.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
        <div className="bg-[#183153] text-white rounded-2xl p-10 shadow-xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Analyze a Chest Radiograph?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Test with our bundled ICMR normal and tuberculosis samples or upload your own clinical image in PNG, JPG, or DICOM format.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link to="/upload" className="btn-primary bg-[#17A2A4] hover:bg-[#128183] text-sm px-6 py-3">
              <UploadCloud className="w-4 h-4" />
              Start CXR Analysis
            </Link>
            <Link to="/register-patient" className="btn-outline text-white border-slate-600 hover:bg-slate-800 text-sm px-6 py-3">
              Register New Patient
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
