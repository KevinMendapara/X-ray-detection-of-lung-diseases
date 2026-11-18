import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Eye, ArrowLeft, Download, ShieldAlert, Sliders,
  Layers, Info, FileText, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { xrayAPI, reportsAPI, resolveBackendUrl } from '../services/api';

export default function GradCamPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overlayOpacity, setOverlayOpacity] = useState(65); // 0 to 100%
  const [activeTab, setActiveTab] = useState('side_by_side'); // side_by_side | blended | pure_cam

  useEffect(() => {
    fetchGradCamData();
  }, [id]);

  const fetchGradCamData = async () => {
    setLoading(true);
    try {
      const data = await reportsAPI.getById(id);
      setAnalysis(data);
    } catch (err) {
      setError('Could not retrieve Grad-CAM++ visualization.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#17A2A4] animate-spin mx-auto" />
        <div className="text-sm font-semibold text-slate-700">Synthesizing Grad-CAM++ Attention Maps...</div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">{error || 'Visualization Not Found'}</h2>
        <Link to="/history" className="btn-primary text-xs px-4 py-2 inline-flex">
          Return to History
        </Link>
      </div>
    );
  }

  const zones = analysis.zone_analysis || {};
  const isTB = analysis.ai_results.prediction === 'TB Suspected';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-slate-600 hover:text-[#1769AA] flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-bold text-[#17A2A4]">
            <Eye className="w-3.5 h-3.5" />
            Explainable AI Studio (XAI)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183153]">
            Grad-CAM++ Lung Attention Visualization
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Patient: <strong className="text-slate-800">{analysis.patient.full_name} ({analysis.patient.id})</strong> • Prediction: <strong className={isTB ? 'text-rose-600' : 'text-emerald-600'}>{analysis.ai_results.prediction}</strong> ({analysis.ai_results.confidence_score}%)
            <br />
            {zones.explanation_method === 'RBF-SVM decision score' ? <span>Heatmap target: <strong className="text-[#1769AA]">{zones.explanation_target}</strong> class score · DenseNet121 final convolutional maps</span> : <span>Stored heatmap from this analysis record</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={resolveBackendUrl(analysis.xray.overlay_image_url)}
            download={`gradcam_overlay_${analysis.patient.id}.png`}
            className="btn-outline text-xs px-3.5 py-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download Heatmap Image
          </a>
          <Link
            to={`/report/${id}`}
            className="btn-primary text-xs px-4 py-2"
          >
            <FileText className="w-3.5 h-3.5" />
            View Full Report
          </Link>
        </div>
      </div>

      {/* Main Interactive Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 Cols: Visual Canvas & View Modes */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls Bar */}
          <div className="health-card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('side_by_side')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'side_by_side' ? 'bg-white shadow text-[#1769AA]' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Side-by-Side Comparison
              </button>
              <button
                onClick={() => setActiveTab('blended')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'blended' ? 'bg-white shadow text-[#1769AA]' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Interactive Blend Overlay
              </button>
              <button
                onClick={() => setActiveTab('pure_cam')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'pure_cam' ? 'bg-white shadow text-[#1769AA]' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pure Attention Heatmap
              </button>
            </div>

            {/* Opacity Slider for Blended mode */}
            {activeTab === 'blended' && (
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Heatmap Opacity: <strong>{overlayOpacity}%</strong></span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overlayOpacity}
                  onChange={e => setOverlayOpacity(parseInt(e.target.value))}
                  className="w-24 accent-[#17A2A4] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Visualization Canvas */}
          <div className="health-card p-6 bg-slate-950 text-white overflow-hidden shadow-2xl">
            
            {activeTab === 'side_by_side' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Original CXR */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Original Preprocessed CXR</span>
                      <span className="font-mono text-[10px]">224x224 RGB</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square flex items-center justify-center">
                      <img
                        src={resolveBackendUrl(analysis.xray.processed_image_url)}
                        alt="Original CXR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Grad-CAM++ Overlay */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[#17A2A4] font-bold">{zones.explanation_method === 'RBF-SVM decision score' ? 'SVM-conditioned Grad-CAM++ Overlay (60/40)' : 'Stored Attention Overlay (60/40)'}</span>
                      <span className="font-mono text-[10px] text-teal-400">DenseNet121 final convolutional maps</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square flex items-center justify-center">
                      <img
                        src={resolveBackendUrl(analysis.xray.overlay_image_url)}
                        alt="Grad-CAM++ Overlay"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  The map weights final-layer activations by their Grad-CAM++ contribution to the trained SVM class score.
                </div>
              </div>
            )}

            {activeTab === 'blended' && (
              <div className="space-y-4">
                <div className="relative mx-auto max-w-md aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  {/* Under layer: Original CXR */}
                  <img
                    src={resolveBackendUrl(analysis.xray.processed_image_url)}
                    alt="Under CXR"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {/* Over layer: Pure Heatmap with dynamic opacity */}
                  <img
                    src={resolveBackendUrl(analysis.xray.heatmap_image_url)}
                    alt="Overlay Heatmap"
                    style={{ opacity: overlayOpacity / 100 }}
                    className="absolute inset-0 w-full h-full object-contain mix-blend-screen transition-opacity"
                  />
                </div>
                <div className="text-center text-xs text-slate-400">
                  Move the opacity slider above to cross-fade between raw anatomy and neural feature activation.
                </div>
              </div>
            )}

            {activeTab === 'pure_cam' && (
              <div className="space-y-4">
                <div className="mx-auto max-w-md aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <img
                    src={resolveBackendUrl(analysis.xray.heatmap_image_url)}
                    alt="Pure Grad-CAM++ Heatmap"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center text-xs text-slate-400">
                  Isolated Grad-CAM++ activation surface with no background radiograph distraction.
                </div>
              </div>
            )}

          </div>

          {/* Color Intensity Legend Card */}
          <div className="health-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#1769AA]" />
                Grad-CAM++ Color Gradient Reference
              </span>
              <span className="text-[11px] text-slate-400">Standard JET Palette</span>
            </div>

            <div className="gradcam-colorbar"></div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                <div className="font-bold">Blue</div>
                <div className="text-[10px] text-blue-600 font-normal">Minimal (0.0 - 0.25)</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                <div className="font-bold">Green</div>
                <div className="text-[10px] text-emerald-600 font-normal">Moderate (0.25 - 0.50)</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                <div className="font-bold">Yellow</div>
                <div className="text-[10px] text-amber-600 font-normal">Elevated (0.50 - 0.75)</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                <div className="font-bold">Red</div>
                <div className="text-[10px] text-rose-600 font-normal">Peak Activation (&gt; 0.75)</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right 4 Cols: 5-Zone Lung Region Analysis Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="health-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">5-Zone Lung Region Analysis</h3>
                <p className="text-[11px] text-slate-500">Spatial feature attention dissection</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#1769AA] font-bold">
                Threshold: 40%
              </span>
            </div>

            {/* Total Highlighted Area Metric */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overall Highlighted Area</div>
                <div className="text-2xl font-extrabold text-[#1769AA]">
                  {zones.overall_highlighted_area_pct ?? 0}%
                </div>
                <div className="text-[10px] text-slate-500">Pixels &ge; 0.40 Activation</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Predominant Zone:</span>
                <strong className="text-xs font-bold text-slate-800">{zones.predominant_zone || 'Mid Zone'}</strong>
              </div>
            </div>

            {/* Lateral Lung Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">Lateral Field Attention</div>
              
              {/* Anatomical Right Lung (Viewer's Left) */}
              <div className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Right Lung (Viewer's Left)</span>
                  <strong className="text-[#1769AA] font-mono">{zones.anatomical_right_lung?.mean_activation_pct ?? 0}%</strong>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#1769AA] h-1.5 rounded-full"
                    style={{ width: `${zones.anatomical_right_lung?.mean_activation_pct ?? 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Peak: {zones.anatomical_right_lung?.max_activation_pct ?? 0}%</span>
                  <span className="font-semibold text-slate-600">{zones.anatomical_right_lung?.clinical_status || 'Low Activity'}</span>
                </div>
              </div>

              {/* Anatomical Left Lung (Viewer's Right) */}
              <div className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Left Lung (Viewer's Right)</span>
                  <strong className="text-[#17A2A4] font-mono">{zones.anatomical_left_lung?.mean_activation_pct ?? 0}%</strong>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#17A2A4] h-1.5 rounded-full"
                    style={{ width: `${zones.anatomical_left_lung?.mean_activation_pct ?? 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Peak: {zones.anatomical_left_lung?.max_activation_pct ?? 0}%</span>
                  <span className="font-semibold text-slate-600">{zones.anatomical_left_lung?.clinical_status || 'Low Activity'}</span>
                </div>
              </div>
            </div>

            {/* Vertical Zones Breakdown */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700">Vertical Zone Distribution</div>
              
              {/* Upper Zone */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Upper Zone (Apical / Subapical)</span>
                  <span className="font-bold text-slate-800 font-mono">{zones.upper_lung_zone?.mean_activation_pct ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${zones.upper_lung_zone?.mean_activation_pct ?? 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Middle Zone */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Middle Zone (Hilar / Perihilar)</span>
                  <span className="font-bold text-slate-800 font-mono">{zones.middle_lung_zone?.mean_activation_pct ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full"
                    style={{ width: `${zones.middle_lung_zone?.mean_activation_pct ?? 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Lower Zone */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Lower Zone (Basilar / Costophrenic)</span>
                  <span className="font-bold text-slate-800 font-mono">{zones.lower_lung_zone?.mean_activation_pct ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${zones.lower_lung_zone?.mean_activation_pct ?? 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Crucial Caution Note */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-1 text-[11px] text-amber-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1 text-amber-800">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                Diagnostic Explainability Guardrail
              </div>
              <div>
                Heatmap activation represents neural network gradient importance; it does <strong>not</strong> quantify active bacterial colonies, lesion size, or clinical disease severity. Highlighted regions must not be labeled as confirmed tubercular lesions.
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

