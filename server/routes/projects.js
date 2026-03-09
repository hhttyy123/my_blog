import express from 'express'
import { getDatabase } from '../database.js'

const router = express.Router()

// 获取所有项目
router.get('/', async (req, res) => {
  try {
    const db = getDatabase()
    const [projects] = await db.query('SELECT * FROM projects ORDER BY id DESC')

    // 解析 tech 字段（支持逗号分隔的字符串或 JSON 数组）
    const parsedProjects = projects.map(project => {
      let tech = []
      if (project.tech) {
        if (typeof project.tech === 'string') {
          // 如果是逗号分隔的字符串，按逗号分割
          tech = project.tech.split(',').map(t => t.trim()).filter(t => t)
        } else {
          tech = project.tech
        }
      }
      return { ...project, tech }
    })

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
    console.log('获取项目 ID:', req.params.id)
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id])

    if (projects.length === 0) {
      console.log('项目不存在')
      return res.status(404).json({ error: 'Project not found' })
    }

    const project = projects[0]
    let tech = []
    if (project.tech) {
      if (typeof project.tech === 'string') {
        tech = project.tech.split(',').map(t => t.trim()).filter(t => t)
      } else {
        tech = project.tech
      }
    }
    const result = { ...project, tech }
    console.log('返回项目数据:', { id: result.id, title: result.title, tech: result.tech })
    res.json(result)
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

    // 解析返回的 tech
    let parsedTech = []
    if (project.tech) {
      if (typeof project.tech === 'string') {
        parsedTech = project.tech.split(',').map(t => t.trim()).filter(t => t)
      } else {
        parsedTech = project.tech
      }
    }
    res.json({ ...project, tech: parsedTech })
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

    // 解析返回的 tech
    let parsedTech = []
    if (project.tech) {
      if (typeof project.tech === 'string') {
        parsedTech = project.tech.split(',').map(t => t.trim()).filter(t => t)
      } else {
        parsedTech = project.tech
      }
    }
    res.json({ ...project, tech: parsedTech })
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
