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
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function fixDatabase() {
  const connection = await pool.getConnection()

  try {
    await connection.query(`USE ${dbName}`)

    // 修改 tags 字段为 TEXT 类型
    await connection.query('ALTER TABLE articles MODIFY COLUMN tags TEXT')
    await connection.query('ALTER TABLE projects MODIFY COLUMN tech TEXT')
    console.log('已将 tags/tech 字段改为 TEXT 类型')

    // 清空数据
    await connection.query('DELETE FROM articles')
    await connection.query('DELETE FROM projects')

    // 插入正确的 JSON 字符串
    const articles = [
      ['Vue 3 响应式原理深度解析', '# Vue 3 响应式原理深度解析\n\nVue 3 使用 Proxy...', '深入探讨 Vue 3 的响应式系统', '前端', '2026.03.08', '["Vue","JavaScript","响应式"]'],
      ['CSS Grid 布局完全指南', '# CSS Grid 布局完全指南\n\nCSS Grid 是一个强大的...', '从基础到高级，全面掌握', '前端', '2026.03.08', '["CSS","布局","教程"]'],
      ['JavaScript 异步编程实战', '# JavaScript 异步编程实战\n\n异步编程是核心概念...', '深入理解 Promise', '技术', '2026.03.08', '["JavaScript","异步","Promise"]']
    ]

    for (const article of articles) {
      await connection.query(
        'INSERT INTO articles (title, content, excerpt, category, date, tags) VALUES (?, ?, ?, ?, ?, ?)',
        article
      )
    }

    const projects = [
      ['个人博客系统', '基于 Vue 3 的现代化博客平台', '["Vue.js","Vite","JavaScript"]', ''],
      ['天气预报应用', '实时天气数据展示应用', '["React","API","CSS"]', ''],
      ['任务管理工具', '简洁高效的任务管理应用', '["Vue.js","Pinia","Element"]', '']
    ]

    for (const project of projects) {
      await connection.query(
        'INSERT INTO projects (title, description, tech, link) VALUES (?, ?, ?, ?)',
        project
      )
    }

    console.log('数据重新插入成功')

    // 验证
    const [result] = await connection.query('SELECT id, title, tags FROM articles')
    console.log('\n验证数据：')
    for (const row of result) {
      console.log(`  ID: ${row.id}, Tags: "${row.tags}"`)
      const parsed = JSON.parse(row.tags)
      console.log(`  解析后:`, parsed)
    }

  } catch (error) {
    console.error('错误:', error)
  } finally {
    connection.release()
    process.exit(0)
  }
}

fixDatabase()
