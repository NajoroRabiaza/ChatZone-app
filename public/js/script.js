const toggleButton = document.querySelector('.toggle-button');
const body = document.body;

// Appliquer le thème sauvegardé au chargement de la page
if (localStorage.getItem('theme') === 'dark') {
	body.classList.add('dark-mode');
	toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
} else {
	toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
}

toggleButton.addEventListener('click', function () {
	body.classList.toggle('dark-mode');
	const isDark = body.classList.contains('dark-mode');
	toggleButton.innerHTML = isDark
		? '<i class="fas fa-sun"></i>'
		: '<i class="fas fa-moon"></i>';
	// Sauvegarder le choix
	localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
