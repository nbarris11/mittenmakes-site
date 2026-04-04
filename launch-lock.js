(function () {
  const launchAt = new Date('2026-04-06T08:00:00-04:00');
  const bypassParam = 'mmPreview';
  const bypassValue = 'farmington';
  const bypassStorageKey = 'mittenMakesLaunchBypass';
  const params = new URLSearchParams(window.location.search);

  if (params.get(bypassParam) === bypassValue) {
    window.localStorage.setItem(bypassStorageKey, 'true');
  }

  if (params.get(bypassParam) === 'off') {
    window.localStorage.removeItem(bypassStorageKey);
  }

  const previewBypassEnabled = window.localStorage.getItem(bypassStorageKey) === 'true';

  if (Number.isNaN(launchAt.getTime()) || Date.now() >= launchAt.getTime() || previewBypassEnabled) {
    return;
  }

  const formatSegment = value => String(value).padStart(2, '0');

  const style = document.createElement('style');
  style.textContent = `
    body.launch-locked {
      overflow: hidden;
    }

    .launch-lock-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background:
        radial-gradient(circle at top, rgba(255, 249, 242, 0.96), rgba(253, 245, 237, 0.98)),
        rgba(253, 245, 237, 0.98);
      backdrop-filter: blur(10px);
    }

    .launch-lock-card {
      width: min(720px, 100%);
      background: rgba(255, 249, 242, 0.98);
      border: 1px solid rgba(196, 81, 26, 0.16);
      border-radius: 28px;
      box-shadow: 0 32px 72px rgba(94, 58, 32, 0.16);
      padding: clamp(2rem, 4vw, 3rem);
      text-align: center;
    }

    .launch-lock-badge {
      display: inline-block;
      margin-bottom: 1rem;
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      background: #f7e8d8;
      color: #c4511a;
      font-family: 'Poppins', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .launch-lock-title {
      margin: 0 0 1rem;
      font-family: 'Poppins', sans-serif;
      font-size: clamp(2rem, 4vw, 3.1rem);
      line-height: 1.05;
      color: #3d3d3d;
    }

    .launch-lock-copy {
      max-width: 560px;
      margin: 0 auto 1.75rem;
      color: #5b6470;
      font-size: clamp(1rem, 2vw, 1.15rem);
      line-height: 1.8;
    }

    .launch-lock-countdown {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.9rem;
      margin-bottom: 1.6rem;
    }

    .launch-lock-segment {
      padding: 1rem 0.7rem;
      border-radius: 20px;
      background: #fff9f2;
      border: 1px solid #ede1d5;
    }

    .launch-lock-number {
      display: block;
      font-family: 'Poppins', sans-serif;
      font-size: clamp(1.7rem, 3vw, 2.4rem);
      font-weight: 800;
      line-height: 1;
      color: #c4511a;
    }

    .launch-lock-label {
      display: block;
      margin-top: 0.45rem;
      color: #5b6470;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .launch-lock-footnote {
      color: #8d857d;
      font-size: 0.92rem;
      line-height: 1.7;
      margin: 0;
    }

    @media (max-width: 640px) {
      .launch-lock-overlay {
        padding: 1rem;
      }

      .launch-lock-card {
        border-radius: 24px;
        padding: 1.6rem 1.2rem;
      }

      .launch-lock-countdown {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'launch-lock-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'launch-lock-title');
  overlay.innerHTML = `
    <div class="launch-lock-card">
      <span class="launch-lock-badge">Mitten Makes opens soon</span>
      <h1 class="launch-lock-title" id="launch-lock-title">We launch Monday morning.</h1>
      <p class="launch-lock-copy">The site is getting its final polish and opens on Monday, April 6, 2026 at 8:00 AM Eastern. Come back when the countdown hits zero.</p>
      <div class="launch-lock-countdown" aria-live="polite">
        <div class="launch-lock-segment">
          <span class="launch-lock-number" data-lock-days>00</span>
          <span class="launch-lock-label">Days</span>
        </div>
        <div class="launch-lock-segment">
          <span class="launch-lock-number" data-lock-hours>00</span>
          <span class="launch-lock-label">Hours</span>
        </div>
        <div class="launch-lock-segment">
          <span class="launch-lock-number" data-lock-minutes>00</span>
          <span class="launch-lock-label">Minutes</span>
        </div>
        <div class="launch-lock-segment">
          <span class="launch-lock-number" data-lock-seconds>00</span>
          <span class="launch-lock-label">Seconds</span>
        </div>
      </div>
      <p class="launch-lock-footnote">All products are made in Farmington Hills, Michigan. The lock will disappear automatically as soon as launch time arrives.</p>
    </div>
  `;

  const daysNode = overlay.querySelector('[data-lock-days]');
  const hoursNode = overlay.querySelector('[data-lock-hours]');
  const minutesNode = overlay.querySelector('[data-lock-minutes]');
  const secondsNode = overlay.querySelector('[data-lock-seconds]');

  const releaseLock = () => {
    window.clearInterval(timer);
    overlay.remove();
    document.body.classList.remove('launch-locked');
  };

  const renderCountdown = () => {
    const remaining = launchAt.getTime() - Date.now();
    if (remaining <= 0) {
      releaseLock();
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysNode.textContent = formatSegment(days);
    hoursNode.textContent = formatSegment(hours);
    minutesNode.textContent = formatSegment(minutes);
    secondsNode.textContent = formatSegment(seconds);
  };

  const attachOverlay = () => {
    document.body.classList.add('launch-locked');
    document.body.appendChild(overlay);
    renderCountdown();
  };

  const timer = window.setInterval(renderCountdown, 1000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachOverlay, { once: true });
  } else {
    attachOverlay();
  }
})();
