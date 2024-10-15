var http = require('http');
var fs=require('fs');
const { program } = require('commander');
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
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
    
}).listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
}); 
