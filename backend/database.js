const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'lachanso.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Loi ket noi SQLite:', err.message);
  } else {
    console.log('Da ket noi voi SQLite database.');
    db.serialize(() => {
      // Bang Users
      db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT, -- 'parent', 'child'
        age INTEGER,
        onboarded BOOLEAN DEFAULT 0
      )`);

      // Bang Logs
      db.run(`CREATE TABLE IF NOT EXISTS Logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        action TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Bang Alerts
      db.run(`CREATE TABLE IF NOT EXISTS Alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        riskLevel TEXT, -- 'low', 'medium', 'high'
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Bang Devices
      db.run(`CREATE TABLE IF NOT EXISTS Devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        name TEXT,
        type TEXT,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Bang FamilyMembers (MOI)
      db.run(`CREATE TABLE IF NOT EXISTS FamilyMembers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        name TEXT NOT NULL,
        age INTEGER,
        role TEXT DEFAULT 'child',
        avatar TEXT DEFAULT '👤',
        safetyScore INTEGER DEFAULT 100,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        deviceId INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Bang Blacklist - Tu khoa tuy chinh (MOI)
      db.run(`CREATE TABLE IF NOT EXISTS Blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        keyword TEXT NOT NULL,
        category TEXT DEFAULT 'custom',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }
});

module.exports = db;
