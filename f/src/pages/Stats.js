import React, {useEffect, useState} from 'react';
import { useParams, Link } from 'react-router-dom';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

export default function Stats(){
  const { code } = useParams();
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    async function load(){
      try {
        const r = await fetch(`${API}/api/links/${code}`);
        if (r.status === 200) setData(await r.json());
        else setData({ error: 'Not found' });
      } catch (e) {
        setData({ error: 'Network' });
      } finally {
        setLoading(false);
      }
    }
    load();
  },[code]);

  if (loading) return <div className="container"><div className="card">Loading...</div></div>;
  if (data && data.error) return <div className="container"><div className="card">{data.error} — <Link to='/'>Back</Link></div></div>;

  return (
    <div className="container">
      <div className="card">
        <h2>Stats — {code}</h2>
        <div style={{marginTop:8}}>
          <div><strong>Target:</strong> <a href={data.target_url} target="_blank" rel="noreferrer">{data.target_url}</a></div>
          <div><strong>Clicks:</strong> {data.total_clicks}</div>
          <div><strong>Created:</strong> {new Date(data.created_at).toLocaleString()}</div>
          <div><strong>Last clicked:</strong> {data.last_clicked ? new Date(data.last_clicked).toLocaleString() : '-'}</div>
        </div>
        <div style={{marginTop:12}}><Link to="/">Back to dashboard</Link></div>
      </div>
    </div>
  );
}
