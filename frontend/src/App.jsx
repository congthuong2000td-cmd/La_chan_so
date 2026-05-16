import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { 
  Shield, LayoutDashboard, AlertTriangle, Users, Activity,
  Smartphone, Laptop, Search, Bell, CheckCircle, Cpu, Lock,
  Zap, ChevronRight, Trash2, Plus, LogOut, Link as LinkIcon,
  FileText, X, ShieldAlert, ShieldCheck, Ban, Moon, Sun, Award, TrendingUp, Info
} from 'lucide-react'

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://lachanso.com'
const AI_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://ai.lachanso.com'
const SOCKET_URL = API_URL

const ROLE_LABELS = { child: 'Tre em', elder: 'Nguoi cao tuoi', spouse: 'Vo / Chong', other: 'Khac' }
const ROLE_EMOJIS = { child: '👶', elder: '👴', spouse: '👫', other: '👤' }

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Auth
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // Dashboard state
  const [alerts, setAlerts] = useState([])
  const [devices, setDevices] = useState([])
  const [logs, setLogs] = useState([])
  const [members, setMembers] = useState([])
  const [blacklist, setBlacklist] = useState([])
  const [report, setReport] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanLogs, setScanLogs] = useState([
    { type: 'system', text: 'He thong bao ve dang chay...' },
    { type: 'system', text: 'AI Engine: v3.0.0 — Multi-Signal Risk Scorer' },
    { type: 'system', text: '8 categories | 60+ patterns | 70+ keywords loaded' }
  ])
  const [activeTab, setActiveTab] = useState('dashboard')

  // Forms
  const [newDeviceName, setNewDeviceName] = useState('')
  const [newDeviceType, setNewDeviceType] = useState('mobile')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberAge, setNewMemberAge] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('child')
  const [newMemberDeviceId, setNewMemberDeviceId] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [newKeywordCat, setNewKeywordCat] = useState('custom')

  // Link scanner
  const [linkInput, setLinkInput] = useState('')
  const [linkResult, setLinkResult] = useState(null)
  const [linkLoading, setLinkLoading] = useState(false)

  // Toast notifications
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)

  // UI States
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)

  // Socket ref
  const socketRef = useRef(null)

  // ===== AUTO LOGIN =====
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userString = localStorage.getItem('user')
    if (token && userString) {
      const user = JSON.parse(userString)
      setCurrentUser(user)
      setIsAuthenticated(true)
      // Check for onboarding
      if (!user.onboarded) {
        setShowOnboarding(true)
      }
    }
  }, [])

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : ''
    localStorage.setItem('theme', theme)
  }, [theme])

  // ===== SOCKET.IO CONNECTION =====
  useEffect(() => {
    if (!isAuthenticated) return

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('new-alert', (alert) => {
      setAlerts(prev => [alert, ...prev])
      addToast(alert.riskLevel, 'Canh bao moi!', alert.message)
    })

    socket.on('alert-deleted', ({ id }) => {
      setAlerts(prev => prev.filter(a => a.id !== id))
    })

    return () => { socket.disconnect() }
  }, [isAuthenticated])

  // ===== TOAST SYSTEM =====
  const addToast = (level, title, message) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, level, title, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5500)
  }

  // ===== AUTH =====
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setIsAuthLoading(true)
    setAuthError('')
    try {
      const endpoint = isLoginMode ? '/api/login' : '/api/register'
      const payload = isLoginMode
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword }
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setCurrentUser(data.user)
        setIsAuthenticated(true)
      } else {
        setAuthError(data.error || 'Co loi xay ra!')
      }
    } catch { setAuthError('Khong the ket noi den may chu.') }
    finally { setIsAuthLoading(false) }
  }

  const doLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  // ===== DATA FETCHERS =====
  const fetchAlerts = async () => { try { const r = await fetch(`${API_URL}/api/alerts`); const d = await r.json(); if (d.alerts) setAlerts(d.alerts) } catch (e) { console.error(e) } }
  const fetchDevices = async () => { try { const r = await fetch(`${API_URL}/api/devices`); const d = await r.json(); if (d.devices) setDevices(d.devices) } catch (e) { console.error(e) } }
  const fetchLogs = async () => { try { const r = await fetch(`${API_URL}/api/logs`); const d = await r.json(); if (d.logs) setLogs(d.logs) } catch (e) { console.error(e) } }
  const fetchMembers = async () => { try { const r = await fetch(`${API_URL}/api/family`); const d = await r.json(); if (d.members) setMembers(d.members) } catch (e) { console.error(e) } }
  const fetchBlacklist = async () => { try { const r = await fetch(`${API_URL}/api/blacklist`); const d = await r.json(); if (d.keywords) setBlacklist(d.keywords) } catch (e) { console.error(e) } }
  const fetchReport = async () => { try { const r = await fetch(`${API_URL}/api/report/summary`); const d = await r.json(); setReport(d) } catch (e) { console.error(e) } }

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts(); fetchDevices(); fetchLogs(); fetchMembers(); fetchBlacklist(); fetchReport()
      // Light polling for non-realtime data
      const interval = setInterval(() => { fetchLogs(); fetchReport() }, 15000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  // ===== ACTIONS =====
  const addScanLog = (type, text) => setScanLogs(prev => [...prev.slice(-15), { type, text }])

  const simulateActivity = async () => {
    if (!textInput.trim()) return
    setLoading(true)
    addScanLog('analyzing', `[SCAN] Dang phan tich: "${textInput.slice(0, 60)}${textInput.length > 60 ? '...' : ''}"...`)
    addScanLog('system', `[ENGINE] Quet 8 category × ${textInput.split(' ').length} tokens...`)
    try {
      const aiRes = await fetch(`${AI_URL}/ai/check-text`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput })
      })
      const aiData = await aiRes.json()
      
      if (aiData.riskLevel === 'high' || aiData.riskLevel === 'medium') {
        addScanLog('result', `⚠️ [${aiData.riskLevel.toUpperCase()}] ${aiData.label} — Confidence: ${Math.round((aiData.confidence || 0.8) * 100)}%`)
        if (aiData.details && aiData.details.length > 1) {
          aiData.details.slice(1).forEach(d => {
            addScanLog('system', `   ↳ ${d.label} (${Math.round(d.confidence * 100)}%, ${d.signals} signals)`)
          })
        }
        await fetch(`${API_URL}/api/alerts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser?.id || 1, riskLevel: aiData.riskLevel, message: `[${aiData.category}] ${aiData.label}: "${textInput.slice(0, 80)}"` })
        })
      } else {
        addScanLog('result', `✅ [SAFE] ${aiData.label} — Confidence: ${Math.round((aiData.confidence || 0.95) * 100)}%`)
        // Award XP for safe scanning!
        if (currentUser) {
          addScanLog('system', `🎁 Ban nhan duoc +10 XP vi da chu dong bao mat!`)
        }
      }
      fetchLogs(); fetchReport()
      setTextInput('')
    } catch {
      addScanLog('result', '❌ [ERROR] Loi ket noi den dich vu AI/Backend.')
    } finally { setLoading(false) }
  }

  const scanLink = async () => {
    if (!linkInput.trim()) return
    setLinkLoading(true); setLinkResult(null)
    try {
      const r = await fetch(`${AI_URL}/ai/check-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkInput })
      })
      const data = await r.json()
      setLinkResult(data)
    } catch { setLinkResult({ riskLevel: 'error', message: 'Khong ket noi duoc den AI Service.' }) }
    finally { setLinkLoading(false) }
  }

  const deleteAlert = async (id) => { try { await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' }) } catch (e) { console.error(e) } }

  const addDevice = async (e) => {
    e.preventDefault(); if (!newDeviceName) return
    try {
      const res = await fetch(`${API_URL}/api/devices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || 1, name: newDeviceName, type: newDeviceType, status: 'safe' })
      })
      if (res.ok) {
        addToast('success', 'Thanh cong', 'Da them thiet bi moi!')
        setNewDeviceName(''); fetchDevices()
      } else {
        addToast('error', 'Loi', 'Khong the luu thiet bi.')
      }
    } catch (e) { 
      console.error(e)
      addToast('error', 'Loi ket noi', 'Khong the ket noi den may chu.')
    }
  }
  const deleteDevice = async (id) => { try { await fetch(`${API_URL}/api/devices/${id}`, { method: 'DELETE' }); fetchDevices() } catch (e) { console.error(e) } }

  const addMember = async (e) => {
    e.preventDefault(); if (!newMemberName) return
    try {
      const res = await fetch(`${API_URL}/api/family`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser?.id || 1, 
          name: newMemberName, 
          age: newMemberAge ? parseInt(newMemberAge) : null, 
          role: newMemberRole, 
          avatar: ROLE_EMOJIS[newMemberRole] || '👤',
          deviceId: newMemberDeviceId || null
        })
      })
      if (res.ok) {
        addToast('success', 'Thanh cong', 'Da them thanh vien moi!')
        setNewMemberName(''); setNewMemberAge(''); setNewMemberDeviceId(''); fetchMembers()
      } else {
        addToast('error', 'Loi', 'Khong the luu thanh vien.')
      }
    } catch (e) { 
      console.error(e)
      addToast('error', 'Loi ket noi', 'Khong the ket noi den may chu.')
    }
  }
  const deleteMember = async (id) => { try { await fetch(`${API_URL}/api/family/${id}`, { method: 'DELETE' }); fetchMembers() } catch (e) { console.error(e) } }

  const addKeyword = async (e) => {
    e.preventDefault(); if (!newKeyword.trim()) return
    try {
      await fetch(`${API_URL}/api/blacklist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || 1, keyword: newKeyword, category: newKeywordCat })
      })
      setNewKeyword(''); fetchBlacklist()
    } catch (e) { console.error(e) }
  }
  const deleteKeyword = async (id) => { try { await fetch(`${API_URL}/api/blacklist/${id}`, { method: 'DELETE' }); fetchBlacklist() } catch (e) { console.error(e) } }

  const highRisks = alerts.filter(a => a.riskLevel === 'high').length
  const renderIcon = (type) => type === 'laptop' || type === 'desktop' ? <Laptop size={18} /> : <Smartphone size={18} />

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)'
    if (score >= 50) return 'var(--warning)'
    return 'var(--danger)'
  }

  // ===== CHART COLORS =====
  const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981']

  // ██████████████████████
  // AUTH SCREEN
  // ██████████████████████
  if (!isAuthenticated) {
    return (
      <div className="auth-wrapper page-transition-enter">
        <div className="auth-card">
          <div className="auth-header">
            <Shield className="logo-shield" size={48} strokeWidth={2.5} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isLoginMode ? 'Dang nhap he thong' : 'Tao tai khoan moi'}
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Nen tang bao ve gia dinh SafeGuard
            </p>
          </div>
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {!isLoginMode && (
              <div className="auth-input-group">
                <input type="text" className="auth-input" placeholder="Ho va Ten" value={authName} onChange={e => setAuthName(e.target.value)} required />
              </div>
            )}
            <div className="auth-input-group">
              <input type="email" className="auth-input" placeholder="Dia chi Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
            </div>
            <div className="auth-input-group">
              <input type="password" className="auth-input" placeholder="Mat khau" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            </div>
            {authError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center' }}>{authError}</div>}
            <button type="submit" className="auth-btn" disabled={isAuthLoading}>
              {isAuthLoading ? 'DANG XU LY...' : (isLoginMode ? 'DANG NHAP' : 'DANG KY')}
            </button>
          </form>
          <div className="auth-toggle">
            {isLoginMode ? "Chua co tai khoan? " : "Da co tai khoan? "}
            <span onClick={() => { setIsLoginMode(!isLoginMode); setAuthError('') }}>
              {isLoginMode ? 'Tao moi ngay' : 'Dang nhap'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ██████████████████████
  // VIEWS
  // ██████████████████████
  const renderDashboard = () => (
    <>
      <section className="page-header">
        <h1>Bang dieu khien Giam sat</h1>
        <p>Bao ve gia dinh ban bang cong nghe AI tien tien hang dau.</p>
      </section>

      <div className="dashboard-grid">
        <div className="stat-card-new">
          <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--primary)' }}><Smartphone size={24} /></div>
          <div className="stat-info">
            <span className="label">Thiet bi ket noi</span>
            <div className="value">{devices.length} / 10</div>
            <div className="stat-trend text-emerald"><CheckCircle size={12} /> Dong bo hoan tat</div>
          </div>
        </div>
        <div className="stat-card-new">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}><Lock size={24} /></div>
          <div className="stat-info">
            <span className="label">Diem an toan</span>
            <div className="value">{report ? report.safetyScore : '...'}/100</div>
            <div className="stat-trend text-emerald"><Zap size={12} /> {report && report.safetyScore >= 80 ? 'Rat tot' : 'Can canh giac'}</div>
          </div>
        </div>
        <div className="stat-card-new">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <span className="label">Canh bao rui ro cao</span>
            <div className="value">{highRisks}</div>
            <div className="stat-trend text-rose">Phat hien thuc te</div>
          </div>
        </div>
        <div className="stat-card-new">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--secondary)' }}><Users size={24} /></div>
          <div className="stat-info">
            <span className="label">Thanh vien gia dinh</span>
            <div className="value">{members.length}</div>
            <div className="stat-trend text-indigo">Dang giam sat</div>
          </div>
        </div>
      </div>

      {/* Link Scanner */}
      <div className="link-scanner">
        <div className="panel-header">
          <div className="panel-title"><LinkIcon className="text-cyan" size={20} /><span>Quet Link Nguy hiem</span></div>
          <span className="badge-v2 scanning">URL Shield</span>
        </div>
        <div className="link-input-row" style={{ marginTop: '1rem' }}>
          <input className="link-input" placeholder="Dan link can kiem tra (VD: https://free-gift.com/claim)" value={linkInput} onChange={e => setLinkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && scanLink()} />
          <button className="console-btn" onClick={scanLink} disabled={linkLoading} style={{ whiteSpace: 'nowrap' }}>
            {linkLoading ? 'DANG QUET...' : 'QUET LINK'}
          </button>
        </div>
        {linkResult && (
          <div className={`link-result ${linkResult.riskLevel === 'high' ? 'danger' : linkResult.riskLevel === 'medium' ? 'danger' : 'safe'}`}>
            {linkResult.riskLevel === 'high' ? <ShieldAlert size={24} style={{ color: 'var(--danger)' }} /> : linkResult.riskLevel === 'medium' ? <ShieldAlert size={24} style={{ color: 'var(--warning)' }} /> : <ShieldCheck size={24} style={{ color: 'var(--success)' }} />}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong style={{ color: linkResult.riskLevel === 'high' ? 'var(--danger)' : linkResult.riskLevel === 'medium' ? 'var(--warning)' : 'var(--success)' }}>
                  {linkResult.riskLevel === 'high' ? '🔴 NGUY HIEM!' : linkResult.riskLevel === 'medium' ? '🟡 CAN THAN' : '🟢 AN TOAN'}
                </strong>
                {linkResult.confidence && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'var(--glass)', padding: '2px 8px', borderRadius: '4px' }}>
                    {Math.round(linkResult.confidence * 100)}% confidence · {linkResult.signals || 0} signals
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{linkResult.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className="simulation-row">
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title"><Cpu className="text-cyan" size={20} /><span>Mo phong Phan tich Noi dung AI</span></div>
            <span className="badge-v2 scanning">Live Analysis</span>
          </div>
          <div className="scanner-console">
            <div className="console-input-wrap">
              <input type="text" className="console-input" placeholder="Nhap noi dung hoi thoai, tu khoa hoac link..." value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && simulateActivity()} />
              <button className="console-btn" onClick={simulateActivity} disabled={loading}>
                {loading ? 'ANALYZING...' : 'QUET AI'}
              </button>
            </div>
            <div className="scan-output">
              {scanLogs.map((log, i) => (
                <div key={i} className={`output-line ${log.type}`}>
                  <span style={{ color: 'var(--primary)', opacity: 0.6 }}>[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
              {loading && (
                <div className="output-line analyzing">
                  <span className="pulse-dot" style={{ width: 6, height: 6 }}></span>
                  <span>Dang trich xuat dac trung ngon ngu...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title"><Smartphone className="text-secondary" size={20} /><span>Thiet bi Gan Day</span></div>
          </div>
          <div className="device-list">
            {devices.length === 0 ? <p style={{ color: 'var(--text-dim)' }}>Chua co thiet bi nao</p> : devices.slice(0, 3).map((d, i) => (
              <div key={d.id || i} className="device-item">
                <div className="device-info">
                  <div style={{ padding: 8, background: 'var(--glass)', borderRadius: 8 }}>{renderIcon(d.type)}</div>
                  <div className="device-meta">
                    <div className="name">{d.name}</div>
                    <div className="status" style={{ color: d.status === 'safe' ? 'var(--success)' : 'var(--primary)' }}>
                      {d.status === 'safe' ? 'Dang an toan' : 'Dang quet AI...'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-dim" />
              </div>
            ))}
            <button className="nav-link" onClick={() => setActiveTab('family')} style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', border: '1px dashed var(--glass-border)', fontSize: '0.85rem' }}>
              Xem tat ca thiet bi
            </button>
          </div>
        </div>
      </div>
    </>
  )

  const renderAlerts = () => (
    <section className="glass-panel">
      <div className="panel-header">
        <div className="panel-title"><AlertTriangle className="text-amber" size={24} /><span style={{ fontSize: '1.2rem' }}>Canh bao Rui ro & Su co</span></div>
      </div>
      {alerts.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '3rem' }}>
          <Shield size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
          <h3>Tuyet voi!</h3>
          <p>He thong tron tru va khong phat hien rui ro nao.</p>
        </div>
      ) : (
        <div className="alert-container-scroll" style={{ maxHeight: 'none' }}>
          {alerts.map((alert, idx) => (
            <div key={alert.id || idx} className={`alert-card ${alert.riskLevel}`}>
              <div className="alert-icon-box" style={{ background: alert.riskLevel === 'high' ? 'var(--danger-glow)' : 'var(--warning-glow)', color: alert.riskLevel === 'high' ? 'var(--danger)' : 'var(--warning)' }}>
                <AlertTriangle size={20} />
              </div>
              <div className="alert-body" style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.05rem' }}>{alert.message}</h4>
                <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span className={`badge-v2 ${alert.riskLevel === 'high' ? 'text-rose' : 'text-amber'}`}>{alert.riskLevel?.toUpperCase()} RISK</span>
                <button onClick={() => deleteAlert(alert.id)} style={{ background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Xoa / Da xu ly
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )

  const renderFamily = () => (
    <>
      {/* Family Members Grid */}
      <section className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-header">
           <div className="panel-title"><Users className="text-secondary" size={20} /><span>Thành viên Gia đình</span></div>
        </div>
        <div className="members-grid" style={{ marginTop: '1rem' }}>
          {members.map(m => (
            <div key={m.id} className="member-card">
              <button className="member-delete" onClick={() => deleteMember(m.id)}><X size={16} /></button>
              <span className="member-avatar">{m.avatar || '👤'}</span>
              <div className="member-name">{m.name}</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                 <div className="level-badge">
                   <Zap size={10} fill="currentColor" /> LVL {m.level || 1}
                 </div>
              </div>
              <div className="member-role">{ROLE_LABELS[m.role] || m.role}{m.age ? ` · ${m.age} tuổi` : ''}</div>
              
              <div className="member-xp-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
                  <span>XP: {m.xp || 0}/100</span>
                  <span>{Math.round(((m.xp || 0)/100)*100)}%</span>
                </div>
                <div className="xp-bar-bg">
                  <div className="xp-bar-fill" style={{ width: `${(m.xp || 0) % 100}%` }} />
                </div>
              </div>

              <div className="member-score" style={{ marginTop: '15px' }}>
                <span style={{ fontSize: '0.8rem', color: getScoreColor(m.safetyScore) }}>An toàn: {m.safetyScore}%</span>
                <div className="score-bar-bg">
                  <div className="score-bar-fill" style={{ width: `${m.safetyScore}%`, background: getScoreColor(m.safetyScore) }} />
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && <p style={{ color: 'var(--text-dim)', gridColumn: '1/-1' }}>Chưa có thành viên nào. Hãy thêm người thân để bắt đầu bảo vệ!</p>}
        </div>

        {/* Add member form */}
        <form onSubmit={addMember} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--bg-accent)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Tên</label>
            <input required type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }} placeholder="VD: Bé Tuấn" />
          </div>
          <div style={{ flex: '0 0 80px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Tuổi</label>
            <input type="number" value={newMemberAge} onChange={e => setNewMemberAge(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }} placeholder="12" />
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Vai trò</label>
            <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
              <option value="child">Trẻ em</option>
              <option value="elder">Người cao tuổi</option>
              <option value="spouse">Vợ / Chồng</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div style={{ flex: '0 0 160px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Thiết bị gắn kèm</label>
            <select 
              value={newMemberDeviceId}
              onChange={e => setNewMemberDeviceId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }}
            >
              <option value="">Không có</option>
              {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button type="submit" className="console-btn" style={{ padding: '10px 20px' }}>+ THÊM</button>
        </form>
      </section>

      {/* Devices */}
      <div className="simulation-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <section className="glass-panel">
          <div className="panel-header"><div className="panel-title"><Plus className="text-cyan" size={20} /><span>Them Thiet Bi Moi</span></div></div>
          <form onSubmit={addDevice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Ten thiet bi</label>
              <input required type="text" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loai thiet bi</label>
              <select value={newDeviceType} onChange={e => setNewDeviceType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
                <option value="mobile">Dien thoai</option><option value="tablet">May tinh bang</option><option value="laptop">Laptop</option>
              </select>
            </div>
            <button type="submit" className="console-btn" style={{ marginTop: '1rem' }}>LUU THIET BI</button>
          </form>
        </section>
        <section className="glass-panel">
          <div className="panel-header"><div className="panel-title"><Smartphone className="text-secondary" size={20} /><span>Danh Sach Thiet Bi</span></div></div>
          <div className="device-list">
            {devices.map(d => (
              <div key={d.id} className="device-item" style={{ padding: '1rem' }}>
                <div className="device-info">
                  <div style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: '8px' }}>{renderIcon(d.type)}</div>
                  <div className="device-meta">
                    <div className="name" style={{ fontSize: '1.05rem' }}>{d.name}</div>
                    <div className="status" style={{ color: d.status === 'safe' ? 'var(--success)' : 'var(--primary)', marginTop: '4px' }}>AI: {d.status === 'safe' ? 'An toan' : 'Dang quet...'}</div>
                  </div>
                </div>
                <button onClick={() => deleteDevice(d.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}><Trash2 size={20} /></button>
              </div>
            ))}
            {devices.length === 0 && <p style={{ color: 'var(--text-dim)', padding: '1rem' }}>Chua co thiet bi nao.</p>}
          </div>
        </section>
      </div>

      {/* Blacklist Keywords */}
      <section className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header">
          <div className="panel-title"><Ban className="text-rose" size={20} /><span>Danh sach den Tu khoa</span></div>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Them tu khoa tuy chinh. AI se uu tien phat hien cac tu nay khi quet noi dung.</p>
        <div className="keyword-tags">
          {blacklist.map(kw => (
            <div key={kw.id} className="keyword-tag">
              {kw.keyword}
              <button onClick={() => deleteKeyword(kw.id)}>×</button>
            </div>
          ))}
          {blacklist.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Chua co tu khoa nao.</span>}
        </div>
        <form onSubmit={addKeyword} className="keyword-input-row">
          <input type="text" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="Nhap tu khoa (VD: co bac, cho vay)" style={{ flex: 1, padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
          <select value={newKeywordCat} onChange={e => setNewKeywordCat(e.target.value)} style={{ padding: '10px', background: 'var(--bg-deep)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
            <option value="custom">Tu chinh</option><option value="scam">Lua dao</option><option value="violence">Bao luc</option><option value="gambling">Co bac</option>
          </select>
          <button type="submit" className="console-btn" style={{ padding: '10px 20px' }}>+ THEM</button>
        </form>
      </section>
    </>
  )

  const renderReport = () => {
    const score = report?.safetyScore ?? 100
    const circumference = 2 * Math.PI * 70
    const offset = circumference - (score / 100) * circumference
    const pieData = (report?.alertsByLevel || []).map(a => ({ name: a.riskLevel, value: a.count }))
    const barData = (report?.dailyAlerts || []).map(d => ({ day: d.day?.slice(5), count: d.count }))

    return (
      <>
        {/* Hero Safety Score */}
        <div className="report-hero">
          <div className="safety-ring">
            <svg width="180" height="180">
              <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="90" cy="90" r="70" fill="none" stroke={getScoreColor(score)} strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="safety-ring-text">
              <div className="score-value">{score}</div>
              <div className="score-label">DIEM AN TOAN</div>
            </div>
          </div>
          <div className="report-summary">
            <h2>{score >= 80 ? '🛡️ Gia dinh ban dang an toan!' : score >= 50 ? '⚠️ Can chu y hon!' : '🚨 Canh bao nghiem trong!'}</h2>
            <p>{score >= 80 ? 'He thong hoat dong on dinh. Tiep tuc duy tri cac thoi quen tot de bao ve gia dinh.' : 'Da phat hien nhieu rui ro. Hay kiem tra tab Canh bao de xu ly.'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="report-grid">
          <div className="report-stat">
            <div className="stat-num" style={{color: 'var(--primary)'}}>{report?.totalScans || 0}</div>
            <div className="stat-label">Tong quet AI</div>
          </div>
          <div className="report-stat">
            <div className="stat-num" style={{color: 'var(--danger)'}}>{report?.totalAlerts || 0}</div>
            <div className="stat-label">Tong canh bao</div>
          </div>
          <div className="report-stat">
            <div className="stat-num" style={{color: 'var(--success)'}}>{report?.totalDevices || 0}</div>
            <div className="stat-label">Thiet bi</div>
          </div>
          <div className="report-stat">
            <div className="stat-num" style={{color: 'var(--secondary)'}}>{report?.totalMembers || 0}</div>
            <div className="stat-label">Thanh vien</div>
          </div>
        </div>

        {/* Charts */}
        <div className="report-charts">
          <div className="chart-panel">
            <h3>📊 Canh bao 7 ngay gan nhat</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="day" stroke="var(--text-dim)" fontSize={12} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '3rem' }}>Chua co du lieu trong 7 ngay qua.</p>}
          </div>
          <div className="chart-panel">
            <h3>🎯 Phan loai rui ro</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '3rem' }}>Chua co canh bao nao.</p>}
          </div>
        </div>

        {/* Recent Logs */}
        <section className="glass-panel">
          <div className="panel-header"><div className="panel-title"><Activity className="text-cyan" size={20} /><span>Hoat dong Gan day</span></div></div>
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Thoi gian</th><th>Hanh dong</th><th>Noi dung</th></tr></thead>
              <tbody>
                {logs.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Khong co nhat ky nao.</td></tr>
                  : [...logs].slice(0, 10).map(log => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-dim)' }}>#{log.id}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td><span className="badge-v2 scanning" style={{ background: 'var(--glass)', color: 'var(--primary)' }}>{log.action}</span></td>
                      <td>{log.content}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    )
  }

  const renderAnalysis = () => (
    <section className="glass-panel">
      <div className="panel-header"><div className="panel-title"><Activity className="text-cyan" size={20} /><span>Nhat Ky Hanh Vi Toan He Thong (Logs)</span></div></div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Thoi gian</th><th>Hanh dong</th><th>Noi dung chi tiet</th></tr></thead>
          <tbody>
            {logs.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>Khong co nhat ky nao.</td></tr>
              : [...logs].reverse().map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-dim)' }}>#{log.id}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td><span className="badge-v2 scanning" style={{ background: 'var(--glass)', color: 'var(--primary)' }}>{log.action}</span></td>
                  <td>{log.content}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const completeOnboarding = async () => {
    setShowOnboarding(false)
    if (currentUser) {
      try {
        await fetch(`${API_URL}/api/users/${currentUser.id}/onboard`, { method: 'POST' })
        const updatedUser = { ...currentUser, onboarded: 1 }
        setCurrentUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
      } catch (e) { console.error(e) }
    }
  }

  const renderOnboarding = () => {
    const steps = [
      { title: 'Chào mừng bạn!', desc: 'SafeGuard là vệ sĩ tàng hình cho gia đình bạn trên không gian mạng.', icon: <Shield size={32}/> },
      { title: 'Giám sát AI v3', desc: 'Công nghệ AI quét hơn 60 loại rủi ro (lừa đảo, bạo lực, nsfw...).', icon: <Cpu size={32}/> },
      { title: 'Gamification', desc: 'Thành viên earn XP khi dùng mạng an toàn. Cùng nhau thăng hạng!', icon: <Award size={32}/> },
      { title: 'Báo cáo thông minh', desc: 'Nhận báo cáo an toàn hàng tuần và cảnh báo thời gian thực.', icon: <TrendingUp size={32}/> }
    ]
    const cur = steps[onboardingStep]

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="onboarding-step-icon">{cur.icon}</div>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>{cur.title}</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>{cur.desc}</p>
          
          <div className="onboarding-steps" style={{ justifyContent: 'center' }}>
            {steps.map((_, i) => (
              <div key={i} className={`onboarding-dot ${i === onboardingStep ? 'active' : ''}`} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {onboardingStep > 0 && <button className="console-btn" style={{ background: 'var(--bg-accent)', flex: 1 }} onClick={() => setOnboardingStep(s => s - 1)}>Quay lại</button>}
            <button className="console-btn" style={{ flex: 2 }} onClick={() => {
              if (onboardingStep < steps.length - 1) setOnboardingStep(s => s + 1)
              else completeOnboarding()
            }}>
              {onboardingStep === steps.length - 1 ? 'Bắt đầu ngay' : 'Tiếp theo'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-container ${theme === 'light' ? 'light-theme' : ''}`}>
      {showOnboarding && renderOnboarding()}
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.level}`} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
            <div className={`toast-icon ${t.level}`}><AlertTriangle size={18} /></div>
            <div className="toast-body">
              <h4>{t.title}</h4>
              <p>{t.message}</p>
            </div>
            <div className="toast-progress" />
          </div>
        ))}
      </div>

      <aside className="sidebar">
        <div className="logo-area">
          <img src="/logo.png" alt="Logo SafeGuard" style={{ width: '40px', height: '40px', objectFit: 'contain' }} className="logo-shield" />
          <span className="logo-name">SafeGuard</span>
        </div>
        <nav className="nav-menu">
          <div className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </div>
          <div className={`nav-link ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
            <AlertTriangle size={20} /> <span>Cảnh báo</span>
            {alerts.length > 0 && <span className="alert-count">{alerts.length}</span>}
          </div>
          <div className={`nav-link ${activeTab === 'family' ? 'active' : ''}`} onClick={() => setActiveTab('family')}>
            <Users size={20} /> <span>Gia đình</span>
          </div>
          <div className={`nav-link ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
            <Activity size={20} /> <span>Báo cáo</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} title="Chỉnh sáng/tối">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="nav-link" onClick={() => { localStorage.clear(); setIsAuthenticated(false); }} style={{ color: 'var(--danger)', marginTop: '5px' }}>
            <LogOut size={20} /> <span>Đăng xuất</span>
          </div>
        </div>
      </aside>

      <main className="main-wrapper">
        <header className="top-bar">
          <div className="search-sim"><Search size={16} /><span>Tìm kiếm nội dung...</span></div>
          <div className="system-status">
            <div className="status-indicator"><div className="pulse-dot"></div>AI Engine: v3.0.0 Active</div>
            <div className="nav-link" style={{ padding: '8px', position: 'relative' }}>
              <Bell size={20} />
              {toasts.length > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />}
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(to right, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>
        <div className="content-scroll">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'alerts' && renderAlerts()}
          {activeTab === 'family' && renderFamily()}
          {activeTab === 'report' && renderReport()}
        </div>
      </main>
    </div>
  )
}

export default App
