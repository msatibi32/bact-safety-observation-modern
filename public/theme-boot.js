try {
  var theme = localStorage.getItem('soc_theme') || 'dark'
  if (theme !== 'dark' && theme !== 'light') theme = 'dark'
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
} catch (e) {}
