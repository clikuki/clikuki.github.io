const bigCookie = document.querySelector('.bigCookie');
if (bigCookie) {
	function randomInt(max, min = 0) {
		return Math.floor(Math.random() * (max - min) + min);
	}

	class Cookie {
		constructor(x, y) {
			this.elem = document.createElement('div');
			this.elem.classList.add('smallCookie');
			this.opacity = 1;
			this.pos = { x, y };
			this.vel = { x: randomInt(5, -5), y: randomInt(-10) };
			this.size = randomInt(30, 10);
			this.elem.style.setProperty('--left', `${x}px`);
			this.elem.style.setProperty('--top', `${y}px`);
			this.elem.style.setProperty('--size', `${this.size}px`);
		}
		update() {
			if (this.isDead) return;
			this.pos.x += this.vel.x;
			this.pos.y += this.vel.y;
			if (this.pos.x < 0) {
				this.pos.x = 0;
				this.vel.x = -this.vel.x;
			} else if (this.pos.x + this.size > innerWidth) {
				this.pos.x = innerWidth - this.size;
				this.vel.x = -this.vel.x;
			}
			if (this.pos.y < 0) {
				this.pos.y = 0;
				this.vel.y = (-this.vel.y / 4) * 3; // Dampen bouncing
			} else if (this.pos.y + this.size > innerHeight) {
				this.pos.y = innerHeight - this.size;
				this.vel.y = (-this.vel.y / 4) * 3; // Dampen bouncing
			}
			if (this.pos.y + this.size >= innerHeight) {
				// Dampen speed when on floor
				this.vel.x = this.vel.x * 0.9;
			}
			this.vel.y += 1; // Gravity
			this.opacity -= 0.004; // Lower opacity on each frame
			this.elem.style.opacity = this.opacity;
			this.elem.style.setProperty('--left', `${this.pos.x}px`);
			this.elem.style.setProperty('--top', `${this.pos.y}px`);
			if (this.opacity <= 0) {
				this.isDead = true;
				this.elem.remove();
			}
		}
	}

	bigCookie.classList.add('jsEnabled');
	let smallCookies = [];
	const smallCookieContainer = document.createElement('div');
	document.body.appendChild(smallCookieContainer);
	bigCookie.addEventListener('click', (e) => {
		const smallCookie = new Cookie(e.pageX, e.pageY);
		smallCookieContainer.appendChild(smallCookie.elem);
		smallCookies.push(smallCookie);
	});
	(function loop() {
		smallCookies.forEach((cookie) => cookie.update());
		smallCookies.filter((cookie) => !cookie.isDead);
		requestAnimationFrame(loop);
	})();
}
