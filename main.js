function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  document.getElementById('live-time').textContent = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();

setInterval(() => {
  const counterEl = document.getElementById('live-counter');
  let currentCount = parseInt(counterEl.textContent);
  counterEl.textContent = Math.max(15, currentCount + (Math.floor(Math.random() * 5) - 2));
}, 4000);

// --- 10 Track Playlist (Full Songs) ---
const playlistTracks = [
  { ytId: 'Y9IWXcd9p20', itunesQuery: 'Banjaara Ek Villain' },
  { ytId: 'XvXoYVghqwI', itunesQuery: 'Be Intehaan Race 2' },
  { ytId: '2tKtKvhq22w', itunesQuery: 'Badtameez Dil Yeh Jawaani Hai Deewani' },
  { ytId: 'pSg1r5Q3Hps', itunesQuery: 'Sunny Sunny Yaariyan' },
  { ytId: 'wTpy5d-B3u8', itunesQuery: 'Kabira Encore Yeh Jawaani Hai Deewani' },
  { ytId: 'V9qLz6lS9-0', itunesQuery: 'Raabta Agent Vinod' },
  { ytId: 't4mB-v5i0wI', itunesQuery: 'Main Rang Sharbaton Ka Phata Poster Nikhla Hero' },
  { ytId: 'sK7i8i1hUvg', itunesQuery: 'Sun Saathiya ABCD 2' },
  { ytId: 'n_X0sZ5d0gA', itunesQuery: 'Sooraj Dooba Hain Roy' },
  { ytId: '12gHnCPAVnE', itunesQuery: 'Channa Mereya Ae Dil Hai Mushkil' },
  { ytId: '2Vv-BfVoq4g', itunesQuery: 'Zaalima Raees' },
  { ytId: 'L_j7zVz7d0o', itunesQuery: 'Hawayein Jab Harry Met Sejal' },
  { ytId: 'X-53Vz5d0gA', itunesQuery: 'Agar Tum Saath Ho Tamasha' },
  { ytId: 'zQ9kZ7d0gA', itunesQuery: 'Samjhawan Humpty Sharma Ki Dulhania' },
  { ytId: 'M3n_X0sZ5gA', itunesQuery: 'Phir Le Aya Dil Barfi' }
];


let currentTrackIndex = 0;
let player;
let isPlaying = false;

const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const progressBarWrapper = document.getElementById('progress-bar-wrapper');

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Fetch Album & Artwork directly from iTunes API
async function fetchiTunesMetaData(query) {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
  } catch (err) {
    console.error("iTunes Metadata Fetch error:", err);
  }
  return null;
}

// Initialize YouTube API Player
function onYouTubeIframeAPIReady() {
  const track = playlistTracks[currentTrackIndex];
  
  player = new YT.Player('yt-player', {
    videoId: track.ytId,
    playerVars: {
      'playsinline': 1,
      'controls': 0
    },
    events: {
      'onReady': () => loadTrack(currentTrackIndex, false, true),
      'onStateChange': onPlayerStateChange
    }
  });
}

async function loadTrack(index, autoPlay = true, isInitialLoad = false) {
  currentTrackIndex = index;
  const track = playlistTracks[currentTrackIndex];

  if (!isInitialLoad) {
    document.getElementById('track-title').textContent = "Loading track...";
    document.getElementById('track-artist').textContent = "...";
    document.getElementById('track-album').textContent = "Searching...";
  }

  const itunesData = await fetchiTunesMetaData(track.itunesQuery);
  
  let title = "Unknown Song";
  let artist = "Unknown Artist";
  let album = "Single";
  let artUrl = document.getElementById('track-art').src;

  if (itunesData) {
    title = itunesData.trackName;
    artist = itunesData.artistName;
    album = itunesData.collectionName || 'Single';
    if (itunesData.artworkUrl100) {
      artUrl = itunesData.artworkUrl100.replace('100x100bb', '600x600bb');
    }
  }

  document.getElementById('track-title').textContent = title;
  document.getElementById('track-artist').textContent = artist;
  document.getElementById('track-album').textContent = album;
  document.getElementById('track-art').src = artUrl;

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: album,
      artwork: [{ src: artUrl, sizes: '512x512', type: 'image/jpeg' }]
    });
  }

  if (player && player.loadVideoById) {
    if (autoPlay) {
      player.loadVideoById(track.ytId);
      isPlaying = true;
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      player.cueVideoById(track.ytId);
    }
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  } else if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  } else if (event.data === YT.PlayerState.ENDED) {
    nextTrack();
  }
}

// Live Time & Progress Update
setInterval(() => {
  if (player && player.getCurrentTime && isPlaying) {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    if (duration > 0) {
      const percent = (currentTime / duration) * 100;
      progressFill.style.width = `${percent}%`;
      currentTimeEl.textContent = formatTime(currentTime);
      totalDurationEl.textContent = formatTime(duration);
    }
  }
}, 500);

// Seek Bar Click Event
progressBarWrapper.addEventListener('click', (e) => {
  if (player && player.getDuration) {
    const rect = progressBarWrapper.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = clickPosition * player.getDuration();
    player.seekTo(seekTime, true);
  }
});

function nextTrack() {
  const nextIndex = (currentTrackIndex + 1) % playlistTracks.length;
  loadTrack(nextIndex, true, false);
}

function prevTrack() {
  const prevIndex = (currentTrackIndex - 1 + playlistTracks.length) % playlistTracks.length;
  loadTrack(prevIndex, true, false);
}

document.getElementById('play-pause-btn').addEventListener('click', () => {
  if (!player || !player.getPlayerState) return;
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

document.getElementById('next-btn').addEventListener('click', nextTrack);
document.getElementById('prev-btn').addEventListener('click', prevTrack);

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => player && player.playVideo());
  navigator.mediaSession.setActionHandler('pause', () => player && player.pauseVideo());
  navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
  navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
}
