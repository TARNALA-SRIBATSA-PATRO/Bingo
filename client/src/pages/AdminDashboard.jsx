import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './AdminDashboard.css';

// SVG Icons
const LockIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ClockIcon = ({ size = 20, color = "#f59e0b" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);


const UsersIcon = ({ size = 20, color = "#6366f1" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DownloadIcon = ({ size = 20, color = "#22c55e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const BellIcon = ({ size = 20, color = "#f59e0b" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const BotIcon = ({ size = 20, color = "#ec4899" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const TrophyIcon = ({ size = 20, color = "#eab308" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
    <path d="M4 4h16v7a8 8 0 0 1-16 0V4z" />
  </svg>
);

const RefreshIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export default function AdminDashboard() {
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem('bingo_admin_token') || '';
    } catch {
      return '';
    }
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  // Time Filter State
  const [rangeMode, setRangeMode] = useState('7days'); // 'today', '7days', '30days', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Push Broadcast & Scheduling State
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushUrl, setPushUrl] = useState('/lobby');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState(null);

  // Delivery Mode: 'instant' vs 'scheduled'
  const [deliveryMode, setDeliveryMode] = useState('instant');
  const [scheduledDateTime, setScheduledDateTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [scheduledList, setScheduledList] = useState([]);

  // Snapshot Vault & Container Redeployment Detection
  const [redeployAlert, setRedeployAlert] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef(null);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState(null);

  // Compute query dates based on rangeMode
  const queryParams = useMemo(() => {
    const now = new Date();
    let start = '';
    let end = now.toISOString().split('T')[0];

    if (rangeMode === 'today') {
      start = end;
    } else if (rangeMode === '7days') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = d.toISOString().split('T')[0];
    } else if (rangeMode === '30days') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = d.toISOString().split('T')[0];
    } else if (rangeMode === 'custom') {
      start = customStart;
      end = customEnd;
    }

    return { startDate: start, endDate: end };
  }, [rangeMode, customStart, customEnd]);

  // Fetch Dashboard Stats & Scheduled Queue
  const fetchDashboardData = useCallback(async (authToken = token) => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (queryParams.startDate) query.append('startDate', queryParams.startDate);
      if (queryParams.endDate) query.append('endDate', queryParams.endDate);

      const [statsRes, historyRes, scheduledRes] = await Promise.all([
        fetch(`/api/admin/stats?${query.toString()}`, {
          headers: { 'x-admin-token': authToken }
        }),
        fetch('/api/admin/push/history', {
          headers: { 'x-admin-token': authToken }
        }),
        fetch('/api/admin/push/scheduled', {
          headers: { 'x-admin-token': authToken }
        })
      ]);

      if (statsRes.status === 401) {
        setToken('');
        sessionStorage.removeItem('bingo_admin_token');
        setAuthError('Session expired. Please log in again.');
        return;
      }

      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      const scheduledData = scheduledRes.ok ? await scheduledRes.json() : null;

      if (statsData.success) {
        const currentStats = statsData.stats;
        setStats(currentStats);

        // Check local vault snapshot to see if Render container was redeployed and wiped
        try {
          const rawVault = localStorage.getItem('_b_admin_stats_vault');
          if (rawVault) {
            const savedSnapshot = JSON.parse(rawVault);
            const savedBotTotal = savedSnapshot?.stats?.botOverview?.totalMatches || savedSnapshot?.backupData?.botStats?.totalMatches || 0;
            const currentBotTotal = currentStats?.botOverview?.totalMatches || 0;

            if (currentBotTotal === 0 && savedBotTotal > 0) {
              setRedeployAlert({
                savedMatches: savedBotTotal,
                savedUsers: savedSnapshot?.stats?.overview?.totalUsers || Object.keys(savedSnapshot?.backupData?.users || {}).length || 0,
                timestamp: savedSnapshot?.timestamp || Date.now(),
                snapshotData: savedSnapshot?.backupData || savedSnapshot?.stats
              });
            } else {
              setRedeployAlert(null);
            }
          }

          // If currentStats has data, update the local vault snapshot silently
          if ((currentStats?.botOverview?.totalMatches || 0) > 0 || (currentStats?.overview?.totalUsers || 0) > 0) {
            // Also fetch raw backup silently for exact store restoration
            fetch('/api/admin/backup/export', { headers: { 'x-admin-token': authToken } })
              .then(r => r.json())
              .then(bData => {
                localStorage.setItem('_b_admin_stats_vault', JSON.stringify({
                  stats: currentStats,
                  backupData: bData.backup || null,
                  timestamp: Date.now()
                }));
              })
              .catch(() => {
                localStorage.setItem('_b_admin_stats_vault', JSON.stringify({
                  stats: currentStats,
                  timestamp: Date.now()
                }));
              });
          }
        } catch {}
      }
      if (historyData.success) {
        setHistoryList(historyData.history || []);
      }
      if (scheduledData && scheduledData.success) {
        setScheduledList(scheduledData.scheduled || []);
      }
    } catch (err) {
      console.warn('[Admin] Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, queryParams]);

  // Fetch only the scheduled notifications list
  const fetchScheduledQueue = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/push/scheduled', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (data.success) {
        setScheduledList(data.scheduled || []);
      }
    } catch {}
  }, [token]);

  // Calculate user-friendly relative countdown string
  function getRelativeTimeDesc(dateTimeStr) {
    if (!dateTimeStr) return '';
    const diffMs = new Date(dateTimeStr).getTime() - Date.now();
    if (diffMs <= 0) return 'momentarily';
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `~${mins} minute(s)`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return `~${hours}h ${remMins}m`;
    const days = Math.round(hours / 24);
    return `~${days} day(s)`;
  }

  // Restore saved snapshot to server
  async function handleRestoreSnapshot() {
    if (!redeployAlert?.snapshotData) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ backupData: redeployAlert.snapshotData })
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRedeployAlert(null);
        alert('All bot matches and metrics successfully restored to server!');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to restore snapshot');
      }
    } catch {
      alert('Error connecting to server to restore snapshot');
    } finally {
      setIsRestoring(false);
    }
  }

  // Export complete analytics backup file
  async function handleExportBackup() {
    try {
      const res = await fetch('/api/admin/backup/export', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (data.success && data.backup) {
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bingo-analytics-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Failed to export backup: ' + err.message);
    }
  }

  // Import analytics backup file
  async function handleImportBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ backupData })
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRedeployAlert(null);
        alert('Backup successfully imported! All stats merged.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to import backup');
      }
    } catch (err) {
      alert('Invalid backup file format: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Initial fetch and periodic auto-refresh every 20 seconds
  useEffect(() => {
    if (token) {
      fetchDashboardData(token);
      const interval = setInterval(() => {
        fetchDashboardData(token);
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [token, fetchDashboardData]);

  // Handle Login
  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsLoggingIn(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      const data = await res.json();

      if (res.status === 429) {
        setLockoutRemaining(data.remainingSeconds || 900);
        setAuthError(data.error || 'Too many attempts. Account locked.');
        return;
      }

      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Invalid password.');
        return;
      }

      setToken(data.token);
      sessionStorage.setItem('bingo_admin_token', data.token);
      setPasswordInput('');
      fetchDashboardData(data.token);
    } catch {
      setAuthError('Connection error. Server unreachable.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  // Handle Logout
  function handleLogout() {
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      }).catch(() => {});
    }
    setToken('');
    sessionStorage.removeItem('bingo_admin_token');
    setStats(null);
  }

  // Handle Push Send (Instant Broadcast or Scheduled for later)
  async function handleSendPush(e) {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMessage.trim()) return;

    if (deliveryMode === 'scheduled') {
      const scheduledMs = new Date(scheduledDateTime).getTime();
      if (isNaN(scheduledMs) || scheduledMs <= Date.now()) {
        setPushFeedback({
          type: 'error',
          text: 'Please select a future date and time for scheduled notification.'
        });
        return;
      }
    }

    setIsSendingPush(true);
    setPushFeedback(null);

    try {
      const endpoint = deliveryMode === 'scheduled' ? '/api/admin/push/schedule' : '/api/admin/push/send';
      const payload = {
        title: pushTitle.trim(),
        message: pushMessage.trim(),
        url: pushUrl.trim() || '/lobby',
        ...(deliveryMode === 'scheduled' ? { scheduledAt: new Date(scheduledDateTime).toISOString() } : {})
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (deliveryMode === 'scheduled') {
          setPushFeedback({
            type: 'success',
            text: `Notification scheduled successfully for ${new Date(scheduledDateTime).toLocaleString()}! It will automatically broadcast to all devices at the specified time.`
          });
          setPushTitle('');
          setPushMessage('');
          fetchScheduledQueue();
        } else {
          setPushFeedback({
            type: 'success',
            text: `Notification dispatched successfully! Delivered to ${data.deliveredCount} phone(s)/device(s). ${data.failedCount > 0 ? `(${data.failedCount} expired unsubscribed)` : ''}`
          });
          setPushTitle('');
          setPushMessage('');
          fetchDashboardData();
        }
      } else {
        setPushFeedback({ type: 'error', text: data.error || 'Failed to dispatch push notification.' });
      }
    } catch {
      setPushFeedback({ type: 'error', text: 'Network error sending notification.' });
    } finally {
      setIsSendingPush(false);
    }
  }

  // Handle Cancel Scheduled Notification
  async function handleCancelScheduled(id) {
    if (!window.confirm('Are you sure you want to cancel this scheduled notification?')) return;
    try {
      const res = await fetch(`/api/admin/push/scheduled/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (data.success) {
        setScheduledList((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.error || 'Failed to cancel scheduled notification');
      }
    } catch {
      alert('Network error while canceling scheduled notification.');
    }
  }


  // Handle Change Password
  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdFeedback({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdFeedback({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd
        })
      });

      const data = await res.json();
      if (data.success) {
        setPwdFeedback({ type: 'success', text: 'Password changed successfully!' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPwd('');
          setNewPwd('');
          setConfirmPwd('');
          setPwdFeedback(null);
        }, 1500);
      } else {
        setPwdFeedback({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch {
      setPwdFeedback({ type: 'error', text: 'Network error updating password' });
    }
  }

  // If Not Authenticated: Render Login Card
  if (!token) {
    return (
      <div className="admin-page">
        <div className="admin-login-wrapper">
          <div className="admin-login-card">
            <div className="admin-login-icon">
              <LockIcon size={28} />
            </div>
            <h2>Executive Console</h2>
            <p>Enter the secure password to access the Bingo administrative metrics and push broadcasting station.</p>

            {authError && (
              <div className="admin-error-box">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="admin-form-group">
                <label>Admin Access Key</label>
                <div className="admin-input-wrapper">
                  <input
                    type="password"
                    className="admin-input"
                    placeholder="Enter security password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    disabled={lockoutRemaining > 0 || isLoggingIn}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={lockoutRemaining > 0 || isLoggingIn}
              >
                {isLoggingIn ? 'Authenticating...' : 'Unlock Console'}
              </button>

              <p style={{ marginTop: '14px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
                💡 <em>Notice:</em> If the server was recently redeployed and <code>ADMIN_PASSWORD</code> was not configured in Render, log in with default <code>BingoAdmin2026!</code>.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const botOverview = stats?.botOverview || {};
  const todayHourly = stats?.todayHourlyActivity || [];

  return (
    <div className="admin-page">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1 className="admin-header-title">Bingo Control Center</h1>
          <div className="admin-live-badge">
            <span className="admin-live-dot" />
            <span>{overview.currentlyActiveUsers || 0} Online Right Now</span>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleExportBackup}
            title="Download complete database backup JSON"
            style={{ width: 'auto' }}
          >
            <span>📥 Export</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Restore database backup JSON"
            style={{ width: 'auto' }}
          >
            <span>📤 Import</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportBackup}
          />
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            style={{ width: 'auto' }}
          >
            <RefreshIcon size={14} />
            <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowPasswordModal(true)}
            style={{ width: 'auto' }}
          >
            <LockIcon size={14} />
            <span>Security</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleLogout}
            style={{ width: 'auto', color: '#f87171' }}
          >
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Render Container Redeployment Recovery Banner */}
      {redeployAlert && (
        <div style={{
          margin: '0 0 18px 0',
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(234, 179, 8, 0.12)',
          border: '1px solid rgba(234, 179, 8, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 8px 24px rgba(234, 179, 8, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.6rem' }}>⚡</span>
            <div>
              <strong style={{ color: '#fde047', fontSize: '0.94rem' }}>Render Container Reset Detected</strong>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#fef08a', lineHeight: 1.4 }}>
                The server container was rebuilt on update, but your browser vault holds a saved snapshot ({redeployAlert.savedMatches} bot matches, {redeployAlert.savedUsers} users from {new Date(redeployAlert.timestamp).toLocaleTimeString()}).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleRestoreSnapshot}
            disabled={isRestoring}
            style={{ width: 'auto', background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#000', fontWeight: 'bold' }}
          >
            {isRestoring ? 'Restoring...' : 'Restore Snapshot to Server'}
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-range-pills">
          <button
            type="button"
            className={`admin-range-pill ${rangeMode === 'today' ? 'active' : ''}`}
            onClick={() => setRangeMode('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`admin-range-pill ${rangeMode === '7days' ? 'active' : ''}`}
            onClick={() => setRangeMode('7days')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`admin-range-pill ${rangeMode === '30days' ? 'active' : ''}`}
            onClick={() => setRangeMode('30days')}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`admin-range-pill ${rangeMode === 'custom' ? 'active' : ''}`}
            onClick={() => setRangeMode('custom')}
          >
            Custom Range
          </button>
        </div>

        {rangeMode === 'custom' && (
          <div className="admin-date-inputs">
            <input
              type="date"
              className="admin-date-picker"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span style={{ color: '#94a3b8' }}>to</span>
            <input
              type="date"
              className="admin-date-picker"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}

        {overview.percentageChange !== undefined && (
          <div className={`admin-percentage-pill ${overview.percentageChange >= 0 ? 'positive' : 'negative'}`}>
            <span>{overview.percentageChange >= 0 ? '▲ +' : '▼ '}{overview.percentageChange}%</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>vs previous period</span>
          </div>
        )}
      </div>

      {/* KPI Overview Grid */}
      <div className="admin-kpi-grid">
        {/* Total Downloads / PWA Installs */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">PWA Downloads & Installs</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
              <DownloadIcon size={20} color="#22c55e" />
            </div>
          </div>
          <div className="admin-kpi-value">{overview.pwaInstalledUsers || 0}</div>
          <div className="admin-kpi-subline">
            <span>Installed standalone application members</span>
          </div>
        </div>

        {/* Currently Active Users */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Live Active Right Now</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
              <UsersIcon size={20} color="#6366f1" />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#818cf8' }}>
            {overview.currentlyActiveUsers || 0}
          </div>
          <div className="admin-kpi-subline">
            <span>Pinged heartbeat in the last 5 minutes</span>
          </div>
        </div>

        {/* Total Unique Users in Range */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Active Users In Period</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
              <UsersIcon size={20} color="#ec4899" />
            </div>
          </div>
          <div className="admin-kpi-value">{overview.activeInRangeUsers || overview.totalUsers || 0}</div>
          <div className="admin-kpi-subline">
            <span>Total distinct secret IDs tracked: {overview.totalUsers || 0}</span>
          </div>
        </div>

        {/* Website vs Application Breakdown */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Browser vs App</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <DownloadIcon size={20} color="#f59e0b" />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ fontSize: '1.4rem' }}>
            {overview.pwaInstalledUsers || 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>App</span> / {overview.webBrowserUsers || 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Web</span>
          </div>
          <div className="admin-kpi-subline">
            <span>{overview.totalUsers > 0 ? Math.round(((overview.pwaInstalledUsers || 0) / overview.totalUsers) * 100) : 0}% installed application adoption</span>
          </div>
        </div>

        {/* Multiplayer Rooms & Matches */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Multiplayer Matches</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
              <TrophyIcon size={20} color="#a855f7" />
            </div>
          </div>
          <div className="admin-kpi-value">{overview.totalRoomsCreated || 0}</div>
          <div className="admin-kpi-subline">
            <span>{overview.totalMatchesCompleted || 0} completed multiplayer rounds</span>
          </div>
        </div>

        {/* Push Notification Subscribers */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Push Subscribers</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(234, 179, 8, 0.15)' }}>
              <BellIcon size={20} color="#eab308" />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#facc15' }}>{overview.totalPushSubscribers || 0}</div>
          <div className="admin-kpi-subline">
            <span>Phones & devices receiving alerts</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        {/* Hourly Peak Time Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>Today's Hourly Peak Time</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Traffic distribution by hour (00:00 to 23:00 UTC)
              </p>
            </div>
            {overview.peakHour && (
              <div className="admin-peak-chip">
                Peak Time: {overview.peakHour}
              </div>
            )}
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <svg viewBox="0 0 700 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="40" y1="90" x2="680" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="40" y1="150" x2="680" y2="150" stroke="rgba(255,255,255,0.06)" />

              {/* Bars for 24 hours */}
              {(() => {
                const maxVal = Math.max(...todayHourly, 1);
                const barWidth = 20;
                return todayHourly.map((count, hr) => {
                  const x = 50 + hr * 26;
                  const barHeight = Math.round((count / maxVal) * 120);
                  const y = 150 - barHeight;
                  const isPeak = count === maxVal && maxVal > 0;

                  return (
                    <g key={hr}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeight, 2)}
                        rx="3"
                        fill={isPeak ? '#fbbf24' : '#6366f1'}
                        opacity={isPeak ? 1 : 0.75}
                      >
                        <title>{`${hr}:00 - ${count} active visits`}</title>
                      </rect>
                      {hr % 3 === 0 && (
                        <text
                          x={x + barWidth / 2}
                          y="168"
                          fontSize="10"
                          fill="#94a3b8"
                          textAnchor="middle"
                        >
                          {String(hr).padStart(2, '0')}h
                        </text>
                      )}
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* Platform Breakdown Donut Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <h3>App vs Web Usage</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
            {(() => {
              const pwa = overview.pwaInstalledUsers || 0;
              const web = overview.webBrowserUsers || 0;
              const total = Math.max(pwa + web, 1);
              const pwaPct = Math.round((pwa / total) * 100);
              const webPct = 100 - pwaPct;
              const circumference = 2 * Math.PI * 40;
              const pwaStroke = (pwaPct / 100) * circumference;

              return (
                <>
                  <svg width="130" height="130" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#22c55e"
                      strokeWidth="14"
                      strokeDasharray={`${pwaStroke} ${circumference}`}
                      strokeDashoffset={circumference / 4}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="#6366f1"
                      strokeWidth="14"
                      strokeDasharray={`${circumference - pwaStroke} ${circumference}`}
                      strokeDashoffset={(circumference / 4) - pwaStroke}
                      strokeLinecap="round"
                    />
                    <text x="50" y="54" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">
                      {pwaPct}% App
                    </text>
                  </svg>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e' }} />
                      <span>App ({pwaPct}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#6366f1' }} />
                      <span>Web ({webPct}%)</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Bot Mode Analytics & Win Ratio */}
      <div className="admin-bot-table-card">
        <div className="admin-chart-header">
          <div>
            <h3>Bot Mode Analytics & Win Ratios</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Tracks human vs artificial intelligence win rates across difficulty tiers (includes offline-synced matches)
            </p>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700 }}>
            Total Bot Matches: {botOverview.totalMatches || 0}
          </div>
        </div>

        <div className="admin-bot-diff-grid">
          {/* Beginner */}
          <div className="admin-diff-box">
            <div className="admin-diff-header">
              <span className="admin-diff-tag diff-beginner">Beginner Level</span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {botOverview.beginner?.total || 0} matches
              </span>
            </div>
            <div className="admin-ratio-bars">
              <div className="admin-ratio-bar-wrapper">
                <div className="admin-user-bar" style={{ width: `${botOverview.beginner?.userWinRate || 0}%` }} />
                <div className="admin-bot-bar" style={{ width: `${botOverview.beginner?.botWinRate || 0}%` }} />
              </div>
            </div>
            <div className="admin-ratio-legend">
              <span style={{ color: '#4ade80' }}>
                User Wins: {botOverview.beginner?.userWins || 0} ({botOverview.beginner?.userWinRate || 0}%)
              </span>
              <span style={{ color: '#f87171' }}>
                Bot Wins: {botOverview.beginner?.botWins || 0} ({botOverview.beginner?.botWinRate || 0}%)
              </span>
            </div>
          </div>

          {/* Intermediate */}
          <div className="admin-diff-box">
            <div className="admin-diff-header">
              <span className="admin-diff-tag diff-intermediate">Intermediate Level</span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {botOverview.intermediate?.total || 0} matches
              </span>
            </div>
            <div className="admin-ratio-bars">
              <div className="admin-ratio-bar-wrapper">
                <div className="admin-user-bar" style={{ width: `${botOverview.intermediate?.userWinRate || 0}%` }} />
                <div className="admin-bot-bar" style={{ width: `${botOverview.intermediate?.botWinRate || 0}%` }} />
              </div>
            </div>
            <div className="admin-ratio-legend">
              <span style={{ color: '#4ade80' }}>
                User Wins: {botOverview.intermediate?.userWins || 0} ({botOverview.intermediate?.userWinRate || 0}%)
              </span>
              <span style={{ color: '#f87171' }}>
                Bot Wins: {botOverview.intermediate?.botWins || 0} ({botOverview.intermediate?.botWinRate || 0}%)
              </span>
            </div>
          </div>

          {/* Pro */}
          <div className="admin-diff-box">
            <div className="admin-diff-header">
              <span className="admin-diff-tag diff-pro">Pro Level</span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {botOverview.pro?.total || 0} matches
              </span>
            </div>
            <div className="admin-ratio-bars">
              <div className="admin-ratio-bar-wrapper">
                <div className="admin-user-bar" style={{ width: `${botOverview.pro?.userWinRate || 0}%` }} />
                <div className="admin-bot-bar" style={{ width: `${botOverview.pro?.botWinRate || 0}%` }} />
              </div>
            </div>
            <div className="admin-ratio-legend">
              <span style={{ color: '#4ade80' }}>
                User Wins: {botOverview.pro?.userWins || 0} ({botOverview.pro?.userWinRate || 0}%)
              </span>
              <span style={{ color: '#f87171' }}>
                Bot Wins: {botOverview.pro?.botWins || 0} ({botOverview.pro?.botWinRate || 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Push Notification Station */}
      <div className="admin-push-card">
        <div className="admin-chart-header">
          <div>
            <h3>Push Notification Broadcast Station</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Broadcast instant alerts or schedule automated notifications directly to players' phones & devices
            </p>
          </div>
          <span className="admin-peak-chip" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', borderColor: '#eab308' }}>
            {overview.totalPushSubscribers || 0} Active Subscribed Devices
          </span>
        </div>

        {overview.totalPushSubscribers === 0 && (
          <div style={{ margin: '12px 0', padding: '10px 14px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.82rem', color: '#93c5fd', lineHeight: 1.4 }}>
            ℹ️ <strong>Device Registration:</strong> Players visiting the app are politely asked to allow notifications on Home/Lobby. As soon as a player clicks <em>"Allow Alerts"</em> (or installs the PWA), their device token is securely registered here and will receive your broadcast alerts.
          </div>
        )}

        {pushFeedback && (
          <div className={`admin-push-status ${pushFeedback.type}`}>
            {pushFeedback.text}
          </div>
        )}

        {/* Delivery Mode Selector */}
        <div style={{ marginTop: '16px' }}>
          <div className="admin-delivery-pills">
            <button
              type="button"
              className={`admin-delivery-pill ${deliveryMode === 'instant' ? 'active' : ''}`}
              onClick={() => setDeliveryMode('instant')}
            >
              ⚡ Send Immediately
            </button>
            <button
              type="button"
              className={`admin-delivery-pill ${deliveryMode === 'scheduled' ? 'active' : ''}`}
              onClick={() => setDeliveryMode('scheduled')}
            >
              ⏰ Schedule for Later
            </button>
          </div>
        </div>

        <form onSubmit={handleSendPush}>
          {deliveryMode === 'scheduled' && (
            <div className="admin-scheduled-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClockIcon size={16} color="#818cf8" />
                  <span>Select Scheduled Date & Time (Your Local Timezone)</span>
                </label>
                {scheduledDateTime && (
                  <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600 }}>
                    Trigger countdown: {getRelativeTimeDesc(scheduledDateTime)}
                  </span>
                )}
              </div>
              <input
                type="datetime-local"
                className="admin-input"
                style={{ maxWidth: '320px' }}
                value={scheduledDateTime}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                required={deliveryMode === 'scheduled'}
              />
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                ℹ️ When the scheduled time arrives, the server will automatically dispatch this push notification to all registered phones and record the event into Dispatched History.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>Notification Title</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., Weekend Tournament is Live! 🏆"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                required
              />
            </div>
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label>Target URL Action</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g., /lobby"
                value={pushUrl}
                onChange={(e) => setPushUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Notification Body Message</label>
            <textarea
              className="admin-push-textarea"
              placeholder="Write the notification message to broadcast to all players..."
              value={pushMessage}
              onChange={(e) => setPushMessage(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={isSendingPush || !pushTitle.trim() || !pushMessage.trim()}
            style={{ width: 'auto', padding: '12px 28px' }}
          >
            {deliveryMode === 'scheduled' ? (
              <>
                <ClockIcon size={16} color="#fff" />
                <span>{isSendingPush ? 'Scheduling Notification...' : 'Schedule Automated Notification ⏰'}</span>
              </>
            ) : (
              <>
                <BellIcon size={16} color="#fff" />
                <span>{isSendingPush ? 'Broadcasting via Web Push...' : 'Send Broadcast to All Devices 🚀'}</span>
              </>
            )}
          </button>
        </form>

        {/* Upcoming Scheduled Notifications Queue */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '32px 0 12px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockIcon size={18} color="#facc15" />
            <span>Upcoming Scheduled Notifications Queue ({scheduledList.length})</span>
          </h4>
          <button
            type="button"
            onClick={fetchScheduledQueue}
            className="admin-refresh-btn"
            title="Refresh scheduled queue"
          >
            <RefreshIcon size={14} />
          </button>
        </div>

        <div className="admin-table-wrapper" style={{ marginBottom: '24px' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Scheduled Trigger Time</th>
                <th>Title</th>
                <th>Message</th>
                <th>Target URL</th>
                <th>Countdown</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {scheduledList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                    No scheduled notifications pending in queue. Schedule one above to fire automatically at any future date and time!
                  </td>
                </tr>
              ) : (
                scheduledList.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>
                      {new Date(item.scheduledAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.title}</td>
                    <td style={{ maxWidth: '260px', whiteSpace: 'pre-wrap' }}>{item.message}</td>
                    <td><code>{item.url || '/'}</code></td>
                    <td>
                      <span className="admin-scheduled-badge">
                        ⏰ in {getRelativeTimeDesc(item.scheduledAt)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-cancel-btn"
                        onClick={() => handleCancelScheduled(item.id)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Notification History Log Table */}
        <h4 style={{ margin: '28px 0 12px', fontSize: '1rem', color: '#f1f5f9' }}>Dispatched Notification History</h4>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Title</th>
                <th>Message</th>
                <th>Target URL</th>
                <th>Recipients Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No broadcast notifications dispatched yet.
                  </td>
                </tr>
              ) : (
                historyList.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      {new Date(item.sentAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.title}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{item.message}</td>
                    <td><code>{item.url}</code></td>
                    <td>
                      <span className="admin-delivered-badge">
                        ✓ {item.deliveredCount} devices
                      </span>
                    </td>
                    <td><span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700 }}>Delivered</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="admin-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: '#fff' }}>Update Admin Password</h3>

            {pwdFeedback && (
              <div className={`admin-push-status ${pwdFeedback.type}`} style={{ marginBottom: '16px' }}>
                {pwdFeedback.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="admin-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="admin-input"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>New Password (min 8 chars)</label>
                <input
                  type="password"
                  className="admin-input"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="admin-input"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.8rem', color: '#93c5fd', lineHeight: 1.45 }}>
                🛡️ <strong>Permanent Render Persistence:</strong><br />
                Render Free Tier rebuilds containers on git updates. To make your password permanent across all future deployments, set <code>ADMIN_PASSWORD</code> in your <strong>Render Dashboard &rarr; Environment Variables</strong>.
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Save New Password
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
