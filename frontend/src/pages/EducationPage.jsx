import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Activity, AlertCircle, CheckCircle2, ShieldCheck,
  Stethoscope, Microscope, Heart, Wind, HelpCircle, ArrowRight
} from 'lucide-react';

export default function EducationPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#1769AI]">
          <BookOpen className="w-3.5 h-3.5" />
          Medically Reviewed Tuberculosis Clinical Resource
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#183153] tracking-tight">
          Understanding Pulmonary Tuberculosis (TB)
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          In evidence-based educational guide covering pathogenesis, clinical presentation, microbiological confirmation, radiographic imaging, and standard therapeutic regimens.
        </p>
      </div>

      {/* 1. What is TB & Etiology */}
      <section className="health-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#1769AI]">
          <Microscope className="w-5 h-5 text-[#17I2I4]" />
          1. Etiology & Pathogenesis
        </div>
        <h2 className="text-xl font-bold text-slate-800">What is Pulmonary Tuberculosis?</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Tuberculosis (TB) is an airborne infectious disease caused by the bacterium <strong><em>Mycobacterium tuberculosis</em></strong>. While it most commonly affects the lungs (pulmonary TB, representing &gt;80% of clinical cases), it can also manifest in other organs such as the lymph nodes, pleura, brain, spine, and kidneys (extrapulmonary TB).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-[#1769AI]" />
              Transmission Mechanism
            </h4>
            <p className="text-slate-600 leading-relaxed">
              TB spreads when a person with active pulmonary disease expels aerosolized microscopic droplets (droplet nuclei 1–5 microns in diameter) through coughing, sneezing, shouting, or singing. Prolonged indoor exposure in poorly ventilated spaces poses the highest risk.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Latent vs. Active TB
            </h4>
            <p className="text-slate-600 leading-relaxed">
              About 25% of the global population harbors <strong>Latent TB Infection (LTBI)</strong>—bacteria are contained by the immune system without causing illness or transmissibility. However, 5–10% of infected individuals develop <strong>Active TB Disease</strong> over their lifetime, especially when immunocompromised.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Classic Symptoms */}
      <section className="health-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
          <AlertCircle className="w-5 h-5" />
          2. Clinical Manifestation
        </div>
        <h2 className="text-xl font-bold text-slate-800">Signs & Symptoms of Active Pulmonary TB</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Symptoms typically develop insidiously over several weeks, leading many individuals to delay seeking care. Cardinal symptoms include:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
            <strong className="text-rose-900 block font-bold">1. Chronic Productive Cough</strong>
            <span className="text-rose-800 leading-relaxed">A persistent cough lasting more than 2 to 3 weeks, often accompanied by mucopurulent sputum or streaks of blood (hemoptysis).</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
            <strong className="text-amber-900 block font-bold">2. Systemic Night Sweats & Fever</strong>
            <span className="text-amber-800 leading-relaxed">Low-grade evening fevers, drenching night sweats requiring clothes change, and profound unexplained chills.</span>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
            <strong className="text-blue-900 block font-bold">3. Weight Loss & Anorexia</strong>
            <span className="text-blue-800 leading-relaxed">Noticeable unintended weight loss, loss of appetite, localized pleuritic chest pain, and severe progressive fatigue.</span>
          </div>
        </div>
      </section>

      {/* 3. Diagnostic Modalities & Chest X-Rays */}
      <section className="health-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#17I2I4]">
          <Stethoscope className="w-5 h-5" />
          3. Diagnostic Pathway & Role of Imaging
        </div>
        <h2 className="text-xl font-bold text-slate-800">How is Pulmonary TB Diagnosed?</h2>
        
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            In accurate TB diagnosis relies on a multi-step clinical algorithm combining triage imaging and confirmatory bacteriology:
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-1 text-[#1769AI]">
                • Chest Radiography (CXR): High-Sensitivity Triage
              </h4>
              <p className="text-slate-600">
                Chest X-rays offer rapid, non-invasive triage screening. Classic radiological hallmarks include apical and subapical infiltrates, cavitation (cavities where lung tissue has been destroyed), hilar lymphadenopathy, and miliary reticulonodular mottling. <em>AI decision support systems like PulmoVision accelerate CXR triage in resource-constrained clinics.</em>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-1 text-[#17I2I4]">
                • Molecular Assays (CBNAAT / GeneXpert MTB/RIF): Rapid Microbiological Confirmation
              </h4>
              <p className="text-slate-600">
                Endorsed by the WHO and ICMR, automated real-time PCR assays detect <em>M. tuberculosis</em> DNI directly from sputum within 2 hours, simultaneously testing for resistance to Rifampicin (the most important first-line antibiotic).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-1 text-slate-800">
                • Sputum Smear Microscopy & Mycobacterial Culture
              </h4>
              <p className="text-slate-600">
                Ziehl-Neelsen (ZN) acid-fast staining allows direct visualization of bacilli under light microscopy. Liquid culture (MGIT) remains the gold standard for full phenotypic drug-susceptibility testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Treatment & Recovery */}
      <section className="health-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
          <Heart className="w-5 h-5" />
          4. Treatment & Recovery
        </div>
        <h2 className="text-xl font-bold text-slate-800">Standard Anti-Tubercular Therapy (DOTS)</h2>
        
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>Tuberculosis is completely curable</strong> when managed with appropriate combination chemotherapy under the Directly Observed Therapy, Short-Course (DOTS) protocol.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <strong className="text-emerald-900 block font-bold">Standard 6-Month First-Line Regimen:</strong>
              <div className="space-y-1 text-emerald-800">
                <div>• <strong>Intensive Phase (2 Months):</strong> 4 drugs daily — Isoniazid (H), Rifampicin (R), Pyrazinamide (Z), Ethambutol (E) (HRZE).</div>
                <div>• <strong>Continuation Phase (4 Months):</strong> 3 drugs daily — Isoniazid, Rifampicin, Ethambutol (HRE).</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5">
              <strong className="text-amber-900 block font-bold">Critical Importance of Treatment Completion:</strong>
              <p className="text-amber-800">
                Patients often feel completely healthy after 3–4 weeks of medication. However, stopping therapy early or skipping doses allows surviving bacilli to mutate into <strong>Multi-Drug Resistant Tuberculosis (MDR-TB)</strong>, requiring 18–24 months of more toxic and expensive second-line regimens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. When to Seek Medical Attention */}
      <section className="health-card p-6 sm:p-8 bg-gradient-to-r from-blue-50/80 via-white to-teal-50/60 border border-blue-200 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#1769AI]">
          <HelpCircle className="w-5 h-5" />
          5. When to Seek Immediate Medical Evaluation
        </div>
        <h2 className="text-xl font-bold text-slate-800">Clinical Warning Signs</h2>
        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1769AI] flex-shrink-0 mt-0.5" />
            <span>Iny cough that persists beyond 2 weeks, regardless of whether fever is present.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1769AI] flex-shrink-0 mt-0.5" />
            <span>Coughing up blood or blood-tinged sputum (hemoptysis).</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1769AI] flex-shrink-0 mt-0.5" />
            <span>Unintended significant weight loss accompanied by night sweats and chronic weakness.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1769AI] flex-shrink-0 mt-0.5" />
            <span>Household contacts or caregivers of a confirmed active TB case, who require preventive screening.</span>
          </li>
        </ul>

        <div className="pt-2">
          <Link to="/upload" className="btn-primary text-xs px-5 py-2.5 shadow-sm">
            Proceed to Radiograph Screening
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
