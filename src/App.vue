<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const ADMIN_PASSWORD = 'Hty061120'

const currentView = ref('home')
const articles = ref([])
const projects = ref([])
const sidebarOpen = ref(false)
const bgImage = ref('')
const currentTime = ref('')
const currentDate = ref('')

// 认证相关
const isAuthenticated = ref(false)
const showPasswordModal = ref(false)
const passwordInput = ref('')
const pendingAction = ref(null)

// 编辑器相关
const editingArticle = ref(null)
const editorTitle = ref('')
const editorContent = ref('')
const editorExcerpt = ref('')
const editorCategory = ref('技术')
const editorTags = ref('')
const vditorRef = ref(null)

// 文章详情相关
const currentArticle = ref(null)
const renderedContent = ref('')

// 项目详情相关
const currentProject = ref(null)
const renderedProjectReadme = ref('')
const projectVditorRef = ref(null)

// Markdown 渲染
async function renderMarkdown() {
  if (!currentArticle.value || !currentArticle.value.content) {
    renderedContent.value = ''
    return
  }
  try {
    renderedContent.value = await Vditor.md2html(currentArticle.value.content, { mode: 'light' })
  } catch (e) {
    console.error('Markdown 渲染错误:', e)
    renderedContent.value = '<pre>' + currentArticle.value.content + '</pre>'
  }
}

// 监听 currentArticle 变化时重新渲染
watch(currentArticle, () => {
  renderMarkdown()
})

// 更新日期时间
function updateDateTime() {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  // 格式化时间 HH:MM:SS
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`

  // 格式化日期 YYYY年MM月DD日 周X
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekday = weekdays[now.getDay()]
  currentDate.value = `${year}年${month}月${day}日 ${weekday}`
}

// 从 localStorage 加载背景图片
onMounted(() => {
  // 直接设置默认背景
  bgImage.value = '/e680a49633e16ae3248fcb3fee8e1981.png'
  console.log('背景图片设置为:', bgImage.value)

  // 初始化日期时间并每秒更新
  updateDateTime()
  setInterval(updateDateTime, 1000)

  // 从 API 获取真实数据
  fetchData()
})

async function fetchData() {
  try {
    await Promise.all([fetchArticles(), fetchProjects()])
  } catch (error) {
    console.log('Using mock data')
  }
}

async function fetchArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`)
    articles.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch articles:', error)
  }
}

async function fetchProjects() {
  try {
    const res = await fetch(`${API_BASE}/projects`)
    projects.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  }
}

function navigate(view) {
  currentView.value = view
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

// 认证检查
function requireAuth(callback) {
  if (isAuthenticated.value) {
    callback()
  } else {
    pendingAction.value = callback
    showPasswordModal.value = true
    passwordInput.value = ''
  }
}

function submitPassword() {
  if (passwordInput.value === ADMIN_PASSWORD) {
    isAuthenticated.value = true
    showPasswordModal.value = false
    if (pendingAction.value) {
      pendingAction.value()
      pendingAction.value = null
    }
  } else {
    alert('密码错误')
    passwordInput.value = ''
  }
}

function cancelPassword() {
  showPasswordModal.value = false
  passwordInput.value = ''
  pendingAction.value = null
}

// 文章编辑相关函数
function openEditor(article = null) {
  requireAuth(() => {
    if (article) {
      editingArticle.value = article
      editorTitle.value = article.title
      editorContent.value = article.content
      editorExcerpt.value = article.excerpt || ''
      editorCategory.value = article.category || '技术'
      editorTags.value = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '')
    } else {
      editingArticle.value = null
      editorTitle.value = ''
      editorContent.value = ''
      editorExcerpt.value = ''
      editorCategory.value = '技术'
      editorTags.value = ''
    }
    currentView.value = 'editor'
  })
}

function closeEditor() {
  currentView.value = 'articles'
  editingArticle.value = null
}

async function saveArticle() {
  // 从编辑器获取最新内容
  if (vditorRef.value) {
    editorContent.value = vditorRef.value.getValue()
  }

  if (!editorTitle.value.trim() || !editorContent.value.trim()) {
    alert('请填写标题和内容')
    return
  }

  const articleData = {
    title: editorTitle.value.trim(),
    content: editorContent.value,
    excerpt: editorExcerpt.value.trim() || editorContent.value.substring(0, 100) + '...',
    category: editorCategory.value,
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    tags: editorTags.value.split(',').map(t => t.trim()).filter(t => t)
  }

  try {
    if (editingArticle.value) {
      // 更新文章
      const res = await fetch(`${API_BASE}/articles/${editingArticle.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })
      const updated = await res.json()
      const index = articles.value.findIndex(a => a.id === editingArticle.value.id)
      if (index !== -1) articles.value[index] = updated
    } else {
      // 创建新文章
      const res = await fetch(`${API_BASE}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      })
      const newArticle = await res.json()
      articles.value.unshift(newArticle)
    }
    closeEditor()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请重试')
  }
}

async function deleteArticle(id) {
  requireAuth(async () => {
    if (!confirm('确定要删除这篇文章吗？')) return

    try {
      await fetch(`${API_BASE}/articles/${id}`, { method: 'DELETE' })
      articles.value = articles.value.filter(a => a.id !== id)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  })
}

// 项目编辑相关状态 - 完全照抄文章的结构
const editingProject = ref(null)
const projectTitle = ref('')
const projectDescription = ref('')
const projectTech = ref('')
const projectLink = ref('')
const projectGithubLink = ref('')
const projectReadme = ref('')

// 打开项目编辑器 - 对应 openEditor
function openProjectEditor(project = null) {
  requireAuth(() => {
    if (project) {
      editingProject.value = project
      projectTitle.value = project.title
      projectDescription.value = project.description
      projectTech.value = Array.isArray(project.tech) ? project.tech.join(', ') : ''
      projectLink.value = project.link || ''
      projectGithubLink.value = project.github_link || ''
      projectReadme.value = project.readme || ''
    } else {
      editingProject.value = null
      projectTitle.value = ''
      projectDescription.value = ''
      projectTech.value = ''
      projectLink.value = ''
      projectGithubLink.value = ''
      projectReadme.value = ''
    }
    currentView.value = 'projectEditor'
  })
}

// 关闭项目编辑器 - 对应 closeEditor
function closeProjectEditor() {
  currentView.value = 'projects'
  editingProject.value = null
}

// 保存项目 - 完全照抄 saveArticle
async function saveProject() {
  // 从编辑器获取最新 README 内容
  if (projectVditorRef.value) {
    projectReadme.value = projectVditorRef.value.getValue()
  }

  if (!projectTitle.value.trim()) {
    alert('请填写项目标题')
    return
  }

  const projectData = {
    title: projectTitle.value.trim(),
    description: projectDescription.value.trim(),
    tech: projectTech.value.split(',').map(t => t.trim()).filter(t => t),
    link: projectLink.value.trim(),
    github_link: projectGithubLink.value.trim(),
    readme: projectReadme.value
  }

  try {
    if (editingProject.value) {
      const res = await fetch(`${API_BASE}/projects/${editingProject.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      const updated = await res.json()
      const index = projects.value.findIndex(p => p.id === editingProject.value.id)
      if (index !== -1) projects.value[index] = updated
    } else {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      const newProject = await res.json()
      projects.value.unshift(newProject)
    }
    closeProjectEditor()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请重试')
  }
}

// 查看项目 - 对应 viewArticle
async function viewProject(id) {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`)
    currentProject.value = await res.json()
    currentView.value = 'projectDetail'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('加载项目失败:', error)
    alert('加载项目失败')
  }
}

// 删除项目
async function deleteProject(id) {
  requireAuth(async () => {
    if (!confirm('确定要删除这个项目吗？')) return

    try {
      await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' })
      projects.value = projects.value.filter(p => p.id !== id)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  })
}

// 查看文章详情
async function viewArticle(id) {
  try {
    const res = await fetch(`${API_BASE}/articles/${id}`)
    currentArticle.value = await res.json()
    currentView.value = 'articleDetail'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('加载文章失败:', error)
    alert('加载文章失败')
  }
}

// 渲染项目 README - 完全照抄 renderMarkdown
async function renderProjectReadme() {
  if (!currentProject.value || !currentProject.value.readme) {
    renderedProjectReadme.value = ''
    return
  }
  try {
    renderedProjectReadme.value = await Vditor.md2html(currentProject.value.readme, { mode: 'light' })
  } catch (e) {
    console.error('README 渲染错误:', e)
    renderedProjectReadme.value = '<pre>' + currentProject.value.readme + '</pre>'
  }
}

// 监听 currentProject 变化时重新渲染 - 照抄 watch(currentArticle)
watch(currentProject, () => {
  renderProjectReadme()
})

// 导入文章 MD 文件
function importMDFile(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.name.endsWith('.md')) {
    alert('请选择 .md 文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    if (vditorRef.value) {
      vditorRef.value.setValue(content)
      editorContent.value = content
    }
    // 如果文件名作为标题
    if (!editorTitle.value) {
      editorTitle.value = file.name.replace('.md', '')
    }
  }
  reader.readAsText(file)
  // 重置 input 以便重复选择同一文件
  event.target.value = ''
}

// 导入项目 README MD 文件
function importProjectMDFile(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.name.endsWith('.md')) {
    alert('请选择 .md 文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    if (projectVditorRef.value) {
      projectVditorRef.value.setValue(content)
      projectReadme.value = content
    }
    // 如果文件名作为项目名
    if (!projectTitle.value) {
      projectTitle.value = file.name.replace('.md', '')
    }
  }
  reader.readAsText(file)
  // 重置 input 以便重复选择同一文件
  event.target.value = ''
}

// 初始化编辑器
watch(currentView, async (newView) => {
  if (newView === 'editor') {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // 先销毁旧实例
    if (vditorRef.value) {
      try {
        vditorRef.value.destroy()
        vditorRef.value = null
      } catch (e) {
        console.log('销毁编辑器实例:', e)
      }
    }

    // 创建新实例
    vditorRef.value = new Vditor('vditor', {
      height: 400,
      placeholder: '开始写作...',
      theme: 'classic',
      counter: {
        enable: true
      },
      cache: {
        enable: false
      },
      mode: 'ir',
      toolbar: [
        'headings', 'bold', 'italic', 'strike', '|',
        'list', 'ordered-list', 'check', '|',
        'quote', 'code', 'inline-code', '|',
        'link', 'table', '|',
        'undo', 'redo', '|',
        'preview', 'fullscreen'
      ],
      after: () => {
        if (editorContent.value) {
          vditorRef.value.setValue(editorContent.value)
        }
      }
    })
  } else if (newView === 'projectEditor') {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // 先销毁旧实例
    if (projectVditorRef.value) {
      try {
        projectVditorRef.value.destroy()
        projectVditorRef.value = null
      } catch (e) {
        console.log('销毁项目编辑器实例:', e)
      }
    }

    // 创建新实例
    projectVditorRef.value = new Vditor('project-vditor', {
      height: 400,
      placeholder: '输入项目的 README 内容...',
      theme: 'classic',
      counter: {
        enable: true
      },
      cache: {
        enable: false
      },
      mode: 'ir',
      toolbar: [
        'headings', 'bold', 'italic', 'strike', '|',
        'list', 'ordered-list', 'check', '|',
        'quote', 'code', 'inline-code', '|',
        'link', 'table', '|',
        'undo', 'redo', '|',
        'preview', 'fullscreen'
      ],
      after: () => {
        if (projectReadme.value) {
          projectVditorRef.value.setValue(projectReadme.value)
        }
      }
    })
  }
})
</script>

<template>
  <div class="app" :style="{ '--bg-image': bgImage ? `url(${bgImage})` : 'none' }">
    <!-- 背景层 -->
    <div class="background-layer"></div>

    <!-- 菜单按钮 -->
    <button class="menu-btn" @click="toggleSidebar" v-if="!sidebarOpen">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- 日期时间组件 -->
    <div class="datetime-widget">
      <div class="datetime-time">{{ currentTime }}</div>
      <div class="datetime-date">{{ currentDate }}</div>
    </div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'collapsed': !sidebarOpen }">
      <div class="sidebar-inner">
        <div class="sidebar-header">
          <div class="logo" v-show="sidebarOpen">
            <span class="logo-bracket">&lt;</span>
            <span class="logo-text">CATALYZER</span>
            <span class="logo-bracket">/&gt;</span>
          </div>
          <button class="toggle-btn" @click="toggleSidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect v-if="!sidebarOpen" x="3" y="3" width="18" height="18" rx="2"/>
              <line v-if="sidebarOpen" x1="9" y1="18" x2="15" y2="12"/>
              <line v-if="sidebarOpen" x1="15" y1="18" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        <nav class="nav">
          <a
            class="nav-item"
            :class="{ active: currentView === 'home' }"
            @click="navigate('home')"
          >
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span class="nav-text" v-show="sidebarOpen">首页</span>
          </a>
          <a
            class="nav-item"
            :class="{ active: currentView === 'articles' }"
            @click="navigate('articles')"
          >
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </span>
            <span class="nav-text" v-show="sidebarOpen">文章</span>
          </a>
          <a
            class="nav-item"
            :class="{ active: currentView === 'projects' }"
            @click="navigate('projects')"
          >
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
            </span>
            <span class="nav-text" v-show="sidebarOpen">项目</span>
          </a>
          <a
            class="nav-item"
            @click="openProjectEditor()"
          >
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            <span class="nav-text" v-show="sidebarOpen">添加</span>
          </a>
          <a
            class="nav-item"
            :class="{ active: currentView === 'about' }"
            @click="navigate('about')"
          >
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <span class="nav-text" v-show="sidebarOpen">关于</span>
          </a>
          <a
            class="nav-item"
            :class="{ active: currentView === 'editor' }"
            @click="openEditor()"
          >
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </span>
            <span class="nav-text" v-show="sidebarOpen">写文章</span>
          </a>
        </nav>

        <div class="sidebar-footer" v-show="sidebarOpen">
          <div class="footer-line"></div>
          <p class="tagline">Code · Create · Explore</p>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content" :class="{ 'expanded': !sidebarOpen }">
      <!-- 首页 -->
      <div v-if="currentView === 'home'" class="home-view">
        <div class="hero">
          <div class="hero-decoration"></div>
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="title-line title-accent">Welcome!</span>
            </h1>
            <p class="hero-quote">世界上只有一种英雄主义，就是在认清生活的全部真相之后，依然热烈地热爱生活。</p>
            <p class="hero-author">—— 罗曼・罗兰</p>
          </div>
        </div>

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">最新文章</h2>
            <div class="section-line"></div>
          </div>
          <div class="articles-list">
            <article v-for="(article, index) in articles.slice(0, 3)" :key="article.id" class="article-card" @click="viewArticle(article.id)" :style="{ animationDelay: `${index * 0.1}s` }">
              <div class="article-number">{{ String(index + 1).padStart(2, '0') }}</div>
              <div class="article-content">
                <div class="article-meta">
                  <span class="article-date">{{ article.date }}</span>
                  <span class="article-dot">·</span>
                  <span class="article-category">{{ article.category }}</span>
                </div>
                <h3 class="article-title">{{ article.title }}</h3>
                <p class="article-excerpt">{{ article.excerpt }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <!-- 文章页 -->
      <div v-else-if="currentView === 'articles'" class="page-view">
        <div class="page-header">
          <div class="page-decoration"></div>
          <h1 class="page-title">文章</h1>
          <p class="page-subtitle">技术思考与探索</p>
        </div>
        <div class="articles-list">
          <article v-for="(article, index) in articles" :key="article.id" class="article-card" @click="viewArticle(article.id)" :style="{ animationDelay: `${index * 0.05}s` }">
            <div class="article-number">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="article-content" @click="viewArticle(article.id)">
              <div class="article-meta">
                <span class="article-date">{{ article.date }}</span>
                <span class="article-dot">·</span>
                <span class="article-category">{{ article.category }}</span>
              </div>
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-excerpt">{{ article.excerpt }}</p>
              <div class="article-tags">
                <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="article-actions" @click.stop>
              <button class="action-btn edit-btn" @click="openEditor(article)" title="编辑">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" @click="deleteArticle(article.id)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </article>
        </div>
      </div>

      <!-- 项目页 -->
      <div v-else-if="currentView === 'projects'" class="page-view">
        <div class="page-header">
          <div class="page-decoration"></div>
          <h1 class="page-title">项目</h1>
          <p class="page-subtitle">我构建的作品和学到的东西</p>
        </div>
        <div class="projects-list">
          <div v-for="(project, index) in projects" :key="project.id" class="project-item" :style="{ animationDelay: `${index * 0.05}s` }">
            <div class="project-item-main" @click="viewProject(project.id)">
              <div class="project-item-header">
                <div class="project-item-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="project-icon">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span class="project-name">{{ project.title }}</span>
                  <span class="project-public">Public</span>
                </div>
              </div>
              <p class="project-item-desc">{{ project.description }}</p>
            </div>
            <div class="project-item-actions" @click.stop>
              <button class="project-action-btn edit-btn" @click="openProjectEditor(project)" title="编辑">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="project-action-btn delete-btn" @click="deleteProject(project.id)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 关于页 -->
      <div v-else-if="currentView === 'about'" class="page-view">
        <div class="about-wrapper">
          <div class="about-content">
            <div class="about-decoration"></div>
            <h1 class="about-title">关于我</h1>
            <div class="about-text">
              <p>华东师范大学本科生</p>
              <p>用这个博客记录一下软件开发旅程和探索新技术的空间。希望能坚持下去。</p>
              <p>主要会用C/C++、Python、Javascript等等。</p>
            </div>
            <div class="social-links">
              <a href="https://github.com/hhttyy123" target="_blank" class="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
              <a href="https://github.com/hhttyy123" target="_blank" class="social-link">
                <span>https://github.com/hhttyy123</span>
              </a>
            </div>
            <div class="social-links">
              <a href="mailto:448181385@qq.com" class="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>Email</span>
              </a>
              <a href="mailto:448181385@qq.com" class="social-link">
                <span>448181385@qq.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑器视图 -->
      <div v-else-if="currentView === 'editor'" class="page-view editor-view">
        <div class="page-header">
          <div class="page-decoration"></div>
          <h1 class="page-title">{{ editingArticle ? '编辑文章' : '写文章' }}</h1>
          <p class="page-subtitle">{{ editingArticle ? '修改已发布的内容' : '分享你的想法' }}</p>
        </div>
        <div class="editor-container">
          <div class="editor-form">
            <div class="form-group">
              <label class="form-label">导入 MD 文件</label>
              <label class="file-import-btn">
                <input type="file" accept=".md" @change="importMDFile" style="display: none" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                选择 MD 文件
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">标题</label>
              <input v-model="editorTitle" class="form-input" placeholder="输入文章标题..." />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">分类</label>
                <select v-model="editorCategory" class="form-select">
                  <option value="技术">技术</option>
                  <option value="前端">前端</option>
                  <option value="后端">后端</option>
                  <option value="算法">算法</option>
                  <option value="随笔">随笔</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">标签（用逗号分隔）</label>
                <input v-model="editorTags" class="form-input" placeholder="Vue, JavaScript..." />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">摘要</label>
              <textarea v-model="editorExcerpt" class="form-textarea" rows="2" placeholder="简短描述这篇文章..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">内容（支持 Markdown）</label>
              <div id="vditor" class="vditor-container"></div>
            </div>
            <div class="editor-actions">
              <button class="btn btn-secondary" @click="closeEditor">取消</button>
              <button class="btn btn-primary" @click="saveArticle">
                {{ editingArticle ? '更新文章' : '发布文章' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 项目编辑器视图 -->
      <div v-else-if="currentView === 'projectEditor'" class="page-view editor-view">
        <div class="page-header">
          <div class="page-decoration"></div>
          <h1 class="page-title">{{ editingProject ? '编辑项目' : '添加项目' }}</h1>
          <p class="page-subtitle">{{ editingProject ? '修改项目信息' : '添加你的作品' }}</p>
        </div>
        <div class="editor-container">
          <div class="editor-form">
            <div class="form-group">
              <label class="form-label">导入 README 文件</label>
              <label class="file-import-btn">
                <input type="file" accept=".md" @change="importProjectMDFile" style="display: none" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                选择 README 文件
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">项目名称</label>
              <input v-model="projectTitle" class="form-input" placeholder="输入项目名称..." />
            </div>
            <div class="form-group">
              <label class="form-label">项目描述</label>
              <textarea v-model="projectDescription" class="form-textarea" rows="2" placeholder="简短描述这个项目..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">技术栈（用逗号分隔）</label>
              <input v-model="projectTech" class="form-input" placeholder="Vue.js, Python, MySQL..." />
            </div>
            <div class="form-group">
              <label class="form-label">GitHub 仓库链接</label>
              <input v-model="projectGithubLink" class="form-input" placeholder="https://github.com/username/repo" />
            </div>
            <div class="form-group">
              <label class="form-label">README 内容（支持 Markdown）</label>
              <div id="project-vditor" class="vditor-container"></div>
            </div>
            <div class="editor-actions">
              <button class="btn btn-secondary" @click="navigate('projects')">取消</button>
              <button class="btn btn-primary" @click="saveProject">
                {{ editingProject ? '更新项目' : '添加项目' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章详情页 -->
      <div v-else-if="currentView === 'articleDetail'" class="page-view article-detail-view">
        <div class="article-detail-header">
          <button class="back-btn" @click="navigate('articles')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            返回列表
          </button>
          <button class="edit-article-btn" @click="openEditor(currentArticle)" v-if="currentArticle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            编辑文章
          </button>
        </div>
        <article class="article-detail" v-if="currentArticle">
          <div class="article-detail-meta">
            <span class="detail-date">{{ currentArticle.date }}</span>
            <span class="detail-dot">·</span>
            <span class="detail-category">{{ currentArticle.category }}</span>
            <template v-if="currentArticle.tags && currentArticle.tags.length">
              <span class="detail-dot">·</span>
              <span class="detail-tags">
                <span v-for="tag in currentArticle.tags" :key="tag" class="detail-tag">{{ tag }}</span>
              </span>
            </template>
          </div>
          <h1 class="article-detail-title">{{ currentArticle.title }}</h1>
          <div class="article-detail-content markdown-body" v-html="renderedContent"></div>
        </article>
      </div>

      <!-- 项目详情页 -->
      <div v-else-if="currentView === 'projectDetail'" class="page-view project-detail-view">
        <div class="article-detail-header">
          <button class="back-btn" @click="navigate('projects')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            返回列表
          </button>
          <div class="detail-header-actions">
            <span v-if="currentProject?.github_link" class="github-link-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {{ currentProject.github_link }}
            </span>
            <button class="edit-article-btn" @click="openProjectEditor(currentProject)" v-if="currentProject">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              编辑项目
            </button>
          </div>
        </div>
        <article class="article-detail" v-if="currentProject">
          <div class="article-detail-meta">
            <span class="detail-date">项目</span>
            <template v-if="currentProject.tech && currentProject.tech.length">
              <span class="detail-dot">·</span>
              <span class="detail-tags">
                <span v-for="tech in currentProject.tech" :key="tech" class="detail-tag">{{ tech }}</span>
              </span>
            </template>
          </div>
          <h1 class="article-detail-title">{{ currentProject.title }}</h1>
          <p class="project-detail-desc">{{ currentProject.description }}</p>
          <div class="article-detail-content markdown-body" v-html="renderedProjectReadme"></div>
        </article>
      </div>
    </main>
  </div>

  <!-- 密码输入弹窗 -->
  <div v-if="showPasswordModal" class="password-modal-overlay" @click.self="cancelPassword">
    <div class="password-modal">
      <h3 class="password-modal-title">需要管理员权限</h3>
      <p class="password-modal-desc">请输入密码以继续操作</p>
      <input
        v-model="passwordInput"
        type="password"
        class="password-modal-input"
        placeholder="请输入密码"
        @keyup.enter="submitPassword"
      />
      <div class="password-modal-buttons">
        <button @click="cancelPassword" class="password-modal-btn cancel">取消</button>
        <button @click="submitPassword" class="password-modal-btn confirm">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

.app {
  /* CSS 变量 - 高级绿白配色 */
  --sidebar-bg: rgba(255, 255, 255, 0);
  --sidebar-hover: rgba(34, 197, 94, 0.15);
  --sidebar-active: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  --sidebar-text: #ffffff;
  --sidebar-text-muted: #86efac;
  --text-primary: #ffffff;
  --text-secondary: #4ade80;
  --text-muted: #bbf7d0;
  --text-dark: #0d2e16;
  --bg-primary: transparent;
  --bg-card: linear-gradient(135deg, rgba(13, 46, 22, 0.85) 0%, rgba(21, 128, 61, 0.75) 100%);
  --border-color: rgba(74, 222, 128, 0.3);
  --accent-glow: rgba(34, 197, 94, 0.5);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.5);
  --text-gradient: linear-gradient(135deg, #ffffff 0%, #86efac 100%);
  --text-gradient-dark: linear-gradient(135deg, #ffffff 0%, #4ade80 100%);

  display: flex;
  min-height: 100vh;
  position: relative;
}

/* ==================== 背景层 ==================== */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.background-layer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* ==================== 菜单按钮 ==================== */
.menu-btn {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(34, 197, 94, 0.25);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: var(--text-dark);
}

.menu-btn:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(134, 239, 172, 0.15) 100%);
  border-color: #22c55e;
  color: #22c55e;
  transform: scale(1.08);
  box-shadow: var(--shadow-lg), 0 0 20px var(--accent-glow);
}

/* ==================== 日期时间组件 ==================== */
.datetime-widget {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.875rem 1.25rem;
  background: linear-gradient(135deg, rgba(13, 46, 22, 0.85) 0%, rgba(21, 128, 61, 0.75) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.datetime-widget:hover {
  border-color: #22c55e;
  box-shadow: var(--shadow-lg), 0 0 30px rgba(34, 197, 94, 0.4);
  transform: translateY(-2px);
}

.datetime-time {
  font-family: 'Inter', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  text-align: right;
  line-height: 1;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.datetime-date {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  color: #86efac;
  text-align: right;
  margin-top: 0.4rem;
  letter-spacing: 0.05em;
}

/* ==================== 侧边栏 ==================== */
.sidebar {
  width: 280px;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  border-right: 1px solid rgba(34, 197, 94, 0.15);
}

.sidebar.collapsed {
  transform: translateX(-100%);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 1.5rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(34, 197, 94, 0.2);
}

.logo {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--sidebar-text);
  display: flex;
  align-items: center;
  gap: 0.15rem;
  white-space: nowrap;
}

.logo-bracket {
  color: var(--accent);
  font-size: 1.3rem;
}

.toggle-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--sidebar-text-muted);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.nav {
  flex: 1;
  padding: 1.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  color: var(--sidebar-text-muted);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #22c55e 0%, #86efac 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: #22c55e;
  transform: translateX(4px);
}

.nav-item.active {
  background: var(--sidebar-active);
  color: #ffffff;
}

.nav-item.active::before {
  transform: scaleY(1);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
}

.nav-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 1.25rem;
  border-top: 1px solid rgba(34, 197, 94, 0.2);
}

.footer-line {
  width: 40px;
  height: 2px;
  background: var(--accent);
  margin-bottom: 0.875rem;
  border-radius: 1px;
}

.tagline {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--sidebar-text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ==================== 主内容区 ==================== */
.main-content {
  flex: 1;
  min-height: 100vh;
  padding-left: 16rem;
}

/* ==================== 首页 ==================== */
.home-view {
  padding: 3rem 3rem 4rem;
  max-width: 1100px;
  margin: 0 auto;
}

.hero {
  position: relative;
  padding: 5rem 0 4rem;
  margin-bottom: 4rem;
}

.hero-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.06;
  filter: blur(60px);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: var(--text-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
}

.title-line {
  display: block;
  opacity: 0;
  animation: slideUp 0.8s ease forwards;
}


.title-accent {
  color: #ffffff;
  position: relative;
  display: inline-block;
  -webkit-text-fill-color: initial !important;
  background: none !important;
  text-shadow: 0 4px 30px rgba(255, 255, 255, 0.8);
}

.hero-quote {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  font-weight: 400;
  color: #ffffff;
  max-width: 700px;
  line-height: 1.8;
  margin-bottom: 1rem;
  text-shadow: 0 2px 15px rgb(0, 255, 94);
  font-style: italic;
  opacity: 0;
  animation: fadeIn 0.8s ease 0.6s forwards;
}

.hero-author {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
  max-width: 700px;
  margin-left: 600px;
  margin-right: 100px;
  text-shadow: 0 2px 10px rgb(0, 255, 94);
  opacity: 0;
  animation: fadeIn 0.8s ease 0.8s forwards;
}

.title-accent::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 3px;
  background: var(--accent);
}

.hero-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--text-secondary);
  max-width: 500px;
  line-height: 1.7;
  opacity: 0;
  animation: fadeIn 0.8s ease 0.4s forwards;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* ==================== 通用区块 ==================== */
.section {
  margin-bottom: 4rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  margin-top: 8rem;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ffffff 0%, #86efac 50%, #4ade80 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(34, 197, 94, 0.4);
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--border-color), transparent);
}

/* ==================== 页面样式 ==================== */
.page-view {
  padding: 3rem 3rem 4rem;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  position: relative;
  padding: 4rem 0 3rem;
  margin-bottom: 3rem;
}

.page-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.05;
  filter: blur(50px);
}

.page-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.page-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-primary);
}

/* ==================== 文章卡片 ==================== */
.articles-list {
  display: grid;
  gap: 1rem;
}

.article-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
  position: relative;
  overflow: hidden;
}

.article-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #22c55e 0%, #86efac 50%, #22c55e 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.article-card:hover {
  border-color: #22c55e;
  box-shadow: var(--shadow-lg), 0 0 40px var(--accent-glow);
  transform: translateY(-4px);
}

.article-card:hover::before {
  transform: scaleX(1);
}

.article-number {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #86efac 0%, #22c55e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.4;
  min-width: 60px;
  flex-shrink: 0;
  text-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
}

.article-content {
  flex: 1;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.article-date {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: #86efac;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.article-dot {
  color: var(--text-muted);
  font-size: 0.6rem;
}

.article-category {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.article-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ffffff 0%, #bbf7d0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.article-excerpt {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1.7;
}

.article-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.tag {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(134, 239, 172, 0.15) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  color: #86efac;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* ==================== 项目列表（GitHub 风格）==================== */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.project-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1.2px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
  transition: all 0.3s ease;
}

.project-item:hover {
  border-color: #22c55e;
  box-shadow: var(--shadow-md);
}

.project-item-main {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.project-item-header {
  margin-bottom: 0.35rem;
}

.project-item-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.project-icon {
  color: #86efac;
  flex-shrink: 0;
}

.project-name {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #22c55e;
}

.project-public {
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-muted);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 6px;
  padding: 0.05rem 0.3rem;
  margin-left: 0.5rem;
}

.project-item-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 400;
  color: #bbf7d0;
  line-height: 1.5;
}

.project-item-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.project-item-language {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.language-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.language-name {
  color: #86efac;
}

.project-item-actions {
  display: flex;
  gap: 0.3rem;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.project-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-action-btn:hover {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: #22c55e;
}

.project-action-btn.edit-btn:hover {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ffffff;
}

.project-action-btn.delete-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

/* ==================== 关于页 ==================== */
.about-wrapper {
  display: flex;
  justify-content: center;
}

.about-content {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 3rem;
  max-width: 650px;
  position: relative;
  overflow: hidden;
}

.about-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.1;
  filter: blur(40px);
}

.about-title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #86efac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
  position: relative;
  text-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
}

.about-text p {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1.9;
  margin-bottom: 1.25rem;
}

.social-links {
  display: flex;
  gap: 1rem;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(34, 197, 94, 0.2);
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.875rem 1.5rem;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.3);
}

/* ==================== 文章操作按钮 ==================== */
.article-actions {
  display: flex;
  gap: 0.3rem;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: #22c55e;
}

.action-btn.edit-btn:hover {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ffffff;
}

.action-btn.delete-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

/* ==================== 编辑器 ==================== */
.editor-view {
  max-width: 1200px;
}

.editor-container {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 2rem;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(187, 247, 208, 0.5);
}

.form-select {
  cursor: pointer;
}

.form-select option {
  background: #0d2e16;
  color: #ffffff;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.vditor-container {
  border-radius: 10px;
  overflow: hidden;
}

.vditor-container :deep(.vditor) {
  border: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.2);
}

.vditor-container :deep(.vditor-toolbar) {
  background: rgba(13, 46, 22, 0.9);
  border-bottom: 1px solid var(--border-color);
}

.vditor-container :deep(.vditor-content) {
  background: transparent;
}

.vditor-container :deep(.vditor-ir) {
  color: #ffffff;
}

.vditor-container :deep(.vditor-ir pre.vditor-ir__marker--pre) {
  background: rgba(0, 0, 0, 0.3);
}

.vditor-container :deep(.vditor-toolbar__item) {
  color: #86efac;
}

.vditor-container :deep(.vditor-toolbar__item:hover) {
  color: #22c55e;
}

.editor-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(74, 222, 128, 0.2);
}

.btn {
  padding: 0.75rem 1.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.btn-primary {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ffffff;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
}

/* ==================== 文件导入按钮 ==================== */
.file-import-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(134, 239, 172, 0.15) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 10px;
  color: #86efac;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-import-btn:hover {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ffffff;
  border-color: #22c55e;
}

/* ==================== 文章详情页 ==================== */
.article-detail-view {
  max-width: 1100px;
}

.article-detail-header {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.detail-header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 10px;
  color: var(--text-muted);
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: #22c55e;
}

.edit-article-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-article-btn:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
}

.article-detail {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 3rem;
}

.article-detail-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.detail-date,
.detail-category {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #86efac;
}

.detail-dot {
  color: var(--text-muted);
  font-size: 0.6rem;
}

.detail-tags {
  display: flex;
  gap: 0.4rem;
}

.detail-tag {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.3rem 0.6rem;
  background: rgba(34, 197, 94, 0.15);
  border-radius: 6px;
  color: #86efac;
}

.article-detail-title {
  font-family: 'Playfair Display', serif;
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #86efac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
  line-height: 1.3;
}

.article-detail-content {
  color: #e5e7eb;
  line-height: 1.8;
  font-size: 1.05rem;
}

.article-detail-content :deep(h1),
.article-detail-content :deep(h2),
.article-detail-content :deep(h3),
.article-detail-content :deep(h4),
.article-detail-content :deep(h5),
.article-detail-content :deep(h6) {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #ffffff;
}

.article-detail-content :deep(h1) { font-size: 1.8rem; }
.article-detail-content :deep(h2) { font-size: 1.5rem; }
.article-detail-content :deep(h3) { font-size: 1.3rem; }

.article-detail-content :deep(p) {
  margin-bottom: 1rem;
}

.article-detail-content :deep(code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 0.9em;
  color: #86efac;
}

.article-detail-content :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  border-radius: 10px;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(74, 222, 128, 0.2);
}

.article-detail-content :deep(pre code) {
  background: none;
  padding: 0;
  color: #e5e7eb;
}

.article-detail-content :deep(blockquote) {
  border-left: 4px solid #22c55e;
  padding-left: 1rem;
  margin: 1.5rem 0;
  color: var(--text-muted);
  font-style: italic;
}

.article-detail-content :deep(ul),
.article-detail-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.article-detail-content :deep(li) {
  margin-bottom: 0.5rem;
}

.article-detail-content :deep(a) {
  color: #86efac;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.article-detail-content :deep(a:hover) {
  color: #22c55e;
  border-bottom-color: #22c55e;
}

.article-detail-content :deep(img) {
  max-width: 100%;
  border-radius: 10px;
  margin: 1.5rem 0;
}

.article-detail-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.article-detail-content :deep(th),
.article-detail-content :deep(td) {
  padding: 0.75rem;
  border: 1px solid rgba(74, 222, 128, 0.2);
  text-align: left;
}

.article-detail-content :deep(th) {
  background: rgba(34, 197, 94, 0.15);
  font-weight: 600;
  color: #86efac;
}

.article-detail-content :deep(hr) {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(74, 222, 128, 0.3), transparent);
  margin: 2rem 0;
}

/* ==================== 项目详情页 ==================== */
.project-detail-view {
  max-width: 1100px;
}

.github-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.github-link-btn:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
}

.project-detail-desc {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: #bbf7d0;
  line-height: 1.7;
  margin-bottom: 2rem;
}

.readme-content {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 2rem;
  border: 1px solid rgba(74, 222, 128, 0.2);
}

.no-readme {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
  font-style: italic;
}

/* ==================== 动画 ==================== */
@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .sidebar {
    width: 240px;
  }

  .main-content {
    margin-left: 0;
  }

  .menu-btn {
    top: 1rem;
    left: 1rem;
    width: 42px;
    height: 42px;
  }

  .datetime-widget {
    top: 1rem;
    right: 1rem;
    padding: 0.6rem 1rem;
  }

  .datetime-time {
    font-size: 1.2rem;
  }

  .datetime-date {
    font-size: 0.65rem;
  }

  .home-view,
  .page-view {
    padding: 2rem 1.5rem 3rem;
  }

  .hero {
    padding: 3rem 0;
  }

  .about-content {
    padding: 2rem;
  }

  .article-card {
    flex-direction: column;
    gap: 1rem;
  }

  .article-number {
    font-size: 1.5rem;
    min-width: auto;
  }

  .settings-panel {
    width: 100%;
    right: -100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .editor-container {
    padding: 1.5rem;
  }

  .vditor-container :deep(.vditor) {
    font-size: 14px;
  }

  .article-detail {
    padding: 2rem;
  }

  .article-detail-title {
    font-size: 1.6rem;
  }

  .article-detail-content {
    font-size: 1rem;
  }
}

/* ==================== 密码弹窗 ==================== */
.password-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.password-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.password-modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.password-modal-desc {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
}

.password-modal-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  box-sizing: border-box;
}

.password-modal-input:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.password-modal-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.password-modal-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.password-modal-btn.cancel {
  background: #f3f4f6;
  color: #374151;
}

.password-modal-btn.cancel:hover {
  background: #e5e7eb;
}

.password-modal-btn.confirm {
  background: #22c55e;
  color: white;
}

.password-modal-btn.confirm:hover {
  background: #16a34a;
}
</style>
