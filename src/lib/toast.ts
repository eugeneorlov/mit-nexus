let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (container && document.body.contains(container)) return container;

  container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    zIndex: '9999',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    pointerEvents: 'none',
    width: 'calc(100vw - 2rem)',
    maxWidth: '24rem',
  });
  document.body.appendChild(container);
  return container;
}

export function toast(
  message: string,
  type: 'error' | 'success' | 'info' = 'error'
) {
  const c = getContainer();

  const bg =
    type === 'error'
      ? '#EF4444'
      : type === 'success'
        ? '#22C55E'
        : '#3B82F6';

  const el = document.createElement('div');
  Object.assign(el.style, {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    color: 'white',
    pointerEvents: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transform: 'translateX(100%)',
    opacity: '0',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    background: bg,
  });
  el.textContent = message;

  c.appendChild(el);

  // Trigger enter animation
  requestAnimationFrame(() => {
    el.style.transform = 'translateX(0)';
    el.style.opacity = '1';
  });

  // Auto-remove after 4s
  setTimeout(() => {
    el.style.transform = 'translateX(100%)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}
