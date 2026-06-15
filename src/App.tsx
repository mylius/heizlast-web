import { useEffect } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"

import { AppHeader } from "@/components/layout/AppHeader"
import { useProjectStore } from "@/store/projectStore"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ProfiPage } from "@/pages/profi/ProfiPage"
import { ReportPage } from "@/pages/ReportPage"
import { SanierungPage } from "@/pages/sanierung/SanierungPage"
import { StartPage } from "@/pages/StartPage"
import { WizardPage } from "@/pages/wizard/WizardPage"

function Shell() {
  const { pathname } = useLocation()
  const isReport = pathname === "/bericht"

  useEffect(() => {
    // Hydration aus localStorage soll kein Undo-Schritt sein
    useProjectStore.temporal.getState().clear()
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        const temporal = useProjectStore.temporal.getState()
        if (e.shiftKey) temporal.redo()
        else temporal.undo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isReport && <AppHeader />}
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/assistent" element={<WizardPage />} />
        <Route path="/profi" element={<ProfiPage />} />
        <Route path="/sanierung" element={<SanierungPage />} />
        <Route path="/bericht" element={<ReportPage />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <TooltipProvider delayDuration={300}>
        <Shell />
      </TooltipProvider>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  )
}
