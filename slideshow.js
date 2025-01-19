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
    images = Array.from(files).filter(file => 
        file.type.startsWith('image/')
    );
    
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

function startSlideshow() {
    const container = document.getElementById('slideshow');
    container.innerHTML = '';
    imageHistory = []; // 履歴をクリア
    
    // 最初の画像を表示
    showImage(currentIndex);
    
    // 既存のインターバルをクリア
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
    }
    
    // 新しいタイマーを設定
    slideshowInterval = setInterval(() => {
        showNextImage(); // showNextImageを使用
    }, 10000);
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
    container.appendChild(img);
    
    setTimeout(() => {
        img.classList.add('active');
    }, 50);
}

function toggleFullScreen() {
    const controls = document.getElementById('controls');
    
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            requestWakeLock();
            controls.style.display = 'none'; // フルスクリーン時に非表示
            addMouseMoveHandler(); // マウス移動検知の開始
        }).catch(err => {
            console.log(`フルスクリーンモードのエラー: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            releaseWakeLock();
            controls.style.display = 'block'; // 通常表示時に表示
            removeMouseMoveHandler(); // マウス移動検知の終了
        }
    }
}

function handleMouseMove() {
    const controls = document.getElementById('controls');
    controls.style.display = 'block';
    
    // 既存のタイマーをクリア
    clearTimeout(mouseTimer);
    
    // 2秒後に非表示
    mouseTimer = setTimeout(() => {
        if (document.fullscreenElement) {
            controls.style.display = 'none';
        }
    }, 2000);
}

function addMouseMoveHandler() {
    document.addEventListener('mousemove', handleMouseMove);
}

function removeMouseMoveHandler() {
    document.removeEventListener('mousemove', handleMouseMove);
    clearTimeout(mouseTimer);
}

// フルスクリーン解除時のイベントリスナーを追加
document.addEventListener('fullscreenchange', () => {
    const controls = document.getElementById('controls');
    if (!document.fullscreenElement) {
        controls.style.display = 'block';
        removeMouseMoveHandler();
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
    imageHistory = []; // 履歴もクリア
    
    // スライドショーのコンテナをクリア
    const container = document.getElementById('slideshow');
    container.innerHTML = '';
    
    // Wake Lockを解除
    releaseWakeLock();
}

// 次の画像を表示する関数を追加
function showNextImage() {
    if (images.length > 0) {
        // 現在のインデックスを履歴に追加
        if (!imageHistory.includes(currentIndex)) {
            if (imageHistory.length >= MAX_HISTORY) {
                imageHistory.shift();
            }
            imageHistory.push(currentIndex);
        }
        
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
        
        // インターバルをリセット
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = setInterval(() => {
                showNextImage();
            }, 10000);
        }
    }
}

// 前の画像を表示する関数を追加
function showPreviousImage() {
    if (images.length > 0 && imageHistory.length > 0) {
        // 履歴から前のインデックスを取得
        currentIndex = imageHistory.pop();
        showImage(currentIndex);
        
        // インターバルをリセット
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = setInterval(() => {
                showNextImage();
            }, 10000);
        }
    }
} 