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

async function fixTags() {
  const connection = await pool.getConnection()

  try {
    // 获取所有文章
    const [articles] = await connection.query('SELECT id, tags FROM articles')

    console.log('修复前数据：')
    for (const article of articles) {
      console.log(`  ID: ${article.id}, Tags: "${article.tags}"`)
    }

    // 修复每个文章的 tags
    for (const article of articles) {
      let newTags = article.tags

      // 如果是逗号分隔格式，转换成 JSON 数组
      if (article.tags && !article.tags.startsWith('[')) {
        const tagsArray = article.tags.split(',').map(t => t.trim())
        newTags = JSON.stringify(tagsArray)

        await connection.query(
          'UPDATE articles SET tags = ? WHERE id = ?',
          [newTags, article.id]
        )
        console.log(`  修复 ID ${article.id}: "${article.tags}" -> "${newTags}"`)
      }
    }

    console.log('\n修复后数据：')
    const [fixedArticles] = await connection.query('SELECT id, tags FROM articles')
    for (const article of fixedArticles) {
      console.log(`  ID: ${article.id}, Tags: "${article.tags}"`)
    }

    // 同样修复 projects 表
    const [projects] = await connection.query('SELECT id, tech FROM projects')

    console.log('\n修复 Projects 表：')
    for (const project of projects) {
      let newTech = project.tech

      if (project.tech && !project.tech.startsWith('[')) {
        const techArray = project.tech.split(',').map(t => t.trim())
        newTech = JSON.stringify(techArray)

        await connection.query(
          'UPDATE projects SET tech = ? WHERE id = ?',
          [newTech, project.id]
        )
        console.log(`  修复 ID ${project.id}: "${project.tech}" -> "${newTech}"`)
      }
    }

    console.log('\n✅ Tags 修复完成！')

  } catch (error) {
    console.error('错误:', error)
  } finally {
    connection.release()
    process.exit(0)
  }
}

fixTags()
