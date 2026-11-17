import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, CheckCircle2, Circle, ClipboardPlus,
  Cpu, FileCheck2, FileUp, LockKeyhole, ShieldCheck, UserRound, X
} from 'lucide-react';
import { patientsAPI, xrayAPI } from '../services/api';
import './UploadPage.css';

const pipelineStages = [
  'Image normalization',
  'DenseNet121 feature extraction',
  'SVM classification',
  'Grad-CAM++ analysis',
  'Report generation'
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patient_id') || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [qualityReview, setQualityReview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    patientsAPI.list().then((res) => {
      setPatients(res || []);
      if (!selectedPatientId && res?.length) setSelectedPatientId(String(res[0].id));
    }).catch(() => {});
  }, []);

  const handleFileSelect = (file) => {
    setError('');
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isDicom = ['dcm', 'dicom'].includes(extension);
    const isImage = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
    if (!isImage && !isDicom) {
      setError('Choose a PNG, JPG, JPEG, or DICOM chest radiograph.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('This file exceeds the 25 MB limit. Choose a smaller file and try again.');
      return;
    }
    setSelectedFile(file);
    setUploadedImage(null);
    setQualityReview(null);
    setFileDetails({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: isDicom ? 'DICOM' : (file.type.split('/')[1] || extension).toUpperCase()
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedImage(null);
    setQualityReview(null);
    setFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) { setError('Select a chest radiograph before starting the analysis.'); return; }
    if (!selectedPatientId) { setError('Select a patient or register a new patient before starting the analysis.'); return; }
    setError('');
    setAnalyzing(true);
    setPipelineStage(0);
    let interval = null;
    try {
      if (!qualityReview) {
        const review = await xrayAPI.checkQuality(selectedFile);
        setQualityReview(review);
        setAnalyzing(false);
        return;
      }
      interval = setInterval(() => setPipelineStage((stage) => Math.min(stage + 1, 4)), 650);
      const image = uploadedImage || await xrayAPI.upload(selectedFile, selectedPatientId);
      setUploadedImage(image);
      const result = await xrayAPI.predict(image.filename, selectedPatientId);
      clearInterval(interval);
      setPipelineStage(4);
      setTimeout(() => navigate(`/results/${result.analysis_id}`), 450);
    } catch (err) {
      if (interval) clearInterval(interval);
      setAnalyzing(false);
      setError(err.response?.data?.detail || 'Analysis could not be completed. Check the file and try again.');
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <header className="upload-heading">
          <div className="upload-eyebrow"><FileCheck2 size={15} /> Imaging workflow</div>
          <div className="upload-title-row">
            <div>
              <h1>Upload a chest X-ray</h1>
              <p>Prepare a radiograph for AI-assisted analysis and report generation.</p>
            </div>
            <div className="upload-private"><LockKeyhole size={15} /> Secure session</div>
          </div>
        </header>

        <div className="upload-notice" role="note">
          <ShieldCheck size={19} />
          <div><strong>Research decision-support prototype</strong><span>Results are not a diagnosis. Have findings reviewed by a qualified medical professional.</span></div>
        </div>

        {error && <div className="upload-error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}

        <section className="upload-card patient-card" aria-labelledby="patient-heading">
          <div className="upload-card-heading">
            <span className="upload-step">01</span>
            <div><h2 id="patient-heading">Patient</h2><p>Assign this analysis to a registered patient.</p></div>
          </div>
          <div className="patient-control-row">
            <label className="patient-select-wrap">
              <span><UserRound size={16} /> Select patient</span>
              <select value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)}>
                <option value="">Choose a patient</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.id} · {patient.full_name}</option>)}
              </select>
            </label>
            <button className="register-patient-button" type="button" onClick={() => navigate('/register-patient')}>
              <ClipboardPlus size={17} /> Register patient
            </button>
          </div>
        </section>

        <section className="upload-card image-card" aria-labelledby="file-heading">
          <div className="upload-card-heading">
            <span className="upload-step">02</span>
            <div><h2 id="file-heading">Radiograph file</h2><p>Upload one frontal chest radiograph in a supported format.</p></div>
          </div>

          {!selectedFile ? (
            <div
              className={`dropzone ${dragOver ? 'dropzone-active' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click(); }}
              role="button"
              tabIndex={0}
              aria-label="Choose or drop a chest radiograph file"
            >
              <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.dicom,.dcm" onChange={(event) => handleFileSelect(event.target.files?.[0])} />
              <div className="dropzone-icon"><FileUp size={25} /></div>
              <h3>Drop your file here</h3>
              <p>or <span>browse files</span> on your device</p>
              <div className="file-format-list"><span>PNG</span><span>JPG</span><span>JPEG</span><span>DICOM</span><i /> Up to 25 MB</div>
            </div>
          ) : (
            <div className="selected-file-card">
              <div className="selected-file-icon"><FileCheck2 size={21} /></div>
              <div className="selected-file-info"><strong>{fileDetails?.name}</strong><span>{fileDetails?.type} · {fileDetails?.size}</span></div>
              <span className="file-ready"><CheckCircle2 size={15} /> Ready</span>
              <button type="button" className="remove-file-button" onClick={handleRemoveFile} disabled={analyzing} aria-label="Remove selected file"><X size={17} /></button>
            </div>
          )}
          <div className="upload-helper"><LockKeyhole size={14} /> Your selected file is used for this analysis workflow.</div>
          {qualityReview && <div className="quality-review" role="status"><div className="quality-review-head"><ShieldCheck size={17} /><div><strong>Technical image checks</strong><span>{qualityReview.quality_status}</span></div></div><div className="quality-check-list">{(qualityReview.quality_checks || []).map((check) => <div key={check.code} className={check.status === 'review' ? 'quality-check quality-check-review' : 'quality-check'}><span>{check.status === 'review' ? 'Review' : 'OK'}</span><div><b>{check.label}</b><small>{check.detail}</small></div></div>)}</div><p>{qualityReview.quality_advisory} Continue to analysis even when a technical check needs review.</p></div>}
        </section>

        {analyzing ? (
          <section className="analysis-progress" aria-live="polite">
            <div className="progress-title"><Cpu size={19} /><div><strong>Analysis in progress</strong><span>Processing the radiograph through the analysis pipeline.</span></div><b>{pipelineStage + 1} / 5</b></div>
            <div className="progress-track"><div style={{ width: `${((pipelineStage + 1) / 5) * 100}%` }} /></div>
            <ol className="pipeline-list">{pipelineStages.map((stage, index) => <li className={index < pipelineStage ? 'complete' : index === pipelineStage ? 'current' : ''} key={stage}>{index < pipelineStage ? <CheckCircle2 size={16} /> : <Circle size={16} />}<span>{stage}</span></li>)}</ol>
          </section>
        ) : (
          <div className="upload-submit-row">
            <p>By continuing, you confirm this image is being submitted for research decision support.</p>
            <button className="analyze-button" type="button" onClick={handleAnalyze} disabled={!selectedFile || !selectedPatientId}>
              {qualityReview ? 'Continue to analysis' : 'Check image quality'} <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
