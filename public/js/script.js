const toggleButton = document.querySelector('.toggle-button');
const body = document.body;

toggleButton.addEventListener('click', function () {
	body.classList.toggle('dark-mode');
	toggleButton.innerHTML = body.classList.contains('dark-mode')
	? '<i class="fas fa-sun"></i>' // Icône lune pour le mode sombre
	: '<i class="fas fa-moon"></i>'; // Icone soleil pour le mode clair
});
