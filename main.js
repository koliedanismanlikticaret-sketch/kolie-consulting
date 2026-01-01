'use strict';

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function setLanguage(lang) {
  const supported = ['fr', 'en', 'tr'];
  if (!supported.includes(lang)) lang = 'fr';

  // Text nodes
  qsa('[data-lang]').forEach(el => {
    const key = el.getAttribute('data-lang');
    if (window.translations?.[lang]?.[key] !== undefined) {
      el.innerHTML = window.translations[lang][key];
    } else if (window.translations?.fr?.[key] !== undefined) {
      el.innerHTML = window.translations.fr[key];
    }
  });

  // Placeholders
  qsa('[data-lang-placeholder]').forEach(el => {
    const key = el.getAttribute('data-lang-placeholder');
    if (window.translations?.[lang]?.[key] !== undefined) {
      el.setAttribute('placeholder', window.translations[lang][key]);
    } else if (window.translations?.fr?.[key] !== undefined) {
      el.setAttribute('placeholder', window.translations.fr[key]);
    }
  });

  document.documentElement.lang = lang;
  localStorage.setItem('language', lang);

  // Update dropdown visual
  const selected = qs('.selected-lang');
  const info = {
    fr: { img: 'https://flagcdn.com/w40/fr.png', alt: 'Français' },
    en: { img: 'https://flagcdn.com/w40/gb.png', alt: 'English' },
    tr: { img: 'https://flagcdn.com/w40/tr.png', alt: 'Türkçe' }
  };
  if (selected) selected.innerHTML = `<img src="${info[lang].img}" alt="${info[lang].alt}"> <i class="fas fa-caret-down"></i>`;

  const options = qs('.lang-options');
  if (options) options.style.display = 'none';
}

function setupLanguage() {
  const savedLang = localStorage.getItem('language');
  const browserLang = (navigator.language || 'fr').split('-')[0];
  const supported = ['fr', 'en', 'tr'];

  let initial = 'fr';
  if (savedLang && supported.includes(savedLang)) initial = savedLang;
  else if (supported.includes(browserLang)) initial = browserLang;

  setLanguage(initial);

  // Dropdown open/close
  const selector = qs('.lang-selector');
  const selected = qs('.selected-lang');
  const options = qs('.lang-options');

  if (selected && options) {
    selected.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      options.style.display = (options.style.display === 'block') ? 'none' : 'block';
    });
  }

  // Click outside closes
  document.addEventListener('click', (e) => {
    if (selector && options && !selector.contains(e.target)) {
      options.style.display = 'none';
    }
  });

  // Language option links (replaces inline onclick)
  qsa('.lang-options a[data-set-lang]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = a.getAttribute('data-set-lang');
      setLanguage(lang);
    });
  });
}

function setupFadeIn() {
  const sections = qsa('.fade-in-section');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: '0px', threshold: 0.1 });

  sections.forEach(s => observer.observe(s));
}

function setupMobileMenu() {
  const btn = qs('.mobile-menu');
  const links = qs('.nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => links.classList.toggle('active'));
  qsa('.nav-links a').forEach(a => a.addEventListener('click', () => links.classList.remove('active')));
}

function setupHeaderShadow() {
  const header = qs('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.style.boxShadow = (window.scrollY > 100)
      ? '0 5px 20px rgba(0,0,0,0.1)'
      : '0 2px 10px rgba(0,0,0,0.1)';
  });
}

function setupChatbot() {
  const toggle = qs('#chatbotToggle');
  const win = qs('#chatbotWindow');
  const close = qs('#chatbotClose');
  const messages = qs('#chatbotMessages');
  const input = qs('#chatbotInput');
  const sendBtn = qs('#chatbotSend');
  const quick = qs('#quickOptions');

  if (!toggle || !win || !close || !messages || !input || !sendBtn) return;

  toggle.addEventListener('click', () => {
    win.style.display = (win.style.display === 'flex') ? 'none' : 'flex';
  });
  close.addEventListener('click', () => { win.style.display = 'none'; });

  function addMessage(text, sender) {
    const el = document.createElement('div');
    el.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    el.innerHTML = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('message', 'bot-message', 'typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(indicator);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = qs('.typing-indicator');
    if (indicator) indicator.remove();
  }

  function getBotResponse(message) {
    const currentLang = document.documentElement.lang || 'fr';
    const responses = window.translations?.[currentLang]?.chatbot_responses || window.translations?.fr?.chatbot_responses || {};
    const text = (message || '').toLowerCase();

    const keywordMap = {
      services: '#services',
      partenaires: '#partenaires',
      contact: '#contact',
      étudiants: '#services',
      'à propos': '#apropos',
      galerie: '#galerie',
      blog: '#blog'
    };

    for (const keyword in responses) {
      if (text.includes(keyword)) return { text: responses[keyword], action: keywordMap[keyword] || null };
    }
    return { text: responses.default || "Je suis là pour vous aider. Posez votre question 😊", action: null };
  }

  function handleBotResponse(message) {
    const response = getBotResponse(message);
    addMessage(response.text, 'bot');

    if (response.action) {
      const section = qs(response.action);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    addTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      handleBotResponse(message);
    }, 900);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

  if (quick) {
    quick.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-option');
      if (!btn) return;
      const question = btn.getAttribute('data-question') || btn.textContent;
      addMessage(question, 'user');
      addTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        handleBotResponse(question);
      }, 900);
    });
  }
}

function setupPartnerLogoUpload() {
  const input = qs('#partner-logo-upload');
  const container = qs('#partnersLogosContainer');
  const msg = qs('#noLogosMsg');
  if (!input || !container) return;

  input.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (msg) msg.style.display = 'none';

      const logoBox = document.createElement('div');
      logoBox.className = 'partner-logo';

      const img = document.createElement('img');
      img.src = String(ev.target.result);
      img.alt = 'Logo partenaire';
      logoBox.appendChild(img);

      container.appendChild(logoBox);
      input.value = '';
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupLanguage();
  setupFadeIn();
  setupMobileMenu();
  setupHeaderShadow();
  setupChatbot();
  setupPartnerLogoUpload();
});
