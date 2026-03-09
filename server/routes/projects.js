import express from 'express'
import { getDatabase } from '../database.js'

const router = express.Router()

// 获取所有项目
router.get('/', async (req, res) => {
  try {
    const db = getDatabase()
    const [projects] = await db.query('SELECT * FROM projects ORDER BY id DESC')

    // 解析 JSON 字段
    const parsedProjects = projects.map(project => ({
      ...project,
      tech: project.tech ? JSON.parse(project.tech) : []
    }))

    res.json(parsedProjects)
  } catch (error) {
    console.error('获取项目失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取单个项目
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase()
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id])

    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const project = projects[0]
    res.json({
      ...project,
      tech: project.tech ? JSON.parse(project.tech) : []
    })
  } catch (error) {
    console.error('获取项目失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 创建项目
router.post('/', async (req, res) => {
  const { title, description, tech, link, github_link, readme } = req.body

  try {
    const db = getDatabase()
    const techJson = Array.isArray(tech) ? JSON.stringify(tech) : tech

    const [result] = await db.query(
      'INSERT INTO projects (title, description, tech, link, github_link, readme) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, techJson, link, github_link, readme]
    )

    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [result.insertId])
    const project = projects[0]

    res.json({
      ...project,
      tech: project.tech ? JSON.parse(project.tech) : []
    })
  } catch (error) {
    console.error('创建项目失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 更新项目
router.put('/:id', async (req, res) => {
  const { title, description, tech, link, github_link, readme } = req.body

  try {
    const db = getDatabase()
    const techJson = Array.isArray(tech) ? JSON.stringify(tech) : tech

    await db.query(
      'UPDATE projects SET title = ?, description = ?, tech = ?, link = ?, github_link = ?, readme = ? WHERE id = ?',
      [title, description, techJson, link, github_link, readme, req.params.id]
    )

    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id])
    const project = projects[0]

    res.json({
      ...project,
      tech: project.tech ? JSON.parse(project.tech) : []
    })
  } catch (error) {
    console.error('更新项目失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 删除项目
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase()
    await db.query('DELETE FROM projects WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('删除项目失败:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
