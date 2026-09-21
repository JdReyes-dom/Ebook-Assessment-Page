/* ==========================================================================
   FRS CUTSCENE — full-screen video player (manual play, unskippable)
   - Video does NOT autoplay. The learner presses the native play button.
   - Seeking is blocked: the learner cannot drag forward or jump ahead.
   - The Continue button appears ONLY when the video has truly finished
     (100% completion verified via the 'ended' event).
   - No skip button. No fast-forward. No unmute button.
   - On clicking Continue, ALL sessionStorage keys written by this app are
     cleared so the next visit to the assessment starts fresh.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const video         = document.getElementById('cutsceneVideo');
  const videoStage    = document.querySelector('.video-stage');
  const videoControls = document.getElementById('videoControls');
  const continueBtn   = document.getElementById('continueBtn');

  if (!video) {
    console.warn('No cutscene video element found.');
    return;
  }

  /* ------------------------------------------------------------------
     STATE
  ------------------------------------------------------------------ */
  let furthestWatched = 0;
  let hasCompleted = false;

  /* ------------------------------------------------------------------
     ALIGN CONTROLS TO THE VIDEO FRAME
  ------------------------------------------------------------------ */
  function alignOverlays() {
    if (!videoStage || !videoControls) return;
    const rect = videoStage.getBoundingClientRect();
    videoControls.style.bottom = (window.innerHeight - rect.bottom + 24) + 'px';
  }

  alignOverlays();
  window.addEventListener('resize', alignOverlays);
  window.addEventListener('orientationchange', () => {
    setTimeout(alignOverlays, 100);
  });

  /* ------------------------------------------------------------------
     BLOCK SEEKING — prevent the learner from skipping ahead
  ------------------------------------------------------------------ */
  const FORWARD_TOLERANCE = 0.5;
  const REWIND_LIMIT = 5;

  video.addEventListener('timeupdate', () => {
    if (video.seeking) return;
    if (video.currentTime > furthestWatched) {
      furthestWatched = video.currentTime;
    }
  });

  video.addEventListener('seeking', () => {
    if (hasCompleted) return;

    const current = video.currentTime;

    if (current > furthestWatched + FORWARD_TOLERANCE) {
      video.currentTime = furthestWatched;
      return;
    }

    if (current < furthestWatched - REWIND_LIMIT) {
      video.currentTime = Math.max(0, furthestWatched - REWIND_LIMIT);
    }
  });

  /* ------------------------------------------------------------------
     REVEAL THE CONTINUE BUTTON ONLY WHEN THE VIDEO HAS FINISHED
  ------------------------------------------------------------------ */
  video.addEventListener('ended', () => {
    const reachedEnd = video.duration > 0 &&
      video.currentTime >= video.duration - 0.25;

    if (!reachedEnd) {
      console.warn('Ended event fired but video did not reach the end.');
      return;
    }

    hasCompleted = true;

    if (videoControls) {
      videoControls.classList.add('visible');
      requestAnimationFrame(alignOverlays);
    }
  });

  /* ------------------------------------------------------------------
     ERROR FALLBACK
  ------------------------------------------------------------------ */
  video.addEventListener('error', (e) => {
    console.warn('Video failed to load. Showing continue button.', e);
    if (videoControls) {
      videoControls.classList.add('visible');
      requestAnimationFrame(alignOverlays);
    }
  });

  /* ------------------------------------------------------------------
     CLEAR SESSION DATA ON CONTINUE
     - This is the natural "end of session" boundary. Once the learner
       clicks Continue, the next time they land on the assessment it
       starts fresh — no restored answers, no pre-filled form, no
       resumed question pointer.
  ------------------------------------------------------------------ */
  const SESSION_KEYS_TO_CLEAR = [
    'frsLearnerInfo',    // grade + school
    'frsQuizAnswers',    // selected answers
    'frsQuizProgress'    // current question + started flag
  ];

  function clearSessionData() {
    try {
      SESSION_KEYS_TO_CLEAR.forEach(key => sessionStorage.removeItem(key));
    } catch (err) {
      console.warn('Could not clear session data:', err);
    }
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      clearSessionData();
      // The anchor's default href navigation proceeds normally.
    });
  }

  /* ------------------------------------------------------------------
     KEYBOARD — Enter or Space advances (only after completion)
     Also clears session data before navigating.
  ------------------------------------------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (!hasCompleted) return;

    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      clearSessionData();
      window.location.href = '../assessment/assessment.html';
    }
  });

  document.body.style.overflow = 'hidden';

  console.log('📹 Cutscene video loaded — manual play, unskippable, native controls ready.');
});