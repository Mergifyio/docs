import { useEffect, useState } from 'react';
import './HeaderButton.css';
import './SidebarToggle.css';

const MenuToggle = () => {
  const [open, setOpen] = useState(false);
  // Some layouts (e.g. 404.astro) render the Header without #left-sidebar.
  // Only set aria-controls when the controlled element actually exists.
  const [hasSidebar, setHasSidebar] = useState(false);

  useEffect(() => {
    setHasSidebar(!!document.getElementById('left-sidebar'));
  }, []);

  useEffect(() => {
    if (!hasSidebar) return;
    document.body.classList.toggle('mobile-sidebar-toggle', open);
  }, [open, hasSidebar]);

  // ESC + backdrop click both close the drawer.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    const handleBackdrop = () => setOpen(false);
    window.addEventListener('keydown', handleKey);
    backdrop?.addEventListener('click', handleBackdrop);
    return () => {
      window.removeEventListener('keydown', handleKey);
      backdrop?.removeEventListener('click', handleBackdrop);
    };
  }, [open]);

  // Keep tab order + a11y tree in sync with the drawer state. On mobile,
  // the closed drawer hides the sidebar from interaction; the open drawer
  // is modal, so the rest of the page (main + footer) becomes inert.
  useEffect(() => {
    if (!hasSidebar) return;
    const mq = window.matchMedia('(max-width: 49.999em)');
    const sidebar = document.getElementById('left-sidebar');
    const mainContent = document.getElementById('main-content');
    const footer = document.querySelector<HTMLElement>('.main-column-footer');

    const updateInert = () => {
      const isMobile = mq.matches;
      sidebar?.toggleAttribute('inert', isMobile && !open);
      mainContent?.toggleAttribute('inert', isMobile && open);
      footer?.toggleAttribute('inert', isMobile && open);
    };

    updateInert();
    mq.addEventListener('change', updateInert);
    return () => {
      mq.removeEventListener('change', updateInert);
      sidebar?.removeAttribute('inert');
      mainContent?.removeAttribute('inert');
      footer?.removeAttribute('inert');
    };
  }, [open, hasSidebar]);

  return (
    <button
      id="menu-toggle"
      className="header-button"
      type="button"
      aria-pressed={open ? 'true' : 'false'}
      aria-expanded={open ? 'true' : 'false'}
      aria-controls={hasSidebar ? 'left-sidebar' : undefined}
      aria-label={open ? 'Close sidebar' : 'Open sidebar'}
      onClick={() => setOpen(!open)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        {open ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 6l12 12M6 18L18 6"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
};

export default MenuToggle;
