import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '雪場服務 | SnowTrace 滑雪場資訊與足跡紀錄',
  description: '探索全球滑雪場資訊，紀錄你的滑雪足跡，分享精彩瞬間。查詢交通、設施、雪道，規劃完美的滑雪之旅。',
  keywords: ['滑雪場', '雪場資訊', '滑雪足跡', '滑雪交通', '雪場查詢', 'ski resort'],
  manifest: '/manifest.json',
  openGraph: {
    title: '雪場服務 | SnowTrace',
    description: '探索全球滑雪場，紀錄你的滑雪足跡',
    type: 'website',
    locale: 'zh_TW',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0891b2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-zinc-900">
        {children}
      </body>
    </html>
  )
}
