import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowDownUp, ArrowRight, ArrowUpRight,
  CalendarClock, CheckCircle2, CircleHelp, Download, Eye, FileText,
  RefreshCw, Search, ShieldAlert, SlidersHorizontal, UploadCloud, UserRound, X
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import './HistoryPage.css';

const filters = [
  { label: 'All analyses', value: 'All' },
  { label: 'TB suspected', value: 'TB Suspected' },
  { label: 'Not detected', value: 'TB Not Detected by Model' },
  { label: 'Inconclusive', value: 'Inconclusive' }
];

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PT';
const formatDate = (value) => {
  if (!value) return { date: 'Date unavailable', time: '' };
  const parsed = new Date(value.includes('Z') ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(parsed.getTime())) return { date: value.slice(0, 10), time: value.slice(11, 16) };
  return {
    date: parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
    time: parsed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  };
};

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrediction, setFilterPrediction] = useState('All');
  const [sortNewest, setSortNewest] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      reportsAPI.list(searchQuery.trim(), 'All')
        .then((data) => { if (active) setReports(data || []); })
        .catch(() => { if (active) { setReports([]); setError('The archive could not be loaded. Check the connection and retry.'); } })
        .finally(() => { if (active) setLoading(false); });
    }, searchQuery ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [searchQuery, refreshKey]);

  const counts = useMemo(() => ({
    All: reports.length,
    'TB Suspected': reports.filter((report) => report.prediction === 'TB Suspected').length,
    'TB Not Detected by Model': reports.filter((report) => report.prediction === 'TB Not Detected by Model').length,
    Inconclusive: reports.filter((report) => report.prediction === 'Inconclusive').length
  }), [reports]);

  const visibleReports = useMemo(() => reports
    .filter((report) => filterPrediction === 'All' || report.prediction === filterPrediction)
    .sort((a, b) => {
      const delta = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return sortNewest ? -delta : delta;
    }), [reports, filterPrediction, sortNewest]);

  const summary = {
    suspected: reports.filter((report) => report.prediction === 'TB Suspected').length,
    clear: reports.filter((report) => report.prediction === 'TB Not Detected by Model').length,
    other: reports.filter((report) => report.prediction === 'Inconclusive').length
  };

  return (
    <main className="history-page">
      <div className="history-shell">
        <header className="history-hero">
          <div className="history-hero-copy">
            <div className="history-kicker"><Activity size={15} /> Screening archive</div>
            <h1>Analysis history</h1>
            <p>Find a patient’s previous chest X-ray analysis, review the model output, or open its report.</p>
          </div>
          <div className="history-hero-actions">
            <div className="archive-count"><span>RECENT RECORDS</span><strong>{reports.length}</strong></div>
            <Link to="/upload" className="history-new-scan"><UploadCloud size={16} /> New analysis <ArrowRight size={15} /></Link>
          </div>
        </header>

        <section className="history-summary" aria-label="Archive summary">
          <div className="summary-total"><span className="summary-icon"><CalendarClock size={17} /></span><div><strong>{reports.length}</strong><small>Recent analyses</small></div></div>
          <div className="summary-stat"><span className="summary-dot summary-dot-risk" /><div><strong>{summary.suspected}</strong><small>TB suspected</small></div></div>
          <div className="summary-stat"><span className="summary-dot summary-dot-clear" /><div><strong>{summary.clear}</strong><small>Not detected</small></div></div>
          <div className="summary-stat"><span className="summary-dot summary-dot-other" /><div><strong>{summary.other}</strong><small>Inconclusive</small></div></div>
        </section>

        <section className="history-controls" aria-label="Search and filter analyses">
          <div className="history-search-wrap"><Search size={17} /><input aria-label="Search patient or report" type="search" placeholder="Search patient name, patient ID, or report…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />{searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')}><X size={15} /></button>}</div>
          <button className="history-sort-button" type="button" onClick={() => setSortNewest((value) => !value)}><ArrowDownUp size={15} /> {sortNewest ? 'Newest first' : 'Oldest first'}</button>
          <button className="history-refresh-button" type="button" onClick={() => setRefreshKey((value) => value + 1)} title="Refresh archive" aria-label="Refresh archive"><RefreshCw size={16} className={loading ? 'history-spinning' : ''} /></button>
        </section>

        <nav className="history-filters" aria-label="Filter by prediction">
          <span><SlidersHorizontal size={14} /> Filter</span>
          {filters.map((filter) => <button key={filter.value} type="button" className={filterPrediction === filter.value ? 'history-filter active' : 'history-filter'} onClick={() => setFilterPrediction(filter.value)} aria-pressed={filterPrediction === filter.value}>{filter.label}<b>{counts[filter.value]}</b></button>)}
        </nav>

        <div className="history-list-heading"><div><h2>{filterPrediction === 'All' ? 'Recent patient analyses' : filterPrediction}</h2><p>{searchQuery ? `Matching “${searchQuery}”` : 'Latest screening activity'}</p></div><span>{visibleReports.length} shown</span></div>

        {error ? (
          <div className="history-empty"><CircleHelp size={30} /><h3>Archive unavailable</h3><p>{error}</p><button className="history-retry" onClick={() => setRefreshKey((value) => value + 1)}>Retry <RefreshCw size={14} /></button></div>
        ) : loading ? (
          <div className="history-loading"><RefreshCw size={22} /><span>Loading archive…</span></div>
        ) : visibleReports.length === 0 ? (
          <div className="history-empty"><FileText size={31} /><h3>{reports.length ? 'No records in this filter' : 'No analysis records yet'}</h3><p>{reports.length ? 'Choose another outcome or clear the search to see more records.' : 'Upload a chest X-ray to create the first analysis in this archive.'}</p><div>{(filterPrediction !== 'All' || searchQuery) && <button className="history-retry" onClick={() => { setFilterPrediction('All'); setSearchQuery(''); }}>Clear filters <X size={14} /></button>}<Link to="/upload" className="history-new-scan"><UploadCloud size={15} /> Start an analysis</Link></div></div>
        ) : (
          <section className="history-card-grid" aria-live="polite">
            {visibleReports.map((report) => {
              const status = report.prediction === 'TB Suspected' ? 'risk' : report.prediction === 'Inconclusive' ? 'uncertain' : 'clear';
              const date = formatDate(report.created_at);
              const confidence = Math.max(0, Math.min(100, Number(report.confidence_score) || 0));
              return (
                <article key={report.id} className={`history-record history-record-${status}`}>
                  <div className="record-topline"><div className="record-date"><span>{date.date}</span><i />{date.time && <span>{date.time}</span>}</div><span className={`record-status record-status-${status}`}>{status === 'risk' ? <AlertTriangle size={13} /> : status === 'uncertain' ? <CircleHelp size={13} /> : <CheckCircle2 size={13} />}{report.prediction}</span></div>
                  <div className="record-patient"><div className={`record-avatar record-avatar-${status}`}>{initials(report.patient_name)}</div><div className="record-patient-info"><strong>{report.patient_name || 'Patient'}</strong><span>{report.patient_id} <i /> {report.patient_age || '—'} yrs · {report.patient_gender || '—'}</span></div><div className="record-id">AR-{String(report.id).padStart(5, '0')}</div></div>
                  <div className="record-confidence"><div><span>Model confidence</span><strong>{confidence}%</strong></div><div className="record-meter"><span style={{ width: `${confidence}%` }} /></div></div>
                  <div className="record-footer"><span className="record-model">{report.model_version?.includes('Grad-CAM++') ? 'DenseNet121 · RBF-SVM' : (report.model_version || 'CXR analysis')}</span><div className="record-actions"><Link to={`/gradcam/${report.id}`} title="Open Grad-CAM++" aria-label={`Open Grad-CAM++ for ${report.patient_name}`}><Eye size={15} /></Link><Link to={`/report/${report.id}`} title="Open report" aria-label={`Open report for ${report.patient_name}`}><FileText size={15} /></Link><a href={report.pdf_url} target="_blank" rel="noreferrer" title="Download PDF" aria-label={`Download PDF for ${report.patient_name}`}><Download size={15} /></a><Link to={`/results/${report.id}`} className="record-open">Open analysis <ArrowUpRight size={14} /></Link></div></div>
                </article>
              );
            })}
          </section>
        )}
        <footer className="history-footnote"><ShieldAlert size={14} /><span>AI outputs are research decision-support information and require clinical review.</span><span>Showing up to 50 recent records</span></footer>
      </div>
    </main>
  );
}

