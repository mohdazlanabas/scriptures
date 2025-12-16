
import { useEffect, useState } from 'react'

type Passage = { ref: string; text: string; translation?: string }
type Daily = {
  date: string
  area: string
  quran: Passage
  torah: Passage
  bible: Passage
  human_design: { ref: string; text: string }
  summary: string
}

export default function Scriptures() {
  const [data, setData] = useState<Daily | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [visitorCount, setVisitorCount] = useState<number | null>(null)
  const [userDate, setUserDate] = useState<string>("")
  const [userLocation, setUserLocation] = useState<string>("Loading...")

  useEffect(() => {
    fetch('/api/today').then(r => r.json()).then(setData).catch(() => setErr('Not ready'))
    fetch('/api/visitors').then(r => r.json()).then(d => setVisitorCount(d.count)).catch(() => setVisitorCount(null))
    setUserDate(new Date().toLocaleString())
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(r => r.json())
            .then(loc => setUserLocation(loc.address?.city || loc.address?.town || loc.address?.village || loc.address?.state || loc.address?.country || 'Unknown'))
            .catch(() => setUserLocation('Unknown'))
        },
        () => setUserLocation('Unknown'),
        { timeout: 5000 }
      )
    } else {
      setUserLocation('Unknown')
    }
  }, [])

  return (
    <div className="container py-6">
      <header className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <a href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
              ← Back to Home
            </a>
            <h1 className="text-2xl font-bold">Scripture Daily</h1>
            <p className="text-sm text-gray-600">Qur'an • Torah • Bible • Human Design</p>
          </div>
          <a
            href="/subscribe"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            Subscribe
          </a>
        </div>
      </header>

      {err && <div className="p-3 bg-amber-50 border border-amber-200 rounded">{err}</div>}
      {data && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div className="text-lg">
              <span className="text-gray-600">Topic Of Today: </span>
              <span className="font-bold uppercase">{data.area}</span>
            </div>
            <div className="text-sm text-gray-600">{data.date}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card"><h3 className="font-semibold">Qur'an</h3><p><em>{data.quran?.ref}</em></p><p>{data.quran?.text}</p></div>
            <div className="card"><h3 className="font-semibold">Torah</h3><p><em>{data.torah?.ref}</em></p><p>{data.torah?.text}</p></div>
            <div className="card"><h3 className="font-semibold">Bible</h3><p><em>{data.bible?.ref}</em></p><p>{data.bible?.text}</p></div>
            <div className="card"><h3 className="font-semibold">Human Design</h3><p><em>{data.human_design?.ref}</em></p><p>{data.human_design?.text}</p></div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
            <h4 className="font-semibold mb-1">Common Ground</h4>
            <p>{data.summary}</p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold mb-3">Copyable Summary</h4>
            <div className="space-y-2 text-sm font-mono">
              <div><strong>Verse:</strong></div>
              <div className="ml-4">• <strong>Quran ({data.quran?.ref}):</strong> {data.quran?.text}</div>
              <div className="ml-4">• <strong>Torah ({data.torah?.ref}):</strong> {data.torah?.text}</div>
              <div className="ml-4">• <strong>Bible ({data.bible?.ref}):</strong> {data.bible?.text}</div>
              <div className="ml-4">• <strong>Human Design ({data.human_design?.ref}):</strong> {data.human_design?.text}</div>
              <div><strong>Result:</strong> {data.area}</div>
              <div><strong>Common Ground:</strong> {data.summary}</div>
            </div>
          </div>
        </>
      )}
      <footer className="mt-10 pt-6 border-t text-sm text-gray-500 flex flex-col items-center gap-1">
        <div>User date: {userDate}</div>
        <div>Location: {userLocation}</div>
        <div>Visitor count: {visitorCount !== null ? visitorCount : '...'}</div>
        <div>Developed by Net1io.com</div>
        <div>Copyright (C) Reserved 2025</div>
      </footer>
    </div>
  )
}
