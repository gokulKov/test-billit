// Minimal temporary layout to bypass complex client logic during build debugging
export default function MainLayout({ children }) {
  return <div className="min-h-screen bg-white text-black p-4">{children}</div>
}
