var http = require('http');
var fs = require('fs');
const fsPromises = require('fs').promises;
const { program } = require('commander');
const superagent = require('superagent');

program
    .option('-h, --host <host>')
    .option('-p, --port <port>')
    .option('-c, --cache <cachePath>');

program.parse();
const options = program.opts();

if (!options.host ||!options.port|| !options.cache) {
    console.error('Всі параметри є обов’язковими: --host, --port, --cache');
    process.exit(1);
}

function readFile(filePath) {
    return fsPromises.readFile(filePath)
        .then((data) => data)
        .catch((error) => {
            console.error('Error reading file:', error);
            throw error;
        });
}

function writeFile(filePath, data) {
    return fsPromises.writeFile(filePath, data)
        .then(() => {
            console.log(`File written successfully to ${filePath}`);
        })
        .catch((error) => {
            console.error('Error writing file:', error);
            throw error;
        });
}

function deleteFile(filePath) {
    return fsPromises.unlink(filePath);
}

const server = http.createServer((req, res) => {
    const imagePath = `${options.cache}${req.url}.jpeg`;
    const statusCode = req.url.substring(1); 
if (req.method === 'GET') {
    readFile(imagePath)
        .then((fileData) => {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(fileData);
        })
        .catch(() => {
            superagent
                .get(`https://http.cat/${statusCode}`)
                .then((response) => {
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(response.body); 
                })
                .catch((error) => {
                    console.error(`Error fetching image from http.cat: ${error.message}`);
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Image not found on http.cat');
                });
        });
}   
 else if (req.method === 'PUT') {
            writeFile(imagePath)
                .then((fileData) => {
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(fileData);
                })
                .catch(() => {
                    superagent
                        .get(`https://http.cat/${statusCode}`)
                        .then((response) => {
                            writeFile(imagePath, response.body)
                                .then(() => {
                                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                                    res.end(response.body); 
                                })
                                .catch(() => {
                                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                                    res.end('Error writing image to cache');
                                });
                        })
                        .catch((error) => {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('Image not found on http.cat');
                        });
                }); 
    } else if (req.method === 'DELETE') {
        deleteFile(imagePath)
            .then(() => {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Image is deleted');
            })
            .catch((error) => {
                if (error.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Image not found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error deleting the image');
                }
            });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method is not allowed');
    }
});

server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}`);
});