import { Link, useLocation } from "react-router-dom"
import { Redo2, Undo2 } from "lucide-react"
import { useStore } from "zustand"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  const { undo, redo, pastStates, futureStates } = useStore(
    useProjectStore.temporal,
  )

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
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={pastStates.length === 0}
                aria-label="Rückgängig"
                onClick={() => undo()}
              >
                <Undo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rückgängig (⌘Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={futureStates.length === 0}
                aria-label="Wiederherstellen"
                onClick={() => redo()}
              >
                <Redo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Wiederherstellen (⇧⌘Z)</TooltipContent>
          </Tooltip>
        </div>
        <div className="truncate text-sm text-muted-foreground">
          {projectId || description}
        </div>
      </div>
    </header>
  )
}
