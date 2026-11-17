import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Inbox, Mail, MessageSquareText, RefreshCw } from 'lucide-react';
import { adminAPI, authAPI } from '../services/api';
import './ContactInboxPage.css';

export default function ContactInboxPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = authAPI.getCurrentUser();
  const refresh = () => { setLoading(true); adminAPI.getMessages().then(setMessages).catch((err) => setError(err.response?.status === 401 ? 'Sign in with a staff account to view project inquiries.' : 'The project inbox could not be loaded.')).finally(() => setLoading(false)); };
  useEffect(() => { refresh(); }, []);
  return <main className="contact-inbox-page"><div className="contact-inbox-shell"><Link className="inbox-back" to="/admin"><ArrowLeft size={14} /> Administration</Link><header className="inbox-heading"><div><span><Inbox size={14} /> PROJECT INBOX · {currentUser?.username || 'STAFF ACCESS'}</span><h1>Research inquiries</h1><p>Contact form submissions stored in this project database.</p></div><button type="button" onClick={refresh} aria-label="Refresh inbox"><RefreshCw size={15} /></button></header>{error ? <div className="inbox-state" role="alert"><p>{error}</p><Link to="/admin">Go to staff sign in</Link></div> : loading ? <div className="inbox-state">Loading messages…</div> : messages.length ? <div className="inbox-list">{messages.map((item) => <article className="inbox-card" key={item.id}><div className="inbox-card-top"><span className="inbox-type"><MessageSquareText size={13} /> {item.inquiry_type}</span><time>{new Date(`${item.created_at}Z`).toLocaleString()}</time></div><h2>{item.subject}</h2><div className="inbox-sender">{item.name} · <a href={`mailto:${item.email}`}><Mail size={12} /> {item.email}</a></div><p>{item.message}</p></article>)}</div> : <div className="inbox-state"><Inbox size={27} /><h2>Your inbox is clear</h2><p>New inquiries submitted through Contact will appear here.</p></div>}</div></main>;
}
