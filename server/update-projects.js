import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const dbName = process.env.DB_NAME || 'blog_db'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function updateProjectsTable() {
  const connection = await pool.getConnection()

  try {
    // 添加新字段
    await connection.query('ALTER TABLE projects ADD COLUMN github_link VARCHAR(500) AFTER link')
    console.log('✅ 已添加 github_link 字段')
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ github_link 字段已存在')
    } else {
      console.error('添加 github_link 失败:', e.message)
    }
  }

  try {
    await connection.query('ALTER TABLE projects ADD COLUMN readme TEXT AFTER tech')
    console.log('✅ 已添加 readme 字段')
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ readme 字段已存在')
    } else {
      console.error('添加 readme 失败:', e.message)
    }
  }

  console.log('\n✅ Projects 表结构更新完成！')

  // 查看当前表结构
  const [columns] = await connection.query('DESCRIBE projects')
  console.log('\n当前表结构：')
  columns.forEach(col => {
    console.log(`  - ${col.Field} (${col.Type})`)
  })

  connection.release()
  process.exit(0)
}

updateProjectsTable()
