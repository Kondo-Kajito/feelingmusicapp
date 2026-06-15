async function analyzeFeeling() {
    const inputElement = document.getElementById('feeling-input');
    const text = inputElement.value;
    const buttonElement = document.getElementById('submit-button');

    // 入力が空っぽの時のブロック
    if (!text) {
        alert("気持ちを入力してください！");
        return;
    }

    // ボタンを「考え中...」にして連打を防ぐ
    buttonElement.innerText = "AIが考え中...";
    buttonElement.disabled = true;

    try {
        // RenderのURLに通信してAIに相談する
        const response = await fetch('https://feelingmusicapp.onrender.com/analyze-emotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        const data = await response.json();

        // 隠していた結果エリアを表示する
        document.getElementById('result-section').style.display = 'block';

        if (data.error) {
            document.getElementById('emotion-message').innerText = data.error;
        } else {
            // メッセージと曲名・アーティスト名を画面にセット
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
                } else {
                    albumArt.style.display = 'none';
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
        console.error("エラー:", error);
        alert("通信エラーが発生しました。Renderの無料サーバーがスリープから復帰中かもしれないので、数十秒待ってからもう一度試してみてください。");
    } finally {
        // ボタンの文字と機能を元に戻す
        buttonElement.innerText = "AIに相談する";
        buttonElement.disabled = false;
    }
}