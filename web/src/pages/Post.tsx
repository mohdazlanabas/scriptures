
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

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

export default function Post() {
  const { date } = useParams()
  const [data, setData] = useState<Daily | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    fetch(`/api/post/${date}`).then(r => r.json()).then(setData).catch(() => setErr('Not found'))
  }, [date])

  return (
    <div className="container py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scripture Daily</h1>
        <Link className="text-blue-600 hover:underline text-sm" to="/">Back to Today</Link>
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
    </div>
  )
}
