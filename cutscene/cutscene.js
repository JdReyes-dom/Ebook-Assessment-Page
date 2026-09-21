/* ==========================================================================
   FRS CUTSCENE — full-screen video player (manual play)
   - Video does NOT autoplay. The learner presses the native play button.
   - Continue button appears only once the video has finished,
     positioned just below the frame.
   - No skip button.
   - Progress is handled by the video's native controls bar.
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
     ALIGN CONTROLS TO THE VIDEO FRAME
     Uses the frame's bounding rect so the Continue button sits
     precisely just below the framed video, on every viewport size.
  ------------------------------------------------------------------ */
  function alignOverlays() {
    if (!videoStage || !videoControls) return;
    const rect = videoStage.getBoundingClientRect();
    videoControls.style.bottom = (window.innerHeight - rect.bottom + 24) + 'px';
  }

  alignOverlays();
  window.addEventListener('resize', alignOverlays);
  window.addEventListener('orientationchange', () => {
    // Wait a tick for the browser to settle the new layout
    setTimeout(alignOverlays, 100);
  });

  /* ------------------------------------------------------------------
     REVEAL THE CONTINUE BUTTON WHEN THE VIDEO ENDS
  ------------------------------------------------------------------ */
  video.addEventListener('ended', () => {
    if (videoControls) {
      videoControls.classList.add('visible');
      // Re-align after the button becomes visible so it sits right
      requestAnimationFrame(alignOverlays);
    }
  });

  /* ------------------------------------------------------------------
     ERROR FALLBACK — if the video can't load, reveal the button
     anyway so the user isn't stuck.
  ------------------------------------------------------------------ */
  video.addEventListener('error', (e) => {
    console.warn('Video failed to load. Showing continue button.', e);
    if (videoControls) {
      videoControls.classList.add('visible');
      requestAnimationFrame(alignOverlays);
    }
  });

  /* ------------------------------------------------------------------
     KEYBOARD — Enter or Space skips to quiz (only after video ends)
  ------------------------------------------------------------------ */
  document.addEventListener('keydown', (e) => {
    const isEnded = video.ended;
    if (!isEnded) return;

    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      window.location.href = '../assessment/assessment.html';
    }
  });

  /* ------------------------------------------------------------------
     PREVENT SCROLLING WHILE VIDEO IS PLAYING
  ------------------------------------------------------------------ */
  document.body.style.overflow = 'hidden';

  console.log('📹 Cutscene video loaded — manual play + native controls ready.');
});