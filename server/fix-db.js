import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载项目根目录的 .env
dotenv.config({ path: path.join(__dirname, '../.env') })

const dbName = process.env.DB_NAME || 'blog_db'

// 创建连接池（不指定数据库）
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

    // 清空现有数据
    await connection.query('DELETE FROM articles')
    await connection.query('DELETE FROM projects')

    console.log('已清空旧数据')

    // 插入示例文章
    const sampleArticles = [
      {
        title: 'Vue 3 响应式原理深度解析',
        content: '# Vue 3 响应式原理深度解析\n\nVue 3 使用 Proxy 替代了 Vue 2 的 Object.defineProperty...',
        excerpt: '深入探讨 Vue 3 的响应式系统，了解 Proxy 如何实现更高效的数据监听',
        category: '前端',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        tags: '["Vue", "JavaScript", "响应式"]'
      },
      {
        title: 'CSS Grid 布局完全指南',
        content: '# CSS Grid 布局完全指南\n\nCSS Grid 是一个强大的二维布局系统...',
        excerpt: '从基础到高级，全面掌握 CSS Grid 布局的使用方法和最佳实践',
        category: '前端',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        tags: '["CSS", "布局", "教程"]'
      },
      {
        title: 'JavaScript 异步编程实战',
        content: '# JavaScript 异步编程实战\n\n异步编程是 JavaScript 的核心概念之一...',
        excerpt: '深入理解 Promise、async/await，掌握异步编程的最佳实践',
        category: '技术',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        tags: '["JavaScript", "异步", "Promise"]'
      }
    ]

    const sampleProjects = [
      {
        title: '个人博客系统',
        description: '基于 Vue 3 的现代化博客平台',
        tech: '["Vue.js", "Vite", "JavaScript"]',
        link: ''
      },
      {
        title: '天气预报应用',
        description: '实时天气数据展示应用',
        tech: '["React", "API", "CSS"]',
        link: ''
      },
      {
        title: '任务管理工具',
        description: '简洁高效的任务管理应用',
        tech: '["Vue.js", "Pinia", "Element"]',
        link: ''
      }
    ]

    for (const article of sampleArticles) {
      await connection.query(
        'INSERT INTO articles (title, content, excerpt, category, date, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [article.title, article.content, article.excerpt, article.category, article.date, article.tags]
      )
    }

    for (const project of sampleProjects) {
      await connection.query(
        'INSERT INTO projects (title, description, tech, link) VALUES (?, ?, ?, ?)',
        [project.title, project.description, project.tech, project.link]
      )
    }

    console.log('示例数据重新插入成功')

    // 验证数据
    const [articles] = await connection.query('SELECT id, title, tags FROM articles')
    console.log('\n当前文章数据：')
    articles.forEach(a => {
      console.log(`  ID: ${a.id}, 标题: ${a.title}, Tags: ${a.tags}`)
    })

  } catch (error) {
    console.error('修复失败:', error)
  } finally {
    connection.release()
    process.exit(0)
  }
}

fixDatabase()
