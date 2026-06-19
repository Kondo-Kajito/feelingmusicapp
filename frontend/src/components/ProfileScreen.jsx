// src/components/ProfileScreen.jsx
function ProfileScreen({ userGenres, setUserGenres, userEras, setUserEras, userWeather, setUserWeather }) {
  // 選択肢のリスト
  const availableGenres = ["J-POP", "K-POP", "洋楽", "Rock", "R&B", "HipHop", "アニソン", "クラシック", "ジャズ"];
  const availableEras = ["80's", "90's", "2000's", "2010's", "2020's"];

  // ジャンルボタンを押した時の処理（選択/解除）
  const toggleGenre = (genre) => {
    if (userGenres.includes(genre)) {
      setUserGenres(userGenres.filter(g => g !== genre)); // すでに選ばれていたら外す
    } else {
      setUserGenres([...userGenres, genre]); // 選ばれていなければ追加する
    }
  };

  // 年代ボタンを押した時の処理（選択/解除）
  const toggleEra = (era) => {
    if (userEras.includes(era)) {
      setUserEras(userEras.filter(e => e !== era));
    } else {
      setUserEras([...userEras, era]);
    }
  };

  return (
    <div className="profile-screen">
      <div className="header">
        <p className="header-subtitle">SETTINGS</p>
        <h1 className="header-title">音楽の好み</h1>
      </div>

      <div className="profile-content">
        <p className="profile-desc">
          AIが選曲する際のヒントになります。<br/>
          好きなものをいくつでも選んでください。
        </p>

        {/* --- 好きなジャンル --- */}
        <div className="setting-section">
          <h3 className="section-title">好きなジャンル</h3>
          <div className="chip-container">
            {availableGenres.map(genre => (
              <button 
                key={genre}
                className={`toggle-chip ${userGenres.includes(genre) ? 'active' : ''}`}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* --- 好きな年代 --- */}
        <div className="setting-section">
          <h3 className="section-title">好きな年代</h3>
          <div className="chip-container">
            {availableEras.map(era => (
              <button 
                key={era}
                className={`toggle-chip ${userEras.includes(era) ? 'active' : ''}`}
                onClick={() => toggleEra(era)}
              >
                {era}
              </button>
            ))}
          </div>
        </div>

        {/* --- 🌟 今の天気（追加） --- */}
        <div className="setting-section">
          <h3 className="section-title">今の天気</h3>
          <div className="chip-container">
            {["晴れ ☀️", "曇り ☁️", "雨 🌧️", "雪 ❄️"].map(weather => (
              <button 
                key={weather}
                className={`toggle-chip ${userWeather === weather ? 'active' : ''}`}
                onClick={() => setUserWeather(weather)}
              >
                {weather}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;