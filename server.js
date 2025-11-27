const jsonServer = require('json-server');
const server = jsonServer.create();
const fs = require('fs');

// Load database into memory
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

// Periodically save to disk (optional)
setInterval(() => {
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
}, 30000); // Save every 30 seconds

server.listen(3000, '0.0.0.0', () => {
  console.log('JSON Server is running on port 3000');
});