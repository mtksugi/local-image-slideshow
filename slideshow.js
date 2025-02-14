let images = [];
let currentIndex = 0;
let wakeLock = null;
let mouseTimer;
let slideshowInterval;
let imageHistory = [];
const MAX_HISTORY = 5; // 最大履歴数

// Wake Lockを取得する関数
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock が有効になりました');
        
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock が解除されました');
        });
    } catch (err) {
        console.log(`Wake Lock エラー: ${err.message}`);
    }
}

// Wake Lockを解除する関数
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

document.getElementById('folder').addEventListener('change', function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    images = Array.from(files).filter(file => 
        file.type.startsWith('image/')
    );
    
    if (images.length === 0) return;
    
    // 配列をシャッフル
    for (let i = images.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [images[i], images[j]] = [images[j], images[i]];
    }
    
    if (images.length > 0) {
        startSlideshow();
        // スライドショー開始時にWake Lockを取得
        requestWakeLock();
    }
});

// TIMER_INTERVALを削除し、代わりに関数で取得
function getInterval() {
    const select = document.getElementById('interval-select');
    return parseInt(select.value);
}

// startSlideshow関数を修正
function startSlideshow() {
    const container = document.getElementById('slideshow');
    container.innerHTML = '';
    imageHistory = []; // 履歴をクリア
    currentIndex = 0;  // インデックスをリセット
    
    showImage(currentIndex);
    
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
    }
    
    slideshowInterval = setInterval(() => {
        showNextImage();
    }, getInterval());
}

function showImage(index) {
    const container = document.getElementById('slideshow');
    const oldImage = container.querySelector('.slide.active');
    
    if (oldImage) {
        oldImage.classList.remove('active');
        setTimeout(() => {
            oldImage.remove();
        }, 1000);
    }
    
    const img = document.createElement('img');
    img.classList.add('slide');
    img.src = URL.createObjectURL(images[index]);
    img.onload = () => {
        URL.revokeObjectURL(img.src);
      };
    container.appendChild(img);
    
    setTimeout(() => {
        img.classList.add('active');
    }, 50);
}

// 画面スリープ防止: Wake Lockの取得／解除用関数等は既存のものを利用

// --- 新しく追加する共通のインタラクション処理 ---
// マウス・タッチのいずれかの操作でcontrolsを一時表示し、一定時間後に非表示にする処理
function handleInteraction() {
    const controls = document.getElementById('controls');
    controls.style.display = 'block';
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => {
        if (document.fullscreenElement) {
            controls.style.display = 'none';
        }
    }, 2000);
}

function addInteractionHandler() {
    document.addEventListener('mousemove', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
}

function removeInteractionHandler() {
    document.removeEventListener('mousemove', handleInteraction);
    document.removeEventListener('touchstart', handleInteraction);
}

// --- toggleFullScreen関数の修正 ---
function toggleFullScreen() {
    const controls = document.getElementById('controls');
    
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            requestWakeLock();
            controls.style.display = 'none'; // フルスクリーン時にコントロール非表示
            addInteractionHandler(); // マウスとタッチの操作を検知
        }).catch(err => {
            console.log(`フルスクリーンモードのエラー: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            releaseWakeLock();
            controls.style.display = 'block'; // 通常時は表示
            removeInteractionHandler();
        }
    }
}

// フルスクリーン解除時のイベントリスナーを追加
document.addEventListener('fullscreenchange', () => {
    const controls = document.getElementById('controls');
    if (!document.fullscreenElement) {
        controls.style.display = 'block';
        removeInteractionHandler();
    }
});

// キーボードショートカットの追加
document.addEventListener('keydown', function(e) {
    if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
    } else if (e.key === 'ArrowRight') {
        // 右矢印キーで次の画像
        showNextImage();
    } else if (e.key === 'ArrowLeft') {
        // 左矢印キーで前の画像
        showPreviousImage();
    } else if (e.key === 'Escape' && !document.fullscreenElement) {
        // ESCキーでスライドショー停止
        stopSlideshow();
    }
});

// ページを閉じる時やタブを切り替える時にWake Lockを解除
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        releaseWakeLock();
    } else {
        requestWakeLock();
    }
});

// スライドショーを停止する関数を追加
function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    
    // 画像の破棄
    images.forEach(image => {
        URL.revokeObjectURL(image);
    });
    images = [];
    imageHistory = []; // 履歴をクリア
    currentIndex = 0;  // インデックスをリセット
    
    // スライドショーのコンテナをクリア
    const container = document.getElementById('slideshow');
    container.innerHTML = '';
    
    // input要素をリセット
    const folderInput = document.getElementById('folder');
    folderInput.value = '';
    
    // Wake Lockを解除
    releaseWakeLock();
}

// showNextImage関数を修正
function showNextImage() {
    if (images.length > 0) {
        if (!imageHistory.includes(currentIndex)) {
            if (imageHistory.length >= MAX_HISTORY) {
                imageHistory.shift();
            }
            imageHistory.push(currentIndex);
        }
        
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
        
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = setInterval(() => {
                showNextImage();
            }, getInterval());
        }
    }
}

// showPreviousImage関数を修正
function showPreviousImage() {
    if (images.length > 0 && imageHistory.length > 0) {
        currentIndex = imageHistory.pop();
        showImage(currentIndex);
        
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = setInterval(() => {
                showNextImage();
            }, getInterval());
        }
    }
}

// インターバル変更時のイベントリスナーを追加
document.getElementById('interval-select').addEventListener('change', function() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = setInterval(() => {
            showNextImage();
        }, getInterval());
    }
}); 