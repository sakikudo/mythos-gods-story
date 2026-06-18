/* ===========================
   main.js — Olympians Card UI
=========================== */

(function () {
  'use strict';

  /* ── DOM refs ── */
  const cardWrap  = document.getElementById('cardWrap');
  const toggleBtn = document.getElementById('toggleBtn');
  const curvePath = document.getElementById('curvePath');
  const cards     = Array.from(cardWrap.querySelectorAll('.card'));

  /* ============================
     SVG パスの総延長を取得
  ============================ */
  const totalLength = curvePath.getTotalLength();
  curvePath.style.strokeDasharray  = totalLength;
  curvePath.style.strokeDashoffset = totalLength;

  /* ============================
     スクロール進捗を 0〜1 で返す
     セクション上端が画面下端に来たとき 0、
     セクション下端が画面上端を抜けたとき 1
  ============================ */
  function getScrollProgress() {
    const rect  = cardWrap.parentElement.getBoundingClientRect();
    const viewH = window.innerHeight;
    const start = viewH;
    const end   = -rect.height*0.7;
    return Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
  }

  /* ============================
     SVG 曲線をスクロールに合わせて描画
  ============================ */
  function updateCurve() {
    if (document.body.classList.contains('is-grid')) return;
    curvePath.style.strokeDashoffset = totalLength * (1 - getScrollProgress());
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateCurve();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateCurve(); // 初期描画

  /* ============================
     カードの fadein
     画面下端から 20% の位置に入ったら
     .fadein クラスを付与する
  ============================ */
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fadein');
      }
    });
  }, {
    rootMargin: '0px 0px -20% 0px',
    threshold: 0
  });

  cards.forEach(card => cardObserver.observe(card));

  /* ============================
     グリッド / 曲線 トグル
  ============================ */
  toggleBtn.addEventListener('click', () => {
    const isGrid = document.body.classList.toggle('is-grid');
    cardWrap.classList.toggle('card-grid', isGrid);

    if (isGrid) {
      // グリッドモード：全カードを fadein 済みにしておく
      cards.forEach(c => c.classList.add('fadein'));
    } else {
      // 曲線モードへ戻す
      updateCurve();
    }
  });

  /* ============================
     キーボードフォーカス補助
  ============================ */
  cards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'article');
    card.addEventListener('focus', () => {
      card.classList.add('fadein');
    });
  });

  /* ============================
     リサイズ時に曲線を再描画
  ============================ */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateCurve, 100);
  });

})();
