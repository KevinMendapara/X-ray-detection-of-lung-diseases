import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, UploadCloud, Users, FileText, BookOpen,
  Info, Mail, ShieldAlert, LogIn, LogOut, CheckCircle, Menu, X
} from 'lucide-react';
import { authAPI } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authAPI.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    setCurrentUser(authAPI.getCurrentUser());
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard', icon: Activity },
    { name: 'Upload X-Ray', path: '/upload', icon: UploadCloud, highlight: true },
    { name: 'Register patient', path: '/register-patient', icon: Users },
    { name: 'History', path: '/history', icon: FileText },
    { name: 'TB Education', path: '/education', icon: BookOpen },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Mail },
    { name: 'Admin', path: '/admin', icon: ShieldAlert }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await authAPI.login(usernameInput, passwordInput);
      setCurrentUser(data.user);
      setLoginModalOpen(false);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 text-decoration-none group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1769AA] to-[#17A2A4] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="font-extrabold text-xl tracking-tight text-[#183153] flex items-center gap-1.5">
                  Pulmo<span className="text-[#1769AA]">Vision</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-50 text-[#1769AA] border border-blue-200 rounded">ICMR v1.0</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Explainable Chest Radiograph Analysis</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                if (link.highlight) {
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="ml-2 mr-1 px-3.5 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12558a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      {link.name}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-[#1769AA] font-bold'
                        : 'text-slate-600 hover:text-[#1769AA] hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Account / Auth */}
            <div className="hidden sm:flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.full_name || currentUser.username}</div>
                    <div className="text-[10px] text-[#17A2A4] font-semibold capitalize">{currentUser.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Staff Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-[#1769AA] font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              {currentUser ? (
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md font-medium"
                >
                  Sign Out ({currentUser.username})
                </button>
              ) : (
                <button
                  onClick={() => { setLoginModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#1769AA] hover:bg-blue-50 rounded-md font-semibold"
                >
                  Staff Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Staff Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center">
                  <LogIn className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Staff Portal Authentication</h3>
              </div>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="mt-4 space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/20 focus:border-[#1769AA]"
                  required
                />
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-[11px] text-[#1769AA]">
                <strong>Default Demo Credentials:</strong><br />
                User: <code className="bg-white px-1 py-0.5 rounded border border-blue-200">admin</code> | Pass: <code className="bg-white px-1 py-0.5 rounded border border-blue-200">admin123</code>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12558a] text-xs font-semibold text-white shadow-sm"
                >
                  {loginLoading ? 'Verifying...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
