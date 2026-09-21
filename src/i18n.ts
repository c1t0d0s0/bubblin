export type Language = 'ja' | 'en';

export function getLanguage(): Language {
  // Check URL query parameter (for explicit override or testing: ?lang=ja or ?lang=en)
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang')?.toLowerCase();
    if (langParam === 'ja' || langParam === 'en') {
      return langParam;
    }
  }

  // Detect browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = (
      navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      ''
    ).toLowerCase();

    if (browserLang.startsWith('ja')) {
      return 'ja';
    }
  }

  // Default to English for all non-Japanese browsers
  return 'en';
}

export const currentLang: Language = getLanguage();

export const translations = {
  docTitle: {
    ja: "Bubblin' - パズルボブル風パズルゲーム",
    en: "Bubblin' - Retro Arcade Bubble Shooter"
  },
  // Audio Controls
  bgmBtnTitle: {
    ja: 'BGM 切替',
    en: 'Toggle BGM'
  },
  seBtnTitle: {
    ja: 'SE 切替',
    en: 'Toggle Sound Effects'
  },
  bgmOn: {
    ja: 'BGM ON',
    en: 'BGM ON'
  },
  bgmOff: {
    ja: 'BGM OFF',
    en: 'BGM OFF'
  },
  seOn: {
    ja: 'SE ON',
    en: 'SE ON'
  },
  seOff: {
    ja: 'SE OFF',
    en: 'SE OFF'
  },
  // Controls panel
  aimLeftAria: {
    ja: '左へ旋回',
    en: 'Aim Left'
  },
  aimRightAria: {
    ja: '右へ旋回',
    en: 'Aim Right'
  },
  leverTitle: {
    ja: '左右にドラッグしてエイム',
    en: 'Drag left/right to aim'
  },
  swapBtnTitle: {
    ja: 'バブルを交代 (↑キー / Wキー)',
    en: 'Swap bubble (Up arrow / W key)'
  },
  swapBtnText: {
    ja: 'SWAP',
    en: 'SWAP'
  },
  launchBtnTitle: {
    ja: 'バブルを発射 (スペースキー)',
    en: 'Launch bubble (Spacebar)'
  },
  launchBtnText: {
    ja: 'LAUNCH (発射)',
    en: 'LAUNCH'
  },
  keyboardTips: {
    ja: 'PC操作: [←/→] または [A/D] で旋回, [SPACE] またはクリックで発射, [↑/W] で交代',
    en: 'PC Controls: [←/→] or [A/D] to steer, [SPACE] or Click to shoot, [↑/W] to swap'
  },
  // Title Modal
  titleSubtitle: {
    ja: 'Bubble Pop Arcade Puzzle',
    en: 'Retro Pop Bubble Shooter'
  },
  instructionsTitle: {
    ja: 'ルール & 操作方法',
    en: 'How to Play & Rules'
  },
  rules: {
    ja: [
      '<strong>照準</strong>: 左右のレバー (PCでは左右キー/マウスドラッグ) で狙いを定める',
      '<strong>発射</strong>: 発射ボタン (PCではスペースキー/クリック) でバブルを射出',
      '<strong>マッチ3</strong>: 同じ色のバブルを3つ以上つなげると爽快ポップ！',
      '<strong>大量落下</strong>: 天井から切り離されたバブルはまとめて落下して高得点！',
      '<strong>天井降下</strong>: 発射を続けると天井が下がります。デッドラインを超えるとゲームオーバー！'
    ],
    en: [
      '<strong>Aim</strong>: Steer with bottom lever (or Left/Right keys / Mouse drag)',
      '<strong>Launch</strong>: Tap the Launch button (or Spacebar / Click) to shoot',
      '<strong>Match 3</strong>: Connect 3 or more bubbles of the same color to pop!',
      '<strong>Mass Drop</strong>: Sever clusters from the ceiling for massive bonus points!',
      '<strong>Ceiling Drop</strong>: The ceiling drops on missed shots. Don\'t cross the deadline!'
    ]
  },
  startGameBtn: {
    ja: 'GAME START',
    en: 'GAME START'
  },
  // Stage Clear Modal
  stageClearedSuffix: {
    ja: ' CLEARED!',
    en: ' CLEARED!'
  },
  allStagesClearedTitle: {
    ja: 'ALL 30 STAGES CLEARED! 🏆',
    en: 'ALL 30 STAGES CLEARED! 🏆'
  },
  clearCheerNormal: {
    ja: 'EXCELLENT! 素晴らしいプレイ！',
    en: 'EXCELLENT! Outstanding shot!'
  },
  clearCheerFinal: {
    ja: 'CONGRATULATIONS! 全30ステージ完全制覇！お見事です！',
    en: 'CONGRATULATIONS! All 30 stages cleared! Incredible mastery!'
  },
  nextStageBtn: {
    ja: 'NEXT STAGE ➔',
    en: 'NEXT STAGE ➔'
  },
  loopModeBtn: {
    ja: 'LOOP MODE (★難易度UP) ➔',
    en: 'LOOP MODE (★Harder) ➔'
  },
  // Game Over Modal
  gameOverTitle: {
    ja: 'GAME OVER',
    en: 'GAME OVER'
  },
  gameOverSub: {
    ja: 'バブルがデッドラインを超えてしまいました！',
    en: 'The bubbles crossed the deadline!'
  },
  restartBtn: {
    ja: 'TRY AGAIN 🔄',
    en: 'TRY AGAIN 🔄'
  }
};

export function applyStaticTranslations(lang: Language = currentLang): void {
  if (typeof document === 'undefined') return;

  // HTML lang attribute
  document.documentElement.lang = lang;

  // Title
  document.title = translations.docTitle[lang];

  // Lever & bottom controls
  const aimLeftBtn = document.getElementById('aim-left-btn');
  if (aimLeftBtn) aimLeftBtn.setAttribute('aria-label', translations.aimLeftAria[lang]);

  const aimRightBtn = document.getElementById('aim-right-btn');
  if (aimRightBtn) aimRightBtn.setAttribute('aria-label', translations.aimRightAria[lang]);

  const leverTrack = document.getElementById('lever-track');
  if (leverTrack) leverTrack.title = translations.leverTitle[lang];

  const swapBtn = document.getElementById('swap-btn');
  if (swapBtn) {
    swapBtn.title = translations.swapBtnTitle[lang];
    const textEl = swapBtn.querySelector('.btn-text');
    if (textEl) textEl.textContent = translations.swapBtnText[lang];
  }

  const launchBtn = document.getElementById('launch-btn');
  if (launchBtn) {
    launchBtn.title = translations.launchBtnTitle[lang];
    const textEl = launchBtn.querySelector('.btn-text');
    if (textEl) textEl.textContent = translations.launchBtnText[lang];
  }

  const keyboardTips = document.querySelector('.keyboard-tips');
  if (keyboardTips) {
    keyboardTips.textContent = translations.keyboardTips[lang];
  }

  // Title Modal
  const subtitle = document.querySelector('#title-modal .subtitle');
  if (subtitle) subtitle.textContent = translations.titleSubtitle[lang];

  const instructionsH3 = document.querySelector('.instructions-box h3');
  if (instructionsH3) instructionsH3.textContent = translations.instructionsTitle[lang];

  const instructionsUl = document.querySelector('.instructions-box ul');
  if (instructionsUl) {
    instructionsUl.innerHTML = translations.rules[lang]
      .map((item) => `<li>${item}</li>`)
      .join('');
  }

  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) startBtn.textContent = translations.startGameBtn[lang];

  // Game Over Modal subtext
  const gameOverSub = document.querySelector('.gameover-sub');
  if (gameOverSub) gameOverSub.textContent = translations.gameOverSub[lang];

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.textContent = translations.restartBtn[lang];
}
