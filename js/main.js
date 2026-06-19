document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const cardWrap  = document.getElementById('cardWrap');
  const toggleBtn = document.getElementById('toggleBtn');
  const curvePath = document.getElementById('curvePath');
  const cards     = Array.from(cardWrap.querySelectorAll('.card'));

  // SVG パスの総延長を取得して初期化
  let totalLength = 0;
  if (curvePath) {
    totalLength = curvePath.getTotalLength();
    curvePath.style.strokeDasharray  = totalLength;
    curvePath.style.strokeDashoffset = totalLength;
  }

  // スクロール進捗を 0〜1 で計算
  function getScrollProgress() {
    const section = cardWrap.closest('.characters-section');
    if (!section) return 0;
    const rect  = section.getBoundingClientRect();
    const viewH = window.innerHeight;
    
    const start = viewH - 250; // 見出しが見えて少しスクロールしたら開始
    
    // 【決定版スピード調整】
    // セクション高さを2.0倍の長さとして引き延ばして計算することで、
    // スクロールに対して線の伸びるスピードを「半分（0.5倍のゆったりさ）」に調整します。
    const end   = -(rect.height * 2.0) + viewH; 
    
    return Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
  }

  // SVG 曲線をスクロールに合わせてシンクロ描画
  function updateCurve() {
    if (document.body.classList.contains('is-grid') || !curvePath) return;
    
    const progress = getScrollProgress();
    
    // progress(0.0〜1.0) に連動して、線のダッシュオフセットを削っていく
    curvePath.style.strokeDashoffset = totalLength * (1 - progress);

    // 各カードが線に触れたタイミングで浮かび上がらせる計算
    cards.forEach((card, index) => {
      // 0.0〜1.0 の進捗の間にすべてのカードが等間隔で確実に出現する計算式
      const triggerThreshold = (index / (cards.length - 1)) * 0.48; 

      if (progress >= triggerThreshold) {
        card.classList.add('fadein');
      } else {
        // 上にスクロールで戻したときにカードを隠したい場合は下のコメントアウトを外してください
        // card.classList.remove('fadein');
      }
    });
  }

  // スクロールイベント（requestAnimationFrameでパフォーマンス最適化）
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateCurve();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // 初回実行を少し遅らせて要素のレンダリング確定後に確実に初期化
  setTimeout(() => {
    updateCurve();
  }, 50);

  // グリッド / 曲線 レイアウトの切り替え
  toggleBtn.addEventListener('click', () => {
    const isGrid = document.body.classList.toggle('is-grid');
    cardWrap.classList.toggle('card-grid', isGrid);

    if (isGrid) {
      cards.forEach(c => c.classList.add('fadein'));
    } else {
      updateCurve();
    }
  });

  // ウィンドウリサイズ時の再計算
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (curvePath) {
        totalLength = curvePath.getTotalLength();
        curvePath.style.strokeDasharray  = totalLength;
        updateCurve();
      }
    }, 100);
  });

  // ===== ローディングアニメーション =====
  const loadingVeil = document.getElementById('loadingVeil');
  const loadingText = document.querySelector('.loading-text');

  if (loadingVeil && loadingText) {
    loadingText.style.opacity = '0';

    setTimeout(() => {
      loadingVeil.classList.add('is-blurring');
      loadingText.classList.add('is-playing');
    }, 300);

    setTimeout(() => {
      loadingVeil.classList.add('is-lifted');
    }, 1800);
  }

  // ===== STORY SECTION: めくれるカード制御 =====
  const storyTabs = document.querySelectorAll('.story-tab');
  const storyCards = document.querySelectorAll('.story-card');
  const storyContainer = document.querySelector('.story-scroll-container');
  
  let isClickTransition = false; 

  function changeStoryPage(targetIndex) {
    storyTabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === targetIndex);
    });

    storyCards.forEach((card, i) => {
      if (i < targetIndex) {
        card.classList.remove('active');
        card.classList.add('passed'); 
      } else if (i === targetIndex) {
        card.classList.add('active');  
        card.classList.remove('passed');
      } else {
        card.classList.remove('active', 'passed'); 
      }
    });
  }

  // 1. スクロールに連動させる処理（完全ホールド対応・均等めくり修正版）
  window.addEventListener('scroll', () => {
    if (isClickTransition || !storyContainer) return;

    const rect = storyContainer.getBoundingClientRect();
    const currentScroll = -rect.top;
    const totalScrollRange = rect.height - window.innerHeight;

    if (currentScroll < 0) {
      changeStoryPage(0);
      return;
    }

    const effectiveRange = totalScrollRange * 0.75;
    const progress = Math.min(1, Math.max(0, currentScroll / effectiveRange));

    if (progress >= 0 && progress <= 1) {
      let activeIndex = Math.floor(progress * storyCards.length);
      if (activeIndex >= storyCards.length) activeIndex = storyCards.length - 1;
      changeStoryPage(activeIndex);
    }
  }, { passive: true });

  // 2. ボタンクリックに連動させる処理
  storyTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetIndex = parseInt(e.currentTarget.getAttribute('data-index'));
      
      isClickTransition = true; 
      changeStoryPage(targetIndex);

      if (storyContainer) {
        const containerTop = storyContainer.offsetTop;
        const totalScrollRange = storyContainer.offsetHeight - window.innerHeight;
        
        const effectiveRange = totalScrollRange * 0.75;
        const scrollTarget = containerTop + (effectiveRange * (targetIndex / (storyCards.length - 1)));

        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });

        setTimeout(() => { isClickTransition = false; }, 800);
      }
    });
  });

  // ===== CHARACTERS SECTION: モーダルウィンドウ制御 =====
  const godData = {
    0: {
      nameJa: "ゼウス",
      power: "空",
      symbol: "雷・鷲",
      desc: "兄弟を父親の腹から助け出したことで最高神となった。<br>ヘラの夫だが、様々な女性に一目ぼれをして関係を持つため、相手やその子供へヘラからの嫌がらせを受けている。",
      bgClass: "bg-zeus",
      
      // 💡【ここを修正しました！】画像ファイル名を実際の .png に合わせました
      thumb1: "image/zeus-syumatu.png", 
      link1: "https://ragnarok-official.com/", 
      quote1: "引用：アニメ『終末のワルキューレ』公式サイト",
      
      thumb2: "image/zeus-pazdra.png", 
      link2: "https://pad.gungho.jp/", 
      quote2: "引用：『パズル＆ドラゴンズ』公式サイト"
    },
    1: {
      nameJa: "ポセイドン",
      power: "海・地震・馬",
      symbol: "三叉槍・イルカ",
      desc: "ゼウスに次ぐ強さを誇る海の最高権力者。荒ぶる海の波濤を支配し、ひとたび怒り三叉槍を振るえば大地震を引き起こす豪快な神。",
      bgClass: "",
      thumb1: "", link1: "#", quote1: "引用元テキスト",
      thumb2: "", link2: "#", quote2: "引用元テキスト"
    },
    2: {
      nameJa: "ハデス",
      power: "冥府・地下世界の富",
      symbol: "バイデント・ケルベロス",
      desc: "死者の国である冥府を統べる王。冷徹で厳格な裁判官としての側面を持ち、一度引き受けた死者の魂は決して地上へ逃がさない。",
      bgClass: "",
      thumb1: "", link1: "#", quote1: "引用元テキスト",
      thumb2: "", link2: "#", quote2: "引用元テキスト"
    },
    3: {
      nameJa: "ヘラ",
      power: "結婚・母性・貞節",
      symbol: "王笏・クジャク",
      desc: "オリンポスの女王であり最高位の女神。浮気を繰り返す夫ゼウスに対する凄まじい復讐劇と、神聖なる結婚を守るプライドを持つ。",
      bgClass: "",
      thumb1: "", link1: "#", quote1: "引用元テキスト",
      thumb2: "", link2: "#", quote2: "引用元テキスト"
    },
    4: {
      nameJa: "デメテル",
      power: "豊穣·大地·穀物",
      symbol: "麦の穂·角の器",
      desc: "大地に実りをもたらす穀物の女神。愛娘ペルセポネが冥府に連れ去られた際の深い悲しみによって、地上に「冬」が生まれたとされる。",
      bgClass: "",
      thumb1: "", link1: "#", quote1: "引用元テキスト",
      thumb2: "", link2: "#", quote2: "引用元テキスト"
    },
    5: {
      nameJa: "ヘスティア",
      power: "炉の神・家庭の秩序",
      symbol: "聖火のトーチ",
      desc: "オリンポス第一位の女神でありながら、常に中央の炉の火を守り続ける守護神。家庭の平穏と国家の結束を象徴する。",
      bgClass: "",
      thumb1: "", link1: "#", quote1: "引用元テキスト",
      thumb2: "", link2: "#", quote2: "引用元テキスト"
    }
  };

  const modal = document.getElementById('charModal');
  const modalBg = document.getElementById('modalBgGraphic');
  const mNameJa = document.getElementById('modalNameJa');
  const mPower = document.getElementById('modalPower');
  const mSymbol = document.getElementById('modalSymbol');
  const mDesc = document.getElementById('modalDesc');

  const mThumb1 = document.getElementById('modalThumb1');
  const mLink1  = document.getElementById('modalLink1');
  const mQuote1 = document.getElementById('modalQuote1');
  const mThumb2 = document.getElementById('modalThumb2');
  const mLink2  = document.getElementById('modalLink2');
  const mQuote2 = document.getElementById('modalQuote2');

  const closeBtn = document.getElementById('modalCloseBtn');
  const closeOverlay = document.getElementById('modalCloseOverlay');

  cards.forEach((card, index) => {
    card.style.cursor = 'pointer';
    
    card.addEventListener('click', () => {
      const data = godData[index];
      if (!data) return;

      mNameJa.textContent = data.nameJa;
      mPower.textContent = data.power;
      mSymbol.textContent = data.symbol;
      mDesc.innerHTML = data.desc;

      if (mThumb1 && mLink1 && mQuote1 && mThumb2 && mLink2 && mQuote2) {
        mThumb1.style.backgroundImage = data.thumb1 ? `url('${data.thumb1}')` : 'none';
        mLink1.setAttribute('href', data.link1 || '#');
        mQuote1.textContent = data.quote1 || '';

        mThumb2.style.backgroundImage = data.thumb2 ? `url('${data.thumb2}')` : 'none';
        mLink2.setAttribute('href', data.link2 || '#');
        mQuote2.textContent = data.quote2 || '';
      }

      modalBg.className = "modal-bg-graphic";
      if (data.bgClass) {
        modalBg.classList.add(data.bgClass);
      }

      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeOverlay) closeOverlay.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

});