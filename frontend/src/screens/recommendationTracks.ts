import type { Track } from './musicSelection'

export interface RecommendationTrack extends Track { album: string; previewCover?: string }
const cover = (name: string) => `/images/recommendations/${name}.png`

// Verified recording lengths: docs/recommendation-durations.md.
export const recommendationTracks: RecommendationTrack[] = [
  { id: 108, title: 'AFTERCARE', artist: 'Nessa Barrett', album: 'AFTERCARE DELUXE', cover: cover('edge-left'), duration: 93 },
  { id: 101, title: 'Electric Shock', artist: 'f(x)', album: 'The 2nd Mini Album', cover: cover('electric-shock'), duration: 195 },
  { id: 102, title: 'greedy', artist: 'Tate McRae', album: 'greedy', cover: cover('greedy'), duration: 131 },
  { id: 103, title: 'So Easy', artist: 'Olivia Dean', album: 'The Art of Loving', cover: cover('so-easy'), duration: 229 },
  { id: 104, title: 'Pretty Girls', artist: 'Reneé Rapp', album: 'Snow Angel', cover: cover('pretty-girls'), previewCover: cover('pretty-girls-avatar'), duration: 146 },
  { id: 105, title: 'Escapism.', artist: 'RAYE', album: 'My 21st Century Blues', cover: cover('escapism'), duration: 272 },
  { id: 106, title: 'bittersweet', artist: 'Madison Beer', album: 'locket', cover: cover('bittersweet'), duration: 202 },
  { id: 107, title: 'That’s So True', artist: 'Gracie Abrams', album: 'The Secret of Us', cover: cover('thats-so-true'), duration: 166 },
  { id: 109, title: 'Beatopia Cultsong', artist: 'beabadoobee', album: 'Beatopia', cover: cover('edge-right'), duration: 151 },
]
