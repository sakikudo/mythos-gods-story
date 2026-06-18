    document.addEventListener('DOMContentLoaded', () => {
      'use strict';

      const cardWrap  = document.getElementById('cardWrap');
      const toggleBtn = document.getElementById('toggleBtn');
      const curvePath = document.getElementById('curvePath');
      const cards     = Array.from(cardWrap.querySelectorAll('.card'));

      // SVG パスの総延長を取得
      let totalLength = 0;
      if (curvePath) {
        totalLength = curvePath.getTotalLength();
        curvePath.style.strokeDasharray  = totalLength;
        curvePath.style.strokeDashoffset = totalLength;
      }

      // スクロール進捗を 0〜1 で計算
      function getScrollProgress() {
        // 対象をCharactersセクション全体とする
        const section = cardWrap.closest('.characters-section');
        const rect  = section.getBoundingClientRect();
        const viewH = window.innerHeight;
        const start = viewH;
        // セクションが完全に通り過ぎる手前までを1.0とする
        const end   = -rect.height * 0.5; 
        return Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      }

      // SVG 曲線をスクロールに合わせて描画
      function updateCurve() {
        if (document.body.classList.contains('is-grid') || !curvePath) return;
        const progress = getScrollProgress();
        // イージングをかけて滑らかに
        curvePath.style.strokeDashoffset = totalLength * (1 - progress);
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

      updateCurve(); // 初期描画

      // Intersection Observerによるカードのフェードイン
      const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fadein');
            // 一度表示されたら監視を解除する場合（今回はスクロール戻りも考慮し維持）
          }
        });
      }, {
        rootMargin: '0px 0px -15% 0px', // 画面下部から15%入ったところで発火
        threshold: 0
      });

      cards.forEach(card => cardObserver.observe(card));

      // グリッド / 曲線 レイアウトの切り替え
      toggleBtn.addEventListener('click', () => {
        const isGrid = document.body.classList.toggle('is-grid');
        cardWrap.classList.toggle('card-grid', isGrid);

        if (isGrid) {
          // グリッドモード時は全カードを表示状態にする
          cards.forEach(c => c.classList.add('fadein'));
        } else {
          // 曲線モードに戻した際に再度パスを描画
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
    });