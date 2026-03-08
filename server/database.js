import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// 创建连接池
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

// 初始化数据库（创建表）
async function initDatabase() {
  const connection = await pool.getConnection()

  try {
    // 创建数据库（如果不存在）
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'blog_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.query(`USE ${process.env.DB_NAME || 'blog_db'}`)

    // 创建文章表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        excerpt TEXT,
        category VARCHAR(50) DEFAULT '技术',
        date VARCHAR(20),
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 创建项目表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        tech JSON,
        link VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 检查是否有数据，没有则插入示例数据
    const [articles] = await connection.query('SELECT COUNT(*) as count FROM articles')
    if (articles[0].count === 0) {
      await seedData(connection)
    }

    console.log('MySQL 数据库初始化成功')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  } finally {
    connection.release()
  }
}

// 插入示例数据
async function seedData(connection) {
  const sampleArticles = [
    {
      title: 'Vue 3 响应式原理深度解析',
      content: '# Vue 3 响应式原理深度解析\n\nVue 3 使用 Proxy 替代了 Vue 2 的 Object.defineProperty...',
      excerpt: '深入探讨 Vue 3 的响应式系统，了解 Proxy 如何实现更高效的数据监听',
      category: '前端',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      tags: JSON.stringify(['Vue', 'JavaScript', '响应式'])
    },
    {
      title: 'CSS Grid 布局完全指南',
      content: '# CSS Grid 布局完全指南\n\nCSS Grid 是一个强大的二维布局系统...',
      excerpt: '从基础到高级，全面掌握 CSS Grid 布局的使用方法和最佳实践',
      category: '前端',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      tags: JSON.stringify(['CSS', '布局', '教程'])
    },
    {
      title: 'JavaScript 异步编程实战',
      content: '# JavaScript 异步编程实战\n\n异步编程是 JavaScript 的核心概念之一...',
      excerpt: '深入理解 Promise、async/await，掌握异步编程的最佳实践',
      category: '技术',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      tags: JSON.stringify(['JavaScript', '异步', 'Promise'])
    }
  ]

  const sampleProjects = [
    {
      title: '个人博客系统',
      description: '基于 Vue 3 的现代化博客平台',
      tech: JSON.stringify(['Vue.js', 'Vite', 'JavaScript']),
      link: ''
    },
    {
      title: '天气预报应用',
      description: '实时天气数据展示应用',
      tech: JSON.stringify(['React', 'API', 'CSS']),
      link: ''
    },
    {
      title: '任务管理工具',
      description: '简洁高效的任务管理应用',
      tech: JSON.stringify(['Vue.js', 'Pinia', 'Element']),
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

  console.log('示例数据插入成功')
}

// 获取连接池
export function getDatabase() {
  return pool
}

export { initDatabase }
