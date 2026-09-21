/* ==========================================================================
   FRS CUTSCENE — full-screen video player (manual play, unskippable)
   - Video does NOT autoplay. The learner presses the native play button.
   - Seeking is blocked: the learner cannot drag forward or jump ahead.
   - The Continue button appears ONLY when the video has truly finished
     (100% completion verified via the 'ended' event).
   - No skip button. No fast-forward. No unmute button.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const video         = document.getElementById('cutsceneVideo');
  const videoStage    = document.querySelector('.video-stage');
  const videoControls = document.getElementById('videoControls');

  if (!video) {
    console.warn('No cutscene video element found.');
    return;
  }

  /* ------------------------------------------------------------------
     STATE
     - furthestWatched: the highest currentTime the video has reached
       during normal playback. Used to clamp any forward seeks.
     - hasCompleted: flips to true only when 'ended' fires.
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
     Strategy:
       1. Track the furthest point the video has reached naturally.
       2. If the learner tries to seek forward (past furthestWatched),
          snap them back.
       3. Allow backward seeking only within a small rewound window
          (so they can replay a moment they just missed).
  ------------------------------------------------------------------ */
  const FORWARD_TOLERANCE = 0.5;   // seconds of drift allowed
  const REWIND_LIMIT = 5;          // max seconds the learner can rewind

  // Update furthestWatched as the video plays naturally
  video.addEventListener('timeupdate', () => {
    if (video.seeking) return;
    if (video.currentTime > furthestWatched) {
      furthestWatched = video.currentTime;
    }
  });

  // Detect and correct any forward seeking
  video.addEventListener('seeking', () => {
    // Don't police seeks after completion
    if (hasCompleted) return;

    const current = video.currentTime;

    // Forward seek beyond what has been watched → snap back
    if (current > furthestWatched + FORWARD_TOLERANCE) {
      video.currentTime = furthestWatched;
      return;
    }

    // Backward seek too far → clamp to the rewind limit
    if (current < furthestWatched - REWIND_LIMIT) {
      video.currentTime = Math.max(0, furthestWatched - REWIND_LIMIT);
    }
  });

  /* ------------------------------------------------------------------
     REVEAL THE CONTINUE BUTTON ONLY WHEN THE VIDEO HAS FINISHED
     - 'ended' fires only when playback reaches the end naturally.
     - We additionally verify the video actually reached near-duration
       so a manipulated timeline can't trick us.
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
     ERROR FALLBACK — if the video can't load, reveal the button
     anyway so the learner isn't stuck.
  ------------------------------------------------------------------ */
  video.addEventListener('error', (e) => {
    console.warn('Video failed to load. Showing continue button.', e);
    if (videoControls) {
      videoControls.classList.add('visible');
      requestAnimationFrame(alignOverlays);
    }
  });

  /* ------------------------------------------------------------------
     KEYBOARD — Enter or Space advances (only after completion)
  ------------------------------------------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (!hasCompleted) return;

    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      window.location.href = '../assessment/assessment.html';
    }
  });

  /* ------------------------------------------------------------------
     PREVENT SCROLLING WHILE VIDEO IS PLAYING
  ------------------------------------------------------------------ */
  document.body.style.overflow = 'hidden';

  console.log('📹 Cutscene video loaded — manual play, unskippable, native controls ready.');
});