'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AdminContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (key !== 'saral2026') {
      setError('Unauthorized access. Please provide the correct security key.');
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const res = await fetch(`/api/rsvp/stats?key=${key}`);
        const result = await res.json();
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [key]);

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">Loading Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="error-state">
          <h1>Access Denied</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { stats, responses } = data;

  const handleExport = () => {
    window.location.href = `/api/rsvp/export?key=${key}`;
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-top">
          <h1>RSVP Analysis Dashboard</h1>
          <button onClick={handleExport} className="export-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download CSV
          </button>
        </div>
        <p className="subtitle">Live response tracking for Sonal's Baby Shower</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total RSVPs</span>
          <span className="stat-value">{stats.totalResponses}</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Total Guests (Attending)</span>
          <span className="stat-value">{stats.totalGuests}</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Attending (Yes)</span>
          <span className="stat-value">{stats.attendingYes}</span>
        </div>
        <div className="stat-card red">
          <span className="stat-label">Total No</span>
          <span className="stat-value">{stats.attendingNo}</span>
        </div>
        <div className="stat-card gold">
          <span className="stat-label">Photos Uploaded</span>
          <span className="stat-value">{stats.imagesUploaded}</span>
        </div>
      </div>

      <div className="analysis-grid">
        <div className="analysis-section gender-section">
          <h2>Gender Guesses</h2>
          <div className="guess-bars">
            {Object.entries(stats.genderGuess).map(([label, count]) => (
              <div key={label} className="guess-item">
                <div className="guess-info">
                  <span className="guess-label">{label}</span>
                  <span className="guess-count">{count}</span>
                </div>
                <div className="guess-bar-bg">
                  <div 
                    className={`guess-bar-fill ${label.toLowerCase()}`} 
                    style={{ width: `${(count / stats.totalResponses) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-section attendance-section">
          <h2>Attendance Rate</h2>
          <div className="donut-stat">
            <div className="donut-center">
              <span className="percentage">
                {stats.totalResponses > 0 ? Math.round((stats.attendingYes / stats.totalResponses) * 100) : 0}%
              </span>
              <span className="donut-label">Acceptance</span>
            </div>
          </div>
        </div>
      </div>

      <div className="gallery-section">
        <div className="section-header">
          <h2>Photo Gallery</h2>
          <span className="count-tag">{responses.filter(r => r.hasImage).length} photos</span>
        </div>
        <div className="gallery-grid">
          {responses.filter(r => r.hasImage).map((r) => (
            <div key={r.id} className="gallery-card">
              <div className="gallery-image-container">
                <img src={r.imageUrl} alt={r.name} loading="lazy" />
                <a 
                  href={`/api/rsvp/download?url=${encodeURIComponent(r.imageUrl)}&filename=rsvp-${r.name.replace(/\s+/g, '-').toLowerCase()}.jpg`}
                  className="download-overlay"
                  title="Download Photo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </a>
              </div>
              <div className="gallery-info">
                <p className="guest-name">{r.name}</p>
              </div>
            </div>
          ))}
          {responses.filter(r => r.hasImage).length === 0 && (
            <p className="empty-msg">No photos uploaded yet.</p>
          )}
        </div>
      </div>

      <div className="responses-section">
        <h2>Detailed Responses</h2>
        <div className="table-wrapper">
          <table className="responses-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Guests</th>
                <th>Guess</th>
                <th>Photo</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className={r.attending === 'yes' ? 'status-yes' : 'status-no'}>
                    {r.attending === 'yes' ? 'Attending' : 'Declined'}
                  </td>
                  <td>{r.guestsCount}</td>
                  <td>{r.genderGuess || '-'}</td>
                  <td>
                    {r.hasImage ? (
                      <div className="table-actions">
                        <span>✅</span>
                        <a 
                          href={`/api/rsvp/download?url=${encodeURIComponent(r.imageUrl)}&filename=rsvp-${r.name.replace(/\s+/g, '-').toLowerCase()}.jpg`} 
                          className="row-link" 
                          title="Download Photo"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                        </a>
                      </div>
                    ) : '❌'}
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #333;
          font-family: 'Inter', sans-serif;
          background: #fdfbf7;
          min-height: 100vh;
        }
        .admin-header {
          margin-bottom: 40px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 10px;
        }
        h1 {
          font-size: 2.5rem;
          color: #D4806A;
          margin: 0;
        }
        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #D4806A;
          color: white;
          border: none;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        .export-btn:hover {
          background: #B85940;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212, 128, 106, 0.3);
        }
        .subtitle {
          color: #777;
          font-style: italic;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          border-top: 4px solid #D4806A;
        }
        .stat-card.accent { border-color: #E8C07A; }
        .stat-card.green { border-color: #7DA47D; }
        .stat-card.red { border-color: #D46A6A; }
        .stat-card.gold { border-color: #C9963E; }
        
        .stat-label {
          font-size: 0.85rem;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
        }
        .analysis-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }
        @media (max-width: 768px) {
          .analysis-grid { grid-template-columns: 1fr; }
        }
        .analysis-section {
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        h2 {
          font-size: 1.4rem;
          color: #333;
          margin-bottom: 20px;
        }
        .guess-item {
          margin-bottom: 15px;
        }
        .guess-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 0.95rem;
        }
        .guess-bar-bg {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .guess-bar-fill {
          height: 100%;
          border-radius: 4px;
        }
        .guess-bar-fill.boy { background: #89CFF0; }
        .guess-bar-fill.girl { background: #F4C2C2; }
        .guess-bar-fill.surprise { background: #C9963E; }
        .guess-bar-fill.unspecified { background: #DDD; }

        .donut-stat {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .donut-center {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 8px solid #E8C07A;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
        }
        .percentage { font-size: 1.8rem; font-weight: 700; color: #D4806A; }
        .donut-label { font-size: 0.75rem; color: #777; }

        .gallery-section {
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          margin-bottom: 40px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .count-tag {
          background: #f0ede6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          color: #777;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 15px;
        }
        .gallery-card {
          border-radius: 12px;
          overflow: hidden;
          background: #fcfcfc;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.2s;
          position: relative;
        }
        .gallery-card:hover { transform: scale(1.03); }
        .gallery-image-container {
          position: relative;
          aspect-ratio: 1;
        }
        .gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .download-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .gallery-card:hover .download-overlay {
          opacity: 1;
        }
        .gallery-info {
          padding: 8px;
          text-align: center;
        }
        .guest-name {
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .table-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .row-link {
          color: #D4806A;
          display: flex;
          align-items: center;
        }
        .row-link:hover { color: #B85940; }

        .responses-section {
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .responses-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        th, td {
          padding: 15px;
          border-bottom: 1px solid #eee;
        }
        th {
          font-weight: 600;
          color: #777;
          text-transform: uppercase;
          font-size: 0.8rem;
        }
        .status-yes { color: #5B8C5B; font-weight: 600; }
        .status-no { color: #B25353; font-weight: 600; }
        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          text-align: center;
        }
        .error-state h1 { color: #D46A6A; }
        .empty-msg { grid-column: 1/-1; text-align: center; color: #777; padding: 40px; }
      `}</style>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminContent />
    </Suspense>
  );
}
