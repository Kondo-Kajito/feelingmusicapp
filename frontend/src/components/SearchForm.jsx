function SearchForm({ text, setText, weather, setWeather, situation, setSituation, handleSearch, isLoading }) {
  return (
    <form onSubmit={handleSearch} className="search-form">
      <div className="form-group">
        <label>今の気分や出来事を教えてください</label>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例: 失恋して泣きたい気分... / 雨の日のドライブ中"
          rows="3"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>天候</label>
          <select value={weather} onChange={(e) => setWeather(e.target.value)}>
            <option value="">指定なし</option>
            <option value="晴れ">晴れ ☀️</option>
            <option value="雨">雨 🌧️</option>
            <option value="曇り">曇り ☁️</option>
          </select>
        </div>

        <div className="form-group">
          <label>シチュエーション</label>
          <select value={situation} onChange={(e) => setSituation(e.target.value)}>
            <option value="">指定なし</option>
            <option value="カフェ・リラックス">カフェ・リラックス ☕</option>
            <option value="ドライブ・移動">ドライブ・移動 🚗</option>
            <option value="勉強・仕事">勉強・仕事 💻</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={isLoading || !text} className="submit-button">
        {isLoading ? 'AIが選曲中...' : '音楽を処方してもらう ✨'}
      </button>
    </form>
  );
}

export default SearchForm;