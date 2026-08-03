import { useState, useEffect } from 'react'
import { loadConfig, saveConfig, IAppConfig } from '../utils/config-store'
import { Card } from './Card'
import { Input } from './Input'
import { Button } from './Button'
import { ToggleSwitch } from './ToggleSwitch'
import { Loading } from './Loading'

interface PluginInfo {
  name: string
  enabled: boolean
}

export default function ConfigPage(): React.ReactNode {
  const [config, setConfig] = useState<IAppConfig | null>(null)
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
      .then(async (cfg) => {
        setConfig(cfg)

        // 获取当前插件列表
        const pluginList: PluginInfo[] = await window.electron.ipcRenderer.invoke('get-plugins')
        setPlugins(pluginList)

        // 用保存的配置覆盖主进程的插件状态
        for (const plugin of pluginList) {
          const savedState = cfg.plugins[plugin.name]
          if (savedState !== undefined) {
            await window.electron.ipcRenderer.invoke(
              'toggle-plugin',
              plugin.name,
              savedState.enabled
            )
          }
        }

        // 重新获取一次，确保 UI 反映实际状态
        const updatedList = await window.electron.ipcRenderer.invoke('get-plugins')
        setPlugins(updatedList)
        setLoading(false)
      })
      .catch((error) => {
        console.error('加载配置失败:', error)
        setLoading(false)
      })
  }, [])

  const handleTogglePlugin = async (pluginName: string, enabled: boolean): Promise<void> => {
    await window.electron.ipcRenderer.invoke('toggle-plugin', pluginName, enabled)
    setPlugins((prev) => prev.map((p) => (p.name === pluginName ? { ...p, enabled } : p)))

    if (config) {
      setConfig({
        ...config,
        plugins: {
          ...config.plugins,
          [pluginName]: {
            ...config.plugins[pluginName],
            enabled
          }
        }
      })
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!config) return
    await saveConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <Loading text="加载配置中..." />
  }

  if (!config) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <div className="empty-title">加载配置失败</div>
        <div className="empty-description">请检查应用日志或重启应用</div>
      </div>
    )
  }

  return (
    <div className="page-scroll-container config-page">
      <div className="config-page-header">
        <div className="config-page-header-info">
          <h2 className="config-page-title">配置管理</h2>
          <p className="config-page-desc">管理检测插件与 AI 大模型设置</p>
        </div>
        <Button onClick={handleSave} variant={saved ? 'secondary' : 'primary'} size="sm">
          {saved ? (
            <>
              <span>✅</span>
              已保存
            </>
          ) : (
            <>
              <span>💾</span>
              保存配置
            </>
          )}
        </Button>
      </div>

      <div className="config-scroll-area">
        {/* AI 设置 */}
        <Card title="🤖 AI 大模型配置">
          <Input
            label="API Key"
            type="password"
            value={config.ai.apiKey}
            onChange={(e) => setConfig({ ...config, ai: { ...config.ai, apiKey: e.target.value } })}
            placeholder="sk-xxxxxxxx"
          />
          <Input
            label="Endpoint"
            value={config.ai.baseURL}
            onChange={(e) =>
              setConfig({ ...config, ai: { ...config.ai, baseURL: e.target.value } })
            }
            placeholder="https://api.example.com/v1/chat/completions"
          />
          <Input
            label="Model"
            value={config.ai.model}
            onChange={(e) => setConfig({ ...config, ai: { ...config.ai, model: e.target.value } })}
            placeholder="gpt-4o-mini"
          />
        </Card>

        {/* 插件管理 */}
        <Card title="🔌 检测插件管理">
          <div className="config-plugin-list">
            {plugins.map((plugin, index) => (
              <div
                key={plugin.name}
                className="config-plugin-row animate-slide-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  background: plugin.enabled ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${plugin.enabled ? '#dcfce7' : '#e5e7eb'}`
                }}
              >
                <div className="config-plugin-info">
                  <div
                    className="config-plugin-name"
                    style={{ color: plugin.enabled ? '#166534' : '#374151' }}
                  >
                    {plugin.name}
                  </div>
                  <div className="config-plugin-status">
                    {plugin.enabled ? '已启用，将在检测时运行' : '已禁用，检测时将跳过'}
                  </div>
                </div>
                <ToggleSwitch
                  checked={plugin.enabled}
                  onChange={(checked) => handleTogglePlugin(plugin.name, checked)}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
