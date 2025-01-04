import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'

const app = express()
const port = 3519

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const corsOptions = {
    origin: 'https://dtko.hansenfamily.cc',
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'))
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

