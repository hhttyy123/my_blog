# App.vue 代码结构说明

> 文件路径: `src/App.vue` | 总行数: 2390 行

---

## 一、Script 部分 (第 1-486 行)

### 1.1 导入与配置 (第 1-6 行)
- Vue 核心功能导入
- Vditor 编辑器导入
- API 基础路径配置

### 1.2 响应式状态定义 (第 8-14 行)
- 视图状态: `currentView`, `sidebarOpen`
- 数据状态: `articles`, `projects`, `bgImage`
- 日期时间: `currentTime`, `currentDate`

### 1.3 文章编辑器相关状态 (第 16-23 行)
- `editingArticle` - 当前编辑的文章
- `editorTitle` - 文章标题
- `editorContent` - 文章内容
- `editorExcerpt` - 文章摘要
- `editorCategory` - 文章分类
- `editorTags` - 文章标签
- `vditorRef` - Vditor 实例

### 1.4 项目编辑器相关状态 (第 25-31 行)
- `editingProject` - 当前编辑的项目
- `projectTitle` - 项目标题
- `projectDescription` - 项目描述
- `projectTech` - 技术栈
- `projectLink` - 演示链接
- `projectGithubLink` - GitHub 链接
- `projectReadme` - README 内容
- `projectVditorRef` - 项目 Vditor 实例

### 1.5 详情相关状态 (第 33-38 行)
- `currentArticle` - 当前查看的文章
- `renderedContent` - 渲染后的文章内容
- `currentProject` - 当前查看的项目
- `renderedProjectReadme` - 渲染后的项目 README

### 1.6 核心功能函数

#### 文章功能

| 功能 | 行数 | 说明 |
|------|------|------|
| `renderMarkdown()` | 40-51 | Markdown 渲染 |
| `viewArticle()` | 316-327 | 查看文章详情 |
| `openEditor()` | 122-139 | 打开文章编辑器 |
| `closeEditor()` | 141-143 | 关闭文章编辑器 |
| `saveArticle()` | 177-204 | 保存文章 |
| `deleteArticle()` | 273-285 | 删除文章 |
| `importMDFile()` | 362-373 | 导入文章 MD 文件 |

#### 项目功能

| 功能 | 行数 | 说明 |
|------|------|------|
| `openProjectEditor()` | 206-235 | 打开项目编辑器 |
| `closeProjectEditor()` | 251-253 | 关闭项目编辑器 |
| `saveProject()` | 255-286 | 保存项目 |
| `viewProject()` | 287-298 | 查看项目详情 |
| `deleteProject()` | 300-311 | 删除项目 |
| `importProjectMDFile()` | 376-387 | 导入项目 README 文件 |
| `renderProjectReadme()` | 342-353 | 渲染项目 README |

#### 通用功能

| 功能 | 行数 | 说明 |
|------|------|------|
| `updateDateTime()` | 52-69 | 更新日期时间 |
| `toggleSidebar()` | 115-117 | 切换侧边栏 |
| `navigate()` | 118-120 | 页面导航 |
| `fetchData()` | 86-101 | 获取文章和项目数据 |
| `fetchArticles()` | 103-108 | 获取文章列表 |
| `fetchProjects()` | 110-113 | 获取项目列表 |

### 1.7 生命周期与监听

| 功能 | 行数 | 说明 |
|------|------|------|
| `onMounted()` | 73-81 | 组件挂载 |
| `watch(currentArticle)` | 48-51 | 监听文章变化自动渲染 |
| `watch(currentProject)` | 356-359 | 监听项目变化自动渲染 |
| `watch(currentView)` | 393-485 | 监听视图变化初始化编辑器 |

---

## 二、Template 部分 (第 488-959 行)

### 2.1 背景层 (第 490-491 行)
```vue
<div class="background-layer"></div>
```

### 2.2 菜单按钮 (第 493-500 行)
```vue
<button class="menu-btn" @click="toggleSidebar">
  <!-- 汉堡菜单图标 -->
</button>
```

### 2.3 日期时间组件 (第 502-506 行) - 固定右上角
```vue
<div class="datetime-widget">
  <div class="datetime-time">{{ currentTime }}</div>
  <div class="datetime-date">{{ currentDate }}</div>
</div>
```

### 2.4 侧边栏 (第 508-617 行)
- 导航菜单: 首页、文章、项目、关于
- 动画装饰元素

### 2.5 主内容区 (第 619-957 行)

#### 2.5.1 首页 (第 621-654 行)
- Hero 区域: 欢迎标题和名言
- 最新文章区块: 显示前 3 篇文章

#### 2.5.2 文章页 (第 656-690 行)
- 页面头部: 标题"文章"
- 文章列表: 显示所有文章卡片
- 每个卡片包含: 编号、日期、分类、标题、摘要、标签、编辑/删除图标按钮

#### 2.5.3 项目页 (第 692-729 行)
- 页面头部: 标题"项目"
- 项目列表: GitHub 风格的水平布局
- 每个项目包含: 图标、标题、描述、Public 标识、编辑/删除图标按钮

#### 2.5.4 关于页 (第 731-767 行)
- 关于我页面内容
- 装饰元素和联系方式

#### 2.5.5 文章编辑器视图 (第 769-867 行)
- 页面头部: 标题"写文章"/"编辑文章"
- 导入 MD 文件按钮
- 表单: 标题、分类、标签、摘要
- Vditor 编辑器容器 (`#vditor`)
- 保存/取消按钮

#### 2.5.6 项目编辑器视图 (第 869-941 行)
- 页面头部: 标题"添加项目"/"编辑项目"
- 导入 README 文件按钮
- 表单: 项目名称、描述、技术栈、GitHub 链接
- Vditor 编辑器容器 (`#project-vditor`)
- 保存/取消按钮

#### 2.5.7 文章详情页 (第 943-956 行)
- 返回按钮 + 编辑按钮
- 文章元信息: 日期、分类、标签
- 文章标题和渲染后的 Markdown 内容 (`v-html="renderedContent"`)

#### 2.5.8 项目详情页 (第 958-957 行)
- 返回按钮 + GitHub 链接显示 + 编辑按钮
- 项目元信息: 技术栈
- 项目标题、描述和渲染的 README (`v-html="renderedProjectReadme"`)

---

## 三、Style 部分 (第 961-2390 行)

### 3.1 基础样式 (第 961-989 行)
- 字体导入 (Playfair Display, Inter)
- CSS 变量定义 (颜色、尺寸)

### 3.2 各组件样式

| 组件/区域 | 行数 | 说明 |
|-----------|------|------|
| 背景层 | 996-1018 | 背景图片、渐变遮罩 |
| 菜单按钮 | 1019-1048 | 汉堡菜单按钮样式 |
| 日期时间组件 | 1049-1092 | 固定右上角时间日期卡片 |
| 侧边栏 | 1093-1245 | 导航侧边栏及菜单项 |
| 主内容区 | 1246-1252 | 主容器布局 |
| 首页 | 1253-1359 | Hero 区域和区块样式 |
| 通用区块 | 1360-1389 | 区块头部、标题、分割线 |
| 页面样式 | 1390-1428 | 页面头部、标题、装饰 |
| 文章卡片 | 1429-1564 | 文章列表项样式 |
| 项目列表 (GitHub 风格) | 1565-1704 | 水平布局项目项 |
| 关于页 | 1705-1784 | 关于页面布局 |
| 文章操作按钮 | 1785-1824 | 编辑/删除图标按钮 |
| 项目操作按钮 | 1825-1863 | 编辑/删除图标按钮 |
| 编辑器 | 1864-2017 | 编辑器界面样式 |
| 文件导入按钮 | 2018-2040 | 导入 MD 文件按钮 |
| 文章详情页 | 2041-2266 | 文章详情展示 |
| 项目详情页 | 2267-2317 | 项目详情展示 |
| 动画 | 2318-2346 | 淡入、滑入等动画 |
| 响应式 | 2347-2387 | 移动端适配 |

---

## 四、快速查找索引

### 想修改...

| 需求 | 跳转到 |
|------|--------|
| 页面布局结构 | Template 488-959 |
| 顶部菜单按钮 | 493-500, Style 1019-1048 |
| 日期时间组件 | 502-506, Style 1049-1092 |
| 侧边栏导航 | 508-617, Style 1093-1245 |
| 文章列表 | 656-690, Style 1429-1564 |
| 项目列表 | 692-729, Style 1565-1704 |
| 文章编辑器 | 769-867, Style 1864-2017 |
| 项目编辑器 | 869-941, Style 1864-2017 |
| 文章详情 | 943-956, Style 2041-2266 |
| 项目详情 | 958-957, Style 2267-2317 |
| 颜色主题 | Style 961-989 (CSS 变量) |
| 数据获取逻辑 | Script 86-113 |

### 函数对照表

| 文章函数 | 项目函数 | 说明 |
|---------|---------|------|
| `editingArticle` | `editingProject` | 当前编辑的对象 |
| `editorContent` | `projectReadme` | Markdown 内容 |
| `vditorRef` | `projectVditorRef` | Vditor 实例 |
| `currentArticle` | `currentProject` | 当前查看的对象 |
| `renderedContent` | `renderedProjectReadme` | 渲染后的 HTML |
| `openEditor()` | `openProjectEditor()` | 打开编辑器 |
| `closeEditor()` | `closeProjectEditor()` | 关闭编辑器 |
| `saveArticle()` | `saveProject()` | 保存内容 |
| `viewArticle()` | `viewProject()` | 查看详情 |
| `deleteArticle()` | `deleteProject()` | 删除项目 |
| `importMDFile()` | `importProjectMDFile()` | 导入 MD 文件 |
| `renderMarkdown()` | `renderProjectReadme()` | 渲染 Markdown |
| `watch(currentArticle)` | `watch(currentProject)` | 监听变化自动渲染 |

### 数据字段对照

| 用途 | 文章字段 | 项目字段 |
|------|---------|---------|
| 标题 | `title` | `title` |
| 内容 | `content` | `readme` |
| 摘要 | `excerpt` | `description` |
| 分类/标签 | `category`, `tags` | `tech` |
| 链接 | - | `github_link` |

---

*文档更新时间: 2026-03-09*
*项目功能已完全按照文章结构重写*
*演示链接字段已从项目编辑器移除*
*项目详情页 GitHub 链接显示为纯文本，不可跳转*
