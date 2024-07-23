const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 4000;  // You can choose any available port

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'decimal.html' : req.url);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Page not found');
        } else {
            res.writeHead(200, { 'Content-Type': getContentType(filePath) });
            res.end(content);
        }
    });
});

function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'text/javascript';
        default: return 'application/octet-stream';
    }
}

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
