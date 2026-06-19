// src/components/MiniPlayer.jsx

function MiniPlayer({ 
  song, 
  isPlaying, 
  onTogglePlay, 
  likedSongs, 
  toggleLike, 
  onOpenModal 
}) {
  if (!song) return null; // 曲が選択されていない時は何も表示しない

  const isLiked = likedSongs.some(likedSong => likedSong.song_title === song.song_title);

  return (
    <div className="mini-player">
      <div className="mini-player-info">
        <img src={song.artwork_url} alt={song.song_title} className="mini-artwork" />
        <div className="mini-text">
          <div className="mini-title">{song.song_title}</div>
          <div className="mini-artist">{song.artist}</div>
        </div>
      </div>
      
      <div className="mini-player-actions">
        {/* ♡ いいねボタン */}
        <button 
          className={`icon-btn heart-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => toggleLike(song)}
        >
          {isLiked ? '♥' : '♡'}
        </button>

        {/* ＋ リストへ保存ボタン */}
        <button className="icon-btn" onClick={() => onOpenModal(song)}>＋</button>

        {/* ▶ 再生 / 停止ボタン */}
        <button className="play-pause-btn" onClick={onTogglePlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}

export default MiniPlayer;