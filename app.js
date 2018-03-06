const express = require('express')
const path = require('path')
const app = express()
app.use(express.static('public'))
// app.get('/', (req, res) => res.send('Hello World!'))

app.listen(4000, () => console.log('Example app listening on port 3000!'))