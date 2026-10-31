(() => {
  'use strict';

  function initializeDeck() {
    const deck = document.querySelector('#deck');
    if (!deck) return;

    const slides = Array.from(deck.querySelectorAll('section.slide'));
    if (!slides.length) return;

    const controls = {
      mode: document.querySelector('#mode-toggle'),
      contents: document.querySelector('#contents-toggle'),
      notes: document.querySelector('#notes-toggle'),
      fullscreen: document.querySelector('#fullscreen-toggle'),
      print: document.querySelector('#print-button'),
      previous: document.querySelector('#previous'),
      next: document.querySelector('#next'),
      number: document.querySelector('#slide-number'),
      title: document.querySelector('#slide-title'),
      progress: document.querySelector('#progress-fill'),
      dots: document.querySelector('#slide-dots'),
      dialog: document.querySelector('#contents-dialog'),
      closeContents: document.querySelector('#contents-close'),
      notesPanel: document.querySelector('#notes-panel'),
      notesContent: document.querySelector('#notes-content'),
      toast: document.querySelector('#toast')
    };
    const presentationQuery = window.matchMedia('(min-width: 760px) and (min-height: 600px)');
    let mode = 'reading';
    let selectedMode = false;
    let current = 0;
    let notesOpen = false;
    let toastTimer;
    let navigationTarget = null;
    let navigationTimer;
    let initialPositionReady = false;

    function titleOf(index) {
      return slides[index].dataset.title || slides[index].querySelector('h1, h2')?.textContent.trim() || `Slide ${index + 1}`;
    }

    function indexFromHash() {
      let id;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return -1;
      }
      return slides.findIndex(slide => slide.id === id);
    }

    function setButtonLabel(button, label) {
      if (!button) return;
      button.setAttribute('aria-label', label);
      button.title = label;
      const labelElement = button.querySelector('[data-button-label], .button-label');
      if (labelElement) labelElement.textContent = label;
      else button.textContent = label;
    }

    function updateHash(index, push) {
      if (!slides[index].id) return;
      const hash = `#${encodeURIComponent(slides[index].id)}`;
      if (window.location.hash === hash) return;
      try {
        window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', hash);
      } catch {
        // Keep navigation usable where history changes are restricted.
      }
    }

    function refreshNotes() {
      if (!controls.notesContent) return;
      const template = slides[current].querySelector('template.speaker-notes');
      controls.notesContent.replaceChildren();
      if (template) controls.notesContent.append(template.content.cloneNode(true));
      else {
        const message = document.createElement('p');
        message.textContent = 'No speaker notes for this slide.';
        controls.notesContent.append(message);
      }
    }

    function refreshControls() {
      slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === current);
        // CSS owns visibility, including the all-slides print layout.
        slide.removeAttribute('hidden');
      });
      if (controls.number) controls.number.textContent = `${current + 1} / ${slides.length}`;
      if (controls.title) controls.title.textContent = titleOf(current);
      if (controls.progress) controls.progress.style.width = `${((current + 1) / slides.length) * 100}%`;
      if (controls.previous) controls.previous.disabled = current === 0;
      if (controls.next) controls.next.disabled = current === slides.length - 1;
      controls.dots?.querySelectorAll('button[data-slide]').forEach(button => {
        const active = Number(button.dataset.slide) === current;
        button.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      controls.dialog?.querySelectorAll('.contents-list a').forEach(link => {
        const active = link.hash === `#${slides[current].id}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      refreshNotes();
    }

    function scrollToSlide(index, smooth = true) {
      navigationTarget = index;
      window.clearTimeout(navigationTimer);
      navigationTimer = window.setTimeout(() => { navigationTarget = null; }, 1400);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      slides[index].scrollIntoView({
        block: 'start',
        behavior: smooth && !reducedMotion ? 'smooth' : 'instant'
      });
    }

    function activate(index, { scroll = false, push = false, writeHash = true, smooth = true } = {}) {
      const next = Math.max(0, Math.min(slides.length - 1, index));
      if (next !== current) {
        current = next;
        refreshControls();
      }
      if (writeHash) updateHash(current, push);
      if (scroll && mode === 'reading') scrollToSlide(current, smooth);
    }

    function setMode(nextMode, { scroll = false } = {}) {
      mode = nextMode;
      document.body.classList.toggle('present', mode === 'present');
      document.body.classList.toggle('reading', mode === 'reading');
      if (controls.mode) {
        controls.mode.setAttribute('aria-pressed', String(mode === 'present'));
        setButtonLabel(controls.mode, mode === 'present' ? 'Reading view' : 'Slide view');
      }
      if (scroll && mode === 'reading') {
        window.requestAnimationFrame(() => scrollToSlide(current, false));
      }
    }

    function setNotes(open) {
      notesOpen = open;
      if (controls.notesPanel) controls.notesPanel.hidden = !open;
      if (controls.notes) {
        controls.notes.setAttribute('aria-expanded', String(open));
        controls.notes.setAttribute('aria-pressed', String(open));
        setButtonLabel(controls.notes, open ? 'Hide notes' : 'Show notes');
      }
      document.body.classList.toggle('notes-open', open);
      // Updating notes must never navigate or scroll the slide beneath them.
    }

    function showToast(message) {
      if (!controls.toast) return;
      window.clearTimeout(toastTimer);
      controls.toast.textContent = message;
      controls.toast.hidden = false;
      toastTimer = window.setTimeout(() => {
        controls.toast.hidden = true;
        controls.toast.textContent = '';
      }, 4000);
    }

    function closeContents({ restoreFocus = true } = {}) {
      const dialog = controls.dialog;
      if (!dialog?.open) return;
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      controls.contents?.setAttribute('aria-expanded', 'false');
      if (restoreFocus) controls.contents?.focus({ preventScroll: true });
    }

    function openContents() {
      const dialog = controls.dialog;
      if (!dialog) return;
      if (dialog.open) {
        closeContents();
        return;
      }
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      controls.contents?.setAttribute('aria-expanded', 'true');
      controls.closeContents?.focus({ preventScroll: true });
    }

    function refreshFullscreen() {
      const full = Boolean(document.fullscreenElement);
      if (controls.fullscreen) controls.fullscreen.setAttribute('aria-pressed', String(full));
      setButtonLabel(controls.fullscreen, full ? 'Exit full screen' : 'Full screen');
    }

    async function toggleFullscreen() {
      try {
        if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
          await document.exitFullscreen();
        } else if (document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === 'function') {
          await document.documentElement.requestFullscreen();
        } else {
          showToast('Full screen is unavailable in this browser. Slide view is still available.');
        }
      } catch {
        showToast('Full screen could not open. Slide view is still available.');
      }
      refreshFullscreen();
    }

    controls.mode?.addEventListener('click', () => {
      selectedMode = true;
      setMode(mode === 'present' ? 'reading' : 'present', { scroll: true });
    });
    controls.previous?.addEventListener('click', () => activate(current - 1, { scroll: true, push: true }));
    controls.next?.addEventListener('click', () => activate(current + 1, { scroll: true, push: true }));
    controls.notes?.addEventListener('click', () => setNotes(!notesOpen));
    controls.contents?.addEventListener('click', openContents);
    controls.closeContents?.addEventListener('click', () => closeContents());
    controls.print?.addEventListener('click', () => window.print());
    controls.fullscreen?.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', refreshFullscreen);

    controls.dots?.querySelectorAll('button[data-slide]').forEach(button => {
      const index = Number(button.dataset.slide);
      if (!Number.isInteger(index) || !slides[index]) return;
      button.setAttribute('aria-label', `Go to slide ${index + 1}: ${titleOf(index)}`);
      button.addEventListener('click', () => activate(index, { scroll: true, push: true }));
    });

    controls.dialog?.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('.contents-list a[href^="#"]') : null;
      if (link) {
        let id;
        try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
        const index = slides.findIndex(slide => slide.id === id);
        if (index < 0) return;
        event.preventDefault();
        closeContents();
        activate(index, { scroll: true, push: true });
      } else if (event.target === controls.dialog) {
        const rect = controls.dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          closeContents();
        }
      }
    });
    controls.dialog?.addEventListener('cancel', event => {
      event.preventDefault();
      closeContents();
    });
    controls.dialog?.addEventListener('close', () => controls.contents?.setAttribute('aria-expanded', 'false'));

    function followHash() {
      const index = indexFromHash();
      if (index >= 0) activate(index, { scroll: mode === 'reading', writeHash: false, smooth: false });
    }
    window.addEventListener('hashchange', followHash);
    window.addEventListener('popstate', followHash);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (document.fullscreenElement) {
          event.preventDefault();
          toggleFullscreen();
        } else if (controls.dialog?.open || notesOpen) {
          event.preventDefault();
          closeContents();
          setNotes(false);
        }
        return;
      }
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      if (controls.dialog?.open) return;
      const target = event.target instanceof Element ? event.target : null;
      const activeElement = document.activeElement instanceof Element ? document.activeElement : null;
      const interactive = 'input, textarea, select, button, a, summary, audio, video, [role="button"], [role="link"], [role="slider"], [contenteditable]:not([contenteditable="false"])';
      if (target?.closest(interactive) || activeElement?.closest(interactive)) return;

      let index;
      if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key)) index = current + 1;
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) index = current - 1;
      else if (event.key === ' ' || event.key === 'Spacebar') index = current + (event.shiftKey ? -1 : 1);
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = slides.length - 1;
      else return;
      event.preventDefault();
      activate(index, { scroll: true, push: true });
    });

    if ('IntersectionObserver' in window) {
      const visible = new Map();
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => visible.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
        if (!initialPositionReady || mode !== 'reading' || controls.dialog?.open) return;
        if (navigationTarget !== null) {
          if ((visible.get(slides[navigationTarget]) || 0) < 0.5) return;
          navigationTarget = null;
          window.clearTimeout(navigationTimer);
        }
        let best = current;
        let ratio = 0;
        slides.forEach((slide, index) => {
          const nextRatio = visible.get(slide) || 0;
          if (nextRatio > ratio) {
            ratio = nextRatio;
            best = index;
          }
        });
        if (ratio > 0 && best !== current) activate(best);
      }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
      slides.forEach(slide => observer.observe(slide));
    }

    const onViewportChange = () => {
      if (!selectedMode) setMode(presentationQuery.matches ? 'present' : 'reading');
    };
    if (typeof presentationQuery.addEventListener === 'function') presentationQuery.addEventListener('change', onViewportChange);
    else if (typeof presentationQuery.addListener === 'function') presentationQuery.addListener(onViewportChange);

    const fragmentIndex = indexFromHash();
    current = fragmentIndex >= 0 ? fragmentIndex : 0;
    setMode(presentationQuery.matches ? 'present' : 'reading');
    refreshControls();
    setNotes(false);
    refreshFullscreen();
    if (controls.contents) controls.contents.setAttribute('aria-expanded', 'false');
    if (controls.toast) controls.toast.hidden = true;
    // Preserve native initial-fragment positioning; do not scroll or rewrite it.
    document.body.classList.add('deck-ready');
    const allowObservedNavigation = () => window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => { initialPositionReady = true; });
    });
    if (document.readyState === 'complete') allowObservedNavigation();
    else window.addEventListener('load', allowObservedNavigation, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeDeck, { once: true });
  else initializeDeck();
})();
