import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Download, Eye, FileText, RefreshCw, Search, ShieldCheck, UploadCloud, Users } from 'lucide-react';
import { adminAPI, patientsAPI, reportsAPI, resolveBackendUrl } from '../services/api';
import './DashboardFeatures.css';

const ymd = (date) => date.toISOString().slice(0, 10);
export default function DashboardPage() {
  const [stats, setStats] = useState({ total_patients: 0, total_analyses: 0, suspected_cases: 0, normal_cases: 0, pending_reviews: 0, model_accuracy_pct: 0 });
  const [patients, setPatients] = useState([]);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reportParams = () => {
    const params = { review_status: reviewFilter };
    if (dateRange !== 'all') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - Number(dateRange));
      params.start_date = ymd(start);
      params.end_date = ymd(end);
    }
    return params;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsResult, patientResult, reportResult] = await Promise.all([
        adminAPI.getStats(), patientsAPI.list(), reportsAPI.list('', 'All', reportParams())
      ]);
      setStats(statsResult.kpis || {});
      setPatients(patientResult || []);
      setReports((reportResult || []).slice(0, 8));
    } catch {
      setError('Some dashboard information could not be loaded. Refresh to try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboardData(); }, [dateRange, reviewFilter]);

  const exportCsv = async () => {
    try {
      const blob = await reportsAPI.exportCsv(reportParams());
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'tb-detect-analysis-summary.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch { setError('CSV export could not be created. Try again.'); }
  };

  const visiblePatients = patients.filter((patient) => `${patient.full_name} ${patient.id}`.toLowerCase().includes(search.toLowerCase()));
  const kpis = [
    { label: 'Enrolled patients', value: stats.total_patients || 0, icon: Users, tone: 'blue' },
    { label: 'Total analyses', value: stats.total_analyses || 0, icon: FileText, tone: 'teal' },
    { label: 'TB suspected', value: stats.suspected_cases || 0, icon: AlertTriangle, tone: 'rose' },
    { label: 'Not detected', value: stats.normal_cases || 0, icon: CheckCircle2, tone: 'green' },
    { label: 'Pending review', value: stats.pending_reviews ?? stats.pending_analyses ?? 0, icon: ShieldCheck, tone: 'amber' }
  ];

  return <main className="dashboard-page">
    <div className="dashboard-shell">
      <header className="dashboard-heading"><div><span className="dashboard-eyebrow"><Activity size={14} /> SCREENING OVERVIEW</span><h1>Clinical dashboard</h1><p>Patient activity, analysis outcomes, and human review status in one place.</p></div><div className="dashboard-heading-actions"><button type="button" onClick={fetchDashboardData} aria-label="Refresh dashboard"><RefreshCw size={15} /></button><Link to="/upload" className="dashboard-primary"><UploadCloud size={15} /> New analysis</Link><Link to="/register-patient" className="dashboard-secondary"><Users size={15} /> Register patient</Link></div></header>
      {error && <div className="dashboard-error" role="alert">{error}</div>}
      <section className="dashboard-kpis" aria-label="Screening summary">{kpis.map(({ label, value, icon: Icon, tone }) => <article className={`dashboard-kpi kpi-${tone}`} key={label}><span><Icon size={16} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>
      <div className="dashboard-content-grid">
        <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">RECENT ACTIVITY</span><h2>Analysis reports</h2></div><Link to="/history">Full history <ArrowRight size={13} /></Link></div>
          <div className="dashboard-report-filters" aria-label="Filter and export analyses"><label>Date range<select value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option value="all">All dates</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label><label>Review status<select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}><option>All</option><option>Pending Review</option><option>Reviewed</option><option>Follow-up Required</option></select></label><button type="button" onClick={exportCsv}><Download size={14} /> Export CSV</button></div>
          <div className="dashboard-report-list">{loading ? <div className="dashboard-empty"><RefreshCw size={18} /> Loading analyses...</div> : reports.length ? reports.map((report) => <article className="dashboard-report" key={report.id}><img src={resolveBackendUrl(report.overlay_image_url)} alt="Analysis heatmap preview" loading="lazy" /><div className="dashboard-report-info"><Link to={`/patients/${report.patient_id}`} className="dashboard-patient-link">{report.patient_name} <small>{report.patient_id}</small></Link><strong>{report.prediction}</strong><span>{new Date(`${report.created_at}Z`).toLocaleString()} · Confidence {Number(report.confidence_score || 0).toFixed(1)}%</span><em>{report.review_status || 'Pending Review'}</em></div><div className="dashboard-report-actions"><Link to={`/gradcam/${report.id}`} aria-label={`Explain analysis ${report.id}`} title="Explainability"><Eye size={15} /></Link><Link to={`/report/${report.id}`} aria-label={`Open report ${report.id}`} title="Open report"><FileText size={15} /></Link></div></article>) : <div className="dashboard-empty"><FileText size={20} /> No analyses match these filters.</div>}</div>
        </section>
        <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">REGISTERED COHORT</span><h2>Patients</h2></div><Link to="/register-patient">Add patient <ArrowRight size={13} /></Link></div><label className="dashboard-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or patient ID" aria-label="Search patients" /></label><div className="dashboard-patient-list">{visiblePatients.length ? visiblePatients.map((patient) => <article className="dashboard-patient" key={patient.id}><div className="dashboard-avatar">{patient.full_name.split(/\s+/).slice(0,2).map((part) => part[0]).join('').toUpperCase()}</div><div><Link to={`/patients/${patient.id}`}>{patient.full_name}</Link><span>{patient.id} · {patient.age}y · {patient.gender}</span><small>{patient.analyses_count || 0} analyses · Latest: {patient.latest_prediction || 'None'}</small></div><Link className="dashboard-scan-link" to={`/upload?patient_id=${patient.id}`} aria-label={`Start scan for ${patient.full_name}`}><UploadCloud size={15} /></Link></article>) : <div className="dashboard-empty">No patients found.</div>}</div></section>
      </div>
      <p className="dashboard-disclaimer"><ShieldCheck size={14} /> Model output is research decision support and requires qualified clinical review. Evaluation figures are cohort-specific.</p>
    </div>
  </main>;
}

