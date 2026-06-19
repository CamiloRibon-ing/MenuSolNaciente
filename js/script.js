document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (preloader) preloader.classList.add('hide');
    }, 600);
  });

  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('navbar');

  if (!toggle) console.warn('menu-toggle no encontrado (id="menu-toggle")');
  if (!nav) console.warn('navbar no encontrado (id="navbar")');

  function ajustarAdminBtn() {
    if (!nav) return;
    const adminMobile = nav.querySelector('.admin-link-mobile');
    if (!adminMobile) return;
    adminMobile.style.display = window.innerWidth > 768 ? 'none' : 'block';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle('show');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && window.innerWidth <= 768) {
        nav.classList.remove('show');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        nav.classList.remove('show');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
      ajustarAdminBtn();
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && nav.classList.contains('show')) {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
          nav.classList.remove('show');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });

    ajustarAdminBtn();
  }

  const btnVolverArriba = document.getElementById('btn-volver-arriba');
  if (btnVolverArriba) {
    window.addEventListener('scroll', () => {
      btnVolverArriba.classList.toggle('visible', window.scrollY > 520);
    }, { passive: true });

    btnVolverArriba.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});

const buttons = document.querySelectorAll('.floating-btn');
const nequiModal = document.getElementById('nequiModal');
const nequiBtn = document.getElementById('btn-nequi');
const closeModal = document.getElementById('closeModal');

if (nequiBtn && nequiModal) {
  nequiBtn.addEventListener('click', () => {
    nequiModal.classList.add('show');
  });
}

if (closeModal && nequiModal) {
  closeModal.addEventListener('click', () => {
    nequiModal.classList.remove('show');
  });
}

const btnBanco = document.getElementById('btn-bancolombia');
const bancoModal = document.getElementById('bancoModal');
const closeBanco = document.getElementById('closeBanco');

if (btnBanco && bancoModal) {
  btnBanco.addEventListener('click', () => {
    bancoModal.classList.add('show');
  });
}

if (closeBanco && bancoModal) {
  closeBanco.addEventListener('click', () => {
    bancoModal.classList.remove('show');
  });
}

window.addEventListener('click', (e) => {
  if (e.target === nequiModal) nequiModal.classList.remove('show');
  if (e.target === bancoModal) bancoModal.classList.remove('show');
});

setInterval(() => {
  buttons.forEach((btn, index) => {
    setTimeout(() => {
      btn.classList.add('shake');
      setTimeout(() => {
        btn.classList.remove('shake');
      }, 600);
    }, index * 500);
  });
}, 8000);
