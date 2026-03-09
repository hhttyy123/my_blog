import express from 'express'
import { getDatabase } from '../database.js'

const router = express.Router()

// 获取所有文章
router.get('/', async (req, res) => {
  try {
    const db = getDatabase()
    const [articles] = await db.query('SELECT * FROM articles ORDER BY id DESC')

    // 解析 tags 字段（支持逗号分隔的字符串或 JSON 数组）
    const parsedArticles = articles.map(article => {
      let tags = []
      if (article.tags) {
        if (typeof article.tags === 'string') {
          // 如果是逗号分隔的字符串，按逗号分割
          tags = article.tags.split(',').map(t => t.trim()).filter(t => t)
        } else {
          tags = article.tags
        }
      }
      return { ...article, tags }
    })

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
    console.log('获取文章 ID:', req.params.id)
    const [articles] = await db.query('SELECT * FROM articles WHERE id = ?', [req.params.id])

    if (articles.length === 0) {
      console.log('文章不存在')
      return res.status(404).json({ error: 'Article not found' })
    }

    const article = articles[0]
    let tags = []
    if (article.tags) {
      if (typeof article.tags === 'string') {
        tags = article.tags.split(',').map(t => t.trim()).filter(t => t)
      } else {
        tags = article.tags
      }
    }
    const result = { ...article, tags }
    console.log('返回文章数据:', { id: result.id, title: result.title, tags: result.tags })
    res.json(result)
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

    // 解析返回的 tags
    let parsedTags = []
    if (article.tags) {
      if (typeof article.tags === 'string') {
        parsedTags = article.tags.split(',').map(t => t.trim()).filter(t => t)
      } else {
        parsedTags = article.tags
      }
    }
    res.json({ ...article, tags: parsedTags })
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

    // 解析返回的 tags
    let parsedTags = []
    if (article.tags) {
      if (typeof article.tags === 'string') {
        parsedTags = article.tags.split(',').map(t => t.trim()).filter(t => t)
      } else {
        parsedTags = article.tags
      }
    }
    res.json({ ...article, tags: parsedTags })
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
