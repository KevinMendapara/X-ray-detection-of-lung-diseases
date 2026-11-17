import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Clock3,
  Download, Eye, FileText, RefreshCw, ShieldAlert, UserRound
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import './ResultsPage.css';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    reportsAPI.getById(id)
      .then((data) => { if (active) setReport(data); })
      .catch(() => { if (active) setError('Could not retrieve this analysis result. It may not exist.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="results-message"><RefreshCw size={26} /><span>Loading analysis results…</span></div>;
  if (error || !report) return <div className="results-message results-error"><AlertCircle size={30} /><strong>{error || 'Result not found'}</strong><Link to="/upload">Return to upload</Link></div>;

  const ai = report.ai_results || {};
  const patient = report.patient || {};
  const xray = report.xray || {};
  const isTB = ai.prediction === 'TB Suspected';
  const isInconclusive = ai.prediction === 'Inconclusive';
  const resultClass = isTB ? 'result-risk' : isInconclusive ? 'result-caution' : 'result-clear';

  return (
    <main className="results-page">
      <div className="results-toolbar">
        <button className="results-back" onClick={() => navigate('/upload')}><ArrowLeft size={15} /> New scan</button>
        <div className="results-actions">
          <Link to={`/gradcam/${id}`} className="results-action results-action-teal"><Eye size={15} /><span>Explainability</span></Link>
          <Link to={`/report/${id}`} className="results-action results-action-primary"><FileText size={15} /><span>Full report</span></Link>
          <a href={report.pdf_download_url} target="_blank" rel="noreferrer" className="results-action results-action-quiet"><Download size={15} /><span>PDF</span></a>
        </div>
      </div>

      <section className={`results-summary ${resultClass}`}>
        <div className="results-status-block">
          <div className="results-meta"><span>ANALYSIS #{report.analysis_id}</span><i /> <span><Clock3 size={12} /> {report.created_at?.slice(0, 16).replace('T', ' ')} UTC</span></div>
          <div className="results-status-title">
            <div className="results-status-icon">{isTB ? <AlertTriangle size={21} /> : isInconclusive ? <ShieldAlert size={21} /> : <CheckCircle2 size={21} />}</div>
            <div><h1>{ai.prediction}</h1><p>{ai.interpretation}</p></div>
          </div>
        </div>
        <div className="results-confidence">
          <div className="confidence-head"><span>Model confidence</span><strong>{ai.confidence_score}%</strong></div>
          <div className="confidence-track"><span style={{ width: `${Math.min(100, Math.max(0, Number(ai.confidence_score) || 0))}%` }} /></div>
          <div className="confidence-foot"><span>Statistical model score</span><span>SVM margin {Number(ai.svm_decision_score) > 0 ? '+' : ''}{ai.svm_decision_score}</span></div>
        </div>
      </section>

      <section className="results-patient-strip">
        <div className="patient-strip-title"><UserRound size={16} /><span>Patient</span></div>
        <strong>{patient.full_name || 'Patient record'}</strong>
        <span className="patient-strip-id">{patient.id}</span>
        <i />
        <span>{patient.age} yrs · {patient.gender}</span>
        <i />
        <span className="patient-strip-symptoms">{patient.symptoms || 'Screening'}</span>
      </section>

      <section className="results-images-card">
        <div className="results-images-heading"><div><h2>Image comparison</h2><p>Original image, normalized input, and model attention overlay</p></div><span>224 × 224 analysis input</span></div>
        <div className="results-image-grid">
          <figure><div className="result-image-frame"><img src={xray.original_image_url} alt="Original chest radiograph" /></div><figcaption><span>01</span> Original radiograph <small>{xray.quality_status}</small></figcaption></figure>
          <figure><div className="result-image-frame"><img src={xray.processed_image_url} alt="Normalized chest radiograph" /></div><figcaption><span>02</span> Normalized input <small>Contrast adjusted</small></figcaption></figure>
          <figure><div className="result-image-frame"><img src={xray.overlay_image_url} alt="Grad-CAM attention overlay" /></div><figcaption><span>03</span> Attention overlay <small>Grad-CAM++</small></figcaption></figure>
        </div>
      </section>

      <div className="results-disclaimer"><AlertTriangle size={16} /><p><strong>Decision-support prototype.</strong> Confidence is a model score, not a patient-specific probability. A negative result does not rule out TB. Confirm findings with a qualified clinician and standard diagnostic testing.</p></div>

      <div className="results-bottom-row"><span>DenseNet121 · RBF-SVM · ICMR research cohort</span><Link to={`/report/${id}`}>View clinical details <ArrowLeft size={14} /></Link></div>
    </main>
  );
}
