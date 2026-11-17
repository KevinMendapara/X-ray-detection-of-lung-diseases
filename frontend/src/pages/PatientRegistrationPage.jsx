import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, BadgeCheck, CheckCircle2, ChevronRight,
  ClipboardPlus, Clock3, ContactRound, FilePlus2, HeartPulse,
  ShieldCheck, Stethoscope, UserRound, UsersRound
} from 'lucide-react';
import { patientsAPI } from '../services/api';
import './PatientRegistrationPage.css';

const commonSymptoms = [
  'Persistent cough (> 2 weeks)',
  'Productive sputum',
  'Blood in sputum',
  'Evening fever',
  'Night sweats',
  'Unexplained weight loss',
  'Chest pain or tightness',
  'Fatigue or weakness',
  'Shortness of breath'
];

const emptyForm = {
  full_name: '', age: '', gender: 'Male', contact_number: '', email: '',
  medical_history: '', previous_tb_history: 'No', symptom_duration: '2-3 weeks',
  selected_symptoms: []
};

export default function PatientRegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const updateField = (field, value) => setFormData((current) => ({ ...current, [field]: value }));
  const handleCheckboxChange = (symptom) => {
    setFormData((current) => ({
      ...current,
      selected_symptoms: current.selected_symptoms.includes(symptom)
        ? current.selected_symptoms.filter((item) => item !== symptom)
        : [...current.selected_symptoms, symptom]
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!formData.full_name.trim()) {
      setError('Enter the patient’s full name to continue.');
      return;
    }
    if (!formData.age || Number.parseInt(formData.age, 10) < 1 || Number.parseInt(formData.age, 10) > 125) {
      setError('Enter a valid age between 1 and 125 years.');
      return;
    }

    setLoading(true);
    try {
      const result = await patientsAPI.create({
        full_name: formData.full_name.trim(),
        age: Number.parseInt(formData.age, 10),
        gender: formData.gender,
        contact_number: formData.contact_number.trim() || null,
        email: formData.email.trim() || null,
        medical_history: formData.medical_history.trim() || null,
        symptoms: formData.selected_symptoms.join(', ') || 'No symptoms reported',
        previous_tb_history: formData.previous_tb_history,
        symptom_duration: formData.symptom_duration
      });
      setRegisteredPatient(result);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const validationMessage = Array.isArray(detail)
        ? detail.map((issue) => issue.msg).filter(Boolean).join(' ')
        : null;
      const message = typeof detail === 'string' ? detail : validationMessage;
      setError(
        message || (err.response?.status
          ? `The registration service returned HTTP ${err.response.status}. Please retry, and contact support if it continues.`
          : 'Could not reach the registration service. Check that the backend is running, then try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRegisteredPatient(null);
    setFormData({ ...emptyForm, selected_symptoms: [] });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="registration-page">
      <div className="registration-wrap">
        <div className="registration-breadcrumb"><span>Patient registry</span><ChevronRight size={14} /><strong>New intake</strong></div>
        <header className="registration-heading">
          <div>
            <div className="registration-kicker"><ClipboardPlus size={15} /> Patient services</div>
            <h1>New patient intake</h1>
            <p>Create a patient record and capture the details needed for this research screening workflow.</p>
          </div>
          <div className="registration-ref"><span>FORM</span><strong>PT / 01</strong></div>
        </header>

        {registeredPatient ? (
          <section className="registration-success" aria-live="polite">
            <div className="success-emblem"><CheckCircle2 size={29} /></div>
            <div className="success-copy"><span className="success-label">Record created</span><h2>Patient registered</h2><p>The patient is now available in the screening registry.</p></div>
            <div className="success-id"><span>Patient ID</span><strong>{registeredPatient.id}</strong><BadgeCheck size={17} /></div>
            <div className="success-details">
              <div><span>Patient name</span><strong>{registeredPatient.full_name}</strong></div>
              <div><span>Age / gender</span><strong>{registeredPatient.age} years · {registeredPatient.gender}</strong></div>
              <div><span>Symptom duration</span><strong>{registeredPatient.symptom_duration || 'Not recorded'}</strong></div>
            </div>
            <div className="success-actions">
              <button className="registration-primary" onClick={() => navigate(`/upload?patient_id=${registeredPatient.id}`)}>Continue to X-ray upload <ArrowRight size={17} /></button>
              <button className="registration-secondary" onClick={() => navigate('/dashboard')}>Open dashboard</button>
              <button className="registration-quiet" onClick={resetForm}>Register another patient</button>
            </div>
          </section>
        ) : (
          <div className="registration-layout">
            <form className="intake-form" onSubmit={handleSubmit}>
              <div className="form-topline"><div><span className="form-overline">INTAKE RECORD</span><h2>Patient information</h2></div><span className="required-legend"><i /> Required fields</span></div>

              {error && <div className="registration-error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}

              <section className="intake-section" aria-labelledby="demographics-title">
                <div className="section-heading"><span className="section-number">01</span><div><h3 id="demographics-title">Personal details</h3><p>Basic demographic and contact information</p></div></div>
                <div className="intake-fields">
                  <label className="intake-field field-wide"><span>Full name <b>*</b></span><div className="input-shell"><UserRound size={16} /><input type="text" placeholder="Enter patient’s full name" value={formData.full_name} onChange={(event) => updateField('full_name', event.target.value)} autoComplete="name" required /></div></label>
                  <label className="intake-field"><span>Age <b>*</b></span><div className="input-shell"><input type="number" placeholder="e.g. 42" min="1" max="125" value={formData.age} onChange={(event) => updateField('age', event.target.value)} required /><small>years</small></div></label>
                  <label className="intake-field"><span>Gender</span><div className="input-shell select-shell"><select value={formData.gender} onChange={(event) => updateField('gender', event.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div></label>
                  <label className="intake-field"><span>Contact number <em>Optional</em></span><div className="input-shell"><ContactRound size={16} /><input type="tel" placeholder="Phone number" value={formData.contact_number} onChange={(event) => updateField('contact_number', event.target.value)} autoComplete="tel" /></div></label>
                  <label className="intake-field"><span>Email address <em>Optional</em></span><div className="input-shell"><input type="email" placeholder="name@example.com" value={formData.email} onChange={(event) => updateField('email', event.target.value)} autoComplete="email" /></div></label>
                </div>
              </section>

              <section className="intake-section clinical-section" aria-labelledby="clinical-title">
                <div className="section-heading"><span className="section-number section-number-teal">02</span><div><h3 id="clinical-title">Clinical intake</h3><p>Screening history and current presentation</p></div></div>
                <div className="intake-fields">
                  <label className="intake-field"><span>Previous TB history</span><div className="input-shell select-shell"><select value={formData.previous_tb_history} onChange={(event) => updateField('previous_tb_history', event.target.value)}><option value="No">No prior TB history</option><option value="Yes (Completed Full Treatment)">Previous treatment completed</option><option value="Yes (Defaulted / Incomplete)">Treatment incomplete or interrupted</option><option value="Unknown">Unknown</option></select></div></label>
                  <label className="intake-field"><span>Symptom duration</span><div className="input-shell select-shell"><Clock3 size={16} /><select value={formData.symptom_duration} onChange={(event) => updateField('symptom_duration', event.target.value)}><option value="< 1 week">Less than 1 week</option><option value="1-2 weeks">1–2 weeks</option><option value="2-3 weeks">2–3 weeks</option><option value="1-2 months">1–2 months</option><option value="> 2 months">More than 2 months</option><option value="Asymptomatic (Routine Screening)">No symptoms · routine screening</option></select></div></label>
                </div>

                <div className="symptom-heading"><div><h4>Current symptoms</h4><p>Select all that the patient reports</p></div><span>{formData.selected_symptoms.length} selected</span></div>
                <div className="symptom-grid">
                  {commonSymptoms.map((symptom) => {
                    const checked = formData.selected_symptoms.includes(symptom);
                    return <label key={symptom} className={`symptom-option ${checked ? 'symptom-selected' : ''}`}><input type="checkbox" checked={checked} onChange={() => handleCheckboxChange(symptom)} /><span className="custom-check">{checked && <CheckCircle2 size={15} />}</span><span>{symptom}</span></label>;
                  })}
                </div>

                <label className="intake-field background-field"><span>Relevant medical background <em>Optional</em></span><textarea rows="3" placeholder="Comorbidities, medication, or other relevant history" value={formData.medical_history} onChange={(event) => updateField('medical_history', event.target.value)} /></label>
              </section>

              <div className="registration-footnote"><ShieldCheck size={17} /><span>Record only information needed for this research screening workflow. This prototype does not provide a medical diagnosis.</span></div>
              <div className="intake-submit"><button type="button" className="registration-quiet" onClick={() => navigate('/dashboard')}>Cancel</button><button className="registration-primary" type="submit" disabled={loading}>{loading ? 'Saving patient record…' : 'Create patient record'}{!loading && <ArrowRight size={17} />}</button></div>
            </form>

            <aside className="intake-aside">
              <div className="workflow-card">
                <div className="workflow-icon"><UsersRound size={19} /></div><span className="workflow-label">REGISTRATION FLOW</span>
                <h2>A clear start to the screening process.</h2>
                <div className="workflow-steps">
                  <div className="workflow-step active"><span>1</span><div><strong>Create patient record</strong><small>Demographic details</small></div><CheckCircle2 size={16} /></div>
                  <div className="workflow-step"><span>2</span><div><strong>Capture presentation</strong><small>History and symptoms</small></div></div>
                  <div className="workflow-step"><span>3</span><div><strong>Add chest X-ray</strong><small>Continue to image upload</small></div></div>
                </div>
                <div className="workflow-divider" />
                <div className="id-preview"><span>Patient identifier</span><strong>Generated after saving</strong><small>Used to link the patient record and analysis.</small></div>
              </div>
              <div className="intake-aside-note"><div><HeartPulse size={17} /><strong>Clinical context</strong></div><p>Symptoms and history help keep each analysis attached to its patient record.</p><div className="aside-note-footer"><Stethoscope size={15} /> Decision-support prototype</div></div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
