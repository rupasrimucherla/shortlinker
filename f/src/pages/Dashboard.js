import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const BASE = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';

export default function Dashboard(){
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  async function fetchLinks(){
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/links`);
      const json = await res.json();
      setLinks(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ fetchLinks(); }, []);

  async function handleCreate(e){
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const body = { target_url: targetUrl };
      if (code) body.code = code;
      const r = await fetch(`${API}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.status === 201) {
        setTargetUrl(''); setCode(''); fetchLinks();
      } else {
        const j = await r.json();
        setError(j.error || 'Failed to create');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(c){
    if (!window.confirm('Delete this link?')) return;
    try {
      await fetch(`${API}/api/links/${c}`, { method: 'DELETE' });
      fetchLinks();
    } catch (e) {
      console.error(e);
    }
  }

  function copyToClipboard(short){
    navigator.clipboard.writeText(short).then(()=> {
      const prev = document.getElementById('copy-msg');
      if (prev) prev.innerText = 'Copied!';
      setTimeout(()=> { if (prev) prev.innerText = ''; }, 1200);
    });
  }

  return (
    <div className="container">
      <div className="grid grid-2">
        <div className="card">
          <h1 style={{marginTop:0}}>TinyLink</h1>
          <p className="muted">Create short links and view basic stats.</p>

          <form onSubmit={handleCreate} style={{marginTop:12}}>
            <div style={{display:'flex', gap:8, marginBottom:8}}>
              <input style={{flex:1}} placeholder="https://example.com/very/long/url" value={targetUrl} onChange={e=>setTargetUrl(e.target.value)} required />
              <input placeholder="custom (optional)" value={code} onChange={e=>setCode(e.target.value)} />
              <button disabled={creating} style={{background:'#06b6d4', color:'#042029'}}>Create</button>
            </div>
            {error && <div style={{color:'#ffb4b4'}}>{error}</div>}
            <div id="copy-msg" className="muted" style={{marginTop:8}}></div>
          </form>

          <div style={{marginTop:18}}>
            {loading ? <div className="muted">Loading links...</div> : (
              <table>
                <thead>
                  <tr><th>Code</th><th>Target</th><th>Clicks</th><th>Last</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {links.length===0 && <tr><td colSpan="5" className="muted">No links yet</td></tr>}
                  {links.map(l => (
                    <tr key={l.code}>
                      <td><Link to={`/code/${l.code}`}>{l.code}</Link></td>
                      <td title={l.target_url} style={{maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{l.target_url}</td>
                      <td>{l.total_clicks}</td>
                      <td>{l.last_clicked ? new Date(l.last_clicked).toLocaleString() : '-'}</td>
                      <td>
                        <button onClick={()=>copyToClipboard(`${BASE}/${l.code}`)} style={{marginRight:8}}>Copy</button>
                        <button onClick={()=>handleDelete(l.code)} style={{background:'transparent', color:'#ff7b7b'}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Quick Tips</h3>
          <ul className="muted">
            <li>Use custom codes only with letters and numbers (6–8 chars)</li>
            <li>Click a code to view detailed stats</li>
            <li>Copy button copies the public short URL</li>
          </ul>
          <div style={{marginTop:12}}>
            <a href="/healthz" target="_blank" rel="noreferrer">Health check</a>
          </div>
        </div>
      </div>
    </div>
  );
}
