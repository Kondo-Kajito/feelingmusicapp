// src/components/MusicCard.jsx

function MusicCard({ song, likedSongs = [], toggleLike, onOpenModal, onPlaySong }) {
  const formatDuration = (ms) => {
    if (!ms) return '-:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLiked = likedSongs.some(likedSong => likedSong.song_title === song.song_title);

  return (
    <div className="song-card">
      {/* 🌟 クリックしたら親(App.jsx)の onPlaySong を呼ぶ */}
      <div className="song-info" onClick={() => onPlaySong(song)} style={{ cursor: 'pointer' }}>
        <img src={song.artwork_url} alt={song.song_title} className="artwork" />
        <div className="song-text">
          <div className="song-title">{song.song_title}</div>
          <div className="artist-name">{song.artist}</div>
        </div>
      </div>
      
      <div className="song-actions">
        <span className="duration">{formatDuration(song.duration_ms)}</span>
        <button className={`icon-btn heart-btn ${isLiked ? 'liked' : ''}`} onClick={() => toggleLike(song)}>
          {isLiked ? '♥' : '♡'}
        </button>
        <button className="icon-btn" onClick={() => onOpenModal(song)}>＋</button>
      </div>
    </div>
  );
}

export default MusicCard;