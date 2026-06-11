/**
 * Datei-Download/-Öffnen im Browser: File System Access API (Chromium),
 * sonst Anchor-Download bzw. <input type="file">.
 */

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName?: string
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>
      close: () => Promise<void>
    }>
  }>
}

export async function saveFile(
  content: Blob,
  suggestedName: string,
  description: string,
  mimeAccept: Record<string, string[]>,
): Promise<void> {
  const w = window as SaveFilePickerWindow
  if (w.showSaveFilePicker) {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName,
        types: [{ description, accept: mimeAccept }],
      })
      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
      return
    } catch (err) {
      if ((err as DOMException).name === "AbortError") return
      // Fallback auf Anchor-Download
    }
  }
  const url = URL.createObjectURL(content)
  const a = document.createElement("a")
  a.href = url
  a.download = suggestedName
  a.click()
  URL.revokeObjectURL(url)
}

export function saveTextFile(
  text: string,
  suggestedName: string,
  mimeType: string,
  description: string,
): Promise<void> {
  const ext = `.${suggestedName.split(".").pop()}`
  return saveFile(
    new Blob([text], { type: mimeType }),
    suggestedName,
    description,
    { [mimeType]: [ext] },
  )
}

export function openTextFile(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      resolve(await file.text())
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}
