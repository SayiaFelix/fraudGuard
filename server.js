const jsonServer = require('json-server');
const server = jsonServer.create();
const fs = require('fs');

let db;
try {
  const dbContent = fs.readFileSync('db.json', 'utf8');
  db = JSON.parse(dbContent);
  console.log('Database loaded successfully');
} catch (error) {
  console.error('Error loading database:', error);
  process.exit(1);
}

const router = jsonServer.router(db);  
const middlewares = jsonServer.defaults();

// CORS headers
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

server.use(middlewares);

// Custom delete handler to avoid lodash-id issues
server.delete('/:resource/:id', (req, res) => {
  const { resource, id } = req.params;
  
  try {
    if (!db[resource] || !Array.isArray(db[resource])) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const index = db[resource].findIndex(item => item.id == id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Remove the item
    db[resource].splice(index, 1);
    
    console.log(`Deleted ${resource} with id: ${id}`);
    res.status(200).json({ message: 'Deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', message: error.message });
  }
});

server.use(router);

setInterval(() => {
  try {
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    console.log('Database saved to disk');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}, 10000); 

server.listen(3000, '0.0.0.0', () => {
  console.log('Enhanced JSON Server running on port 3000');
});