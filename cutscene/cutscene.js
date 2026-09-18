/* ==========================================================================
   FRS CUTSCENE — full-screen video player
   - Video autoplays on load (muted so autoplay is allowed).
   - Progress bar hugs the bottom edge of the framed video.
   - Continue button appears only once the video has finished,
     positioned just below the frame.
   - No skip button.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const video         = document.getElementById('cutsceneVideo');
  const videoStage    = document.querySelector('.video-stage');
  const progressFill  = document.getElementById('videoProgress');
  const progressTrack = document.querySelector('.progress-track');
  const videoControls = document.getElementById('videoControls');

  if (!video) {
    console.warn('No cutscene video element found.');
    return;
  }

  /* ------------------------------------------------------------------
     ALIGN PROGRESS BAR + CONTROLS TO THE VIDEO FRAME
     Uses the frame's bounding rect so everything sits precisely
     inside / just below the framed video, on every viewport size.
  ------------------------------------------------------------------ */
  function alignOverlays() {
    if (!videoStage) return;
    const rect = videoStage.getBoundingClientRect();

    // Progress bar: inset a few pixels inside the frame bottom
    if (progressTrack) {
      progressTrack.style.left   = (rect.left + 6) + 'px';
      progressTrack.style.width  = Math.max(0, rect.width - 12) + 'px';
      progressTrack.style.bottom = (window.innerHeight - rect.bottom + 6) + 'px';
    }

    // Continue button: place it a bit below the frame
    if (videoControls) {
      videoControls.style.bottom = (window.innerHeight - rect.bottom + 24) + 'px';
    }
  }

  alignOverlays();
  window.addEventListener('resize', alignOverlays);
  window.addEventListener('orientationchange', () => {
    // Wait a tick for the browser to settle the new layout
    setTimeout(alignOverlays, 100);
  });

  /* ------------------------------------------------------------------
     PROGRESS BAR
  ------------------------------------------------------------------ */
  function updateProgress() {
    if (!progressFill) return;
    if (!video.duration || isNaN(video.duration)) return;

    const pct = (video.currentTime / video.duration) * 100;
    progressFill.style.width = pct + '%';
  }

  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('loadedmetadata', updateProgress);

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
     AUTOPLAY FALLBACK
  ------------------------------------------------------------------ */
  const tryAutoplay = video.play();
  if (tryAutoplay && typeof tryAutoplay.catch === 'function') {
    tryAutoplay.catch(() => {
      console.log('Autoplay blocked — showing continue button.');
      if (videoControls) {
        videoControls.classList.add('visible');
        requestAnimationFrame(alignOverlays);
      }
    });
  }

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

  console.log('📹 Cutscene video loaded — autoplay + aligned progress ready.');
});