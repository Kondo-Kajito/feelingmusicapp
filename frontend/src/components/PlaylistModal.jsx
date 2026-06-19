// src/components/PlaylistModal.jsx
import { useState } from 'react';

function PlaylistModal({ isOpen, onClose, song, playlists, onCreatePlaylist, onSaveToPlaylist }) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎵');

  // アイコンの選択肢
  const iconOptions = ['🎵', '🎧', '☕', '🚗', '🌙', '🏃‍♂️', '🎉', '💻'];

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName, selectedIcon, song);
    setNewPlaylistName(''); // フォームをリセット
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* モーダルの中身（クリックしても閉じないようにストップ） */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">プレイリストに追加</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 選択中の曲の情報 */}
        {song && (
          <div className="modal-song-info">
            <img src={song.artwork_url} alt="" className="modal-artwork" />
            <div>
              <div className="modal-song-title">{song.song_title}</div>
              <div className="modal-artist">{song.artist}</div>
            </div>
          </div>
        )}

        {/* 新規リスト作成フォーム */}
        <div className="create-playlist-section">
          <h4 className="section-label">新しいプレイリストを作成</h4>
          <form onSubmit={handleCreate} className="create-form">
            <div className="icon-selector">
              {iconOptions.map(icon => (
                <button 
                  key={icon} 
                  type="button"
                  className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="input-row">
              <input 
                type="text" 
                placeholder="リストの名前 (例: ドライブ用)" 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
              />
              <button type="submit" className="create-btn" disabled={!newPlaylistName.trim()}>作成して保存</button>
            </div>
          </form>
        </div>

        {/* 既存のリスト一覧 */}
        {playlists.length > 0 && (
          <div className="existing-playlists-section">
            <h4 className="section-label">保存先を選ぶ</h4>
            <div className="playlist-list">
              {playlists.map(playlist => {
                // このリストにすでに曲が入っているかチェック
                const isAlreadyIn = playlist.songs.some(s => s.song_title === song.song_title);
                
                return (
                  <button 
                    key={playlist.id} 
                    className="playlist-item-btn"
                    onClick={() => onSaveToPlaylist(playlist.id, song)}
                    disabled={isAlreadyIn}
                  >
                    <span className="playlist-icon">{playlist.icon}</span>
                    <span className="playlist-name">{playlist.name}</span>
                    <span className="playlist-status">
                      {isAlreadyIn ? '保存済み' : '＋ 追加'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistModal;