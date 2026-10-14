import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getOrCreateSecretUserId } from '../services/analytics';
import './AdminDashboard.css';

// SVG Icons
const LockIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const DownloadIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const LogoutIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const TrashIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const EditIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

const RefreshIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const SparklesIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M7.757 16.243l-2.121 2.121m12.728 0l-2.121-2.121M7.757 7.757L5.636 5.636" />
  </svg>
);

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (mins < 60) {
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

export default function AdminDashboard() {
  // Mark session as admin so this device is never counted as an active player
  useEffect(() => {
    try {
      sessionStorage.setItem('bingo_is_admin', '1');
    } catch {}
  }, []);
  const [token, setToken] = useState(() => {
    try {
      const savedToken = sessionStorage.getItem('bingo_admin_token') || '';
      const savedExpiresAt = Number(sessionStorage.getItem('bingo_admin_expires_at') || 0);
      if (savedToken && savedExpiresAt && Date.now() > savedExpiresAt) {
        sessionStorage.removeItem('bingo_admin_token');
        sessionStorage.removeItem('bingo_admin_expires_at');
        return '';
      }
      return savedToken;
    } catch {
      return '';
    }
  });

  const [sessionExpiresAt, setSessionExpiresAt] = useState(() => {
    try {
      return Number(sessionStorage.getItem('bingo_admin_expires_at') || 0);
    } catch {
      return 0;
    }
  });

  const [sessionRemainingSecs, setSessionRemainingSecs] = useState(() => {
    try {
      const exp = Number(sessionStorage.getItem('bingo_admin_expires_at') || 0);
      return exp ? Math.max(0, Math.floor((exp - Date.now()) / 1000)) : 0;
    } catch {
      return 0;
    }
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(() => {
    try {
      const exp = Number(sessionStorage.getItem('bingo_admin_expires_at') || 0);
      if (exp && Date.now() > exp) {
        return 'Your admin session expired. Please sign in again.';
      }
    } catch {}
    return '';
  });
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [hoveredHour, setHoveredHour] = useState(null);

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
  const [showDbModal, setShowDbModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState(null);

  // Edit Scheduled Notification State
  const [editingScheduled, setEditingScheduled] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDateTime, setEditDateTime] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState(null);

  // AI Campaign Studio & Auto-Pilot State
  const [aiContext, setAiContext] = useState(null);
  const [aiEngineUsed, setAiEngineUsed] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [aiWebNotes, setAiWebNotes] = useState(null);
  const [aiHistoryContext, setAiHistoryContext] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiAutoPilotConfig, setAiAutoPilotConfig] = useState({
    enabled: false,
    lastScheduledDate: null,
    lastRunAt: null,
    geminiApiKey: null
  });
  const [isSavingAutoPilot, setIsSavingAutoPilot] = useState(false);
  const [showAutoPilotModal, setShowAutoPilotModal] = useState(false);
  const [customApiKeyInput, setCustomApiKeyInput] = useState('');

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

  // Format seconds into readable countdown string (e.g., 29m 45s or 45s)
  function formatSessionCountdown(secs) {
    if (secs <= 0) return 'Expired';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  }

  // Handle Admin Logout & Session Cleanup
  const handleLogout = useCallback((isExpired = false) => {
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      }).catch(() => {});
    }
    setToken('');
    setSessionExpiresAt(0);
    setSessionRemainingSecs(0);
    sessionStorage.removeItem('bingo_admin_token');
    sessionStorage.removeItem('bingo_admin_expires_at');
    setStats(null);
    if (isExpired) {
      setAuthError('Your admin session expired after 30 minutes of inactivity. Please sign in again.');
    }
  }, [token]);

  // Extend / Refresh Session
  const extendSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/session', {
        headers: { 'x-admin-token': token }
      });
      if (res.status === 401) {
        handleLogout(true);
        return;
      }
      const data = await res.json();
      if (data.success && data.expiresAt) {
        setSessionExpiresAt(data.expiresAt);
        setSessionRemainingSecs(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
        sessionStorage.setItem('bingo_admin_expires_at', String(data.expiresAt));
      }
    } catch {}
  }, [token, handleLogout]);

  // Session Expiration Countdown Timer (1-second tick)
  useEffect(() => {
    if (!token || !sessionExpiresAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((sessionExpiresAt - now) / 1000));
      setSessionRemainingSecs(diffSecs);

      if (diffSecs <= 0) {
        clearInterval(timer);
        handleLogout(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [token, sessionExpiresAt, handleLogout]);

  // User Inactivity Extension (Debounced: extends session on user interaction)
  useEffect(() => {
    if (!token) return;

    let lastInteraction = Date.now();
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastInteraction > 45000) {
        lastInteraction = now;
        extendSession();
      }
    };

    window.addEventListener('mousedown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [token, extendSession]);

  // Fetch Dashboard Stats & Scheduled Queue
  const fetchDashboardData = useCallback(async (authToken = token) => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (queryParams.startDate) query.append('startDate', queryParams.startDate);
      if (queryParams.endDate) query.append('endDate', queryParams.endDate);

      const [statsRes, historyRes, scheduledRes, autopilotRes] = await Promise.all([
        fetch(`/api/admin/stats?${query.toString()}`, {
          headers: { 'x-admin-token': authToken }
        }),
        fetch('/api/admin/push/history', {
          headers: { 'x-admin-token': authToken }
        }),
        fetch('/api/admin/push/scheduled', {
          headers: { 'x-admin-token': authToken }
        }),
        fetch('/api/admin/ai-push/autopilot', {
          headers: { 'x-admin-token': authToken }
        }).catch(() => null)
      ]);

      if (statsRes.status === 401 || historyRes.status === 401) {
        handleLogout(true);
        return;
      }

      // Check if server refreshed session expiration
      const remainingHeader = statsRes.headers.get('x-admin-session-remaining');
      if (remainingHeader) {
        const remainingMs = parseInt(remainingHeader, 10);
        if (!isNaN(remainingMs) && remainingMs > 0) {
          const newExp = Date.now() + remainingMs;
          setSessionExpiresAt(newExp);
          setSessionRemainingSecs(Math.floor(remainingMs / 1000));
          sessionStorage.setItem('bingo_admin_expires_at', String(newExp));
        }
      }

      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      const scheduledData = scheduledRes.ok ? await scheduledRes.json() : null;

      if (autopilotRes && autopilotRes.ok) {
        try {
          const apData = await autopilotRes.json();
          if (apData.success && apData.config) {
            setAiAutoPilotConfig(apData.config);
            setCustomApiKeyInput(apData.config.geminiApiKey || '');
          }
        } catch {}
      }

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

  // Fetch AI Contextual Suggestions
  const fetchAiSuggestions = useCallback(async () => {
    if (!token) return;
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/admin/ai-push/suggestions', {
        headers: { 'x-admin-token': token }
      });
      const data = await res.json();
      if (data.success) {
        setAiContext(data.context || null);
        setAiEngineUsed(data.engineUsed || null);
        setAiSuggestions(data.suggestions || []);
        setAiPredictions(data.predictions || null);
        setAiWebNotes(data.webAnalysisNotes || null);
        setAiHistoryContext(data.historyContext || null);
      } else {
        setAiError(data.error || 'Failed to generate AI suggestions');
      }
    } catch {
      setAiError('Network error while generating AI suggestions');
    } finally {
      setIsLoadingAi(false);
    }
  }, [token]);

  // Handle Instant AI Auto-Schedule & Advance Notice Broadcast
  async function handleInstantAiSchedule(sugg) {
    if (!token || !sugg) return;
    setIsSendingPush(true);
    setPushFeedback(null);
    try {
      const res = await fetch('/api/admin/ai-push/auto-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          title: sugg.title,
          message: sugg.message,
          url: sugg.url || '/lobby',
          scheduledAt: sugg.scheduledAt
        })
      });
      const data = await res.json();
      if (data.success) {
        setPushFeedback({
          type: 'success',
          text: `⏰ Campaign "${sugg.title}" scheduled for ${sugg.scheduledAtDesc || new Date(sugg.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. It will be sent directly at that time.`
        });
        fetchScheduledQueue();
      } else {
        setPushFeedback({ type: 'error', text: data.error || 'Failed to auto-schedule notification' });
      }
    } catch {
      setPushFeedback({ type: 'error', text: 'Network error scheduling AI campaign' });
    } finally {
      setIsSendingPush(false);
    }
  }

  // Use AI suggestion inside standard form
  function handleUseAiSuggestion(sugg) {
    if (!sugg) return;
    setPushTitle(sugg.title);
    setPushMessage(sugg.message);
    setPushUrl(sugg.url || '/lobby');
    setDeliveryMode('scheduled');
    if (sugg.scheduledAt) {
      const d = new Date(sugg.scheduledAt);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledDateTime(localIso);
    }
    const formElem = document.getElementById('pushBroadcastForm');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Toggle Auto-Pilot
  async function handleToggleAutoPilot(newVal) {
    if (!token) return;
    setIsSavingAutoPilot(true);
    try {
      const res = await fetch('/api/admin/ai-push/autopilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ enabled: newVal })
      });
      const data = await res.json();
      if (data.success) {
        setAiAutoPilotConfig(data.config);
      }
    } catch (err) {
      console.warn('Failed to update autopilot:', err);
    } finally {
      setIsSavingAutoPilot(false);
    }
  }

  // Save Auto-Pilot & API Key Settings
  async function handleSaveAutoPilotSettings(e) {
    e.preventDefault();
    if (!token) return;
    setIsSavingAutoPilot(true);
    try {
      const res = await fetch('/api/admin/ai-push/autopilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          enabled: aiAutoPilotConfig.enabled,
          geminiApiKey: customApiKeyInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiAutoPilotConfig(data.config);
        setShowAutoPilotModal(false);
        fetchAiSuggestions();
      }
    } catch (err) {
      alert('Error updating Auto-Pilot settings: ' + err.message);
    } finally {
      setIsSavingAutoPilot(false);
    }
  }

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
      fetchAiSuggestions();
      const interval = setInterval(() => {
        fetchDashboardData(token);
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [token, fetchDashboardData, fetchAiSuggestions]);

  // Handle Login
  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsLoggingIn(true);
    setAuthError('');

    try {
      const adminUserId = getOrCreateSecretUserId();
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput, adminUserId })
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
      if (data.expiresAt) {
        setSessionExpiresAt(data.expiresAt);
        setSessionRemainingSecs(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
        sessionStorage.setItem('bingo_admin_expires_at', String(data.expiresAt));
      }
      setPasswordInput('');
      fetchDashboardData(data.token);
    } catch {
      setAuthError('Connection error. Server unreachable.');
    } finally {
      setIsLoggingIn(false);
    }
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
        ...(deliveryMode === 'scheduled' ? {
          scheduledAt: new Date(scheduledDateTime).toISOString()
        } : {})
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
            text: `⏰ Notification scheduled successfully for ${new Date(scheduledDateTime).toLocaleString()}! It will broadcast directly to players at that time.`
          });
          setPushTitle('');
          setPushMessage('');
          fetchScheduledQueue();
          fetchDashboardData();
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

  // Open Edit Scheduled Notification Modal
  function handleOpenEditScheduled(item) {
    setEditingScheduled(item);
    setEditTitle(item.title);
    setEditMessage(item.message);
    setEditUrl(item.url || '/lobby');
    setEditDateTime(new Date(item.scheduledAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setEditFeedback(null);
  }

  // Save Edited Scheduled Notification
  async function handleSaveEditScheduled(e) {
    e.preventDefault();
    if (!editingScheduled || !editTitle.trim() || !editMessage.trim()) return;

    const scheduledMs = new Date(editDateTime).getTime();
    if (isNaN(scheduledMs) || scheduledMs <= Date.now()) {
      setEditFeedback({ type: 'error', text: 'Please select a future date and time for the scheduled trigger.' });
      return;
    }

    setIsSavingEdit(true);
    setEditFeedback(null);

    try {
      const res = await fetch(`/api/admin/push/scheduled/${editingScheduled.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          message: editMessage.trim(),
          url: editUrl.trim() || '/lobby',
          scheduledAt: new Date(editDateTime).toISOString()
        })
      });

      const data = await res.json();
      if (data.success && data.scheduledItem) {
        setScheduledList((prev) =>
          prev
            .map((item) => (item.id === editingScheduled.id ? data.scheduledItem : item))
            .sort((a, b) => a.scheduledAt - b.scheduledAt)
        );
        setEditingScheduled(null);
      } else {
        setEditFeedback({ type: 'error', text: data.error || 'Failed to update scheduled notification.' });
      }
    } catch {
      setEditFeedback({ type: 'error', text: 'Network error updating scheduled notification.' });
    } finally {
      setIsSavingEdit(false);
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
  const pushFunnel = stats?.pushFunnel || overview.pushFunnel || {};

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

          {stats?.persistenceStatus?.isConnected ? (
            <div className="admin-db-badge connected" title="PostgreSQL Cloud Database Connected - Permanent Storage active across all rebuilds and deploys">
              <span className="admin-db-dot green" />
              <span>PostgreSQL Active (Permanent)</span>
            </div>
          ) : (
            <div
              className="admin-db-badge ephemeral"
              onClick={() => setShowDbModal(true)}
              title="Running on Render Free Tier ephemeral storage. Click for instructions to connect a Free PostgreSQL Database."
            >
              <span className="admin-db-dot yellow" />
              <span>Ephemeral Storage</span>
              <span className="admin-db-action">Connect Free SQL ⚡</span>
            </div>
          )}

          {/* Real-time Session Expiration Badge */}
          {sessionRemainingSecs > 0 && (
            <div
              className={`admin-session-badge ${sessionRemainingSecs < 180 ? 'warning' : ''}`}
              onClick={extendSession}
              title={`Admin session expires in ${formatSessionCountdown(sessionRemainingSecs)} of inactivity. Click or interact to extend session.`}
            >
              <ClockIcon size={13} color={sessionRemainingSecs < 180 ? '#f87171' : '#a5b4fc'} />
              <span>Session: {formatSessionCountdown(sessionRemainingSecs)}</span>
            </div>
          )}
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={handleExportBackup}
            title="Download complete database backup JSON"
            aria-label="Export database backup"
          >
            <DownloadIcon size={18} color="#38bdf8" />
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Restore database backup JSON"
            aria-label="Import database backup"
          >
            <UploadIcon size={18} color="#818cf8" />
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
            className="admin-icon-btn"
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            title={isLoading ? 'Syncing data...' : 'Refresh dashboard'}
            aria-label="Refresh dashboard"
          >
            <RefreshIcon size={18} className={isLoading ? 'admin-spin' : ''} />
          </button>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => setShowPasswordModal(true)}
            title="Admin Security & Password Settings"
            aria-label="Security Settings"
          >
            <LockIcon size={18} color="#facc15" />
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-danger"
            onClick={() => handleLogout(false)}
            title="Logout"
            aria-label="Logout"
          >
            <LogoutIcon size={18} color="#f87171" />
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

        {/* Average Playing Time (Bot vs Multiplayer) */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Average Match Time</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(20, 184, 166, 0.15)' }}>
              <ClockIcon size={20} color="#14b8a6" />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ fontSize: '1.25rem', color: '#2dd4bf', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span>{formatDuration(overview.avgBotDurationSeconds)}</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Bot</span>
            <span style={{ color: '#475569' }}>/</span>
            <span>{formatDuration(overview.avgMultiplayerDurationSeconds)}</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Friends</span>
          </div>
          <div className="admin-kpi-subline">
            <span>Duration per completed match</span>
          </div>
        </div>

        {/* Average Multiplayer Room Size */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Average Room Size</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
              <UsersIcon size={20} color="#38bdf8" />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#38bdf8' }}>
            {overview.avgRoomSize || 2.0} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Players / Room</span>
          </div>
          <div className="admin-kpi-subline">
            <span>Multiplayer lobby participant density</span>
          </div>
        </div>

        {/* Push Click-Through & Play Conversion */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Push CTR & Played %</span>
            <div className="admin-kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
              <BellIcon size={20} color="#c084fc" />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ fontSize: '1.25rem', color: '#c084fc', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span>{pushFunnel.overallCtr || 0}%</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>CTR</span>
            <span style={{ color: '#475569' }}>/</span>
            <span>{pushFunnel.overallConversionRate || 0}%</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Played</span>
          </div>
          <div className="admin-kpi-subline">
            <span>{pushFunnel.totalClicks || 0} clicked • {pushFunnel.totalConversions || 0} played game</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        {/* Hourly Peak Time Chart */}
        {/* Hourly Peak Time Chart - Continuous Spline Area Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>Today's Hourly Peak Time</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Continuous traffic distribution by hour (00:00 to 23:00 UTC)
              </p>
            </div>
            {hoveredHour !== null ? (
              <div
                className="admin-peak-chip"
                style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  borderColor: '#fbbf24',
                  color: '#fef08a'
                }}
              >
                Hour {String(hoveredHour).padStart(2, '0')}:00 - {String((hoveredHour + 1) % 24).padStart(2, '0')}:00 UTC: {todayHourly[hoveredHour] || 0} visits {todayHourly[hoveredHour] > 0 && todayHourly[hoveredHour] === Math.max(...todayHourly, 0) ? '★ (Peak)' : ''}
              </div>
            ) : (
              overview.peakHour && (
                <div className="admin-peak-chip">
                  Peak Time: {overview.peakHour} ({overview.peakHourPings || 0} visits)
                </div>
              )
            )}
          </div>

          <div style={{ width: '100%', height: '220px', position: 'relative' }}>
            {(() => {
              const rawHourly = stats?.todayHourlyActivity;
              const hourly = Array.isArray(rawHourly) && rawHourly.length === 24
                ? rawHourly
                : (Array.isArray(rawHourly)
                    ? [...rawHourly, ...new Array(Math.max(0, 24 - rawHourly.length)).fill(0)].slice(0, 24)
                    : new Array(24).fill(0));

              const maxVal = Math.max(...hourly, 1);
              const baseY = 152;
              const topY = 30;
              const heightSpan = baseY - topY; // 122px
              const startX = 42;
              const endX = 688;
              const stepX = (endX - startX) / 23; // ~28.087px

              const points = hourly.map((count, hr) => ({
                hr,
                count,
                x: startX + hr * stepX,
                y: maxVal > 0 ? baseY - (count / maxVal) * heightSpan : baseY,
                isPeak: count === maxVal && maxVal > 0
              }));

              // Smooth spline using cubic Bezier curve interpolation
              let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i === 0 ? i : i - 1];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
              }

              const areaPath = `${linePath} L ${points[23].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`;
              const activePoint = hoveredHour !== null ? points[hoveredHour] : null;

              return (
                <svg viewBox="0 0 720 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="hourSmoothGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#6366f1" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="hourStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                    <filter id="peakGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1={startX - 10} y1={topY} x2={endX + 15} y2={topY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1={startX - 10} y1={Math.round((topY + baseY) / 2)} x2={endX + 15} y2={Math.round((topY + baseY) / 2)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1={startX - 10} y1={baseY} x2={endX + 15} y2={baseY} stroke="rgba(255,255,255,0.12)" />

                  {/* Left Y-axis labels */}
                  <text x={startX - 14} y={topY + 3} fontSize="9" fill="#64748b" textAnchor="end">{maxVal}</text>
                  <text x={startX - 14} y={Math.round((topY + baseY) / 2) + 3} fontSize="9" fill="#64748b" textAnchor="end">{Math.round(maxVal / 2)}</text>
                  <text x={startX - 14} y={baseY + 3} fontSize="9" fill="#64748b" textAnchor="end">0</text>

                  {/* Continuous smooth area fill */}
                  <path d={areaPath} fill="url(#hourSmoothGrad)" />

                  {/* Continuous smooth stroke line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#hourStrokeGrad)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Hourly tick marks and labels for EVERY single hour (00h to 23h) */}
                  {points.map((p) => {
                    const isHovered = hoveredHour === p.hr;
                    return (
                      <g key={p.hr}>
                        {/* Vertical axis tick mark */}
                        <line
                          x1={p.x}
                          y1={baseY}
                          x2={p.x}
                          y2={baseY + 5}
                          stroke={isHovered ? '#fbbf24' : p.count > 0 ? '#818cf8' : 'rgba(255,255,255,0.15)'}
                          strokeWidth={isHovered ? 1.5 : 1}
                        />

                        {/* Each hour label (00, 01, 02 ... 23) */}
                        <text
                          x={p.x}
                          y={baseY + 18}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fill={isHovered ? '#fbbf24' : p.count > 0 ? '#f8fafc' : '#64748b'}
                          fontWeight={isHovered || p.count > 0 ? '700' : '500'}
                          textAnchor="middle"
                          style={{ transition: 'fill 0.15s ease' }}
                        >
                          {String(p.hr).padStart(2, '0')}
                        </text>

                        {/* Continuous curve points for every hour */}
                        {p.isPeak ? (
                          <g>
                            <circle cx={p.x} cy={p.y} r="8.5" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.6" />
                            <circle cx={p.x} cy={p.y} r="5" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" filter="url(#peakGlow)" />
                          </g>
                        ) : p.count > 0 ? (
                          <circle cx={p.x} cy={p.y} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="1.8" />
                        ) : (
                          <circle cx={p.x} cy={p.y} r="2" fill="rgba(255,255,255,0.22)" />
                        )}

                        {/* Invisible interactive hover hit area for each hour */}
                        <rect
                          x={p.x - stepX / 2}
                          y={topY - 10}
                          width={stepX}
                          height={baseY - topY + 35}
                          fill="transparent"
                          cursor="pointer"
                          onMouseEnter={() => setHoveredHour(p.hr)}
                          onMouseLeave={() => setHoveredHour(null)}
                        >
                          <title>{`${String(p.hr).padStart(2, '0')}:00 - ${String((p.hr + 1) % 24).padStart(2, '0')}:00 UTC: ${p.count} visits`}</title>
                        </rect>
                      </g>
                    );
                  })}

                  {/* Active hovered crosshair line & callout */}
                  {activePoint && (() => {
                    const tipWidth = 148;
                    const tipHeight = 44;
                    let tipX = activePoint.x - tipWidth / 2;
                    if (tipX < 40) tipX = 40;
                    if (tipX + tipWidth > 700) tipX = 700 - tipWidth;
                    const tipY = Math.max(12, activePoint.y - tipHeight - 12);

                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        {/* Vertical dashed crosshair line */}
                        <line
                          x1={activePoint.x}
                          y1={topY}
                          x2={activePoint.x}
                          y2={baseY}
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.85"
                        />

                        {/* Active glowing ring on curve */}
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r="7"
                          fill="#fbbf24"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          filter="url(#peakGlow)"
                        />

                        {/* Floating tooltip callout box */}
                        <rect
                          x={tipX}
                          y={tipY}
                          width={tipWidth}
                          height={tipHeight}
                          rx="8"
                          fill="rgba(15, 20, 32, 0.95)"
                          stroke="#fbbf24"
                          strokeWidth="1.2"
                          filter="drop-shadow(0 6px 16px rgba(0,0,0,0.65))"
                        />
                        <text
                          x={tipX + tipWidth / 2}
                          y={tipY + 16}
                          fontSize="9.5"
                          fontWeight="700"
                          fill="#cbd5e1"
                          textAnchor="middle"
                        >
                          {String(activePoint.hr).padStart(2, '0')}:00 - {String((activePoint.hr + 1) % 24).padStart(2, '0')}:00 UTC
                        </text>
                        <text
                          x={tipX + tipWidth / 2}
                          y={tipY + 33}
                          fontSize="11"
                          fontWeight="800"
                          fill={activePoint.isPeak ? '#fbbf24' : '#818cf8'}
                          textAnchor="middle"
                        >
                          {activePoint.count} Active Visits {activePoint.isPeak ? '★ (Peak)' : ''}
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              );
            })()}
          </div>

          {/* Quick Metrics Bar below continuous chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px 16px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.8rem',
              color: '#94a3b8'
            }}
          >
            <div>
              Total Today: <strong style={{ color: '#818cf8' }}>{(stats?.todayHourlyActivity || []).reduce((a, b) => a + b, 0)}</strong> visits
            </div>
            <div>
              Peak Traffic: <strong style={{ color: '#fbbf24' }}>{overview.peakHour || '00:00 - 01:00'}</strong> ({overview.peakHourPings || 0} visits)
            </div>
            <div>
              Active Hours: <strong style={{ color: '#38bdf8' }}>{(stats?.todayHourlyActivity || []).filter(v => v > 0).length}</strong> / 24 hrs
            </div>
            <div>
              Current UTC: <strong style={{ color: '#cbd5e1' }}>{String(new Date().getUTCHours()).padStart(2, '0')}:00</strong>
            </div>
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
                <div className="admin-user-bar" style={{ width: `${botOverview.beginner?.userWinRate || 0}%` }} title={`User Wins: ${botOverview.beginner?.userWinRate || 0}%`} />
                <div className="admin-draw-bar" style={{ width: `${botOverview.beginner?.drawRate || 0}%` }} title={`Draws: ${botOverview.beginner?.drawRate || 0}%`} />
                <div className="admin-bot-bar" style={{ width: `${botOverview.beginner?.botWinRate || 0}%` }} title={`Bot Wins: ${botOverview.beginner?.botWinRate || 0}%`} />
              </div>
            </div>
            <div className="admin-ratio-legend">
              <span style={{ color: '#4ade80' }}>
                User Wins: {botOverview.beginner?.userWins || 0} ({botOverview.beginner?.userWinRate || 0}%)
              </span>
              <span style={{ color: '#facc15', fontWeight: 600 }}>
                Draws: {botOverview.beginner?.draws || 0} ({botOverview.beginner?.drawRate || 0}%)
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
                <div className="admin-user-bar" style={{ width: `${botOverview.intermediate?.userWinRate || 0}%` }} title={`User Wins: ${botOverview.intermediate?.userWinRate || 0}%`} />
                <div className="admin-draw-bar" style={{ width: `${botOverview.intermediate?.drawRate || 0}%` }} title={`Draws: ${botOverview.intermediate?.drawRate || 0}%`} />
                <div className="admin-bot-bar" style={{ width: `${botOverview.intermediate?.botWinRate || 0}%` }} title={`Bot Wins: ${botOverview.intermediate?.botWinRate || 0}%`} />
              </div>
            </div>
            <div className="admin-ratio-legend">
              <span style={{ color: '#4ade80' }}>
                User Wins: {botOverview.intermediate?.userWins || 0} ({botOverview.intermediate?.userWinRate || 0}%)
              </span>
              <span style={{ color: '#facc15', fontWeight: 600 }}>
                Draws: {botOverview.intermediate?.draws || 0} ({botOverview.intermediate?.drawRate || 0}%)
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
                <div className="admin-user-bar" style={{ width: `${botOverview.pro?.userWinRate || 0}%` }} title={`User Wins: ${botOverview.pro?.userWinRate || 0}%`} />
                <div className="admin-draw-bar" style={{ width: `${botOverview.pro?.drawRate || 0}%` }} title={`Draws: ${botOverview.pro?.drawRate || 0}%`} />
                <div className="admin-bot-bar" style={{ width: `${botOverview.pro?.botWinRate || 0}%` }} title={`Bot Wins: ${botOverview.pro?.botWinRate || 0}%`} />
              </div>
            </div>
            <div className="admin-ratio-legend">
              <span style={{ color: '#4ade80' }}>
                User Wins: {botOverview.pro?.userWins || 0} ({botOverview.pro?.userWinRate || 0}%)
              </span>
              <span style={{ color: '#facc15', fontWeight: 600 }}>
                Draws: {botOverview.pro?.draws || 0} ({botOverview.pro?.drawRate || 0}%)
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

        {/* Push Funnel Metrics Grid */}
        <div className="admin-funnel-grid">
          <div className="admin-funnel-card">
            <span className="admin-funnel-label">1. Prompts Shown</span>
            <div className="admin-funnel-val">{pushFunnel.promptsShown || 0}</div>
            <span className="admin-funnel-sub">Times permission requested</span>
          </div>

          <div className="admin-funnel-card">
            <span className="admin-funnel-label">2. Permission Granted</span>
            <div className="admin-funnel-val" style={{ color: '#4ade80' }}>
              {pushFunnel.promptsGranted || 0}
            </div>
            <span className="admin-funnel-sub" style={{ color: '#86efac' }}>
              {pushFunnel.optInRate || 0}% Opt-In Consent Rate
            </span>
          </div>

          <div className="admin-funnel-card">
            <span className="admin-funnel-label">3. Total Clicks</span>
            <div className="admin-funnel-val" style={{ color: '#38bdf8' }}>
              {pushFunnel.totalClicks || 0}
            </div>
            <span className="admin-funnel-sub" style={{ color: '#7dd3fc' }}>
              {pushFunnel.overallCtr || 0}% Click-Through Rate (CTR)
            </span>
          </div>

          <div className="admin-funnel-card">
            <span className="admin-funnel-label">4. Played Game</span>
            <div className="admin-funnel-val" style={{ color: '#c084fc' }}>
              {pushFunnel.totalConversions || 0}
            </div>
            <span className="admin-funnel-sub" style={{ color: '#d8b4fe' }}>
              {pushFunnel.overallConversionRate || 0}% Downstream Conversion
            </span>
          </div>
        </div>

        {/* Data-Driven Strategy & Subscriber Optimization Guide */}
        <div className="admin-insights-box">
          <div className="admin-insights-header">
            <div className="admin-insights-title">
              <span>📊 Data-Backed Send Time & Subscriber Growth Intelligence</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.18)', padding: '2px 8px', borderRadius: '10px' }}>
              Research & Casual Gaming Benchmarks
            </span>
          </div>

          <div className="admin-insights-grid">
            <div className="admin-insight-item">
              <strong style={{ color: '#fde047' }}>🍵 Afternoon Tea Window (3:30 PM – 5:30 PM)</strong>
              Top casual gaming engagement slot. Office workers take micro-breaks and crave brief relaxation. Best for warm, friendly messages like <em>"Tired from work? Take a quick 2-min Bingo break! ☕"</em>.
            </div>

            <div className="admin-insight-item">
              <strong style={{ color: '#a78bfa' }}>🌙 Prime Evening Relaxation (7:30 PM – 9:30 PM)</strong>
              Highest social multiplayer room creation and match duration. Users are relaxed at home and actively invite friends for casual social gaming sessions.
            </div>

            <div className="admin-insight-item">
              <strong style={{ color: '#4ade80' }}>⚡ Cadence & Frequency Rule</strong>
              Keep broadcast cadence to <strong>3–4 notifications per week</strong> maximum (&lt; 1 notification/day). Avoid sending before 9:00 AM or after 10:00 PM to prevent permission revokes.
            </div>

            <div className="admin-insight-item">
              <strong style={{ color: '#38bdf8' }}>🎯 Boost Subscriber Opt-In & CTR</strong>
              Pre-prompt soft ask primes players before native browser prompt (increases opt-ins from 18% to 64%). Use active curiosity hooks & emojis to boost CTR by +35%.
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AI CONTEXTUAL CAMPAIGN STUDIO & AUTO-PILOT (100% FREE OF COST)           */}
        {/* ========================================================================= */}
        <div className="admin-ai-studio-card">
          <div className="admin-ai-header">
            <div className="admin-ai-title-group">
              <h4>
                <SparklesIcon size={22} color="#c084fc" />
                <span>AI Contextual Campaign Studio & Auto-Pilot</span>
              </h4>
              <p className="admin-ai-subtitle">
                Context-aware AI analyzes current situation, day, special festival/calendar events (e.g. <em>Chai Break ☕</em>, <em>Bored of work?</em>, <em>Dinner relaxation</em>), and peak player activity to draft highly engaging, friendly notifications with direct scheduled dispatch. <strong>100% Free of Cost!</strong>
              </p>

              <div className="admin-ai-status-row">
                <div className="admin-ai-situation-pill">
                  <span>{aiContext?.timeSlotIcon || '☕'}</span>
                  <span>{aiContext?.timeSlot || 'Afternoon Chai Break Window'}</span>
                  <span>• Target: {aiContext?.targetDayName || aiContext?.dayName || 'Today'}</span>
                  <span>• Live: {aiContext?.currentTime || 'Live IST'}</span>
                </div>

                {aiContext?.specialOccasion && (
                  <div className="admin-ai-holiday-pill">
                    <span>🎉</span>
                    <span>{aiContext.specialOccasion}</span>
                  </div>
                )}

                <div className={`admin-ai-autopilot-badge ${aiAutoPilotConfig.enabled ? 'active' : 'idle'}`}>
                  <span>{aiAutoPilotConfig.enabled ? '⚡ Auto-Pilot Active' : '💤 Auto-Pilot Idle'}</span>
                </div>
              </div>
            </div>

            <div className="admin-ai-controls">
              <button
                type="button"
                className="admin-ai-gen-btn"
                onClick={fetchAiSuggestions}
                disabled={isLoadingAi}
              >
                <SparklesIcon size={16} color="#ffffff" />
                <span>{isLoadingAi ? 'Analyzing Context...' : '✨ Generate AI Suggestions'}</span>
              </button>

              <button
                type="button"
                className="admin-ai-autopilot-btn"
                onClick={() => setShowAutoPilotModal(true)}
              >
                <span>⚙️ Auto-Pilot Settings</span>
              </button>
            </div>
          </div>

          {aiError && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontSize: '0.82rem' }}>
              ⚠️ {aiError}
            </div>
          )}

          {/* AI Suggestions Cards */}
          {aiSuggestions && aiSuggestions.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', margin: '4px 0 10px' }}>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                  🧠 Engine: <strong style={{ color: '#c084fc' }}>{aiEngineUsed || 'Built-in Smart Semantic AI (100% Free & Offline)'}</strong>
                </span>
                {aiContext?.recommendedTriggerDesc && (
                  <span style={{ fontSize: '0.78rem', color: '#fde047', fontWeight: 600 }}>
                    🎯 Recommended Trigger: {aiContext.recommendedTriggerDesc}
                  </span>
                )}
              </div>

              {/* Predictive Audience Reaction & Daily Pacing Card */}
              {aiPredictions && (
                <div className="admin-ai-predictions-card">
                  <div className="admin-ai-predictions-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`admin-ai-pacing-pill ${aiPredictions.volumeStatus}`}>
                        {aiPredictions.volumeStatus === 'optimal' ? '🟢' : aiPredictions.volumeStatus === 'moderate' ? '🟡' : '🔴'}
                        <span>{aiPredictions.sentTodayCount} of {aiPredictions.maxOptimalDaily} Sent Today ({aiPredictions.fatigueIndex})</span>
                      </span>

                      <span className="admin-ai-buffer-badge">
                        <ClockIcon size={13} color="#38bdf8" />
                        <span>2-Hour Safety Buffer Active (Editable in Queue)</span>
                      </span>
                    </div>

                    {aiWebNotes && (
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                        🌐 {aiWebNotes}
                      </span>
                    )}
                  </div>

                  <div className="admin-ai-probability-grid">
                    <div className="admin-ai-prob-box">
                      <div className="admin-ai-prob-label">Open / Tap Rate</div>
                      <div className="admin-ai-prob-value green">
                        {aiPredictions.openProbability}%
                      </div>
                      <div className="admin-ai-prob-bar-bg">
                        <div className="admin-ai-prob-bar-fill green" style={{ width: `${Math.min(100, aiPredictions.openProbability * 2)}%` }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                        ~{aiPredictions.projectedOpens} players engage
                      </div>
                    </div>

                    <div className="admin-ai-prob-box">
                      <div className="admin-ai-prob-label">Lockscreen View</div>
                      <div className="admin-ai-prob-value blue">
                        {aiPredictions.viewProbability}%
                      </div>
                      <div className="admin-ai-prob-bar-bg">
                        <div className="admin-ai-prob-bar-fill blue" style={{ width: `${aiPredictions.viewProbability}%` }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                        Glance & remember
                      </div>
                    </div>

                    <div className="admin-ai-prob-box">
                      <div className="admin-ai-prob-label">Swipe Away / Ignore</div>
                      <div className="admin-ai-prob-value gray">
                        {aiPredictions.ignoreProbability}%
                      </div>
                      <div className="admin-ai-prob-bar-bg">
                        <div className="admin-ai-prob-bar-fill gray" style={{ width: `${aiPredictions.ignoreProbability}%` }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                        Passive dismiss
                      </div>
                    </div>

                    <div className="admin-ai-prob-box">
                      <div className="admin-ai-prob-label">App Delete / Mute Risk</div>
                      <div className={`admin-ai-prob-value ${aiPredictions.churnRiskProbability < 1.5 ? 'green' : aiPredictions.churnRiskProbability < 4 ? 'gray' : 'red'}`}>
                        {aiPredictions.churnRiskProbability}%
                      </div>
                      <div className="admin-ai-prob-bar-bg">
                        <div className={`admin-ai-prob-bar-fill ${aiPredictions.churnRiskProbability < 1.5 ? 'green' : aiPredictions.churnRiskProbability < 4 ? 'gray' : 'red'}`} style={{ width: `${Math.min(100, aiPredictions.churnRiskProbability * 10)}%` }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: aiPredictions.churnRiskProbability < 1.5 ? '#4ade80' : '#f87171', marginTop: '4px' }}>
                        {aiPredictions.churnRiskProbability < 1.5 ? 'Very Low / Safe 🛡️' : 'Caution ⚠️'}
                      </div>
                    </div>
                  </div>

                  <div className="admin-ai-advice-banner">
                    💡 <strong>AI Strategy:</strong> {aiPredictions.advice}
                  </div>

                  {aiHistoryContext?.sentTodayTitles?.length > 0 && (
                    <div className="admin-ai-memory-pill">
                      <span>🧠</span>
                      <span>
                        Sent earlier today: <em>"{aiHistoryContext.sentTodayTitles[0]}"</em> — AI ensured 100% unique & non-repeating copy below!
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="admin-ai-suggestions-grid">
                {aiSuggestions.map((sugg) => (
                  <div key={sugg.id} className="admin-ai-card">
                    <div>
                      <div className="admin-ai-card-badge">{sugg.badge}</div>
                      <h5 className="admin-ai-card-title" style={{ marginTop: '8px' }}>{sugg.title}</h5>
                      <p className="admin-ai-card-body" style={{ marginTop: '6px' }}>{sugg.message}</p>
                    </div>

                    <div>
                      <div className="admin-ai-card-meta">
                        <span className="admin-ai-card-trigger">
                          <ClockIcon size={13} color="#facc15" />
                          <span>{sugg.scheduledAtDesc || 'Upcoming Peak'}</span>
                        </span>
                        <span style={{ fontStyle: 'italic', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sugg.reasoning}>
                          {sugg.reasoning}
                        </span>
                      </div>

                      <div className="admin-ai-card-actions">
                        <button
                          type="button"
                          className="admin-ai-card-btn use"
                          onClick={() => handleUseAiSuggestion(sugg)}
                        >
                          <span>Use in Form ✍️</span>
                        </button>
                        <button
                          type="button"
                          className="admin-ai-card-btn schedule"
                          onClick={() => handleInstantAiSchedule(sugg)}
                          disabled={isSendingPush}
                        >
                          <span>⚡ Auto-Schedule</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

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

        <form id="pushBroadcastForm" onSubmit={handleSendPush}>
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
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClockIcon size={14} color="#facc15" />
                <span>
                  <strong>Direct Scheduled Dispatch:</strong> No advance reminder is sent to players now. The main message will fire automatically at the scheduled time.
                </span>
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
            className="admin-icon-btn admin-refresh-btn"
            title="Refresh scheduled queue"
            aria-label="Refresh scheduled queue"
          >
            <RefreshIcon size={16} />
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-edit-btn"
                          onClick={() => handleOpenEditScheduled(item)}
                          title="Edit scheduled notification"
                          aria-label="Edit scheduled notification"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <EditIcon size={14} color="#38bdf8" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-danger"
                          onClick={() => handleCancelScheduled(item.id)}
                          title="Cancel scheduled notification"
                          aria-label="Cancel scheduled notification"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <TrashIcon size={14} color="#f87171" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Notification History Log Table */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '28px 0 12px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#f1f5f9' }}>Dispatched Notification History</h4>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="admin-icon-btn admin-refresh-btn"
            title="Refresh notification history"
            aria-label="Refresh notification history"
          >
            <RefreshIcon size={16} />
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Title</th>
                <th>Message</th>
                <th>Target URL</th>
                <th>Delivered</th>
                <th>Clicks (CTR)</th>
                <th>Played (Conv %)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
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
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="admin-delivered-badge">
                        ✓ {item.deliveredCount || 0} devices
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {(() => {
                        const clicks = item.clicksCount || 0;
                        const delivered = item.deliveredCount || 0;
                        const ctr = delivered > 0 ? Math.round((clicks / delivered) * 1000) / 10 : 0;
                        return (
                          <span className={`admin-metric-chip ${clicks > 0 ? 'active' : ''}`}>
                            🖱️ {clicks} ({ctr}%)
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {(() => {
                        const played = item.conversionsCount || 0;
                        const clicks = item.clicksCount || 0;
                        const convRate = clicks > 0 ? Math.round((played / clicks) * 1000) / 10 : 0;
                        return (
                          <span className={`admin-metric-chip ${played > 0 ? 'success' : ''}`}>
                            🎮 {played} ({convRate}%)
                          </span>
                        );
                      })()}
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
      {/* Free Cloud PostgreSQL Connection Modal */}
      {showDbModal && (
        <div className="admin-modal-overlay" onClick={() => setShowDbModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🐘 Connect Free PostgreSQL Database</span>
              </h3>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
                onClick={() => setShowDbModal(false)}
              >
                ✕ Close
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, marginTop: 0 }}>
              Render's Free Tier uses ephemeral containers that clear local files whenever you rebuild or clear cache.
              Connecting a <strong>100% Free PostgreSQL Database</strong> makes all player downloads, active user history, bot win rates, push subscriptions, and admin passwords <strong>persist permanently forever</strong>!
            </p>

            <div style={{ background: 'rgba(10, 11, 16, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '16px', margin: '16px 0', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: '#4ade80', marginBottom: '8px' }}>
                ⚡ Quick 2-Minute Setup with Neon.tech (Recommended &amp; 100% Free Forever):
              </div>
              <ol style={{ margin: '0 0 0 18px', padding: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  Open <a href="https://neon.tech" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontWeight: 600 }}>neon.tech</a> and sign up for free (takes 30 seconds with Google/GitHub).
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Click <strong>"Create Project"</strong> (e.g. name it <code>bingo-db</code>).
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Copy your <strong>Connection String</strong> (e.g. <code>postgresql://alex:xxxx@ep-cool-frog-123.neon.tech/neondb?sslmode=require</code>).
                </li>
                <li style={{ marginBottom: '8px' }}>
                  Go to your <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontWeight: 600 }}>Render Dashboard</a> &rarr; Click your <code>bingo-online-game</code> Web Service &rarr; <strong>Environment</strong> tab.
                </li>
                <li>
                  Add an environment variable:<br />
                  Key: <code style={{ color: '#facc15' }}>DATABASE_URL</code><br />
                  Value: <em>paste your copied connection string</em>
                </li>
              </ol>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', fontSize: '0.82rem', color: '#86efac', lineHeight: 1.45 }}>
              ✅ That's it! As soon as you click "Save Changes" on Render, this Bingo server will automatically connect, create the database tables, and securely preserve all history and passwords permanently!
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => setShowDbModal(false)}
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Scheduled Notification Modal */}
      {editingScheduled && (
        <div className="admin-modal-overlay" onClick={() => setEditingScheduled(null)}>
          <div className="admin-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EditIcon size={18} color="#38bdf8" />
                <span>Edit Scheduled Notification</span>
              </h3>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setEditingScheduled(null)}
                title="Close"
                aria-label="Close"
                style={{ width: '32px', height: '32px' }}
              >
                ✕
              </button>
            </div>

            {editFeedback && (
              <div className={`admin-push-status ${editFeedback.type}`} style={{ marginBottom: '14px' }}>
                {editFeedback.text}
              </div>
            )}

            <form onSubmit={handleSaveEditScheduled}>
              <div className="admin-form-group">
                <label>Scheduled Trigger Time (Your Local Timezone)</label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={editDateTime}
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setEditDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Notification Title</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Friendly Afternoon Break! ☕"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Target URL Action</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="/lobby"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>Notification Body Message</label>
                <textarea
                  className="admin-push-textarea"
                  rows="3"
                  placeholder="Message to display on player devices..."
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setEditingScheduled(null)}
                  style={{ width: 'auto' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ width: 'auto' }}
                  disabled={isSavingEdit || !editTitle.trim() || !editMessage.trim()}
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Pilot & AI Settings Modal */}
      {showAutoPilotModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAutoPilotModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SparklesIcon size={20} color="#c084fc" />
                <span>AI Auto-Pilot & Engine Settings</span>
              </h3>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setShowAutoPilotModal(false)}
                title="Close"
                aria-label="Close"
                style={{ width: '32px', height: '32px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAutoPilotSettings}>
              {/* Daily Auto-Pilot Toggle Switch */}
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', fontSize: '0.94rem' }}>Automated Daily Peak Scheduling</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      When enabled, the server automatically crafts & schedules 1 optimal situation-aware campaign every day during peak player activity windows, complete with advance subscriber notices.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={aiAutoPilotConfig.enabled}
                      onChange={(e) => handleToggleAutoPilot(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: aiAutoPilotConfig.enabled ? '#7c3aed' : 'rgba(255,255,255,0.2)',
                      borderRadius: '34px', transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute', height: '22px', width: '22px', left: aiAutoPilotConfig.enabled ? '25px' : '3px', bottom: '3px',
                        backgroundColor: '#ffffff', borderRadius: '50%', transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              </div>

              {/* 100% Free Guarantee Info */}
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '16px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                  ✨ 100% Free of Cost Guaranteed:
                </div>
                By default, Bingo runs the <strong>Built-in Smart Semantic AI Engine</strong> directly on the server with 0ms latency, zero credit cards, and zero external costs.
                <div style={{ marginTop: '6px' }}>
                  You can optionally enter a <strong>Google Gemini API Key</strong> below or add <code>GEMINI_API_KEY</code> to your environment variables (e.g. in <code>server/.env</code> or your Render dashboard). Google AI Studio provides 15 free requests/min with zero billing required!
                </div>
              </div>

              {/* Gemini API Key input */}
              <div className="admin-form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Gemini API Key (Optional)</span>
                  <span style={{ fontSize: '0.74rem', color: aiAutoPilotConfig.hasEnvKey ? '#4ade80' : '#a5b4fc', fontWeight: aiAutoPilotConfig.hasEnvKey ? 600 : 400 }}>
                    {aiAutoPilotConfig.hasEnvKey
                      ? '⚡ Active via Environment Variable (GEMINI_API_KEY)'
                      : 'Leave blank to use built-in free AI'}
                  </span>
                </label>
                <input
                  type="password"
                  className="admin-input"
                  placeholder={aiAutoPilotConfig.hasEnvKey ? "Configured via GEMINI_API_KEY environment variable" : "AIzaSy... (optional for Gemini 2.5 Flash free tier)"}
                  value={customApiKeyInput}
                  onChange={(e) => setCustomApiKeyInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowAutoPilotModal(false)}
                  style={{ width: 'auto' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ width: 'auto' }}
                  disabled={isSavingAutoPilot}
                >
                  {isSavingAutoPilot ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
