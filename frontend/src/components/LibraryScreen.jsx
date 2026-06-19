// src/components/LibraryScreen.jsx

function LibraryScreen({ likedSongs, toggleLike, playlists }) {
  return (
    <div className="library-screen">
      <h2 className="screen-title">ライブラリ</h2>

      {/* お気に入りエリア */}
      <div className="section">
        <h3 className="section-title">お気に入り ({likedSongs.length})</h3>
        {likedSongs.length === 0 && <p className="empty-msg">まだお気に入りはありません</p>}
        {likedSongs.map((song, i) => (
          <div key={i} className="library-item">
            <img src={song.artwork_url} alt="" className="artwork-small" />
            <div className="info">
              <div className="title">{song.song_title}</div>
              <div className="artist">{song.artist}</div>
            </div>
            <button className="heart-btn liked" onClick={() => toggleLike(song)}>♥</button>
          </div>
        ))}
      </div>

      {/* 🌟 プレイリストエリア（追加部分） */}
      <div className="section">
        <h3 className="section-title">プレイリスト ({playlists ? playlists.length : 0})</h3>
        {!playlists || playlists.length === 0 ? (
          <p className="empty-msg">作成したプレイリストはありません</p>
        ) : (
          playlists.map(pl => (
            <div key={pl.id} className="playlist-card">
              <div className="playlist-header">
                <span className="icon">{pl.icon}</span>
                <span className="name">{pl.name}</span>
                <span className="count">{pl.songs.length} 曲</span>
              </div>
              <div className="playlist-songs">
                {pl.songs.map((song, idx) => (
                  <div key={idx} className="small-song-item">
                    {song.song_title} - {song.artist}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LibraryScreen;