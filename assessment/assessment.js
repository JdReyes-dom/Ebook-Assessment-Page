/* ==========================================================================
   FRS DIGITAL VALUES QUIZ — INTERACTIVE LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------
     CONFIG
  ------------------------------------------------------------------ */
  const QUESTIONS = window.QUIZ_QUESTIONS || [];
  const TOTAL_QUESTIONS = QUESTIONS.length;
  const STORAGE_KEY = 'frsQuizAnswers';
  const LEARNER_KEY = 'frsLearnerInfo';

  const SHEET_ENDPOINT =
    'https://script.google.com/macros/s/AKfycbwm0di8B59dO_WIz9SOsd691p6hO79sysyAgPg1dPpHGkhYscnRHUM4XEXeBYE0Qkq8/exec';

  const CUSTOM_VALUE = '__custom__';

  let currentQuestion = 0;
  let isTransitioning = false;
  const answers = {};

  /* ------------------------------------------------------------------
     DOM REFS
  ------------------------------------------------------------------ */
  const questionPagesContainer = document.getElementById('questionPages');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const progressDots = document.getElementById('progressDots');
  const startBtn = document.getElementById('startBtn');
  const resultModal = document.getElementById('resultModal');
  const resultAnswers = document.getElementById('resultAnswers');
  const resultMessage = document.getElementById('resultMessage');
  const viewResultsBtn = document.getElementById('viewResultsBtn');

  const confirmModal = document.getElementById('confirmModal');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');

  const gradeSelect      = document.getElementById('gradeLevel');
  const customGradeField = document.getElementById('customGradeField');
  const customGradeInput = document.getElementById('customGrade');
  const schoolInput      = document.getElementById('schoolName');
  const formHint         = document.getElementById('formHint');

  const mascotWaving = document.getElementById('mascotWaving');
  const mascotAnswering = document.getElementById('mascotAnswering');

  /* ------------------------------------------------------------------
     HELPERS — grade value
  ------------------------------------------------------------------ */
  function isCustomGradeSelected() {
    return gradeSelect && gradeSelect.value === CUSTOM_VALUE;
  }

  function getEffectiveGrade() {
    if (isCustomGradeSelected()) {
      return customGradeInput ? customGradeInput.value.trim() : '';
    }
    return gradeSelect ? gradeSelect.value.trim() : '';
  }

  function updateCustomGradeVisibility() {
    if (!customGradeField) return;
    const showCustom = isCustomGradeSelected();

    if (showCustom) {
      customGradeField.hidden = false;
      void customGradeField.offsetWidth;
      customGradeField.classList.add('revealed');
      setTimeout(() => {
        if (customGradeInput) customGradeInput.focus();
      }, 200);
    } else {
      customGradeField.classList.remove('revealed');
      setTimeout(() => {
        customGradeField.hidden = true;
      }, 350);
      if (customGradeInput) customGradeInput.value = '';
    }
  }

  /* ------------------------------------------------------------------
     RESTORE SAVED INFO
  ------------------------------------------------------------------ */
  try {
    const savedInfo = sessionStorage.getItem(LEARNER_KEY);
    if (savedInfo) {
      const info = JSON.parse(savedInfo);
      if (info.gradeLevel && gradeSelect) {
        const presetOptions = Array.from(gradeSelect.options).map(opt => opt.value);
        if (presetOptions.includes(info.gradeLevel)) {
          gradeSelect.value = info.gradeLevel;
        } else if (info.gradeLevel) {
          gradeSelect.value = CUSTOM_VALUE;
          if (customGradeInput) customGradeInput.value = info.gradeLevel;
          updateCustomGradeVisibility();
        }
      }
      if (info.schoolName && schoolInput) schoolInput.value = info.schoolName;
    }
  } catch (err) {
    console.warn('Could not restore learner info:', err);
  }

  /* ------------------------------------------------------------------
     FORM VALIDATION
  ------------------------------------------------------------------ */
  function validateForm() {
    if (!gradeSelect || !schoolInput || !startBtn) return;

    const effectiveGrade = getEffectiveGrade();
    const school = schoolInput.value.trim();
    const gradeOk = effectiveGrade.length > 0;
    const schoolOk = school.length >= 2;
    const isReady = gradeOk && schoolOk;

    gradeSelect.classList.toggle('filled', gradeSelect.value !== '');
    if (customGradeInput) {
      customGradeInput.classList.toggle('filled', isCustomGradeSelected() && effectiveGrade.length > 0);
    }
    schoolInput.classList.toggle('filled', schoolOk);

    startBtn.disabled = !isReady;

    if (formHint) {
      formHint.classList.remove('ready', 'error');
      if (isReady) {
        formHint.textContent = '✓ All set! You may now begin.';
        formHint.classList.add('ready');
      } else if (!gradeOk && !schoolOk) {
        formHint.textContent = 'Please fill in both fields to begin.';
      } else if (!gradeOk) {
        formHint.textContent = isCustomGradeSelected()
          ? 'Please specify your grade level.'
          : 'Please select your grade level.';
      } else {
        formHint.textContent = 'Please enter your school name.';
      }
    }
  }

  if (gradeSelect) {
    gradeSelect.addEventListener('change', () => {
      updateCustomGradeVisibility();
      validateForm();
    });
  }
  if (customGradeInput) {
    customGradeInput.addEventListener('input', validateForm);
    customGradeInput.addEventListener('blur', validateForm);
  }
  if (schoolInput) {
    schoolInput.addEventListener('input', validateForm);
    schoolInput.addEventListener('blur', validateForm);
  }

  updateCustomGradeVisibility();
  validateForm();

  /* ------------------------------------------------------------------
     BUILD QUESTION PAGES
  ------------------------------------------------------------------ */
  function buildQuestionPages() {
    if (!questionPagesContainer) return;

    QUESTIONS.forEach((q, index) => {
      const qNum = index + 1;
      const page = document.createElement('div');
      page.className = 'page';
      page.id = `page-q${qNum}`;

      const choiceKeys = ['a', 'b', 'c', 'd'];
      let choicesHtml = '';
      choiceKeys.forEach(key => {
        const label = key.toUpperCase();
        choicesHtml += `
          <div class="choice">
            <div>
              <input class="choice-circle" type="radio" name="q${qNum}" id="q${qNum}-${key}" value="${key}">
              <div class="ball"></div>
            </div>
            <label for="q${qNum}-${key}" class="choice-name">${label}</label>
            <span class="choice-text">${q.choices[key]}</span>
          </div>
        `;
      });

      const isFirst = qNum === 1;
      const isLast = qNum === TOTAL_QUESTIONS;

      let navHtml = '<div class="nav-row">';
      if (!isFirst) {
        navHtml += `<button class="nav-btn prev-btn" data-prev="q${qNum - 1}">Previous</button>`;
      } else {
        navHtml += `<button class="nav-btn prev-btn" disabled>Previous</button>`;
      }

      if (!isLast) {
        navHtml += `<button class="nav-btn next-btn" data-next="q${qNum + 1}">Next</button>`;
      } else {
        navHtml += `<button class="nav-btn finish-btn" id="finishBtn">Finish</button>`;
      }
      navHtml += '</div>';

      page.innerHTML = `
        <div class="question-container">
          <div class="question-header">
            <span class="q-number">${q.subject} · ${q.grade}</span>
            <h2>${q.question}</h2>
          </div>
          <div class="radio-input">
            <div class="selector">${choicesHtml}</div>
          </div>
        </div>
        ${navHtml}
      `;

      questionPagesContainer.appendChild(page);
    });
  }

  buildQuestionPages();

  const pages = document.querySelectorAll('.page');

  function buildProgressDots() {
    if (!progressDots) return;
    progressDots.innerHTML = '';
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.dataset.index = i;
      progressDots.appendChild(dot);
    }
  }
  buildProgressDots();

  const progressDotEls = progressDots ? progressDots.querySelectorAll('.dot') : [];

  /* ------------------------------------------------------------------
     PAGE TRANSITIONS
  ------------------------------------------------------------------ */
  function flyToPage(fromPageId, toPageId) {
    const fromPage = document.getElementById('page-' + fromPageId);
    const toPage = document.getElementById('page-' + toPageId);
    if (!toPage) return;

    if (fromPage && fromPage.classList.contains('active')) {
      fromPage.classList.add('leaving');
      fromPage.classList.remove('active');
      setTimeout(() => {
        fromPage.classList.remove('leaving');
        fromPage.style.display = 'none';
      }, 400);
    }

    setTimeout(() => {
      pages.forEach(p => {
        if (p !== fromPage) p.style.display = 'none';
        p.classList.remove('active');
      });
      toPage.style.display = 'block';
      void toPage.offsetWidth;
      toPage.classList.add('active');
    }, 150);
  }

  /* ------------------------------------------------------------------
     PROGRESS
  ------------------------------------------------------------------ */
  function updateProgress() {
    if (!progressFill || !progressLabel) return;

    if (currentQuestion === 0) {
      progressFill.style.width = '0%';
      progressLabel.textContent = 'Ready to begin';
      progressDotEls.forEach(d => d.classList.remove('active', 'completed'));
      return;
    }

    const pct = (currentQuestion / TOTAL_QUESTIONS) * 100;
    progressFill.style.width = pct + '%';
    progressLabel.textContent = `Question ${currentQuestion} of ${TOTAL_QUESTIONS}`;

    progressDotEls.forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i < currentQuestion - 1) dot.classList.add('completed');
      else if (i === currentQuestion - 1) dot.classList.add('active');
    });
  }

  /* ------------------------------------------------------------------
     MASCOT SWAP
  ------------------------------------------------------------------ */
  function swapMascots() {
    if (mascotWaving) {
      mascotWaving.classList.remove('visible');
      mascotWaving.classList.add('fading-out');
      setTimeout(() => {
        mascotWaving.style.display = 'none';
      }, 700);
    }

    if (mascotAnswering) {
      setTimeout(() => {
        mascotAnswering.classList.add('visible');
      }, 220);
    }
  }

  /* ------------------------------------------------------------------
     START
  ------------------------------------------------------------------ */
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const grade = getEffectiveGrade();
      const school = schoolInput ? schoolInput.value.trim() : '';

      if (!grade || school.length < 2) {
        if (formHint) {
          formHint.classList.remove('ready');
          formHint.classList.add('error');
          formHint.textContent = 'Please complete the form first.';
          setTimeout(() => {
            formHint.classList.remove('error');
            validateForm();
          }, 1200);
        }
        return;
      }

      try {
        sessionStorage.setItem(LEARNER_KEY, JSON.stringify({
          gradeLevel: grade,
          schoolName: school
        }));
      } catch (err) {
        console.warn('Could not save learner info:', err);
      }

      currentQuestion = 1;
      updateProgress();
      flyToPage('welcome', 'q1');
      swapMascots();
    });
  }

  /* ------------------------------------------------------------------
     NEXT / PREVIOUS
  ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const nextBtn = e.target.closest('.next-btn');
    if (!nextBtn) return;
    if (isTransitioning) return;

    const nextId = nextBtn.dataset.next;
    if (!isCurrentQuestionAnswered()) { showValidationHint(); return; }

    isTransitioning = true;
    const nextNum = parseInt(nextId.replace('q', ''), 10);
    const fromId = 'q' + currentQuestion;

    currentQuestion = nextNum;
    updateProgress();
    flyToPage(fromId, nextId);
    setTimeout(() => { isTransitioning = false; }, 700);
  });

  document.addEventListener('click', (e) => {
    const prevBtn = e.target.closest('.prev-btn');
    if (!prevBtn) return;
    if (isTransitioning) return;

    const prevId = prevBtn.dataset.prev;
    if (!prevId) return;

    isTransitioning = true;
    const prevNum = parseInt(prevId.replace('q', ''), 10);
    const fromId = 'q' + currentQuestion;

    currentQuestion = prevNum;
    updateProgress();
    flyToPage(fromId, prevId);
    setTimeout(() => { isTransitioning = false; }, 700);
  });

  /* ------------------------------------------------------------------
     FINISH — now shows confirmation modal first
  ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const finishBtn = e.target.closest('#finishBtn');
    if (!finishBtn) return;

    if (!isCurrentQuestionAnswered()) { showValidationHint(); return; }

    /* Show the confirmation modal instead of submitting directly */
    if (confirmModal) {
      confirmModal.classList.add('active');
    }
  });

  /* ------------------------------------------------------------------
     CONFIRM MODAL — Cancel
  ------------------------------------------------------------------ */
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', () => {
      if (confirmModal) confirmModal.classList.remove('active');
    });
  }

  /* ------------------------------------------------------------------
     CONFIRM MODAL — Confirm & submit
  ------------------------------------------------------------------ */
  if (confirmSubmitBtn) {
    confirmSubmitBtn.addEventListener('click', () => {
      if (confirmModal) confirmModal.classList.remove('active');

      /* Now actually collect and submit */
      collectAllAnswers();
      submitToSheetThenShowResults();
    });
  }

  /* Also close the confirm modal when clicking the dim backdrop */
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        confirmModal.classList.remove('active');
      }
    });
  }

  /* ------------------------------------------------------------------
     VALIDATION
  ------------------------------------------------------------------ */
  function isCurrentQuestionAnswered() {
    const currentPage = document.getElementById('page-q' + currentQuestion);
    if (!currentPage) return true;
    return !!currentPage.querySelector('.choice-circle:checked');
  }

  function showValidationHint() {
    const currentPage = document.getElementById('page-q' + currentQuestion);
    if (!currentPage) return;

    const container = currentPage.querySelector('.question-container');
    if (!container) return;
    container.classList.remove('error-state');
    void container.offsetWidth;
    container.classList.add('error-state');

    setTimeout(() => container.classList.remove('error-state'), 1000);
  }

  /* ------------------------------------------------------------------
     COLLECT + SAVE ANSWERS
  ------------------------------------------------------------------ */
  function collectAllAnswers() {
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      answers[i] = selected ? selected.value : null;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (err) {
      console.warn('Could not save answers:', err);
    }
  }

  /* ------------------------------------------------------------------
     SCORE CALCULATION
  ------------------------------------------------------------------ */
  function calculateScore() {
    let correct = 0;
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const q = QUESTIONS[i - 1];
      if (q && answers[i] === q.correct) correct++;
    }
    const total = TOTAL_QUESTIONS;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  }

  /* ------------------------------------------------------------------
     SUBMIT TO GOOGLE SHEET
  ------------------------------------------------------------------ */
  function submitToSheetThenShowResults() {
    const score = calculateScore();

    let learner = { gradeLevel: '', schoolName: '' };
    try {
      const raw = sessionStorage.getItem(LEARNER_KEY);
      if (raw) learner = JSON.parse(raw) || learner;
    } catch (err) {
      console.warn('Could not read learner info:', err);
    }

    showResultModal('Saving your answers…', false);

    const payload = {
      gradeLevel: learner.gradeLevel,
      schoolName: learner.schoolName,
      score: score.correct,
      correct: score.correct,
      total: score.total,
      percentage: score.percentage,
      answers: answers
    };

    fetch(SHEET_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(() => {
        console.log('📤 Submitted to Google Sheet:', payload);
        updateResultMessage('✅ Your answers have been recorded!');
        revealViewResultsButton();
      })
      .catch((err) => {
        console.warn('Sheet submission failed (continuing anyway):', err);
        updateResultMessage('We couldn\'t save your score, but you can still view your results.');
        revealViewResultsButton();
      });

    setTimeout(revealViewResultsButton, 5000);
  }

  function updateResultMessage(text) {
    if (resultMessage) resultMessage.textContent = text;
  }

  function revealViewResultsButton() {
    if (viewResultsBtn) viewResultsBtn.style.display = 'inline-block';
  }

  /* ------------------------------------------------------------------
     RESULT MODAL
  ------------------------------------------------------------------ */
  function showResultModal(message, showButton = true) {
    if (!resultAnswers || !resultModal) return;

    let html = '';
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const val = answers[i] || '—';
      html += `
        <div class="answer-item">
          <span class="answer-q">Q${i}</span>
          <span class="answer-val">${val.toUpperCase()}</span>
        </div>
      `;
    }
    resultAnswers.innerHTML = html;

    if (resultMessage) {
      resultMessage.textContent = message || 'Here\'s a summary of your answers.';
    }

    if (viewResultsBtn) {
      viewResultsBtn.style.display = showButton ? 'inline-block' : 'none';
    }

    resultModal.classList.add('active');
  }

  /* ------------------------------------------------------------------
     CHOICE CLICK
  ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const choice = e.target.closest('.choice');
    if (!choice) return;
    if (e.target.tagName === 'LABEL' || e.target.closest('label')) return;

    const radio = choice.querySelector('.choice-circle');
    if (radio && !radio.checked) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  /* ------------------------------------------------------------------
     KEYBOARD NAVIGATION
  ------------------------------------------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (resultModal && resultModal.classList.contains('active')) return;
    if (confirmModal && confirmModal.classList.contains('active')) {
      /* ESC dismisses the confirm modal */
      if (e.key === 'Escape') {
        confirmModal.classList.remove('active');
        e.preventDefault();
      }
      return;
    }

    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
      if (e.key === 'Enter') {
        if (active.id === 'schoolName' || active.id === 'customGrade') {
          e.preventDefault();
          if (startBtn && !startBtn.disabled) startBtn.click();
        }
      }
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const currentPage = document.querySelector('.page.active');
      if (!currentPage) return;
      const radios = currentPage.querySelectorAll('.choice-circle');
      if (!radios.length) return;

      const checked = currentPage.querySelector('.choice-circle:checked');
      let index = checked ? Array.from(radios).indexOf(checked) : -1;

      if (e.key === 'ArrowDown') index = (index + 1) % radios.length;
      else index = index <= 0 ? radios.length - 1 : index - 1;

      radios[index].checked = true;
      radios[index].focus();
      e.preventDefault();
    }

    if (e.key === 'Enter') {
      const currentPage = document.querySelector('.page.active');
      if (!currentPage) return;
      const nextBtn = currentPage.querySelector('.next-btn');
      const finishBtn = currentPage.querySelector('.finish-btn');
      if (finishBtn) finishBtn.click();
      else if (nextBtn) nextBtn.click();
      e.preventDefault();
    }
  });

  /* ------------------------------------------------------------------
     PAUSE ANIMATIONS WHEN TAB IS HIDDEN
  ------------------------------------------------------------------ */
  document.addEventListener('visibilitychange', () => {
    const state = document.hidden ? 'paused' : 'running';
    document.querySelectorAll(
      '.cloud, .sun-core, .sun-rays, .canopy'
    ).forEach(el => {
      el.style.animationPlayState = state;
    });
  });

  /* ------------------------------------------------------------------
     INIT
  ------------------------------------------------------------------ */
  updateProgress();
  console.log(`🌳 Digital Values Quiz loaded — ${TOTAL_QUESTIONS} questions.`);
});