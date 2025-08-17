
export type Passage = { ref: string; text: string; translation?: string }
export type Daily = {
  date: string
  area: string
  quran: Passage
  torah: Passage
  bible: Passage
  human_design: { ref: string; text: string }
  summary: string
}
