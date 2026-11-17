import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, ArrowUpRight } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-main">
          <section className="footer-brand">
            <Link to="/" className="footer-logo"><span><Activity size={20} /></span><b>PulmoVision</b></Link>
            <p>Explainable chest radiograph decision support for tuberculosis screening research.</p>
            <div className="footer-model-tags"><span>DenseNet121</span><span>SVM</span><span>Grad-CAM++</span></div>
            <small>Research prototype · ICMR–NIRT cohort</small>
          </section>
          <nav className="footer-nav" aria-label="Clinical workflow"><h2>CLINICAL WORKFLOW</h2><Link to="/upload">X-ray analysis <ArrowUpRight size={13} /></Link><Link to="/register-patient">Patient registration <ArrowUpRight size={13} /></Link><Link to="/dashboard">Clinical dashboard <ArrowUpRight size={13} /></Link><Link to="/history">Analysis history <ArrowUpRight size={13} /></Link></nav>
          <nav className="footer-nav" aria-label="Research and methodology"><h2>RESEARCH & METHODS</h2><Link to="/about">Model methodology <ArrowUpRight size={13} /></Link><Link to="/education">TB clinical facts <ArrowUpRight size={13} /></Link><Link to="/admin">Model evaluation <ArrowUpRight size={13} /></Link><Link to="/contact">Contact the project <ArrowUpRight size={13} /></Link></nav>
          <section className="footer-project"><span className="footer-project-label">A RESEARCH PROTOTYPE</span><h2>Clearer insights.<br />Responsible decisions.</h2><p>Designed for academic exploration of explainable AI in chest radiograph screening.</p><Link to="/about" className="footer-about-link">Explore the approach <ArrowUpRight size={15} /></Link></section>
        </div>
        <div className="footer-disclaimer"><span><Shield size={16} /></span><p><b>Research disclaimer</b> — This prototype does not provide a medical diagnosis or replace radiological review, sputum microscopy, or CBNAAT / GeneXpert testing. Clinical decisions require qualified medical professionals.</p></div>
        <div className="footer-bottom"><span>© 2026 PulmoVision · Academic research prototype</span><div><Link to="/contact">Privacy & terms</Link><Link to="/admin">Audit logs</Link><a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top ↑</a></div></div>
      </div>
    </footer>
  );
}
