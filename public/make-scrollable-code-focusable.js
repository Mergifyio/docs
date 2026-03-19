function makeFocusable() {
  Array.from(document.getElementsByTagName('pre')).forEach((element) => {
    element.setAttribute('tabindex', '0');
  });
}

makeFocusable();
document.addEventListener('astro:after-swap', makeFocusable);
