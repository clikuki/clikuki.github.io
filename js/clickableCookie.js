const bigCookie = document.querySelector('.cookie');
if (bigCookie) {
	function randomFloat(min, max) {
		return Math.random() * (max - min) + min;
	}

	bigCookie.classList.add('jsEnabled');
	const cookieBits = [];
	const cracks = [];
	let draggedBit;
	let timeOfClick = NaN;
	const waitBeforeDrag = 200;
	const mousePos = {
		x: NaN,
		y: NaN,
	};

	const cookieContainer = document.createElement('div');
	cookieContainer.classList.add('cookieBitContainer');
	document.body.appendChild(cookieContainer);

	bigCookie.addEventListener('click', (e) => {
		timeOfClick = Date.now();

		// Crack
		const crack = createCrack(e);
		bigCookie.appendChild(crack.img);
		cracks.push(crack);

		// Physics cookie bits
		const cookieBit = new CookieBit(e.pageX, e.pageY);
		cookieContainer.appendChild(cookieBit.elem);
		cookieBits.push(cookieBit);

		// Small splash bits
		// creates 2 bits at each diagonal
		for (const x of [-1, 1]) {
			for (const y of [-1, 1]) {
				for (let i = 0; i < 2; i++) {
					const splashBit = new SplashBit(e.pageX, e.pageY, [x, y]);
					cookieContainer.appendChild(splashBit.elem);
					cookieBits.push(splashBit);
				}
			}
		}

		if (bigCookie.classList.contains('shake')) {
			bigCookie.classList.remove('shake');
			setTimeout(() => bigCookie.classList.add('shake'));
		} else bigCookie.classList.add('shake');
	});

	bigCookie.addEventListener('animationend', () => {
		bigCookie.classList.remove('shake');
	});

	document.addEventListener('mouseup', () => {
		draggedBit = undefined;
		document.body.style.userSelect = 'auto';
		document.body.style.pointerEvents = 'all';
	});
	document.addEventListener('mousemove', ({ x, y }) => {
		mousePos.x = x;
		mousePos.y = y;
	});

	class CookieBit {
		constructor(x, y) {
			this.elem = document.createElement('div');
			this.elem.classList.add('cookieBit');
			this.opacity = 1;
			this.size = randomFloat(30, 50);
			this.rotation = randomFloat(0, 360);
			this.pos = { x: x - this.size / 2, y: y - this.size / 2 };
			const xDir = randomFloat(0, 10) <= 5 ? 1 : -1;
			this.vel =
				Math.random() < 0.1
					? {
							x: randomFloat(5, 20) * xDir,
							y: randomFloat(-5, -20),
					  }
					: {
							x: randomFloat(2, 10) * xDir,
							y: randomFloat(-2, -10),
					  };

			this.elem.addEventListener('mousedown', (e) => {
				if (timeOfClick + waitBeforeDrag > Date.now()) return;
				draggedBit = this;
				this.attractTowards(e.x, e.y);
				document.body.style.userSelect = 'none';
				document.body.style.pointerEvents = 'none';
			});

			this.elem.style.pointerEvents = 'none';
			setTimeout(() => (this.elem.style.pointerEvents = 'all'), waitBeforeDrag);

			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
			this.elem.style.width = `${this.size}px`;
			this.elem.style.opacity = String(this.opacity);
		}
		attractTowards(x, y) {
			this.vel.x = x - (this.pos.x + this.size / 2);
			this.vel.y = y - (this.pos.y + this.size / 2);
		}
		update() {
			if (this.opacity < 0) return;
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

			const onCeil = this.pos.y <= 0;
			const onFloor = this.pos.y + this.size >= innerHeight;
			const onLeft = this.pos.x <= 0;
			const onRight = this.pos.x + this.size >= innerWidth;
			if (draggedBit === this) {
				// Return opacity to normal when dragging
				if (this.opacity < 1) this.opacity += 0.1;

				// Rotate on edges, only when one edge is touching
				if (onCeil + onFloor + onLeft + onRight === 1) {
					const vel = onFloor || onCeil ? this.vel.x : this.vel.y;
					const dir = onFloor || onLeft ? 1 : -1;
					this.rotation += vel * 0.5 * dir;
				}
			} else if (onFloor) {
				this.vel.x = this.vel.x * 0.9; // Dampen speed
				this.rotation += this.vel.x * 0.5; // Fake floor rolling
				this.opacity -= 0.004; // Lower opacity
			} else {
				// When flying through air
				this.rotation += this.vel.x * 0.2;
			}

			// Add gravity last so that constraints don't affect it
			this.vel.y += 1;

			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
			this.elem.style.rotate = `${this.rotation}deg`;
			this.elem.style.opacity = String(this.opacity);
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
			const offset = {
				x: randomFloat(-this.size / 2, this.size / 2),
				y: randomFloat(-this.size / 2, this.size / 2),
			};
			this.elem.style.backgroundPosition = `${offset.x}px ${offset.y}px`;
			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
			this.elem.style.width = `${this.size}px`;
		}
		update() {
			if (this.opacity < 0) return;
			this.opacity -= 0.04;
			this.pos.x += this.vel.x;
			this.pos.y += this.vel.y;
			this.vel.y += 0.2; // Gravity

			this.elem.style.opacity = this.opacity;
			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
		}
	}

	function createCrack(e) {
		const bigCookiePos = bigCookie.getBoundingClientRect();
		const crack = {
			opacity: 1,
			img: document.createElement('img'),
		};
		const crackSize = 30;
		crack.img.src = 'assets/crack.png';
		crack.img.classList.add('cookieCrack');
		crack.img.style.width = `${crackSize}px`;
		crack.img.style.left = `${e.pageX - crackSize / 2 - bigCookiePos.x}px`;
		crack.img.style.top = `${e.pageY - crackSize / 2 - bigCookiePos.y}px`;
		crack.img.style.rotate = `${randomFloat(0, 360)}deg`;
		return crack;
	}

	(function loop() {
		for (let i = 0; i < cookieBits.length; i++) {
			cookieBits[i].update();
			if (cookieBits[i].opacity < 0) {
				cookieBits[i].elem.remove();
				const last = cookieBits.length - 1;
				[cookieBits[i--], cookieBits[last]] = [cookieBits[last], cookieBits[i]];
				if (cookieBits.pop() === draggedBit) draggedBit = undefined;
			}
		}
		for (let i = 0; i < cracks.length; i++) {
			const crack = cracks[i];
			crack.opacity -= 0.02;
			crack.img.style.opacity = crack.opacity;
			if (crack.opacity < 0) {
				crack.img.remove();
				const last = cracks.length - 1;
				[cracks[i--], cracks[last]] = [cracks[last], cracks[i]];
				cracks.pop();
			}
		}
		if (draggedBit) draggedBit.attractTowards(mousePos.x, mousePos.y);
		requestAnimationFrame(loop);
	})();
}
