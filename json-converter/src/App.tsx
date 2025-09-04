import { useState, useEffect, useCallback, useMemo } from 'react'

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





function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')


  const [history, setHistory] = useState<string[]>([''])
  const [historyIndex, setHistoryIndex] = useState(0)

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
    <div
      className="min-h-screen transition-all duration-500 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100"
      style={{
        background: 'linear-gradient(135deg, #dbeafe 0%, #fdf4ff 50%, #fce7f3 100%)',
        minHeight: '100vh'
      }}
    >



      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-8 animate-fadeIn">
          {/* 工具栏 */}
          <div className="rounded-2xl shadow-xl border p-6 transition-all duration-300 backdrop-blur-sm bg-white/90 border-gray-200 shadow-blue-500/10">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={formatJson}
                  className="group px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-3 font-semibold text-lg"
                >
                  <span className="group-hover:rotate-12 transition-transform duration-300 text-xl">✨</span>
                  JSON格式化
                </button>
                <button
                  onClick={minifyJson}
                  className="group px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 flex items-center gap-2"
                >
                  <span className="group-hover:scale-75 transition-transform duration-300">🗜️</span>
                  压缩
                </button>
                <button
                  onClick={escapeJson}
                  className="group px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
                >
                  <span className="group-hover:rotate-45 transition-transform duration-300">🔗</span>
                  转义
                </button>
                <button
                  onClick={removeComments}
                  className="group px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 flex items-center gap-2"
                >
                  <span className="group-hover:scale-110 transition-transform duration-300">🧹</span>
                  去注释
                </button>
                <button
                  onClick={jsonToXml}
                  className="group px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
                >
                  <span className="group-hover:rotate-12 transition-transform duration-300">📄</span>
                  转XML
                </button>
                <button
                  onClick={jsonToTypeScript}
                  className="group px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-2"
                >
                  <span className="group-hover:scale-110 transition-transform duration-300">🔷</span>
                  转TS
                </button>

              </div>
              <div className="flex gap-2">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="group px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md disabled:transform-none flex items-center gap-1"
                  title="撤销"
                >
                  <span className="group-hover:-rotate-12 transition-transform duration-300">↶</span>
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="group px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md disabled:transform-none flex items-center gap-1"
                  title="重做"
                >
                  <span className="group-hover:rotate-12 transition-transform duration-300">↷</span>
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  disabled={!output}
                  className="group px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25 disabled:transform-none flex items-center gap-2"
                >
                  <span className="group-hover:scale-110 transition-transform duration-300">📋</span>
                  复制
                </button>
                <button
                  onClick={clearAll}
                  className="group px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 flex items-center gap-2"
                >
                  <span className="group-hover:rotate-12 transition-transform duration-300">🗑️</span>
                  清空
                </button>
              </div>
            </div>
          </div>

          {/* 主要内容区域测试 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl shadow-xl border transition-all duration-300 backdrop-blur-sm bg-white/90 border-gray-200 shadow-blue-500/10">
              <div className="p-5 border-b rounded-t-2xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <span className="text-xl">📝</span>
                  输入JSON
                </h3>
              </div>
              <div className="p-6">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-[600px] p-4 border border-gray-300 rounded-lg font-mono text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入JSON数据..."
                />
                <div className="mt-2 flex gap-2">
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
                    className="group px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md shadow-blue-500/25 flex items-center gap-2"
                  >
                    <span className="group-hover:rotate-12 transition-transform duration-300">📊</span>
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
                    className="group px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md shadow-purple-500/25 flex items-center gap-2"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300">💬</span>
                    带注释示例
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl shadow-xl border transition-all duration-300 backdrop-blur-sm bg-white/90 border-gray-200 shadow-blue-500/10">
              <div className="flex items-center justify-between p-5 border-b rounded-t-2xl transition-all duration-300 bg-gradient-to-r from-green-50 to-blue-50 border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <span className="text-xl">✨</span>
                  输出结果
                </h3>
                {output && (
                  <button
                    onClick={downloadResult}
                    className="group px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md shadow-emerald-500/25 flex items-center gap-2"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300">💾</span>
                    下载
                  </button>
                )}
              </div>
              <div className="p-6">
                <textarea
                  value={output}
                  readOnly
                  className="w-full h-[600px] p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-base resize-none"
                  placeholder="转换结果将显示在这里..."
                />
              </div>
            </div>
          </div>


        </div>
      </main>


    </div>
  )
}

export default App
