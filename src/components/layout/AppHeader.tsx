import { Link, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useProjectStore } from "@/store/projectStore"

const NAV = [
  { to: "/", label: "Start" },
  { to: "/assistent", label: "Assistent" },
  { to: "/profi", label: "Profi-Modus" },
  { to: "/bericht", label: "Bericht" },
]

export function AppHeader() {
  const { pathname } = useLocation()
  const projectId = useProjectStore((s) => s.project.projectId)
  const description = useProjectStore((s) => s.project.description)

  return (
    <header className="border-b bg-background print:hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">Heizlast</span>
          <span className="text-xs text-muted-foreground">DIN EN 12831</span>
        </Link>
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === item.to
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto truncate text-sm text-muted-foreground">
          {projectId || description}
        </div>
      </div>
    </header>
  )
}
