const express = require('express')
const path = require('path')
var https = require('https')
var fs = require('fs')
const app = express()
var SSLPORT = 3389
//导入HTTPS证书文件  
var keyPath = 'public/cert/214527447900724.key'
var certPath = 'public/cert/214527447900724.pem'
if (process.env.NODE_ENV === "production") {
  keyPath = './cert/214528638570724.key'
  certPath = './cert/214528638570724.pem'
  SSLPORT = 3389
}
const privateKey  = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, certPath), 'utf8');
const credentials = {key: privateKey, cert: certificate}

var httpsServer = https.createServer(credentials, app)
httpsServer.listen(SSLPORT, function() {  
  console.log('HTTPS Server is running on:', SSLPORT);  
})


app.use(express.static( path.join(__dirname, 'public')))
// app.get('/', (req, res) => res.send('Hello World!'))

// app.listen(4000, () => console.log('Example app listening on port 3000!'))