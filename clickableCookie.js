const bigCookie = document.querySelector('.cookie');
if (bigCookie) {
	function randomFloat(max, min = 0) {
		return Math.random() * (max - min) + min;
	}

	class Cookie {
		constructor(x, y) {
			this.elem = document.createElement('div');
			this.elem.classList.add('cookieBits');
			this.opacity = 1;
			this.size = randomFloat(30, 30);
			this.pos = { x: x - this.size / 2, y: y - this.size / 2 };
			this.vel =
				Math.random() < 0.1
					? { x: randomFloat(30, -30), y: randomFloat(-40) }
					: { x: randomFloat(5, -5), y: randomFloat(-10) };
			this.elem.style.setProperty('--left', `${x}px`);
			this.elem.style.setProperty('--top', `${y}px`);
			this.elem.style.setProperty('--size', `${this.size}px`);
			this.elem.style.setProperty('--rotation', `${Math.random() * 360}deg`);
		}
		update() {
			if (this.isDead) return;
			this.pos.x += this.vel.x;
			this.pos.y += this.vel.y;
			// Constrain from screen edges
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
			// when on floor
			if (this.pos.y + this.size >= innerHeight) {
				this.vel.x = this.vel.x * 0.9; // Dampen speed
				this.opacity -= 0.004; // Lower opacity
				this.elem.style.opacity = this.opacity;
			}
			this.vel.y += 1; // Gravity
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
		smallCookies = smallCookies.filter((cookie) => {
			cookie.update();
			return !cookie.isDead;
		});
		requestAnimationFrame(loop);
	})();
}
