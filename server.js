const jsonServer = require('json-server');
const server = jsonServer.create();
const fs = require('fs');

// Load database into memory to avoid file locking
const db = JSON.parse(fs.readFileSync('db.json'));
const router = jsonServer.router(db); // Use in-memory database

const middlewares = jsonServer.defaults();

// CORS headers
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

server.use(middlewares);
server.use(router);

// Save to disk periodically (every 30 seconds) instead of on every write
setInterval(() => {
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  console.log('Database saved to disk');
}, 30000);

server.listen(3000, '0.0.0.0', () => {
  console.log('JSON Server is running on port 3000 with in-memory database');
});