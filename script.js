let favoriteSongs = [];
let playlists = []; 
let currentPlayingData = null; 

let currentQueue = [];
let currentQueueIndex = 0;

let selectedSongForModal = null;
let currentSelectedIcon = '💿';

async function analyzeFeeling() {
    const feelingInput = document.getElementById('feeling-input');
    const feelingText = feelingInput.value.trim();
    const genreText = document.getElementById('genre-input') ? document.getElementById('genre-input').value : "";
    const artistText = document.getElementById('artist-input') ? document.getElementById('artist-input').value : "";

    if (!feelingText) {
        alert("今の気持ちを入力してください！");
        return;
    }

    const chatArea = document.getElementById('chat-area');
    const mainContent = document.querySelector('.main-content');

    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'message user-message';
    userMsgDiv.innerText = feelingText;
    chatArea.appendChild(userMsgDiv);

    feelingInput.value = '';

    if (mainContent) {
        mainContent.scrollTo({ top: mainContent.scrollHeight, behavior: 'smooth' });
    }

    // 世代・ジャンルの取得（複数）
    const selectedEras = [];
    document.querySelectorAll('.grid-4 .pref-btn.active').forEach(btn => {
        // 天候グループのボタンは除外する
        if(!btn.closest('.weather-grid')) {
            selectedEras.push(btn.innerText.split('\n')[0].trim());
        }
    });

    const selectedGenres = [];
    document.querySelectorAll('.grid-3 .pref-btn.active').forEach(btn => {
        const lines = btn.innerText.split('\n').map(l => l.trim()).filter(l => l !== '');
        if (lines.length >= 2) {
            selectedGenres.push(lines[1]);
        } else {
            const textArray = btn.innerText.trim().split(/\s+/);
            const genreName = textArray[textArray.length - 1];
            if (genreName) selectedGenres.push(genreName);
        }
    });

    // 💡 NEW：天候とシチュエーションの取得（単一）
    const activeWeatherBtn = document.querySelector('.weather-grid .pref-btn.active');
    const activeSituationBtn = document.querySelector('.situation-grid .pref-btn.active');
    const weatherValue = activeWeatherBtn ? activeWeatherBtn.innerText.trim() : "";
    const situationValue = activeSituationBtn ? activeSituationBtn.innerText.trim() : "";

    try {
        // 💡 バックエンドのAIに天候とシチュエーションのデータも一緒にパス！
        const response = await fetch("http://127.0.0.1:8000/analyze-emotion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: feelingText,
                genre: genreText,
                favorite_artist: artistText,
                genres: selectedGenres,
                eras: selectedEras,
                weather: weatherValue,      // ☀️ 追加データ
                situation: situationValue   // 🚗 追加データ
            })
        });

        const data = await response.json();

        const botMsgDiv = document.createElement('div');
        botMsgDiv.className = 'message bot-message';
        botMsgDiv.innerText = data.message;
        chatArea.appendChild(botMsgDiv);

        if (data.songs && data.songs.length > 0) {
            const songListContainer = document.createElement('div');
            songListContainer.className = 'song-list-container';

            data.songs.forEach(song => {
                const songItemDiv = document.createElement('div');
                songItemDiv.className = 'song-item';
                
                songItemDiv.dataset.title = song.song_title;
                songItemDiv.dataset.artist = song.artist;
                songItemDiv.dataset.art = song.artwork_url || '';
                songItemDiv.dataset.preview = song.preview_url || '';
                songItemDiv.setAttribute('onclick', 'selectSong(this)');
                
                const isAlreadyFav = favoriteSongs.some(s => s.title === song.song_title && s.artist === song.artist);
                const heartClass = isAlreadyFav ? 'icon-btn active' : 'icon-btn';

                if (currentPlayingData && currentPlayingData.title === song.song_title && currentPlayingData.artist === song.artist) {
                    songItemDiv.classList.add('playing');
                }

                const ms = song.duration_ms || 0;
                const totalSeconds = Math.floor(ms / 1000);
                const durationStr = `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;

                let albumArtHtml = song.artwork_url 
                    ? `<div class="song-img-wrapper"><img src="${song.artwork_url}" class="song-img" alt="Album Art"></div>`
                    : '<div class="song-img-placeholder">🎵</div>';

                songItemDiv.innerHTML = `
                    ${albumArtHtml}
                    <div class="song-info">
                        <div class="song-title">${song.song_title}</div>
                        <div class="song-artist">${song.artist}</div>
                    </div>
                    <div class="song-meta">
                        <span class="song-duration">${durationStr}</span>
                        <button class="${heartClass}" onclick="toggleFavorite(event, this)">
                            <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                        </button>
                        <button class="icon-btn" onclick="openPlaylistModal(event, this)">
                            <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/></svg>
                        </button>
                    </div>
                `;
                songListContainer.appendChild(songItemDiv);
            });
            chatArea.appendChild(songListContainer);
        }

        setTimeout(() => {
            if (mainContent) mainContent.scrollTo({ top: mainContent.scrollHeight, behavior: 'smooth' });
        }, 100);

    } catch (error) {
        console.error("エラー:", error);
        alert("サーバーと通信できませんでした。");
    }
}

// 💡 NEW：天候やシチュエーションなど「グループ内で1つだけ選択」させるトグル関数
function toggleSinglePref(button, groupClass) {
    const isActive = button.classList.contains('active');
    // 同じグループ内のボタンのactiveを一度全部消す
    document.querySelectorAll(`.${groupClass} .pref-btn`).forEach(btn => btn.classList.remove('active'));
    // クリックされたボタンがもともと未選択だったならアクティブにする（選択解除も可能）
    if (!isActive) {
        button.classList.add('active');
    }
}

// === お気に入り関連 ===
function toggleFavorite(event, button) {
    event.stopPropagation();
    
    const songItem = button.closest('.song-item');
    const songData = {
        title: songItem.dataset.title,
        artist: songItem.dataset.artist,
        art: songItem.dataset.art,
        preview: songItem.dataset.preview,
        durationStr: songItem.querySelector('.song-duration').innerText
    };

    const index = favoriteSongs.findIndex(s => s.title === songData.title && s.artist === songData.artist);

    if (index === -1) {
        favoriteSongs.push(songData);
    } else {
        favoriteSongs.splice(index, 1);
    }

    syncFavoriteButtons(songData.title, songData.artist);
    renderLibrary();
}

function syncFavoriteButtons(title, artist) {
    const isFav = favoriteSongs.some(s => s.title === title && s.artist === artist);
    document.querySelectorAll('.song-item').forEach(item => {
        if (item.dataset.title === title && item.dataset.artist === artist) {
            const heartBtn = item.querySelectorAll('.icon-btn')[0];
            if (heartBtn) {
                isFav ? heartBtn.classList.add('active') : heartBtn.classList.remove('active');
            }
        }
    });
}

function renderLibrary() {
    const libraryList = document.getElementById('library-list');
    if (!libraryList) return;

    if (favoriteSongs.length === 0) {
        libraryList.innerHTML = '<p style="color: #56526d; font-size: 14px; text-align: center; margin-top: 10px;">まだお気に入りの曲がありません</p>';
        return;
    }

    libraryList.innerHTML = '';
    
    favoriteSongs.forEach(song => {
        const songItemDiv = document.createElement('div');
        songItemDiv.className = 'song-item';
        
        if (currentPlayingData && currentPlayingData.title === song.title && currentPlayingData.artist === song.artist) {
            songItemDiv.classList.add('playing');
        }

        songItemDiv.dataset.title = song.title;
        songItemDiv.dataset.artist = song.artist;
        songItemDiv.dataset.art = song.art;
        songItemDiv.dataset.preview = song.preview;
        songItemDiv.setAttribute('onclick', 'selectSong(this)');

        let albumArtHtml = song.art 
            ? `<div class="song-img-wrapper"><img src="${song.art}" class="song-img" alt="Album Art"></div>`
            : '<div class="song-img-placeholder">🎵</div>';

        songItemDiv.innerHTML = `
            ${albumArtHtml}
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-meta">
                <span class="song-duration">${song.durationStr}</span>
                <button class="icon-btn active" onclick="toggleFavorite(event, this)">
                    <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                </button>
                <button class="icon-btn" onclick="openPlaylistModal(event, this)">
                    <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/></svg>
                </button>
            </div>
        `;
        libraryList.appendChild(songItemDiv);
    });
}

// === モーダル & アイコンの制御 ===
function selectPlaylistIcon(button, icon) {
    document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentSelectedIcon = icon;
}

function openPlaylistModal(event, button) {
    event.stopPropagation();
    
    const songItem = button.closest('.song-item');
    selectedSongForModal = {
        title: songItem.dataset.title,
        artist: songItem.dataset.artist,
        art: songItem.dataset.art,
        preview: songItem.dataset.preview,
        durationStr: songItem.querySelector('.song-duration') ? songItem.querySelector('.song-duration').innerText : "0:00"
    };

    document.getElementById('modal-song-info').innerText = `${selectedSongForModal.title} - ${selectedSongForModal.artist}`;
    document.getElementById('new-playlist-name').value = ''; 
    
    currentSelectedIcon = '💿';
    document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
    const firstIcon = document.querySelector('.icon-option');
    if (firstIcon) firstIcon.classList.add('active');

    const existingSection = document.getElementById('existing-playlists-section');
    const modalPlaylistList = document.getElementById('modal-playlist-list');
    
    if (playlists.length > 0) {
        existingSection.style.display = 'block';
        modalPlaylistList.innerHTML = '';
        playlists.forEach(playlist => {
            const btn = document.createElement('button');
            btn.className = 'modal-playlist-item-btn';
            btn.innerText = `${playlist.icon || '💿'} ${playlist.name} (${playlist.songs.length}曲)`;
            btn.onclick = () => addToExistingPlaylist(playlist.id);
            modalPlaylistList.appendChild(btn);
        });
    } else {
        existingSection.style.display = 'none';
    }

    document.getElementById('playlist-modal').classList.add('show');
}

function closePlaylistModal() {
    document.getElementById('playlist-modal').classList.remove('show');
    selectedSongForModal = null;
}

function createNewPlaylistAndAdd() {
    const input = document.getElementById('new-playlist-name');
    const name = input.value.trim();
    if (!name) {
        alert('プレイリストの名前を記入してください！');
        return;
    }

    const newPlaylist = {
        id: Date.now(),
        name: name,
        icon: currentSelectedIcon, 
        songs: [selectedSongForModal]
    };

    playlists.push(newPlaylist);
    closePlaylistModal();
    renderPlaylists();
}

function addToExistingPlaylist(playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    playlist.songs.push(selectedSongForModal);
    closePlaylistModal();
    renderPlaylists();
}

function saveAsPlaylist() {
    if (favoriteSongs.length === 0) {
        alert("お気に入りの曲がありません。まずは曲をハートでストックしてください！");
        return;
    }
    const playlistName = prompt("プレイリストの名前を入力してください", "お気に入りまとめ");
    if (!playlistName) return;

    const newPlaylist = {
        id: Date.now(),
        name: playlistName,
        icon: '💖', 
        songs: JSON.parse(JSON.stringify(favoriteSongs))
    };
    playlists.push(newPlaylist);
    renderPlaylists();
}

function renderPlaylists() {
    const container = document.getElementById('playlist-container');
    if (!container) return;

    if (playlists.length === 0) {
        container.innerHTML = '<p style="color: #56526d; font-size: 14px; text-align: center; margin-top: 10px;">プレイリストはまだありません</p>';
        return;
    }

    container.innerHTML = '';
    playlists.forEach(playlist => {
        const item = document.createElement('div');
        item.className = 'song-item';
        item.onclick = () => playPlaylist(playlist.id);

        item.innerHTML = `
            <div class="playlist-icon">${playlist.icon || '💿'}</div>
            <div class="song-info">
                <div class="song-title">${playlist.name}</div>
                <div class="song-artist">${playlist.songs.length}曲収録</div>
            </div>
            <button class="icon-btn active" onclick="playPlaylist(${playlist.id}); event.stopPropagation();">
                <svg class="icon-svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
            </button>
        `;
        container.appendChild(item);
    });
}

// === 再生コアエンジン ===
function selectSong(element) {
    const preview = element.dataset.preview;
    if (!preview) {
        alert("この曲は試聴データがありません💦");
        return;
    }
    currentQueue = [{
        title: element.dataset.title,
        artist: element.dataset.artist,
        art: element.dataset.art,
        preview: preview
    }];
    currentQueueIndex = 0;
    playSongData(currentQueue[0]);
}

function playPlaylist(id) {
    const playlist = playlists.find(p => p.id === id);
    if (!playlist || playlist.songs.length === 0) return;
    
    currentQueue = playlist.songs;
    currentQueueIndex = 0;
    playSongData(currentQueue[currentQueueIndex]);
}

function playSongData(song) {
    currentPlayingData = { title: song.title, artist: song.artist };
    syncPlayingStatus(song.title, song.artist);
    
    document.getElementById('bp-title').innerText = song.title;
    document.getElementById('bp-artist').innerText = song.artist;
    
    const bpArt = document.getElementById('bp-art');
    if (song.art) {
        bpArt.src = song.art;
        bpArt.style.display = 'block';
    } else {
        bpArt.style.display = 'none';
    }

    const audio = document.getElementById('bottom-audio');
    audio.src = song.preview;
    audio.play()
        .then(() => updatePlayIcon(true))
        .catch(err => console.log("再生に失敗しました:", err));

    document.getElementById('bottom-player').classList.add('show');
}

function syncPlayingStatus(title, artist) {
    document.querySelectorAll('.song-item').forEach(item => {
        if (item.dataset.title === title && item.dataset.artist === artist) {
            item.classList.add('playing');
        } else {
            item.classList.remove('playing');
        }
    });
}

function toggleBottomPlay() {
    const audio = document.getElementById('bottom-audio');
    if (audio.paused) {
        audio.play().then(() => updatePlayIcon(true));
    } else {
        audio.pause();
        updatePlayIcon(false);
    }
}

function updatePlayIcon(isPlaying) {
    const playIcon = document.getElementById('bp-play-icon');
    if (isPlaying) {
        playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>';
    } else {
        playIcon.innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>';
    }
}

function hideBottomPlayer() {
    const player = document.getElementById('bottom-player');
    const audio = document.getElementById('bottom-audio');
    audio.pause();
    updatePlayIcon(false);
    player.classList.remove('show');
    
    currentPlayingData = null;
    syncPlayingStatus(null, null);
    currentQueue = [];
}

function updateProgress() {
    const audio = document.getElementById('bottom-audio');
    const progressBar = document.getElementById('bp-progress-bar');
    if (audio.duration) {
        progressBar.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
    }
}

function seekAudio(event) {
    const audio = document.getElementById('bottom-audio');
    const rect = event.currentTarget.getBoundingClientRect();
    if (audio.duration) {
        audio.currentTime = ((event.clientX - rect.left) / rect.width) * audio.duration;
    }
}

function onTrackEnded() {
    if (currentQueue && currentQueueIndex < currentQueue.length - 1) {
        currentQueueIndex++;
        playSongData(currentQueue[currentQueueIndex]);
    } else {
        updatePlayIcon(false);
        document.getElementById('bp-progress-bar').style.width = '0%';
        currentPlayingData = null;
        syncPlayingStatus(null, null);
    }
}

function setFeeling(text) {
    document.getElementById('feeling-input').value = text;
}

function switchTab(tabName) {
    const homeView = document.getElementById('home-view');
    const libraryView = document.getElementById('library-view');
    const profileView = document.getElementById('profile-view');
    
    const navHome = document.getElementById('nav-home');
    const navLibrary = document.getElementById('nav-library');
    const navProfile = document.getElementById('nav-profile');

    homeView.style.display = 'none';
    libraryView.style.display = 'none';
    profileView.style.display = 'none';
    
    navHome.classList.remove('active');
    navLibrary.classList.remove('active');
    navProfile.classList.remove('active');

    if (tabName === 'home') {
        homeView.style.display = 'block';
        navHome.classList.add('active');
    } else if (tabName === 'library') {
        libraryView.style.display = 'block';
        navLibrary.classList.add('active');
        renderLibrary();
        renderPlaylists();
    } else if (tabName === 'profile') {
        profileView.style.display = 'block';
        navProfile.classList.add('active');
    }
}

function togglePref(button) {
    button.classList.toggle('active');
}

function saveProfile() {
    alert('現在のシチュエーションと好みを適用しました！この後のチャット送信に反映されます。');
    switchTab('home');
}