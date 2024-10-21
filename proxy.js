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

if (!options.host || !options.port || !options.cache) {
    console.error('Всі параметри є обов’язковими: --host, --port, --cache');
    process.exit(1);
}

function readFile(filePath) {
    return fsPromises.readFile(filePath)
        .then((data) => data)
        .catch((error) => {
            console.error('Помилка читання файлу:', error);
            throw error;
        });
}

function writeFile(filePath, data) {
    return fsPromises.writeFile(filePath, data)
        .then(() => {
            console.log(`Файл записаний успішно в ${filePath}`);
        })
        .catch((error) => {
            console.error('Помилка запису файлу:', error);
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
                    console.error(`Помилка зтягування фото з http.cat: ${error.message}`);
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Фото не знайдено на http.cat');
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
                                    res.end('Помилка запису фото в кеш');
                                });
                        })
                        .catch((error ) => {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('Фото не знайдено в http.cat');
                        });
                }); 
    } else if (req.method === 'DELETE') {
        deleteFile(imagePath)
            .then(() => {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Фото видалене');
            })
            .catch((error) => {
                if (error.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Фото не знайдене' );
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Помилка видалення фото');
                }
            });
    } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Метод не дозволений');
    }
});

server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}`);
});