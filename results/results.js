/* ==========================================================================
   FRS DIGITAL VALUES QUIZ — RESULTS PAGE LOGIC
   - Reads saved answers from sessionStorage.
   - Shows either a high-score or low-score celebration GIF with a
     matching speech bubble that varies by score.
   - Insight panels are COLLAPSED by default.
   - Answer review rows: desktop expands inline; mobile opens a bottom sheet.
   - Includes TTS (text-to-speech) support for SPED accommodation.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const QUESTIONS = window.QUIZ_QUESTIONS || [];
  const TOTAL_QUESTIONS = QUESTIONS.length;
  const STORAGE_KEY = 'frsQuizAnswers';

  /* DOM REFS */
  const statCorrect       = document.getElementById('statCorrect');
  const statTotal         = document.getElementById('statTotal');
  const statScore         = document.getElementById('statScore');
  const answerList        = document.getElementById('answerList');
  const answerListHint    = document.getElementById('answerListHint');
  const completionMessage = document.getElementById('completionMessage');
  const strengthList      = document.getElementById('strengthList');
  const improveList       = document.getElementById('improveList');

  const msbCorrect        = document.getElementById('msbCorrect');
  const msbTotal          = document.getElementById('msbTotal');
  const msbScore          = document.getElementById('msbScore');

  const mascotHigh        = document.getElementById('mascotCelebratingHigh');
  const mascotLow         = document.getElementById('mascotCelebratingLow');
  const highScoreText     = document.getElementById('highScoreText');
  const lowScoreText      = document.getElementById('lowScoreText');

  const sheetOverlay      = document.getElementById('sheetOverlay');
  const sheet             = document.getElementById('sheet');
  const sheetBody         = document.getElementById('sheetBody');
  const sheetQNum         = document.getElementById('sheetQNum');
  const sheetQSubject     = document.getElementById('sheetQSubject');
  const sheetClose        = document.getElementById('sheetClose');

  /* STATE */
  let answers = {};
  let answeredCount = 0;
  let correctCount = 0;

  const isMobile = () => window.matchMedia('(max-width: 700px)').matches;

  /* LOAD ANSWERS */
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) answers = JSON.parse(raw) || {};
  } catch (err) {
    console.warn('Could not read quiz answers:', err);
  }

  /* VERIFY + SUBJECT BREAKDOWN */
  const subjectStats = {};

  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    const userAns = answers[i];
    const question = QUESTIONS[i - 1];
    if (!question) continue;

    if (!subjectStats[question.subject]) {
      subjectStats[question.subject] = { correct: 0, total: 0 };
    }
    subjectStats[question.subject].total++;

    if (userAns) answeredCount++;
    if (userAns && userAns === question.correct) {
      correctCount++;
      subjectStats[question.subject].correct++;
    }
  }

  const scorePercent = TOTAL_QUESTIONS > 0
    ? Math.round((correctCount / TOTAL_QUESTIONS) * 100)
    : 0;

  /* STATS */
  if (statCorrect) statCorrect.textContent = correctCount;
  if (statTotal)   statTotal.textContent   = TOTAL_QUESTIONS;
  if (statScore)   statScore.textContent   = scorePercent + '%';

  if (msbCorrect) msbCorrect.textContent = correctCount;
  if (msbTotal)   msbTotal.textContent   = TOTAL_QUESTIONS;
  if (msbScore)   msbScore.textContent   = scorePercent + '%';

  /* ==================================================================
     CELEBRATION MASCOT + SPEECH BUBBLE
     ================================================================== */
  const isHighScore = correctCount >= 6;
  const activeMascot = isHighScore ? mascotHigh : mascotLow;

  function getSpeechMessage() {
    if (correctCount >= 8) {
      return `Wow! ${correctCount}/${TOTAL_QUESTIONS} — you're a Digital Values star! 🌟`;
    }
    if (correctCount >= 6) {
      return `Nice work! ${correctCount}/${TOTAL_QUESTIONS} correct — keep it up! 🎉`;
    }
    if (correctCount >= 3) {
      return `Good try! ${correctCount}/${TOTAL_QUESTIONS} — let's learn some more! 🌱`;
    }
    return `Every explorer starts somewhere. Let's practice together! 💪`;
  }

  const speechMessage = getSpeechMessage();

  if (isHighScore && highScoreText) {
    highScoreText.textContent = speechMessage;
  } else if (!isHighScore && lowScoreText) {
    lowScoreText.textContent = speechMessage;
  }

  if (activeMascot) {
    setTimeout(() => {
      activeMascot.classList.add('visible');
    }, 600);
  }

  /* ==================================================================
     COLLAPSIBLE INSIGHT PANELS
     ================================================================== */
  document.querySelectorAll('.insight[data-collapsible]').forEach(panel => {
    const header = panel.querySelector('.insight-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isCollapsed = panel.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', String(!isCollapsed));
    });
  });

  /* ==================================================================
     INSIGHT PANELS — detailed subject breakdown
     ================================================================== */
  const subjectEntries = Object.keys(subjectStats).map(name => {
    const s = subjectStats[name];
    const rate = s.total > 0 ? s.correct / s.total : 0;
    return {
      name,
      correct: s.correct,
      total: s.total,
      rate,
      percent: Math.round(rate * 100)
    };
  });

  const strengths = subjectEntries
    .filter(s => s.correct > 0)
    .sort((a, b) => b.rate - a.rate);

  const improvements = subjectEntries
    .filter(s => s.correct < s.total)
    .sort((a, b) => a.rate - b.rate);

  const everythingPerfect = correctCount === TOTAL_QUESTIONS;

  function renderStrengthList() {
    if (!strengthList) return;
    strengthList.innerHTML = '';

    if (strengths.length === 0) {
      const p = document.createElement('p');
      p.className = 'insight-empty';
      p.textContent = 'No perfect scores yet — but every question is a chance to learn!';
      strengthList.appendChild(p);
      return;
    }

    strengths.forEach(subject => {
      const item = document.createElement('div');
      item.className = 'subject-item';
      item.innerHTML = `
        <div class="subject-item-top">
          <span class="subject-name">${subject.name}</span>
          <span class="subject-score">${subject.correct}/${subject.total} · ${subject.percent}%</span>
        </div>
        <div class="subject-bar"><div class="subject-bar-fill" style="width: ${subject.percent}%"></div></div>
      `;
      strengthList.appendChild(item);
    });

    const perfectCount = strengths.filter(s => s.rate === 1).length;
    if (perfectCount >= 3) {
      const hint = document.createElement('p');
      hint.className = 'subject-hint';
      hint.textContent = `You scored perfectly in ${perfectCount} subjects — amazing work! 🎉`;
      strengthList.appendChild(hint);
    }
  }

  function renderImproveList() {
    if (!improveList) return;
    improveList.innerHTML = '';

    if (improvements.length === 0) {
      const p = document.createElement('p');
      p.className = 'insight-empty';
      p.textContent = everythingPerfect
        ? 'Nothing to improve — you aced every subject! 🎉'
        : 'Keep up the good work — no weak areas found!';
      improveList.appendChild(p);
      return;
    }

    improvements.forEach(subject => {
      const item = document.createElement('div');
      item.className = 'subject-item';
      item.innerHTML = `
        <div class="subject-item-top">
          <span class="subject-name">${subject.name}</span>
          <span class="subject-score">${subject.correct}/${subject.total} · ${subject.percent}%</span>
        </div>
        <div class="subject-bar"><div class="subject-bar-fill" style="width: ${subject.percent}%"></div></div>
      `;
      improveList.appendChild(item);
    });

    const hint = document.createElement('p');
    hint.className = 'subject-hint';
    if (improvements.length === 1) {
      hint.textContent = 'Focus on this one topic and you\'ll reach a perfect score!';
    } else {
      hint.textContent = `Review these ${improvements.length} topics to boost your overall score.`;
    }
    improveList.appendChild(hint);
  }

  renderStrengthList();
  renderImproveList();

  /* ==================================================================
     BUILD EXPANDABLE ANSWER LIST
     ================================================================== */
  const answerDetailsMap = {};

  if (answerList) {
    answerList.innerHTML = '';

    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const question = QUESTIONS[i - 1];
      if (!question) continue;

      const userAns  = answers[i] || null;
      const isCorrect = userAns === question.correct;

      const row = document.createElement('div');
      row.className = 'answer-row'
        + (!userAns ? ' missing' : (isCorrect ? ' correct' : ' incorrect'));

      const userLabel    = userAns ? userAns.toUpperCase() : '—';
      const correctLabel = question.correct.toUpperCase();

      const choiceKeys = ['a', 'b', 'c', 'd'];
      let choicesHtml = '';
      choiceKeys.forEach(key => {
        const isCorrectChoice = key === question.correct;
        const isUserChoice    = key === userAns;
        let extraClass = '';
        if (isCorrectChoice) extraClass = ' is-correct';
        else if (isUserChoice && !isCorrect) extraClass = ' is-user-wrong';

        const choiceText = question.choices[key] || '';
        choicesHtml += `
          <div class="detail-choice${extraClass}">
            <span class="choice-key">${key.toUpperCase()}.</span>
            <span class="choice-text">${choiceText}</span>
          </div>
        `;
      });

      const correctChoiceText = question.choices[question.correct] || '';
      const userChoiceText = userAns ? (question.choices[userAns] || '') : '';

      let answerLineHtml = '';

      if (!userAns) {
        answerLineHtml = `
          <div class="detail-answer-line">
            <span class="answer-label">Correct Answer</span>
            <span class="answer-value">${correctLabel} — ${correctChoiceText}</span>
          </div>
        `;
      } else if (isCorrect) {
        answerLineHtml = `
          <div class="detail-answer-line">
            <span class="answer-label">Your Answer</span>
            <span class="answer-value">${userLabel} — ${userChoiceText} ✓</span>
          </div>
        `;
      } else {
        answerLineHtml = `
          <div class="detail-answer-line detail-wrong">
            <span class="answer-label">Your Answer</span>
            <span class="answer-value">${userLabel} — ${userChoiceText} ✗</span>
          </div>
          <div class="detail-answer-line">
            <span class="answer-label">Correct Answer</span>
            <span class="answer-value">${correctLabel} — ${correctChoiceText}</span>
          </div>
        `;
      }

      answerDetailsMap[i] = {
        qNum: `Q${i}`,
        subject: question.subject,
        html: `
          <div class="detail-question">${question.question}</div>
          <div class="detail-choices">${choicesHtml}</div>
          ${answerLineHtml}
        `
      };

      row.innerHTML = `
        <div class="answer-row-header">
          <div class="answer-meta">
            <span class="q-label">Q${i} · ${question.subject}</span>
            <span class="q-subject">Digital Values</span>
          </div>
          <div class="answer-values">
            <span class="q-user">${userLabel}</span>
            <span class="q-arrow">→</span>
            <span class="q-correct">${correctLabel}</span>
            <span class="q-icon">${!userAns ? '○' : (isCorrect ? '✓' : '✗')}</span>
            <span class="q-chevron">▾</span>
          </div>
        </div>
        <div class="answer-detail">
          <div class="answer-detail-inner">
            ${answerDetailsMap[i].html}
          </div>
        </div>
      `;

      row.addEventListener('click', () => {
        if (isMobile()) {
          openSheet(i);
        } else {
          row.classList.toggle('expanded');
        }
      });

      row.style.animationDelay = (60 * i + 300) + 'ms';
      answerList.appendChild(row);
    }
  }

  /* ==================================================================
     MOBILE BOTTOM SHEET
     ================================================================== */
  function openSheet(qIndex) {
    const detail = answerDetailsMap[qIndex];
    if (!detail || !sheetOverlay || !sheetBody) return;

    if (sheetQNum)     sheetQNum.textContent = detail.qNum;
    if (sheetQSubject) sheetQSubject.textContent = detail.subject;
    if (sheetBody)     sheetBody.innerHTML = detail.html;

    sheetOverlay.classList.add('open');
    sheetOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Read the sheet content aloud if TTS is enabled
    if (window.TTS && TTS.isEnabled()) {
      setTimeout(() => {
        const text = `${detail.qNum}. ${sheetBody.innerText}`;
        TTS.speak(text);
      }, 400);
    }
  }

  function closeSheet() {
    if (!sheetOverlay) return;
    sheetOverlay.classList.remove('open');
    sheetOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.TTS && TTS.isEnabled()) TTS.stop();
  }

  if (sheetClose) {
    sheetClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSheet();
    });
  }

  if (sheetOverlay) {
    sheetOverlay.addEventListener('click', (e) => {
      if (e.target === sheetOverlay) closeSheet();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheetOverlay && sheetOverlay.classList.contains('open')) {
      closeSheet();
    }
  });

  /* Swipe-down to close */
  let touchStartY = null;
  let touchCurrentY = null;
  if (sheet) {
    sheet.addEventListener('touchstart', (e) => {
      const touchY = e.touches[0].clientY;
      const rect = sheet.getBoundingClientRect();
      if (touchY - rect.top < 80) {
        touchStartY = touchY;
        touchCurrentY = touchY;
        sheet.style.transition = 'none';
      }
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
      if (touchStartY === null) return;
      touchCurrentY = e.touches[0].clientY;
      const delta = Math.max(0, touchCurrentY - touchStartY);
      sheet.style.transform = `translateY(${delta}px)`;
    }, { passive: true });

    sheet.addEventListener('touchend', () => {
      if (touchStartY === null) return;
      const delta = Math.max(0, touchCurrentY - touchStartY);
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (delta > 100) {
        closeSheet();
      }
      touchStartY = null;
      touchCurrentY = null;
    });
  }

  if (answerListHint) {
    answerListHint.textContent = answeredCount === TOTAL_QUESTIONS
      ? `All ${TOTAL_QUESTIONS} answered · ${isMobile() ? 'tap to open' : 'click to expand'}`
      : `${answeredCount} of ${TOTAL_QUESTIONS} answered`;
  }

  /* COMPLETION MESSAGE */
  let message = '';

  if (answeredCount === TOTAL_QUESTIONS) {
    if (scorePercent >= 90) {
      message = `<strong>Outstanding! 🎉</strong> You scored ${correctCount} out of ${TOTAL_QUESTIONS} (${scorePercent}%). You're a Digital Values champion!`;
    } else if (scorePercent >= 70) {
      message = `<strong>Great job! 🌿</strong> You scored ${correctCount} out of ${TOTAL_QUESTIONS} (${scorePercent}%). Keep up the good work!`;
    } else if (scorePercent >= 50) {
      message = `<strong>Good effort! 📚</strong> You scored ${correctCount} out of ${TOTAL_QUESTIONS} (${scorePercent}%). A little more practice will go a long way.`;
    } else {
      message = `<strong>Keep learning! 🌱</strong> You scored ${correctCount} out of ${TOTAL_QUESTIONS} (${scorePercent}%). Review the answers below and try again!`;
    }
  } else if (answeredCount >= TOTAL_QUESTIONS * 0.6) {
    message = `<strong>Almost there!</strong> 🌿 You answered ${answeredCount} of ${TOTAL_QUESTIONS} questions. Retake the quiz to complete your journey.`;
  } else {
    message = `<strong>Looks like you skipped a few.</strong> 🤔 You only answered ${answeredCount} of ${TOTAL_QUESTIONS} questions. Retake the quiz to get a full score.`;
  }

  if (completionMessage) completionMessage.innerHTML = message;

  /* ==================================================================
     TEXT-TO-SPEECH (SPED ACCOMMODATION)
     ================================================================== */
  const TTS_AVAILABLE = !!(window.TTS && 'speechSynthesis' in window);

  function speakResultsSummary() {
    if (!TTS_AVAILABLE || !TTS.isEnabled()) return;
    const parts = [];

    const header = document.querySelector('.results-header h1');
    if (header) parts.push(header.innerText.trim());

    parts.push(`You scored ${correctCount} out of ${TOTAL_QUESTIONS}. That's ${scorePercent} percent.`);

    if (speechMessage) parts.push(speechMessage.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''));

    if (completionMessage) {
      parts.push(completionMessage.innerText.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim());
    }

    TTS.speak(parts.join('. '));
  }

  function initTTS() {
    if (!TTS_AVAILABLE) return;

    TTS.init({ autoReadOnEnable: false });

    /* --- Enhancement A: hover-to-read answer rows (desktop only) --- */
    TTS.attachHover('.answer-row', (el) => {
      const label = el.querySelector('.q-label');
      const user  = el.querySelector('.q-user');
      const corr  = el.querySelector('.q-correct');
      if (!label) return '';
      const parts = [label.innerText.trim()];
      if (user) parts.push(`Your answer: ${user.innerText.trim()}`);
      if (corr) parts.push(`Correct answer: ${corr.innerText.trim()}`);
      return parts.join('. ');
    });

    /* --- Enhancement A: hover-to-read insight subject items --- */
    TTS.attachHover('.subject-item', (el) => el.innerText.trim());

    /* --- When TTS is toggled ON, read the results summary --- */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tts-toggle')) return;
      setTimeout(() => {
        if (TTS.isEnabled()) speakResultsSummary();
      }, 250);
    });

    /* --- Auto-read the sheet when opened (handled in openSheet) --- */
    /* --- Auto-read the results summary on first load if enabled --- */
    if (TTS.isEnabled()) {
      setTimeout(speakResultsSummary, 800);
    }
  }

  initTTS();

  /* PAUSE SCENE ANIMATIONS WHEN TAB IS HIDDEN */
  document.addEventListener('visibilitychange', () => {
    const state = document.hidden ? 'paused' : 'running';
    document.querySelectorAll(
      '.cloud, .sun-core, .sun-rays, .canopy, .star'
    ).forEach(el => {
      el.style.animationPlayState = state;
    });
  });

  console.log(
    `🌅 Results loaded — ${correctCount}/${TOTAL_QUESTIONS} correct (${scorePercent}%) — ` +
    `${answeredCount} answered — ` +
    (isHighScore ? 'high-score mascot 🎉' : 'low-score mascot 🌱') + ' — ' +
    `"${speechMessage}"`
  );
});