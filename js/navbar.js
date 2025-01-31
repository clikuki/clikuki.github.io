// If clicked link leads to current page, don't reload
const navbarLinks = document.querySelector('header nav ul');
if (navbarLinks) {
	const curNavbarLink = navbarLinks.querySelector('[data-current-page]');
	if (curNavbarLink) {
		curNavbarLink.addEventListener('click', (e) => {
			e.preventDefault();
		});
	}
}
