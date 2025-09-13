import { useState, useEffect } from 'react'

// 防抖hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}


// 主题hook
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme }
}

function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  
  const { theme, toggleTheme } = useTheme()

  const [history, setHistory] = useState<string[]>([''])
  const [historyIndex, setHistoryIndex] = useState(0)

  // 自定义移除字段功能
  const [removeFieldsInput, setRemoveFieldsInput] = useState('Has*, ErrorInfo')
  const [showRemoveFields, setShowRemoveFields] = useState(false)

  // 防抖处理输入
  const debouncedInput = useDebounce(input, 300)


  const formatJson = () => {
    try {
      if (!input.trim()) {
        setError('请输入JSON数据')
        setOutput('')
        return
      }
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      setError('')
    } catch (err) {
      setError('无效的JSON格式')
      setOutput('')
    }
  }

  const minifyJson = () => {
    try {
      if (!input.trim()) {
        setError('请输入JSON数据')
        setOutput('')
        return
      }
      const parsed = JSON.parse(input)
      // 确保中文字符不被转义
      const minified = JSON.stringify(parsed, null, 0)
      setOutput(minified)
      setError('')
    } catch (err) {
      setError('无效的JSON格式')
      setOutput('')
    }
  }

  const escapeJson = () => {
    try {
      if (!input.trim()) {
        setError('请输入JSON数据')
        setOutput('')
        return
      }
      // 先验证JSON格式
      const parsed = JSON.parse(input)

      // 将JSON对象转换为字符串，然后转义特殊字符
      const jsonString = JSON.stringify(parsed)
      const escaped = jsonString
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')

      setOutput(`"${escaped}"`)
      setError('')
    } catch (err) {
      setError('无效的JSON格式')
      setOutput('')
    }
  }

  const removeComments = () => {
    try {
      if (!input.trim()) {
        setError('请输入JSON数据')
        setOutput('')
        return
      }

      // 移除单行注释 //
      let result = input.replace(/\/\/.*$/gm, '')

      // 移除多行注释 /* */
      result = result.replace(/\/\*[\s\S]*?\*\//g, '')

      // 验证结果是否为有效JSON
      const parsed = JSON.parse(result)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      setError('')
    } catch (err) {
      setError('移除注释后的内容不是有效的JSON格式')
      setOutput('')
    }
  }

  const jsonToXml = () => {
    try {
      if (!input.trim()) {
        setError('请输入JSON数据')
        setOutput('')
        return
      }

      const parsed = JSON.parse(input)

      const convertToXml = (obj: any, rootName = 'root'): string => {
        if (obj === null) {
          return `<${rootName}>null</${rootName}>`
        }

        if (typeof obj === 'string') {
          return `<${rootName}>${escapeXml(obj)}</${rootName}>`
        }

        if (typeof obj === 'number' || typeof obj === 'boolean') {
          return `<${rootName}>${obj}</${rootName}>`
        }

        if (Array.isArray(obj)) {
          const items = obj.map((item, index) =>
            convertToXml(item, 'item')
          ).join('\n  ')
          return `<${rootName}>\n  ${items}\n</${rootName}>`
        }

        if (typeof obj === 'object') {
          const entries = Object.entries(obj).map(([key, value]) =>
            convertToXml(value, key)
          ).join('\n  ')
          return `<${rootName}>\n  ${entries}\n</${rootName}>`
        }

        return `<${rootName}>${obj}</${rootName}>`
      }

      const escapeXml = (str: string): string => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
      }

      const xmlResult = `<?xml version="1.0" encoding="UTF-8"?>\n${convertToXml(parsed)}`
      setOutput(xmlResult)
      setError('')
    } catch (err) {
      setError('无效的JSON格式')
      setOutput('')
    }
  }

  const jsonToTypeScript = () => {
    try {
      if (!input.trim()) {
        setError('请输入JSON数据')
        setOutput('')
        return
      }

      const parsed = JSON.parse(input)

      const getType = (value: any): string => {
        if (value === null) return 'null'
        if (Array.isArray(value)) {
          if (value.length === 0) return 'any[]'
          const itemType = getType(value[0])
          return `${itemType}[]`
        }
        if (typeof value === 'object') {
          return generateInterface(value)
        }
        return typeof value
      }

      const generateInterface = (obj: any, interfaceName = 'RootInterface'): string => {
        const properties = Object.entries(obj).map(([key, value]) => {
          const type = getType(value)
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`
          return `  ${safeKey}: ${type};`
        }).join('\n')

        return `interface ${interfaceName} {\n${properties}\n}`
      }

      let result = ''
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          result = 'type RootType = any[];'
        } else {
          const itemType = getType(parsed[0])
          result = `type RootType = ${itemType}[];`
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        result = generateInterface(parsed)
      } else {
        result = `type RootType = ${getType(parsed)};`
      }

      setOutput(result)
      setError('')
    } catch (err) {
      setError('无效的JSON格式')
      setOutput('')
    }
  }

  // 自定义移除字段功能
  const removeCustomFields = () => {
    try {
      if (!input.trim()) {
        setError('请输入JSON数据')
        setOutput('')
        return
      }

      // 解析输入的移除字段规则
      const fieldsToRemove = removeFieldsInput
        .split(',')
        .map(field => field.trim())
        .filter(field => field.length > 0)

      if (fieldsToRemove.length === 0) {
        setError('请输入要移除的字段名')
        setOutput('')
        return
      }

      const data = JSON.parse(input)

      // 处理resp字段中的嵌套JSON字符串（参考Python代码）
      if ('resp' in data && typeof data['resp'] === 'string') {
        try {
          data['resp'] = JSON.parse(data['resp'])
        } catch {
          // 如果解析失败，保持原样
        }
      }

      // 递归移除字段的函数
      const removeKeys = (obj: unknown) => {
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            // 如果是数组，递归处理每个元素
            obj.forEach(item => removeKeys(item))
          } else {
            const objRecord = obj as Record<string, unknown>
            // 如果是对象，检查并移除匹配的键
            const keysToDelete = Object.keys(objRecord).filter(key => {
              return fieldsToRemove.some(pattern => {
                if (pattern.endsWith('*')) {
                  // 支持通配符匹配
                  const prefix = pattern.slice(0, -1)
                  return key.startsWith(prefix)
                } else {
                  // 精确匹配
                  return key === pattern
                }
              })
            })

            // 删除匹配的键
            keysToDelete.forEach(key => {
              delete objRecord[key]
            })

            // 递归处理剩余的值
            Object.values(objRecord).forEach(value => removeKeys(value))
          }
        }
      }

      removeKeys(data)

      const result = JSON.stringify(data, null, 2)
      setOutput(result)
      setError('')
    } catch (err) {
      setError('无效的JSON格式')
      setOutput('')
    }
  }

  const downloadResult = () => {
    if (!output) return

    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'converted.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const addToHistory = (newInput: string) => {
    if (newInput !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newInput)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInput(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setInput(history[newIndex])
    }
  }

  const clearAll = () => {
    setInput('')
    setOutput('')
    setError('')
    setHistory([''])
    setHistoryIndex(0)
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="app-container">
        {/* 标题栏 */}
        <header className="header">
          <div className="title-bar">
            <div className="title-left">
              <span className="icon">📝</span>
              <h1>JSON 转换工具</h1>
            </div>
            <div className="theme-toggle">
              <button onClick={toggleTheme} title="切换主题">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main style={{ padding: '20px' }}>
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 工具栏 */}
          <div style={{ 
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            padding: '20px',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={formatJson}
                  className="tool-button primary"
                >
                  <span>✨</span>
                  JSON格式化
                </button>
                <button
                  onClick={minifyJson}
                  className="tool-button"
                >
                  <span>🗜️</span>
                  压缩
                </button>
                <button
                  onClick={escapeJson}
                  className="tool-button"
                >
                  <span>🔗</span>
                  转义
                </button>
                <button
                  onClick={removeComments}
                  className="tool-button"
                >
                  <span>🧹</span>
                  去注释
                </button>
                <button
                  onClick={jsonToXml}
                  className="tool-button"
                >
                  <span>📄</span>
                  转XML
                </button>
                <button
                  onClick={jsonToTypeScript}
                  className="tool-button"
                >
                  <span>🔷</span>
                  转TS
                </button>
                <button
                  onClick={() => setShowRemoveFields(!showRemoveFields)}
                  className={`tool-button ${showRemoveFields ? 'primary' : ''}`}
                >
                  <span>🗑️</span>
                  移除字段
                </button>

              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="tool-button"
                  title="撤销"
                  style={{ padding: '8px 12px' }}
                >
                  <span>↶</span>
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="tool-button"
                  title="重做"
                  style={{ padding: '8px 12px' }}
                >
                  <span>↷</span>
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  disabled={!output}
                  className="tool-button success"
                >
                  <span>📋</span>
                  复制
                </button>
                <button
                  onClick={clearAll}
                  className="tool-button danger"
                >
                  <span>🗑️</span>
                  清空
                </button>
              </div>
            </div>
          </div>

          {/* 移除字段配置面板 */}
          {showRemoveFields && (
            <div style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              padding: '20px',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ 
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  margin: '0 0 10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🎯</span>
                  自定义移除字段
                </h3>
                <p style={{ 
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  输入要移除的字段名，用逗号分隔。支持通配符 * (例如: Has*, ErrorInfo, data*)
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={removeFieldsInput}
                  onChange={(e) => setRemoveFieldsInput(e.target.value)}
                  placeholder="例如: Has*, ErrorInfo, data*"
                  style={{
                    flex: '1',
                    minWidth: '300px',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'var(--transition)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-color)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                />
                <button
                  onClick={removeCustomFields}
                  className="tool-button primary"
                  style={{ padding: '10px 16px' }}
                >
                  <span>🧹</span>
                  执行移除
                </button>
                <button
                  onClick={() => setRemoveFieldsInput('Has*, ErrorInfo')}
                  className="tool-button"
                  style={{ padding: '10px 16px' }}
                >
                  <span>🔄</span>
                  重置默认
                </button>
              </div>
            </div>
          )}

          {/* 主要内容区域 */}
          <div className="input-output-grid">
            <div style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '15px 20px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                <h3 style={{ 
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📝</span>
                  输入JSON
                </h3>
              </div>
              <div style={{ padding: '15px' }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{
                    width: '100%',
                    height: '700px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'none',
                    outline: 'none',
                    transition: 'var(--transition)'
                  }}
                  placeholder="请输入JSON数据..."
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-color)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                />
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const sample = {
                        "name": "张三",
                        "age": 30,
                        "city": "北京",
                        "hobbies": ["读书", "游泳", "编程"],
                        "address": {
                          "street": "中关村大街",
                          "number": 123
                        }
                      }
                      setInput(JSON.stringify(sample, null, 2))
                    }}
                    className="tool-button"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    <span>📊</span>
                    示例数据
                  </button>
                  <button
                    onClick={() => {
                      const sampleWithComments = `{
  // 用户基本信息
  "name": "张三",
  "age": 30, // 年龄
  "city": "北京",
  /*
   * 用户爱好列表
   * 包含多种兴趣
   */
  "hobbies": ["读书", "游泳", "编程"],
  "address": {
    "street": "中关村大街", // 街道地址
    "number": 123
  }
}`
                      setInput(sampleWithComments)
                    }}
                    className="tool-button"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    <span>💬</span>
                    带注释示例
                  </button>
                  <button
                    onClick={() => {
                      const removeFieldsSample = {
                        "name": "张三",
                        "age": 30,
                        "HasAge": true,
                        "HasName": true,
                        "ErrorInfo": "这是错误信息",
                        "city": "北京",
                        "resp": JSON.stringify({
                          "data": {
                            "user": "test",
                            "HasUser": true,
                            "ErrorInfo": "嵌套错误信息"
                          }
                        }),
                        "metadata": {
                          "HasMetadata": true,
                          "timestamp": 1234567890,
                          "ErrorInfo": "元数据错误"
                        }
                      }
                      setInput(JSON.stringify(removeFieldsSample, null, 2))
                    }}
                    className="tool-button"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    <span>🗑️</span>
                    移除字段示例
                  </button>
                </div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '15px 20px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ 
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>✨</span>
                  输出结果
                </h3>
                {output && (
                  <button
                    onClick={downloadResult}
                    className="tool-button success"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    <span>💾</span>
                    下载
                  </button>
                )}
              </div>
              <div style={{ padding: '15px' }}>
                <textarea
                  value={output}
                  readOnly
                  style={{
                    width: '100%',
                    height: '700px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'none',
                    outline: 'none'
                  }}
                  placeholder="转换结果将显示在这里..."
                />
                {error && (
                  <div style={{ 
                    marginTop: '10px', 
                    color: 'var(--danger-color)', 
                    fontSize: '14px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--danger-color)',
                    borderRadius: 'var(--border-radius)'
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      </div>
    </div>
  )
}

export default App
