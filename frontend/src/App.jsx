// src/App.jsx
import { useState, useRef, useEffect } from 'react';
import { FiHome, FiBookOpen, FiUser } from "react-icons/fi";
import MusicCard from './components/MusicCard';
import ProfileScreen from './components/ProfileScreen';
import LibraryScreen from './components/LibraryScreen';
import PlaylistModal from './components/PlaylistModal';
import MiniPlayer from './components/MiniPlayer';
import './App.css'; 

// 🌟 参考文章の全選択肢リスト
const ALL_QUICK_REPLIES = [
  "最近ちょっと疲れてる",
  "好きな人がいる",
  "懐かしい気分になりたい",
  "今日とてもうれしいことがあった",
  "眠たくてのんびりしたい",
  "緊張していて落ち着きたい",
  "雨の日の気分に合う曲が聴きたい",
  "ドライブに合う曲を聴きたい",
  "元気が出る曲を聴きたい",
  "夜のリラックスタイムに合う曲を聴きたい",
  "失恋してしまった気分を癒したい",
  "イライラしていて気分を落ち着けたい",
  "最近のヒット曲を聴きたい",
  "昔の名曲を聴きたい",
  "クラシックやジャズなど落ち着いた曲を聴きたい",
  "パーティーやイベントに合う曲を聴きたい",
  "運動やトレーニングに合う曲を聴きたい",
  "勉強や作業に集中できる曲を聴きたい",
  "旅行や冒険に合う曲を聴きたい",
  "季節感のある曲を聴きたい"
];

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [likedSongs, setLikedSongs] = useLocalStorage("mt_liked", []);
  const [playlists, setPlaylists] = useLocalStorage("mt_playlists", []);
  const [userGenres, setUserGenres] = useLocalStorage("mt_genres", ["J-POP"]);
  const [userEras, setUserEras] = useLocalStorage("mt_eras", []);
  const [userWeather, setUserWeather] = useLocalStorage("mt_weather", "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);

  // --- 音楽再生用の状態管理 ---
  const [currentSong, setCurrentSong] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);    
  const audioRef = useRef(null);                        

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1, sender: 'ai',
      text: 'やあ！今どんな気分？\n何でも話してくれたら、その気持ちに合った音楽を見つけるよ。'
    }
  ]);

  const chatEndRef = useRef(null);
  
  // メッセージ用のIDカウンター（前回のESLintエラー対策）
  const messageIdRef = useRef(2); 

  // 🌟 追加：画面を開いた時に、全選択肢からランダムで3つだけ選んで固定するロジック
  const [quickReplies] = useState(() => {
    return [...ALL_QUICK_REPLIES].sort(() => 0.5 - Math.random()).slice(0, 3);
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentScreen]);

  const handlePlaySong = (song) => {
    if (!song.preview_url) {
      alert("この曲は試聴できません。");
      return;
    }
    if (currentSong && currentSong.song_title === song.song_title) {
      if (!isPlaying) togglePlayPause();
      return;
    }
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (!currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("再生エラー:", e));
      setIsPlaying(true);
    }
  };

  const toggleLike = (song) => {
    // 🌟 修正：曲名とアーティスト名の「両方」が一致するかで厳格に判定する
    const isAlreadyLiked = likedSongs.some(
      likedSong => likedSong.song_title === song.song_title && likedSong.artist === song.artist
    );
    
    if (isAlreadyLiked) {
      // すでにいいねされている場合は、曲名とアーティスト名が完全一致するものを除外する
      setLikedSongs(likedSongs.filter(
        likedSong => !(likedSong.song_title === song.song_title && likedSong.artist === song.artist)
      ));
    } else {
      setLikedSongs([...likedSongs, song]);
    }
  };
  const openModal = (song) => {
    setSelectedSongForPlaylist(song);
    setIsModalOpen(true);
  };

  const createPlaylist = (name, icon, song) => {
    const newPlaylist = { id: Date.now(), name, icon, songs: [song] };
    setPlaylists([...playlists, newPlaylist]);
    setIsModalOpen(false);
  };

  const saveToPlaylist = (playlistId, song) => {
    setPlaylists(playlists.map(pl => pl.id === playlistId ? { ...pl, songs: [...pl.songs, song] } : pl));
    setIsModalOpen(false);
  };

  // 通常のフォーム送信と、ボタンでの自動送信の両方に対応
  const handleSend = async (e, textValue = null) => {
    if (e) e.preventDefault();
    
    const currentText = textValue || inputText;
    if (!currentText.trim() || isLoading) return;

    const currentUserId = messageIdRef.current++;
    const userMsg = { id: currentUserId, sender: 'user', text: currentText };
    setMessages(prev => [...prev, userMsg]);
    
    if (!textValue) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('https://feelingmusicapp.onrender.com/analyze-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: currentText, weather: userWeather, situation: "", genres: userGenres, eras: userEras 
        }),
      });
      const data = await response.json();
      
      const currentAiId = messageIdRef.current++;
      const aiMsg = { id: currentAiId, sender: 'ai', text: data.message, songs: data.songs || [] };
      setMessages(prev => [...prev, aiMsg]);
    } catch { 
      const errorMsgId = messageIdRef.current++;
      setMessages(prev => [...prev, { id: errorMsgId, sender: 'ai', text: '⚠️ 通信エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-app-container">
      
      <audio 
        ref={audioRef} 
        src={currentSong?.preview_url} 
        onEnded={() => setIsPlaying(false)} 
        autoPlay={isPlaying}
      />

      {currentScreen === 'home' && (
        <>
          <div className="header">
            <p className="header-subtitle">MOODTUNES AI</p>
            <h1 className="header-title">気持ちを話してみて</h1>
          </div>
          
          <div className={`chat-history ${currentSong ? 'with-mini-player' : ''}`}>
            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                {msg.sender === 'ai' && <div className="avatar-ai">♪</div>}
                <div className="message-content-group">
                  <div className={`message-bubble ${msg.sender}`}>
                    {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                  {msg.songs && msg.songs.length > 0 && (
                    <div className="songs-container">
                      {msg.songs.map((song, i) => (
                        <MusicCard 
                          key={i} 
                          song={song} 
                          likedSongs={likedSongs} 
                          toggleLike={toggleLike} 
                          onOpenModal={openModal}
                          onPlaySong={handlePlaySong} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 🌟 変更：ランダムに選ばれた3つのボタン（quickReplies）をループ処理 */}
            {messages.length === 1 && !isLoading && (
              <div className="quick-replies-container">
                {quickReplies.map((text, index) => (
                  <button 
                    key={index} 
                    className="quick-reply-btn" 
                    onClick={() => handleSend(null, text)}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="message-wrapper ai">
                <div className="avatar-ai">♪</div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className={`input-area-wrapper ${currentSong ? 'with-mini-player' : ''}`}>
            <form onSubmit={(e) => handleSend(e)} className="input-form">
              <span className="input-icon">🎤</span>
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="今の気持ちを話してみて..." />
              <button type="submit" className="send-button" disabled={!inputText.trim() || isLoading}>➤</button>
            </form>
          </div>
        </>
      )}

      {currentScreen === 'library' && (
        <LibraryScreen likedSongs={likedSongs} toggleLike={toggleLike} playlists={playlists} />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen 
          userGenres={userGenres} setUserGenres={setUserGenres} userEras={userEras} setUserEras={setUserEras} userWeather={userWeather} setUserWeather={setUserWeather}
        />
      )}

      <MiniPlayer 
        song={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={togglePlayPause}
        likedSongs={likedSongs}
        toggleLike={toggleLike}
        onOpenModal={openModal}
      />

      <div className="bottom-nav">
        <div 
          className={`nav-item ${currentScreen === 'home' ? 'active' : ''}`} 
          onClick={() => setCurrentScreen('home')}
        >
          <FiHome className="nav-icon" />
          <span>ホーム</span>
        </div>
        
        <div 
          className={`nav-item ${currentScreen === 'library' ? 'active' : ''}`} 
          onClick={() => setCurrentScreen('library')}
        >
          <FiBookOpen className="nav-icon" />
          <span>ライブラリ</span>
        </div>
        
        <div 
          className={`nav-item ${currentScreen === 'profile' ? 'active' : ''}`} 
          onClick={() => setCurrentScreen('profile')}
        >
          <FiUser className="nav-icon" />
          <span>プロフィール</span>
        </div>
      </div>
      <PlaylistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        song={selectedSongForPlaylist} 
        playlists={playlists} 
        onCreatePlaylist={createPlaylist} 
        onSaveToPlaylist={saveToPlaylist}
      />
    </div>
  );
}

export default App;