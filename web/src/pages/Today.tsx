
import React, { useEffect, useState } from 'react'

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

export default function Today() {
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
        <h1 className="text-2xl font-bold">Scripture Daily</h1>
        <p className="text-sm text-gray-600">Qur'an • Torah • Bible • Human Design</p>
      </header>

      {err && <div className="p-3 bg-amber-50 border border-amber-200 rounded">{err}</div>}
      {data && (
        <>
          <div className="mb-2 text-sm text-gray-700">
            <span className="badge mr-2">{data.date}</span>
            <span className="badge">{data.area}</span>
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
        </>
      )}
      <footer className="mt-10 pt-6 border-t text-sm text-gray-500 flex flex-col items-center gap-1">
        <div>User date: {userDate}</div>
        <div>Location: {userLocation}</div>
        <div>Visitor count: {visitorCount !== null ? visitorCount : '...'}</div>
      </footer>
    </div>
  )
}
