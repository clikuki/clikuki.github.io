const navbarLinks = document.querySelector('.navbar .links .list');
if (navbarLinks) {
	const curNavbarLink = navbarLinks.querySelector('[data-current-page]');
	if (curNavbarLink) {
		curNavbarLink.addEventListener('click', (e) => {
			e.preventDefault();
		});
	}
}
