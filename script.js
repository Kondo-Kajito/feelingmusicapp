// 各MBTIに対するダミーの楽曲データ
const songDatabase = {
    // --- 分析家 ---
    INTJ: { message: "独自の視点を持つあなたへ。思考を研ぎ澄ます重厚なインストゥルメンタルを。", title: "Symphony of Logic", artist: "Architects of Sound" },
    INTP: { message: "知的好奇心が旺盛なあなたへ。複雑で美しい電子音楽の世界へようこそ。", title: "Quantum Variables", artist: "The Thinkers" },
    ENTJ: { message: "目標に向かって突き推むあなたへ。モチベーションを高める力強いビートを。", title: "Conquer the Day", artist: "Leader's Anthem" },
    ENTP: { message: "新しいアイデアを愛するあなたへ。ジャンルの枠に囚われない独創的な一曲を。", title: "Creative Chaos", artist: "Brainstormers" },

    // --- 外交官 ---
    INFJ: { message: "深い洞察力と理想を持つあなたへ。心に静かに響くアコースティックな響きを。", title: "Echoes of Ideals", artist: "Quiet Vision" },
    INFP: { message: "豊かな想像力を持つあなたへ。まるで映画のワンシーンのようなファンタジーな楽曲を。", title: "Dreams in the Wind", artist: "Soul Searchers" },
    ENFJ: { message: "人々を導く情熱的なあなたへ。ポジティブなエネルギーに満ちたアンセムを。", title: "Guiding Light", artist: "The Protagonists" },
    ENFP: { message: "自由奔放で好奇心に溢れるあなたへ。思わず踊り出したくなるようなポップスを。", title: "Sparkle & Shine", artist: "Free Spirits" },

    // --- 番人 ---
    ISTJ: { message: "誠実で責任感の強いあなたへ。秩序と調和を感じられるクラシックを。", title: "Structured Harmony", artist: "Classic Foundations" },
    ISFJ: { message: "温かく思いやりのあるあなたへ。心を優しく包み込むようなバラードを。", title: "Gentle Embrace", artist: "Heartfelt Melodies" },
    ESTJ: { message: "伝統と秩序を重んじるあなたへ。堂々とした王道のロックサウンドを。", title: "March of Progress", artist: "The Executives" },
    ESFJ: { message: "周囲を明るく照らすあなたへ。みんなで一緒に歌いたくなるようなハッピーな曲を。", title: "Gather Around", artist: "Social Butterflies" },

    // --- 探検家 ---
    ISTP: { message: "冷静でマイペースなあなたへ。無駄のないクールなオルタナティヴ・ロックを。", title: "Urban Toolkit", artist: "The Crafters" },
    ISFP: { message: "今この瞬間を美しく生きるあなたへ。五感を刺激する芸術的なインディーサウンドを。", title: "Canvas of Sound", artist: "Artistic Souls" },
    ESTP: { message: "スリルと行動を愛するあなたへ。疾走感あふれるエネルギッシュなダンスチューンを。", title: "Adrenaline Rush", artist: "Action Takers" },
    ESFP: { message: "人生を楽しむエンターテイナーなあなたへ。パーティーを盛り上げる最高のクラブミュージックを。", title: "Spotlight Dance", artist: "Party Starters" }
};

// ボタンが押されたときに実行される関数
function suggestSong(mbtiType) {
    const songData = songDatabase[mbtiType];
    
    if (songData) {
        document.getElementById('emotion-message').innerText = songData.message;
        document.getElementById('song-title').innerText = songData.title;
        document.getElementById('artist-name').innerText = songData.artist;
        document.getElementById('result-section').style.display = 'block';
    }
}

// ▼▼ 既存のコードの下にこれを追加 ▼▼

async function analyzeFeeling() {
    const text = document.getElementById('user-feeling').value;
    
    if (!text) {
        alert("今の気持ちを入力してください！");
        return;
    }

    // 分析中の表示にする
    document.getElementById('emotion-message').innerText = "🤖 AIがあなたの感情を分析中...";
    document.getElementById('song-title').innerText = "";
    document.getElementById('artist-name').innerText = "";
    document.getElementById('result-section').style.display = 'block';

    try {
        // Pythonサーバー(ローカル)へデータを送る
        const response = await fetch('https://feelingmusicapp.onrender.com/analyze-emotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        // サーバーから結果を受け取る
        const data = await response.json();

        if (data.error) {
            document.getElementById('emotion-message').innerText = data.error;
        } else {
            document.getElementById('emotion-message').innerText = `【${data.mbti}らしさを持つあなたへ】\n${data.message}`;
            document.getElementById('song-title').innerText = data.song_title;
            document.getElementById('artist-name').innerText = data.artist;
            
            // プレイヤーと画像の設定
            const audioPlayer = document.getElementById('audio-player');
            const albumArt = document.getElementById('album-art');
            const musicError = document.getElementById('music-error');
            
            if (data.preview_url) {
                // 音声データがあれば表示してセット
                audioPlayer.src = data.preview_url;
                audioPlayer.style.display = 'block';
                musicError.style.display = 'none';
                
                // 画像データがあれば表示
                if (data.artwork_url) {
                    albumArt.src = data.artwork_url;
                    albumArt.style.display = 'block';
                }
            } else {
                // 見つからなかった場合
                audioPlayer.style.display = 'none';
                albumArt.style.display = 'none';
                audioPlayer.src = "";
                musicError.style.display = 'block';
            }
        }
    } catch (error) {
        document.getElementById('emotion-message').innerText = "通信エラー：バックエンド（Python）が起動していない可能性があります。";
    }
}