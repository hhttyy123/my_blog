import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { initDatabase } from './database.js'
import articleRoutes from './routes/articles.js'
import projectRoutes from './routes/projects.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 静态文件服务（生产环境）
app.use(express.static(path.join(__dirname, '../dist')))

// API 路由
app.use('/api/articles', articleRoutes)
app.use('/api/projects', projectRoutes)

// SPA 路由支持（所有其他请求返回 index.html）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// 初始化数据库后启动服务器
async function start() {
  try {
    await initDatabase()
    console.log('Database initialized')

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
  }
}

start()
