import React, { useState } from 'react';
import { Activity, ArrowRight, Check, CheckCircle2, Clock3, Database, Mail, MapPin, MessageSquare, ShieldCheck, Send } from 'lucide-react';
import './ContactPage.css';
import { contactAPI } from '../services/api';

const inquiryTypes = ['Project overview', 'Model & validation', 'Dataset collaboration', 'Technical support'];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [inquiryType, setInquiryType] = useState(inquiryTypes[0]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await contactAPI.submit({ ...form, inquiry_type: inquiryType });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.response?.data?.detail || 'We could not save your inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
      <div className="contact-shell">
        <header className="contact-heading">
          <span className="contact-eyebrow"><Mail size={14} /> RESEARCH & COLLABORATION</span>
          <h1>Let’s talk about <span>better screening.</span></h1>
          <p>Questions about the project, model evaluation, or research collaboration? Send a note to the PulmoVision team.</p>
        </header>

        <div className="contact-layout">
          <aside className="contact-aside">
            <div className="contact-aside-orbit" aria-hidden="true" />
            <div className="contact-aside-content">
              <div className="contact-mark"><Activity size={20} /></div>
              <span className="contact-aside-kicker">PULMOVISION · RESEARCH PROTOTYPE</span>
              <h2>Built for transparent, responsible research.</h2>
              <p>We welcome thoughtful questions from clinicians, researchers, and academic teams exploring explainable chest radiograph screening.</p>
              <div className="contact-detail-list">
                <div><span className="contact-detail-icon"><Database size={16} /></span><span><b>Research focus</b><small>Explainable pulmonary TB screening</small></span></div>
                <div><span className="contact-detail-icon"><ShieldCheck size={16} /></span><span><b>Dataset context</b><small>ICMR–NIRT cohort documentation</small></span></div>
                <div><span className="contact-detail-icon"><Clock3 size={16} /></span><span><b>Response window</b><small>Academic project hours</small></span></div>
              </div>
              <div className="contact-aside-note"><MapPin size={14} /><span>Academic & clinical research collaboration</span></div>
            </div>
          </aside>

          <section className="contact-form-panel">
            <div className="contact-form-heading"><div><span className="contact-step">01 / MESSAGE</span><h2>Send an inquiry</h2><p>Share a little context so we can direct your question.</p></div><MessageSquare size={21} /></div>
            {submitted ? (
              <div className="contact-success" role="status">
                <div className="contact-success-mark"><CheckCircle2 size={27} /></div>
                <span className="contact-step">MESSAGE READY</span>
                <h3>Thanks for reaching out.</h3>
                <p>Your inquiry has been saved to the local project inbox for the research team.</p>
                <button type="button" className="contact-reset" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>Write another message <ArrowRight size={14} /></button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <fieldset className="contact-topic-field"><legend>What can we help with?</legend><div className="contact-topic-options">{inquiryTypes.map((type) => <button key={type} type="button" className={inquiryType === type ? 'contact-topic active' : 'contact-topic'} aria-pressed={inquiryType === type} onClick={() => { setInquiryType(type); setForm((current) => ({ ...current, subject: type })); }}><span>{inquiryType === type && <Check size={11} />}</span>{type}</button>)}</div></fieldset>
                <div className="contact-fields-row">
                  <label className="contact-field"><span>Your name</span><input required autoComplete="name" placeholder="Dr. Samira Nair" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                  <label className="contact-field"><span>Work email</span><input required type="email" autoComplete="email" placeholder="you@institution.org" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                </div>
                <label className="contact-field"><span>Subject</span><input required placeholder="A short title for your inquiry" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
                <label className="contact-field"><span>Message <small>{form.message.length}/600</small></span><textarea required maxLength={600} rows={5} placeholder="Tell us what you’re working on and how we can help…" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>
                {submitError && <p className="contact-submit-error" role="alert">{submitError}</p>}
                <div className="contact-submit-row"><p>Prototype form · No message is sent externally</p><button className="contact-submit" type="submit" disabled={submitting}>{submitting ? 'Preparing…' : 'Prepare inquiry'} <Send size={15} /></button></div>
              </form>
            )}
          </section>
        </div>
        <p className="contact-footnote"><ShieldCheck size={14} /> Please do not include patient-identifiable information or urgent clinical details.</p>
      </div>
    </main>
  );
}
