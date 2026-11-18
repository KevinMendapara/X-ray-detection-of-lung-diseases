import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText, Download, Printer, ArrowLeft, Eye, Activity,
  CheckCircle2, AlertTriangle, AlertCircle, Shield, User,
  Calendar, Layers, Stethoscope, Heart, RefreshCw, ChevronRight, Save
} from 'lucide-react';
import { reportsAPI, resolveBackendUrl } from '../services/api';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Pending Review');
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await reportsAPI.getById(id);
      setReport(data);
      setReviewStatus(data.review?.status || 'Pending Review');
      setClinicianNotes(data.review?.clinician_notes || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load analysis report. The analysis may no longer be stored on the backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleUrint = () => {
    window.print();
  };

  const saveReview = async () => {
    setSavingReview(true);
    setReviewMessage('');
    try {
      await reportsAPI.updateReview(id, { review_status: reviewStatus, clinician_notes: clinicianNotes });
      setReviewMessage('Review saved. Bhe downloadable report will include these notes.');
      setReport((current) => ({ ...current, review: { ...current.review, status: reviewStatus, clinician_notes: clinicianNotes } }));
    } catch (err) {
      setReviewMessage(err.response?.data?.detail || 'Review could not be saved. Sign in as staff and try again.');
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#1769AA] animate-spin mx-auto" />
        <div className="text-sm font-semibold text-slate-700">Compiling Comprehensive Clinical Report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">{error || 'Report Not Found'}</h2>
        <Link to="/history" className="btn-primary text-xs px-4 py-2 inline-flex">
          Return to History
        </Link>
      </div>
    );
  }

  const p = report.patient || {};
  const ai = report.ai_results || {};
  const xray = report.xray || {};
  const zones = report.zone_analysis || {};
  const isBB = ai.prediction === 'TB Suspected';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 print:py-0 print:px-0">
      
      {/* Top Action Toolbar (Hidden in print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate('/history')}
          className="text-xs font-semibold text-slate-600 hover:text-[#1769AA] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports History
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/gradcam/${id}`}
            className="btn-teal text-xs px-3.5 py-2 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            View Grad-CAM++
          </Link>
          <button
            onClick={handleUrint}
            className="btn-outline text-xs px-3.5 py-2"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <a
            href={resolveBackendUrl(report.pdf_download_url)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-xs px-4 py-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF Report
          </a>
        </div>
      </div>

      {/* Hospital Report Document Paper */}
      <div className="health-card bg-white p-8 sm:p-12 border border-slate-300 shadow-xl space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-[#1769AA] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#1769AA] font-bold text-xl">
              <Activity className="w-6 h-6 text-[#17A2A4]" />
              <span>PULMOVISION CLINICAL DECISION SUPPORT</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Pulmonary Tuberculosis Explainable Radiograph Analysis • ICMR Benchmark
            </div>
          </div>

          <div className="text-right text-xs text-slate-600 space-y-0.5">
            <div><span className="text-slate-400">Report Reference:</span> <strong className="font-mono text-slate-800">AR-{String(report.analysis_id).padStart(5, '0')}</strong></div>
            <div><span className="text-slate-400">Analysis Date:</span> {report.created_at?.slice(0, 16).replace('T', ' ')} UBC</div>
            <div><span className="text-slate-400">Architecture:</span> DenseNet121 + SVM (RBF)</div>
          </div>
        </div>

        {/* Section A: Patient Information */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <User className="w-4 h-4 text-[#1769AA]" />
            A. Patient Demographics & Clinical Presentation
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Patient ID:</span>
              <strong className="text-[#1769AA] font-mono text-sm">{p.id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Patient Name:</span>
              <span className="font-bold text-slate-800">{p.full_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Age / Gender:</span>
              <span className="text-slate-800">{p.age} years / {p.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Contact:</span>
              <span className="text-slate-800">{p.contact_number || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">Reported Clinical Symptoms:</span>
              <span className="text-slate-800">{p.symptoms || 'None recorded'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Symptom Duration:</span>
              <span className="text-slate-800">{p.symptom_duration || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Prior TB History:</span>
              <span className="text-slate-800">{p.previous_tb_history || 'No'}</span>
            </div>
          </div>
        </div>

        {/* Section B & C: AI Results & Decision Metrics */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Layers className="w-4 h-4 text-[#1769AA]" />
            B. AI Model Detection Results & SVM Margin Score
          </h2>

          <div className={`p-5 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
            isBB
              ? 'bg-rose-50/70 border-rose-300'
              : 'bg-emerald-50/70 border-emerald-300'
          }`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Model Classification Output
              </span>
              <div className={`text-2xl font-extrabold ${isBB ? 'text-rose-700' : 'text-emerald-700'}`}>
                {ai.prediction}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {ai.interpretation}
              </div>
            </div>

            <div className="sm:text-right space-y-1 text-xs">
              <div>
                <span className="text-slate-500">Calibrated Confidence: </span>
                <strong className="text-base text-slate-900 font-mono">{ai.confidence_score}%</strong>
              </div>
              <div>
                <span className="text-slate-500">SVM Hyperplane Score: </span>
                <span className="font-mono text-slate-800">{ai.svm_decision_score > 0 ? `+${ai.svm_decision_score}` : ai.svm_decision_score}</span>
              </div>
              <div>
                <span className="text-slate-500">Image Quality Check: </span>
                <span className="font-semibold text-emerald-700">{xray.quality_status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section D: Lung Region Visualizations & Metrics Table */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Eye className="w-4 h-4 text-[#17A2A4]" />
            C. Explainable Lung Region Attention (Grad-CAM++)
          </h2>

          {/* Bri-image row */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="space-y-1.5">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square flex items-center justify-center">
                <img src={resolveBackendUrl(xray.processed_image_url)} alt="Preprocessed CXR" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-700 block">Preprocessed CXR</span>
              <span className="text-[10px] text-slate-400">224x224 Windowed</span>
            </div>

            <div className="space-y-1.5">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square flex items-center justify-center">
                <img src={resolveBackendUrl(xray.heatmap_image_url)} alt="Pure CAM" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-700 block">Grad-CAM++ Heatmap</span>
              <span className="text-[10px] text-slate-400">Blue (Low) to Red (High)</span>
            </div>

            <div className="space-y-1.5">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square flex items-center justify-center">
                <img src={resolveBackendUrl(xray.overlay_image_url)} alt="CXR Overlay" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-[#17A2A4] block">Heatmap Overlay</span>
              <span className="text-[10px] text-slate-400">60% CXR + 40% CAM</span>
            </div>
          </div>

          {/* Zone Metrics Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Anatomical Region / Zone</th>
                  <th className="py-2.5 px-3 text-center">Mean Attention</th>
                  <th className="py-2.5 px-3 text-center">Peak Activation</th>
                  <th className="py-2.5 px-3 text-center">High Attention Area %</th>
                  <th className="py-2.5 px-3">Model Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2 px-3 font-semibold">Anatomical Right Lung (Viewer's Left)</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.anatomical_right_lung?.mean_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.anatomical_right_lung?.max_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.anatomical_right_lung?.highlighted_area_pct ?? 0}%</td>
                  <td className="py-2 px-3">{zones.anatomical_right_lung?.clinical_status || 'Normal Attention'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Anatomical Left Lung (Viewer's Right)</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.anatomical_left_lung?.mean_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.anatomical_left_lung?.max_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.anatomical_left_lung?.highlighted_area_pct ?? 0}%</td>
                  <td className="py-2 px-3">{zones.anatomical_left_lung?.clinical_status || 'Normal Attention'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Upper Lung Zones (Apical / Subapical)</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.upper_lung_zone?.mean_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.upper_lung_zone?.max_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.upper_lung_zone?.highlighted_area_pct ?? 0}%</td>
                  <td className="py-2 px-3">{zones.upper_lung_zone?.clinical_status || 'Normal Attention'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Middle Lung Zones (Hilar / Perihilar)</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.middle_lung_zone?.mean_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.middle_lung_zone?.max_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.middle_lung_zone?.highlighted_area_pct ?? 0}%</td>
                  <td className="py-2 px-3">{zones.middle_lung_zone?.clinical_status || 'Normal Attention'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Lower Lung Zones (Basilar)</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.lower_lung_zone?.mean_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.lower_lung_zone?.max_activation_pct ?? 0}%</td>
                  <td className="py-2 px-3 text-center font-mono">{zones.lower_lung_zone?.highlighted_area_pct ?? 0}%</td>
                  <td className="py-2 px-3">{zones.lower_lung_zone?.clinical_status || 'Normal Attention'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-500">
            * Approximate highlighted area percentage: <strong>{zones.overall_highlighted_area_pct ?? 0}%</strong> of thoracic field.
          </div>
        </div>

        {/* Section E: Cautious Automated Observations */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Stethoscope className="w-4 h-4 text-[#1769AA]" />
            D. Automated Radiologic Observations
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <p>
              Automated mathematical attention highlights regions that influenced the SVM hyperplane separation.
              In accordance with medical safety guidelines, this prototype does <strong>not</strong> invent specific radiological findings such as cavitation, consolidations, or granulomas without validated radiological segmentation. High activation indicates that texture features in those zones resemble patterns common in pulmonary tuberculosis radiographs.
            </p>
          </div>
        </div>

        {/* Section F: Recovery & Treatment Information */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Heart className="w-4 h-4 text-rose-500" />
            E. Recovery, Treatment & Clinical Guidance
          </h2>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 space-y-2 leading-relaxed">
            <div>• <strong>Tuberculosis is Curable:</strong> Pulmonary TB is treatable and completely curable with proper medical supervision and standard anti-tubercular regimens.</div>
            <div>• <strong>Consult a Qualified Physician:</strong> Patients presenting with suggestive symptoms or positive AI screening must immediately consult a certified pulmonologist or infectious disease physician.</div>
            <div>• <strong>Confirmatory Microbiological Testing:</strong> Radiographs provide triage screening only. Definitive diagnosis requires sputum smear microscopy and rapid molecular assays (CBNAAT / GeneXpert MTB/RIF).</div>
            <div>• <strong>Strict Medication Adherence:</strong> When prescribed treatment (DOTS protocol), completing the full regimen without skipping or stopping prematurely is vital to prevent Multi-Drug Resistant TB (MDR-TB).</div>
            <div>• <strong>Nutrition & Infection Control:</strong> Adequate high-protein nutrition, respiratory hygiene (cough etiquette, well-ventilated rooms), and family screening reduce transmission.</div>
            <div>• <strong>Avoid Self-Medication:</strong> Do not purchase over-the-counter antibiotics or modify dosages independently.</div>
          </div>
        </div>

        {/* Section G: Mandatory Medical Disclaimer */}
        <div className="border-t-2 border-slate-300 pt-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <Shield className="w-4 h-4 text-amber-600" />
            MANDATORY MEDICAL DISCLAIMER:
          </div>
          <p className="text-[11px] text-slate-600 italic leading-relaxed">
            " This report is generated using an artificial intelligence research system. It is not a confirmed medical diagnosis. AI predictions and Grad-CAM++ visualizations may contain errors. Please consult a qualified radiologist or healthcare professional for clinical interpretation and appropriate diagnostic testing."
          </p>
        </div>

      </div>

      <section className="health-card p-5 sm:p-6 space-y-4 print:hidden" aria-labelledby="clinical-review-heading">
        <div className="flex items-start justify-between gap-4">
          <div><div className="text-[10px] font-bold uppercase tracking-wider text-[#1769AA]">CLINICIAN WORKFLOW</div><h2 id="clinical-review-heading" className="text-base font-bold text-slate-800 mt-1">Clinical review & notes</h2><p className="text-xs text-slate-500 mt-1">Record a human review alongside the automated screening output.</p></div>
          <span className="badge-inconclusive">{reviewStatus}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Review status<select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"><option>Pending Review</option><option>Reviewed</option><option>Follow-up Required</option></select></label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Clinician notes<textarea value={clinicianNotes} onChange={(event) => setClinicianNotes(event.target.value)} maxLength={4000} rows={3} placeholder="Add review context or follow-up plan…" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs" /></label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-[11px] text-slate-500" role="status">{reviewMessage}</span><button type="button" onClick={saveReview} disabled={savingReview} className="btn-primary text-xs px-4 py-2"><Save className="w-3.5 h-3.5" />{savingReview ? 'Saving…' : 'Save review'}</button></div>
      </section>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center print:hidden">
        <Link to="/dashboard" className="btn-secondary text-xs px-4 py-2">
          Return to Dashboard
        </Link>
        <Link to="/history" className="text-xs font-bold text-[#1769AA] hover:underline">
          View All History Reports &rarr;
        </Link>
      </div>

    </div>
  );
}
