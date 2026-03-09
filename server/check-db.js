import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function checkDB() {
  try {
    const [projects] = await pool.query('SELECT id, title, readme FROM projects ORDER BY id DESC LIMIT 5')
    console.log('数据库中的项目:')
    projects.forEach(p => {
      console.log(`ID: ${p.id}, Title: ${p.title}, README: ${p.readme ? '有内容 (' + p.readme.length + ' 字符)' : 'NULL'}`)
    })
    process.exit(0)
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

checkDB()
