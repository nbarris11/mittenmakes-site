(function () {
  const REVIEWS_APP_URL = 'https://mittenmakes-reviews.vercel.app';
  const feedRoot = document.querySelector('[data-reviews-feed]');

  if (!feedRoot) return;

  const summaryNode = feedRoot.querySelector('[data-reviews-summary]');
  const gridNode = feedRoot.querySelector('[data-reviews-grid]');
  const emptyNode = feedRoot.querySelector('[data-reviews-empty]');
  const lightboxNode = document.querySelector('[data-review-lightbox]');
  const lightboxImage = lightboxNode?.querySelector('img');

  function formatDate(value) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
  }

  function renderStars(value) {
    const rounded = Math.round(Number(value) || 0);
    return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
  }

  function averageOverall(reviews) {
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, review) => sum + Number(review.ratingOverall || 0), 0);
    return (total / reviews.length).toFixed(1);
  }

  function openLightbox(src, alt) {
    if (!lightboxNode || !lightboxImage) return;
    lightboxImage.src = src;
    lightboxImage.alt = alt || 'Customer review photo';
    lightboxNode.classList.add('open');
    document.body.classList.add('lightbox-open');
  }

  function closeLightbox() {
    if (!lightboxNode || !lightboxImage) return;
    lightboxNode.classList.remove('open');
    lightboxImage.src = '';
    document.body.classList.remove('lightbox-open');
  }

  lightboxNode?.addEventListener('click', event => {
    if (event.target === lightboxNode || event.target.closest('[data-review-lightbox-close]')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeLightbox();
  });

  fetch(`${REVIEWS_APP_URL}/api/public/reviews?limit=12`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }
      return response.json();
    })
    .then(payload => {
      const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];

      if (!reviews.length) {
        if (emptyNode) emptyNode.hidden = false;
        if (summaryNode) summaryNode.hidden = true;
        return;
      }

      const avg = averageOverall(reviews);
      if (summaryNode) {
        summaryNode.hidden = false;
        summaryNode.innerHTML = `
          <div class="reviews-feed-score">${avg}</div>
          <div>
            <div class="reviews-feed-stars" aria-label="${avg} out of 5 stars">${renderStars(avg)}</div>
            <p class="reviews-feed-summary-copy">${reviews.length} verified buyer review${reviews.length === 1 ? '' : 's'} so far</p>
          </div>
        `;
      }

      gridNode.innerHTML = reviews.map((review, index) => {
        const theme = ['theme-peach', 'theme-mint', 'theme-lilac'][index % 3];
        const initials = review.customerName
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map(part => part[0] || '')
          .join('')
          .toUpperCase();
        const photos = Array.isArray(review.photoUrls) ? review.photoUrls.slice(0, 4) : [];

        return `
          <article class="reviews-feed-card">
            <div class="reviews-feed-header">
              <div class="reviews-feed-meta">
                <div class="reviews-feed-avatar ${theme}">${initials}</div>
                <div>
                  <div class="reviews-feed-name-row">
                    <span class="reviews-feed-name">${review.customerName}</span>
                    <span class="reviews-feed-badge">Verified buyer</span>
                  </div>
                  <p class="reviews-feed-product">${review.productName}</p>
                  <p class="reviews-feed-variant">${review.color}</p>
                </div>
              </div>
              <div class="reviews-feed-date">${formatDate(review.createdAt)}</div>
            </div>
            <div class="reviews-feed-rating-row">
              <span class="reviews-feed-stars" aria-label="${review.ratingOverall} out of 5 stars">${renderStars(review.ratingOverall)}</span>
              <span class="reviews-feed-rating-number">${Number(review.ratingOverall).toFixed(1)}/5</span>
            </div>
            ${review.reviewText ? `<p class="reviews-feed-text">${review.reviewText}</p>` : ''}
            ${photos.length ? `
              <div class="reviews-feed-photos">
                ${photos.map(photo => `
                  <button type="button" class="reviews-feed-photo-button" data-review-photo="${photo}">
                    <img src="${photo}" alt="Customer photo for ${review.productName}">
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </article>
        `;
      }).join('');

      gridNode.querySelectorAll('[data-review-photo]').forEach(button => {
        button.addEventListener('click', () => {
          const src = button.getAttribute('data-review-photo');
          const alt = button.querySelector('img')?.alt || 'Customer review photo';
          if (src) openLightbox(src, alt);
        });
      });
    })
    .catch(() => {
      if (emptyNode) {
        emptyNode.hidden = false;
        emptyNode.textContent = 'Reviews are loading a little slowly right now. Please check back in a minute.';
      }
      if (summaryNode) summaryNode.hidden = true;
    });
})();
