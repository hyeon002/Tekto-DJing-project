export type Deck = 'left' | 'right'
export interface Track { id: number; title: string; artist: string; cover: string; duration?: number; audioSrc?: string }
// Set audioSrc to a real audio file URL when supplied.
export const tracks: Track[] = [
 {id:1,title:'Immunity',artist:'Clairo',cover:'/images/music-search/1.png'},
 {id:2,title:'This is How Tomorrow Moves',artist:'beabadobee',cover:'/images/music-search/2.png'},
 {id:3,title:'Beatopia',artist:'beabadobee',cover:'/images/music-search/3.png'},
 {id:4,title:'The Chase',artist:'Hearts2Hearts',cover:'/images/player/cover.png',duration:188},
 {id:5,title:'Electric Shock -The 2nd Mini Album',artist:'f(x)',cover:'/images/music-search/5.png'},
 {id:6,title:'Training Day',artist:'LNGSHOT',cover:'/images/music-search/6.png'},
 {id:7,title:'you seem pretty sad for a girl so in love',artist:'Olivia Rodrigo',cover:'/images/music-search/7.png'},
 {id:8,title:'you seem pretty sad for a girl so in love',artist:'Olivia Rodrigo',cover:'/images/music-search/8.png'},
]
export function selectedTrack(deck: Deck, search = window.location.search) {
 return tracks.find(track => track.id === Number(new URLSearchParams(search).get(deck)))
}
export function selectionUrl(path: string, deck?: Deck, trackId?: number) {
 const params = new URLSearchParams()
 for (const side of ['left','right'] as const) { const track = selectedTrack(side); if(track) params.set(side,String(track.id)) }
 if(deck && trackId) params.set(deck,String(trackId))
 if(deck && path === '/music-search') params.set('deck',deck)
 return `${path}${params.size ? `?${params}` : ''}`
}
export function formatTime(seconds?: number) {
 if(seconds === undefined || !Number.isFinite(seconds)) return '--:--'
 return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`
}
