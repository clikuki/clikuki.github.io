const bigCookie = document.querySelector(".cookie");
if (bigCookie) {
	function randomFloat(min, max) {
		return Math.random() * (max - min) + min;
	}

	bigCookie.classList.add("jsEnabled");
	const cookieBits = [];
	const collidables = Array.from(document.querySelectorAll("[data-collidable]"));
	let draggedBit;
	let timeOfClick = NaN;
	const waitBeforeDrag = 200;
	const mousePos = {
		x: NaN,
		y: NaN,
	};

	const cookieContainer = document.createElement("div");
	cookieContainer.classList.add("cookieBitContainer");
	document.body.appendChild(cookieContainer);

	bigCookie.addEventListener("click", (e) => {
		timeOfClick = Date.now();

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

		if (bigCookie.classList.contains("shake")) {
			bigCookie.classList.remove("shake");
			setTimeout(() => bigCookie.classList.add("shake"));
		} else bigCookie.classList.add("shake");
	});

	bigCookie.addEventListener("animationend", () => {
		bigCookie.classList.remove("shake");
	});

	document.addEventListener("mouseup", () => {
		draggedBit = undefined;
		document.body.style.userSelect = "auto";
		document.body.style.pointerEvents = "all";
	});
	document.addEventListener("mousemove", ({ x, y }) => {
		mousePos.x = x;
		mousePos.y = y;
	});

	const logEl = document.getElementById("log");
	const testEl = document.getElementById("test");
	class CookieBit {
		constructor(x, y) {
			this.elem = document.createElement("div");
			this.elem.classList.add("cookieBit");
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

			this.elem.addEventListener("mousedown", (e) => {
				if (timeOfClick + waitBeforeDrag > Date.now()) return;
				draggedBit = this;
				this.attractTowards(e.x, e.y);
				document.body.style.userSelect = "none";
				document.body.style.pointerEvents = "none";
			});

			this.elem.style.pointerEvents = "none";
			setTimeout(() => (this.elem.style.pointerEvents = "all"), waitBeforeDrag);

			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
			this.elem.style.width = `${this.size}px`;
			this.elem.style.opacity = String(this.opacity);
		}
		attractTowards(x, y) {
			this.vel.x = x - (this.pos.x + this.size / 2);
			this.vel.y = y - (this.pos.y + this.size / 2);
		}
		collide(hitbox) {
			const rightDistance = this.pos.x + this.size - hitbox.left;
			const leftDistance = hitbox.right - this.pos.x;
			const bottomDistance = this.pos.y + this.size - hitbox.top;
			const topDistance = hitbox.bottom - this.pos.y;

			if (
				rightDistance >= 0 &&
				leftDistance >= 0 &&
				bottomDistance >= 0 &&
				topDistance >= 0
			) {
				const cx = this.pos.x + this.size / 2;
				const cy = this.pos.y + this.size / 2;

				let testX = cx;
				let testY = cy;
				if (cx < hitbox.x) testX = hitbox.x; // left edge
				else if (cx > hitbox.right) testX = hitbox.right; // right edge

				if (cy < hitbox.y) testY = hitbox.y; // top edge
				else if (cy > hitbox.bottom) testY = hitbox.bottom; // bottom edge

				testEl.style.left = `${testX}px`;
				testEl.style.top = `${testY}px`;
				testEl.style.width = "5px";
				testEl.style.height = "5px";

				const distX = cx - testX;
				const distY = cy - testY;
				const distance = Math.sqrt(distX * distX + distY * distY);
				logEl.textContent = `distx: ${distX}\ndisty: ${distY}`;
				if (distance <= this.size / 2) {
					const normal = {
						x: (cx - testX) / distance,
						y: (cy - testY) / distance,
					};
					const dot = this.vel.x * normal.x + this.vel.y * normal.y;
					this.vel = {
						x: this.vel.x - 2 * dot * normal.x,
						y: this.vel.y - 2 * dot * normal.y,
					};
				}
			}
		}
		update() {
			// TODO: divide into substeps, and/or look-ahead using velocity
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
			this.elem = document.createElement("div");
			this.elem.classList.add("splashBit");
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

	function loop() {
		const hitboxes = collidables.map((el) => el.getBoundingClientRect());

		for (let i = 0; i < cookieBits.length; i++) {
			cookieBits[i].update();

			if (cookieBits[i] instanceof CookieBit) {
				for (const hitbox of hitboxes) {
					cookieBits[i].collide(hitbox);
				}
			}

			if (cookieBits[i].opacity < 0) {
				cookieBits[i].elem.remove();
				const last = cookieBits.length - 1;
				[cookieBits[i--], cookieBits[last]] = [cookieBits[last], cookieBits[i]];
				if (cookieBits.pop() === draggedBit) draggedBit = undefined;
			}
		}
		if (draggedBit) draggedBit.attractTowards(mousePos.x, mousePos.y);
		requestAnimationFrame(loop);
	}
	loop();
}
