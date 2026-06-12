import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"

import { AppHeader } from "@/components/layout/AppHeader"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ProfiPage } from "@/pages/profi/ProfiPage"
import { ReportPage } from "@/pages/ReportPage"
import { StartPage } from "@/pages/StartPage"
import { WizardPage } from "@/pages/wizard/WizardPage"

function Shell() {
  const { pathname } = useLocation()
  const isReport = pathname === "/bericht"
  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isReport && <AppHeader />}
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/assistent" element={<WizardPage />} />
        <Route path="/profi" element={<ProfiPage />} />
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
