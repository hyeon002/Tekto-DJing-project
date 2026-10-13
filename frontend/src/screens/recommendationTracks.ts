import type { Track } from './musicSelection'
import { demoAudioSources, demoAudioDurations } from './demoAudio'

export interface RecommendationTrack extends Track { album: string; previewCover?: string }
const cover = (name: string) => `/images/recommendations/${name}.png`

// Durations follow the assigned demo recordings, rather than the displayed titles.
export const recommendationTracks: RecommendationTrack[] = [
  { id: 108, title: 'AFTERCARE', artist: 'Nessa Barrett', album: 'AFTERCARE DELUXE', cover: cover('edge-left') },
  { id: 101, title: 'Electric Shock', artist: 'f(x)', album: 'The 2nd Mini Album', cover: cover('electric-shock') },
  { id: 102, title: 'greedy', artist: 'Tate McRae', album: 'greedy', cover: cover('greedy') },
  { id: 103, title: 'So Easy', artist: 'Olivia Dean', album: 'The Art of Loving', cover: cover('so-easy') },
  { id: 104, title: 'Pretty Girls', artist: 'Reneé Rapp', album: 'Snow Angel', cover: cover('pretty-girls'), previewCover: cover('pretty-girls-avatar') },
  { id: 105, title: 'Escapism.', artist: 'RAYE', album: 'My 21st Century Blues', cover: cover('escapism') },
  { id: 106, title: 'bittersweet', artist: 'Madison Beer', album: 'locket', cover: cover('bittersweet') },
  { id: 107, title: 'That’s So True', artist: 'Gracie Abrams', album: 'The Secret of Us', cover: cover('thats-so-true') },
  { id: 109, title: 'Beatopia Cultsong', artist: 'beabadoobee', album: 'Beatopia', cover: cover('edge-right') },
].map((track, index) => ({
  ...track,
  // Nine cards share eight files; repeat at distance four around the carousel.
  audioSrc: demoAudioSources[index === 8 ? 4 : index],
  duration: demoAudioDurations[index === 8 ? 4 : index],
}))

