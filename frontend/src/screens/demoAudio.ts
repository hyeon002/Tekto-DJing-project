// Fixed arbitrary assignments keep a selected card's audio stable across screens.
const filenames = [
 'Riordan x Locky - Friction (Official Audio).mp3',
 'Blossom.mp3',
 'Vodka Only (Extended Club Mix).mp3',
 'Fancy Footwork.mp3',
 'The Goods.mp3',
 'jewel-kid-scream-and-shout.mp3',
 'promise.mp3',
 'Sun is Shining (Lovelee Dae).mp3',
]
export const demoAudioSources = filenames.map(name => `/audio/${encodeURIComponent(name)}`)
// Recording lengths read from the supplied files' browser audio metadata.
export const electricShockAudio = { audioSrc: `/audio/${encodeURIComponent('Run Wild (Korean ver.).mp3')}`, duration: 151.013875 }
export const greedyAudio = { audioSrc: `/audio/${encodeURIComponent('NCT WISH 엔시티 위시 I SPY MV.mp3')}`, duration: 195.631 }
// Actual recording lengths verified from the supplied files in the browser.
export const demoAudioDurations = [193.816961, 341.170794, 311.124172, 192.238005, 210.04771, 400.846077, 110.132245, 174.962358]
