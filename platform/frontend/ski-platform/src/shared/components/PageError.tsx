// Error component
const PageError = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-4">❄️</div>
      <h1 className="text-2xl font-bold text-crystal-blue mb-2">頁面載入失敗</h1>
      <p className="text-crystal-blue/70 mb-6">
        抱歉，頁面載入時發生錯誤。請重新整理頁面或稍後再試。
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-ice-primary text-white rounded-lg hover:bg-ice-primary/90 transition-colors"
      >
        重新載入
      </button>
    </div>
  </div>
);

export default PageError;
