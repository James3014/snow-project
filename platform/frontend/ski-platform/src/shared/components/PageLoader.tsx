// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ice-primary"></div>
      <p className="mt-4 text-crystal-blue">載入中...</p>
    </div>
  </div>
);

export default PageLoader;
