async function analyzeFeeling() {
    const inputElement = document.getElementById('feeling-input');
    const text = inputElement.value;
    
    // 追加：ジャンルとアーティストの入力を取得
    const genreElement = document.getElementById('genre-input');
    const genre = genreElement.value;
    const artistElement = document.getElementById('artist-input');
    const favoriteArtist = artistElement.value;

    const buttonElement = document.getElementById('submit-button');

    if (!text) {
        alert("気持ちを入力してください！");
        return;
    }

    buttonElement.innerText = "AIが考え中...";
    buttonElement.disabled = true;

    try {
        const response = await fetch('https://feelingmusicapp.onrender.com/analyze-emotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // bodyの中に genre と favorite_artist を追加してPythonへ送る
            body: JSON.stringify({ 
                text: text,
                genre: genre,
                favorite_artist: favoriteArtist
            })
        });

        const data = await response.json();
        document.getElementById('result-section').style.display = 'block';

        if (data.error) {
            document.getElementById('emotion-message').innerText = data.error;
        } else {
            document.getElementById('emotion-message').innerText = `【${data.mbti}らしさを持つあなたへ】\n${data.message}`;
            document.getElementById('song-title').innerText = data.song_title;
            document.getElementById('artist-name').innerText = data.artist;
            
            const audioPlayer = document.getElementById('audio-player');
            const albumArt = document.getElementById('album-art');
            const musicError = document.getElementById('music-error');
            
            if (data.preview_url) {
                audioPlayer.src = data.preview_url;
                audioPlayer.style.display = 'block';
                musicError.style.display = 'none';
                
                if (data.artwork_url) {
                    albumArt.src = data.artwork_url;
                    albumArt.style.display = 'block';
                } else {
                    albumArt.style.display = 'none';
                }
            } else {
                audioPlayer.style.display = 'none';
                albumArt.style.display = 'none';
                audioPlayer.src = "";
                musicError.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("エラー:", error);
        alert("通信エラーが発生しました。Renderがスリープから復帰中かもしれないので、少し待ってからもう一度試してみてください。");
    } finally {
        buttonElement.innerText = "AIに相談する";
        buttonElement.disabled = false;
    }
}