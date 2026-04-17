import ThemeToggle from '../ThemeToggle/ThemeToggle'
import { getIcon, IconName, ICON_SIZES } from '@/lib/utils/icon-utils'

export default function Header() {
  const HomeIcon = getIcon('house' as IconName)

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <HomeIcon size={ICON_SIZES[2]} />
          <h1>Enosoft Project Management System</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
