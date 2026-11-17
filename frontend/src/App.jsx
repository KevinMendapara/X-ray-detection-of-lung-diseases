import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PatientRegistrationPage from './pages/PatientRegistrationPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import GradCamPage from './pages/GradCamPage';
import ReportDetailPage from './pages/ReportDetailPage';
import HistoryPage from './pages/HistoryPage';
import EducationPage from './pages/EducationPage';
import ContactPage from './pages/ContactPage';
import PatientDetailPage from './pages/PatientDetailPage';
import ContactInboxPage from './pages/ContactInboxPage';
import AdminPage from './pages/AdminPage';

function AppLayout() {
  const location = useLocation();
  const compactResults = /^\/results\/[^/]+$/.test(location.pathname);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-blue-100 selection:text-[#1769AA]">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/overview" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/register-patient" element={<PatientRegistrationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/gradcam/:id" element={<GradCamPage />} />
          <Route path="/report/:id" element={<ReportDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/messages" element={<ContactInboxPage />} />
        </Routes>
      </main>
      {!compactResults && <Footer />}
    </div>
  );
}

export default function App() {
  return <Router><AppLayout /></Router>;
}