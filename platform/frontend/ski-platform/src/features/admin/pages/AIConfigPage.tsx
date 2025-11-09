/**
 * AI Configuration Page
 * AI 配置管理頁面（僅管理員）
 */
import { useState, useEffect } from 'react';
import { userCoreApi } from '@/shared/api/client';
import Card from '@/shared/components/Card';

interface AIProvider {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
  pricing: { input: string; output: string };
}

interface AIConfig {
  provider: string;
  model: string;
  api_key_preview: string;
  temperature: number;
  is_active: boolean;
}

export default function AIConfigPage() {
  const [currentConfig, setCurrentConfig] = useState<AIConfig | null>(null);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 表單狀態
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  // 載入配置
  useEffect(() => {
    loadConfig();
    loadProviders();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await userCoreApi.get<AIConfig>('/admin/ai-config/current');
      setCurrentConfig(config);
      setSelectedProvider(config.provider);
      setSelectedModel(config.model);
      setTemperature(config.temperature);
    } catch (error) {
      console.error('載入配置失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await userCoreApi.get<{ providers: AIProvider[] }>('/admin/ai-config/providers');
      setProviders(data.providers);
    } catch (error) {
      console.error('載入提供商失敗:', error);
    }
  };

  const handleTest = async () => {
    if (!selectedProvider || !selectedModel || !apiKey) {
      alert('請填寫完整配置');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await userCoreApi.post('/admin/ai-config/test', {
        provider: selectedProvider,
        model: selectedModel,
        api_key: apiKey,
        temperature,
      });

      setTestResult({
        success: true,
        message: `測試成功！回應：${result.test_response}`,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `測試失敗：${error.message || error.detail}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider || !selectedModel || !apiKey) {
      alert('請填寫完整配置');
      return;
    }

    setSaving(true);

    try {
      await userCoreApi.post('/admin/ai-config/update', {
        provider: selectedProvider,
        model: selectedModel,
        api_key: apiKey,
        temperature,
      });

      alert('AI 配置已更新成功！');
      await loadConfig();
      setApiKey(''); // 清空 API Key 輸入框
    } catch (error: any) {
      alert(`更新失敗：${error.message || error.detail}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);
  const availableModels = selectedProviderData?.models || [];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🤖 AI 助手配置</h1>

      {/* 當前配置 */}
      {currentConfig && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-bold mb-4">📊 當前配置</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">提供商</p>
              <p className="font-medium">{currentConfig.provider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">模型</p>
              <p className="font-medium">{currentConfig.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">API Key</p>
              <p className="font-mono text-sm">{currentConfig.api_key_preview}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">溫度</p>
              <p className="font-medium">{currentConfig.temperature}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              currentConfig.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {currentConfig.is_active ? '✓ 啟用中' : '未啟用'}
            </span>
          </div>
        </Card>
      )}

      {/* 配置表單 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">⚙️ 更新配置</h2>

        <div className="space-y-6">
          {/* AI 提供商選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI 提供商 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedModel(''); // 重置模型選擇
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選擇提供商...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>

            {selectedProviderData && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  💰 定價：輸入 {selectedProviderData.pricing.input} / 輸出 {selectedProviderData.pricing.output}
                </p>
              </div>
            )}
          </div>

          {/* 模型選擇 */}
          {selectedProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模型 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選擇模型...</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedProvider === 'openai' ? 'sk-...' : selectedProvider === 'anthropic' ? 'sk-ant-...' : 'your-api-key'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              {selectedProvider === 'openai' && '從 platform.openai.com 獲取'}
              {selectedProvider === 'anthropic' && '從 console.anthropic.com 獲取'}
              {selectedProvider === 'gemini' && '從 ai.google.dev 獲取'}
            </p>
          </div>

          {/* 溫度參數 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              溫度（Temperature）
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-sm w-12">{temperature}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              較低值（0.1-0.3）= 更確定性 | 較高值（0.7-1.0）= 更有創意
            </p>
          </div>

          {/* 測試結果 */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? '✓ ' : '✗ '}
                {testResult.message}
              </p>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !selectedProvider || !selectedModel || !apiKey}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {testing ? '測試中...' : '🧪 測試連接'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedProvider || !selectedModel || !apiKey}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? '儲存中...' : '💾 儲存配置'}
            </button>
          </div>
        </div>
      </Card>

      {/* 使用說明 */}
      <Card className="mt-6 p-6 bg-yellow-50 border border-yellow-200">
        <h3 className="font-bold text-yellow-900 mb-2">⚠️ 注意事項</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>請妥善保管 API Key，不要分享給他人</li>
          <li>建議先使用「測試連接」確認配置正確後再儲存</li>
          <li>更新配置後，AI 助手將立即使用新的設定</li>
          <li>Gemini 目前為免費試用，但有配額限制</li>
          <li>OpenAI 和 Anthropic 按實際使用量計費</li>
        </ul>
      </Card>
    </div>
  );
}
