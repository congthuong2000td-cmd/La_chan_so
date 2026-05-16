const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

const SECRET_KEY = "safeguard_secret";

// ==========================================
// SOCKET.IO — Realtime Connection
// ==========================================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ==========================================
// AUTH APIs
// ==========================================
app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Thieu email hoac mat khau" });
  
  const hashedPassword = bcrypt.hashSync(password, 8);
  
  const stmt = db.prepare('INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)');
  stmt.run(name, email, hashedPassword, role || 'parent', function(err) {
    if (err) {
      if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Email da ton tai" });
      return res.status(500).json({ error: err.message });
    }
    const token = jwt.sign({ id: this.lastID, role: role || 'parent' }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: this.lastID, name, email, role: role || 'parent' } });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM Users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Tai khoan khong ton tai" });
    
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Mat khau khong dung" });
    
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, onboarded: user.onboarded } });
  });
});

app.post('/api/users/:id/onboard', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE Users SET onboarded = 1 WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ==========================================
// LOGS APIs
// ==========================================
app.get('/api/logs', (req, res) => {
  db.all('SELECT * FROM Logs ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ logs: rows });
  });
});

app.post('/api/logs', (req, res) => {
  const { userId, action, content } = req.body;
  const stmt = db.prepare('INSERT INTO Logs (userId, action, content) VALUES (?, ?, ?)');
  stmt.run(userId, action, content, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

// ==========================================
// ALERTS APIs (with Socket.IO realtime)
// ==========================================
app.get('/api/alerts', (req, res) => {
  db.all('SELECT * FROM Alerts ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ alerts: rows });
  });
});

app.post('/api/alerts', (req, res) => {
  const { userId, riskLevel, message } = req.body;
  const stmt = db.prepare('INSERT INTO Alerts (userId, riskLevel, message) VALUES (?, ?, ?)');
  stmt.run(userId, riskLevel, message, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newAlert = { id: this.lastID, userId, riskLevel, message, timestamp: new Date().toISOString() };
    
    // REALTIME: Emit to all connected clients
    io.emit('new-alert', newAlert);

    // Automation: Reduce safety score of the first member (or logic to find associated member)
    if (riskLevel === 'high') {
      db.run('UPDATE FamilyMembers SET safetyScore = MAX(0, safetyScore - 10) WHERE id IN (SELECT id FROM FamilyMembers LIMIT 1)');
    } else if (riskLevel === 'medium') {
      db.run('UPDATE FamilyMembers SET safetyScore = MAX(0, safetyScore - 5) WHERE id IN (SELECT id FROM FamilyMembers LIMIT 1)');
    }
    
    res.json(newAlert);
  });
});

app.delete('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Alerts WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // REALTIME: Notify removal
    io.emit('alert-deleted', { id: parseInt(id) });
    
    res.json({ success: true, deleted: this.changes });
  });
});

// ==========================================
// DEVICES APIs
// ==========================================
app.get('/api/devices', (req, res) => {
  db.all('SELECT * FROM Devices ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ devices: rows });
  });
});

app.post('/api/devices', (req, res) => {
  const { userId, name, type, status } = req.body;
  const stmt = db.prepare('INSERT INTO Devices (userId, name, type, status) VALUES (?, ?, ?, ?)');
  stmt.run(userId, name, type, status, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.delete('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Devices WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// ==========================================
// FAMILY MEMBERS APIs (MOI)
// ==========================================
app.get('/api/family', (req, res) => {
  db.all('SELECT * FROM FamilyMembers ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ members: rows });
  });
});

app.post('/api/family', (req, res) => {
  const { userId, name, age, role, avatar, deviceId } = req.body;
  if (!name) return res.status(400).json({ error: 'Ten thanh vien la bat buoc' });
  
  const stmt = db.prepare('INSERT INTO FamilyMembers (userId, name, age, role, avatar, safetyScore, deviceId) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(userId, name, age || null, role || 'child', avatar || '👤', 100, deviceId || null, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.put('/api/family/:id', (req, res) => {
  const { id } = req.params;
  const { name, age, role, avatar, safetyScore } = req.body;
  db.run(
    'UPDATE FamilyMembers SET name = COALESCE(?, name), age = COALESCE(?, age), role = COALESCE(?, role), avatar = COALESCE(?, avatar), safetyScore = COALESCE(?, safetyScore) WHERE id = ?',
    [name, age, role, avatar, safetyScore, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, updated: this.changes });
    }
  );
});

app.delete('/api/family/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM FamilyMembers WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// ==========================================
// BLACKLIST KEYWORDS APIs (MOI)
// ==========================================
app.get('/api/blacklist', (req, res) => {
  db.all('SELECT * FROM Blacklist ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ keywords: rows });
  });
});

app.post('/api/blacklist', (req, res) => {
  const { userId, keyword, category } = req.body;
  if (!keyword) return res.status(400).json({ error: 'Tu khoa la bat buoc' });
  
  const stmt = db.prepare('INSERT INTO Blacklist (userId, keyword, category) VALUES (?, ?, ?)');
  stmt.run(userId, keyword.toLowerCase().trim(), category || 'custom', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

app.delete('/api/blacklist/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Blacklist WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// ==========================================
// REPORT / SUMMARY API (MOI)
// ==========================================
app.get('/api/report/summary', (req, res) => {
  const result = {};
  
  db.get('SELECT COUNT(*) as total FROM Alerts', [], (err, row) => {
    result.totalAlerts = row ? row.total : 0;
    
    db.get("SELECT COUNT(*) as total FROM Alerts WHERE timestamp >= datetime('now', '-7 days')", [], (err, row) => {
      result.weeklyAlerts = row ? row.total : 0;
      
      db.all("SELECT riskLevel, COUNT(*) as count FROM Alerts GROUP BY riskLevel", [], (err, rows) => {
        result.alertsByLevel = rows || [];
        
        db.get('SELECT COUNT(*) as total FROM Logs', [], (err, row) => {
          result.totalScans = row ? row.total : 0;
          
          db.get("SELECT COUNT(*) as total FROM Logs WHERE timestamp >= datetime('now', '-7 days')", [], (err, row) => {
            result.weeklyScans = row ? row.total : 0;
            
            db.get('SELECT COUNT(*) as total FROM Devices', [], (err, row) => {
              result.totalDevices = row ? row.total : 0;
              
              db.get('SELECT COUNT(*) as total FROM FamilyMembers', [], (err, row) => {
                result.totalMembers = row ? row.total : 0;
                
                db.all("SELECT date(timestamp) as day, COUNT(*) as count FROM Alerts WHERE timestamp >= datetime('now', '-7 days') GROUP BY date(timestamp) ORDER BY day", [], (err, rows) => {
                  result.dailyAlerts = rows || [];
                  
                  // Safety Score: 100 - (high*10 + medium*5 + low*1) capped at 0
                  const highCount = (result.alertsByLevel.find(a => a.riskLevel === 'high') || {}).count || 0;
                  const medCount = (result.alertsByLevel.find(a => a.riskLevel === 'medium') || {}).count || 0;
                  const lowCount = (result.alertsByLevel.find(a => a.riskLevel === 'low') || {}).count || 0;
                  result.safetyScore = Math.max(0, 100 - (highCount * 10 + medCount * 5 + lowCount * 1));
                  
                  res.json(result);
                });
              });
            });
          });
        });
      });
    });
  });
});

// ==========================================
// START SERVER (using http server for Socket.IO)
// ==========================================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend + Socket.IO server running on http://localhost:${PORT}`);
});
