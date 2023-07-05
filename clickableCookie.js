const bigCookie = document.querySelector('.cookie');
if (bigCookie) {
	function randomFloat(min, max) {
		return Math.random() * (max - min) + min;
	}

	class CookieBit {
		constructor(x, y) {
			this.elem = document.createElement('div');
			this.elem.classList.add('cookieBit');
			this.opacity = 1;
			this.size = randomFloat(30, 30);
			this.pos = { x: x - this.size / 2, y: y - this.size / 2 };
			this.vel =
				Math.random() < 0.1 // 10% chance of a stronger velocity
					? { x: randomFloat(-30, 30), y: randomFloat(0, -30) }
					: { x: randomFloat(-5, 5), y: randomFloat(0, -10) };
			this.elem.style.setProperty('--left', `${this.pos.x}px`);
			this.elem.style.setProperty('--top', `${this.pos.y}px`);
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

			// Gravity
			this.vel.y += 1;

			this.elem.style.setProperty('--left', `${this.pos.x}px`);
			this.elem.style.setProperty('--top', `${this.pos.y}px`);

			this.isDead = this.opacity <= 0;
			if (this.isDead) this.elem.remove();
		}
	}

	class SplashBit {
		constructor(x, y, dir) {
			this.elem = document.createElement('div');
			this.elem.classList.add('splashBit');
			this.size = 10;
			this.pos = { x: x - this.size / 2, y: y - this.size / 2 };
			this.vel = {
				x: dir[0] * randomFloat(0.3, 2),
				y: dir[1] * randomFloat(0.3, 3),
			};
			this.opacity = 1;
			this.elem.style.setProperty(
				'--offset-left',
				`${randomFloat(-this.size / 2, this.size / 2)}px`,
			);
			this.elem.style.setProperty(
				'--offset-top',
				`${randomFloat(-this.size / 2, this.size / 2)}px`,
			);
			this.elem.style.setProperty('--left', `${this.pos.x}px`);
			this.elem.style.setProperty('--top', `${this.pos.y}px`);
			this.elem.style.setProperty('--size', `${this.size}px`);
		}
		update() {
			if (this.isDead) return;
			this.opacity -= 0.04;
			this.pos.x += this.vel.x;
			this.pos.y += this.vel.y;
			this.vel.y += 0.2; // Gravity

			this.elem.style.opacity = this.opacity;
			this.elem.style.setProperty('--left', `${this.pos.x}px`);
			this.elem.style.setProperty('--top', `${this.pos.y}px`);
			this.elem.style.setProperty('--size', `${this.size}px`);

			this.isDead = this.opacity <= 0 || this.pos.y < 0;
			if (this.isDead) this.elem.remove();
		}
	}

	bigCookie.classList.add('jsEnabled');
	const cookieBits = [];
	const cracks = [];
	const cookieContainer = document.createElement('div');
	cookieContainer.classList.add('cookieBitContainer');
	document.body.appendChild(cookieContainer);

	bigCookie.addEventListener('click', (e) => {
		const bigCookiePos = bigCookie.getBoundingClientRect();
		const crack = {
			opacity: 1,
			img: document.createElement('img'),
		};
		const crackSize = 30;
		crack.img.src = 'assets/crack.png';
		crack.img.classList.add('cookieCrack');
		crack.img.style.setProperty('--size', `${crackSize}px`);
		crack.img.style.setProperty(
			'--left',
			`${e.pageX - crackSize / 2 - bigCookiePos.x}px`,
		);
		crack.img.style.setProperty(
			'--top',
			`${e.pageY - crackSize / 2 - bigCookiePos.y}px`,
		);
		crack.img.style.setProperty('--rotation', `${randomFloat(0, 359)}deg`);
		bigCookie.appendChild(crack.img);
		cracks.push(crack);

		const cookieBit = new CookieBit(e.pageX, e.pageY);
		cookieContainer.appendChild(cookieBit.elem);
		cookieBits.push(cookieBit);

		// Create 2 splash bits at each of the 4 diagonals
		for (const x of [-1, 1]) {
			for (const y of [-1, 1]) {
				for (let i = 0; i < 2; i++) {
					const splashBit = new SplashBit(e.pageX, e.pageY, [x, y]);
					cookieContainer.appendChild(splashBit.elem);
					cookieBits.push(splashBit);
				}
			}
		}

		if (bigCookie.classList.contains('shake'))
			bigCookie.classList.remove('shake');
		setTimeout(() => bigCookie.classList.add('shake'));
	});

	bigCookie.addEventListener('animationend', () => {
		bigCookie.classList.remove('shake');
	});

	(function loop() {
		for (let i = 0; i < cookieBits.length; i++) {
			cookieBits[i].update();
			if (cookieBits[i].isDead) {
				const last = cookieBits.length - 1;
				[cookieBits[i--], cookieBits[last]] = [cookieBits[last], cookieBits[i]];
				cookieBits.pop();
			}
		}
		for (let i = 0; i < cracks.length; i++) {
			const crack = cracks[i];
			crack.opacity -= 0.02;
			crack.img.style.opacity = crack.opacity;
			const isDead = crack.opacity < 0;
			if (isDead) {
				crack.img.remove();
				const last = cracks.length - 1;
				[cracks[i--], cracks[last]] = [cracks[last], cracks[i]];
				cracks.pop();
			}
		}
		requestAnimationFrame(loop);
	})();
}
