import express from 'express'
import { getDatabase } from '../database.js'

const router = express.Router()

// 获取所有文章
router.get('/', async (req, res) => {
  try {
    const db = getDatabase()
    const [articles] = await db.query('SELECT * FROM articles ORDER BY id DESC')

    // 解析 JSON 字段
    const parsedArticles = articles.map(article => ({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : []
    }))

    res.json(parsedArticles)
  } catch (error) {
    console.error('获取文章失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取单篇文章
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase()
    const [articles] = await db.query('SELECT * FROM articles WHERE id = ?', [req.params.id])

    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' })
    }

    const article = articles[0]
    res.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : []
    })
  } catch (error) {
    console.error('获取文章失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 创建文章
router.post('/', async (req, res) => {
  const { title, content, excerpt, category, date, tags } = req.body

  try {
    const db = getDatabase()
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : tags

    const [result] = await db.query(
      'INSERT INTO articles (title, content, excerpt, category, date, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, excerpt, category, date || new Date().toISOString().split('T')[0].replace(/-/g, '.'), tagsJson]
    )

    const [articles] = await db.query('SELECT * FROM articles WHERE id = ?', [result.insertId])
    const article = articles[0]

    res.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : []
    })
  } catch (error) {
    console.error('创建文章失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 更新文章
router.put('/:id', async (req, res) => {
  const { title, content, excerpt, category, date, tags } = req.body

  try {
    const db = getDatabase()
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : tags

    await db.query(
      'UPDATE articles SET title = ?, content = ?, excerpt = ?, category = ?, date = ?, tags = ? WHERE id = ?',
      [title, content, excerpt, category, date, tagsJson, req.params.id]
    )

    const [articles] = await db.query('SELECT * FROM articles WHERE id = ?', [req.params.id])
    const article = articles[0]

    res.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : []
    })
  } catch (error) {
    console.error('更新文章失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 删除文章
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase()
    await db.query('DELETE FROM articles WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('删除文章失败:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
