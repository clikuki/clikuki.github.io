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
		static DampingFactor = 0.75;
		static FrictionFactor = 0.9;

		constructor(x, y) {
			this.initializeProperties(x, y);

			// Create DOM
			this.elem = document.createElement("div");
			this.elem.classList.add("cookieBit");

			// Apply initial styles
			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
			this.elem.style.width = `${this.size}px`;
			this.elem.style.opacity = String(this.opacity);

			// Cooldown before interaction after initialization
			this.elem.style.pointerEvents = "none";
			setTimeout(() => {
				this.elem.style.pointerEvents = "all";
			}, waitBeforeDrag);

			// Dragging interactions on the cookie bit
			this.elem.addEventListener("mousedown", (e) => {
				if (timeOfClick + waitBeforeDrag > Date.now()) return;
				draggedBit = this;
				this.trackTarget(e.x, e.y);

				// Disable mouse events from occurring on rest of document
				document.body.style.userSelect = "none";
				document.body.style.pointerEvents = "none";
			});
		}

		initializeProperties(x, y) {
			this.opacity = 1;
			this.size = randomFloat(30, 50);
			this.rotation = randomFloat(0, 360);
			this.pos = {
				x: x - this.size / 2,
				y: y - this.size / 2,
			};
			this.acc = { x: 0, y: 0 };

			// Determine random velocity direction
			// 10% chance for a faster initial speed
			const xDirection = randomFloat(0, 10) <= 5 ? 1 : -1;
			if (Math.random() < 0.1) {
				this.vel = {
					x: randomFloat(5, 20) * xDirection,
					y: randomFloat(-5, -20),
				};
			} else {
				this.vel = {
					x: randomFloat(2, 10) * xDirection,
					y: randomFloat(-2, -10),
				};
			}
		}

		trackTarget(targetX, targetY) {
			const centerX = this.pos.x + this.size / 2;
			const centerY = this.pos.y + this.size / 2;

			// Counteract current velocity to stay centered on target and avoid oscillation
			this.acc.x = targetX - centerX - this.vel.x;
			this.acc.y = targetY - centerY - this.vel.y;
		}

		isColliding(pos, hitbox) {
			const bitRect = {
				left: pos.x,
				right: pos.x + this.size,
				top: pos.y,
				bottom: pos.y + this.size,
			};
			return !(
				bitRect.right < hitbox.left ||
				bitRect.left > hitbox.right ||
				bitRect.bottom < hitbox.top ||
				bitRect.top > hitbox.bottom
			);
		}

		// Modified calculateNewPosition method with continuous collision detection
		calculateNewPosition(hitboxes) {
			// Compute the overall movement vector for this frame
			let remainingVel = { x: this.vel.x, y: this.vel.y };
			let remainingDist = Math.hypot(remainingVel.x, remainingVel.y);

			// Process movement in segments until the full velocity is consumed
			while (remainingDist > 0.001) {
				let collisionDetected = false;
				let tCollision = 1; // fraction of the remaining step when collision occurs
				let collisionHitbox = null;

				// For each hitbox, try to find the earliest collision along the movement vector
				for (const hitbox of hitboxes) {
					// Binary search along the movement segment [0, 1] to find collision point
					let low = 0,
						high = 1,
						mid,
						collided = false;
					for (let i = 0; i < 10; i++) {
						// 10 iterations for precision
						mid = (low + high) / 2;
						const testPos = {
							x: this.pos.x + remainingVel.x * mid,
							y: this.pos.y + remainingVel.y * mid,
						};
						if (this.isColliding(testPos, hitbox)) {
							collided = true;
							high = mid;
						} else {
							low = mid;
						}
					}
					// If collision was detected for this hitbox and earlier than previous ones, record it
					if (collided && high < tCollision) {
						tCollision = high;
						collisionDetected = true;
						collisionHitbox = hitbox;
					}
				}

				if (collisionDetected) {
					// Move the cookieBit to the collision point
					this.pos.x += remainingVel.x * tCollision;
					this.pos.y += remainingVel.y * tCollision;

					// Determine the collision normal based on the hitbox boundaries
					const centerX = this.pos.x + this.size / 2;
					const centerY = this.pos.y + this.size / 2;
					let closestX = centerX;
					let closestY = centerY;
					if (centerX < collisionHitbox.x) {
						closestX = collisionHitbox.x;
					} else if (centerX > collisionHitbox.right) {
						closestX = collisionHitbox.right;
					}
					if (centerY < collisionHitbox.y) {
						closestY = collisionHitbox.y;
					} else if (centerY > collisionHitbox.bottom) {
						closestY = collisionHitbox.bottom;
					}

					const dx = centerX - closestX;
					const dy = centerY - closestY;
					const distance = Math.hypot(dx, dy);
					const normal =
						distance === 0 ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance };

					// Reflect the velocity vector off the collision normal.
					const dot = this.vel.x * normal.x + this.vel.y * normal.y;
					this.vel.x -= 2 * dot * normal.x;
					this.vel.y -= 2 * dot * normal.y;
					this.vel.x *= CookieBit.DampingFactor;
					this.vel.y *= CookieBit.DampingFactor;

					const traveledDist = remainingDist * tCollision;
					remainingDist -= traveledDist;

					// Recalculate the remaining velocity and distance based on the damped velocity
					const currentSpeed = Math.hypot(this.vel.x, this.vel.y);
					if (currentSpeed < 0.001) {
						remainingDist = 0;
					} else {
						remainingDist = Math.min(remainingDist, currentSpeed);
						remainingVel.x = (this.vel.x / currentSpeed) * remainingDist;
						remainingVel.y = (this.vel.y / currentSpeed) * remainingDist;
					}
				} else {
					// No more collisions, move the full remaining distance
					this.pos.x += remainingVel.x;
					this.pos.y += remainingVel.y;
					remainingDist = 0;
				}
			}
		}

		// Prevent the cookie bit from moving outside the viewport and adjust its velocity
		handleEdges() {
			// Horizontal boundaries
			if (this.pos.x < 0) {
				this.pos.x = 0;
				this.vel.x = -this.vel.x;
			} else if (this.pos.x + this.size > innerWidth) {
				this.pos.x = innerWidth - this.size;
				this.vel.x = -this.vel.x;
			}

			// Vertical boundaries + Dampen bounce
			if (this.pos.y < 0) {
				this.pos.y = 0;
				this.vel.y *= -CookieBit.DampingFactor;
			} else if (this.pos.y + this.size > innerHeight) {
				this.pos.y = innerHeight - this.size;
				this.vel.y *= -CookieBit.DampingFactor;
			}
		}

		// Update the physics and visual appearance of the cookie bit
		update(hitboxes) {
			if (this.opacity < 0) return;

			// Physics Integration
			this.acc.y += 1; // Gravity force

			this.vel.x += this.acc.x;
			this.vel.y += this.acc.y;

			this.calculateNewPosition(hitboxes);

			this.acc.x = 0;
			this.acc.y = 0;

			this.handleEdges();

			// Behavior adjustments when the cookie bit is being dragged
			const onCeiling = this.pos.y <= 0;
			const onFloor = this.pos.y + this.size >= innerHeight;
			const onLeftEdge = this.pos.x <= 0;
			const onRightEdge = this.pos.x + this.size >= innerWidth;
			if (draggedBit === this) {
				if (this.opacity < 1) this.opacity += 0.1; // Fade back in

				if (onCeiling + onFloor + onLeftEdge + onRightEdge === 1) {
					const edgeVelocity = onFloor || onCeiling ? this.vel.x : this.vel.y;
					const direction = onFloor || onLeftEdge ? 1 : -1;

					this.rotation += edgeVelocity * 0.5 * direction;
				}
			} else if (onFloor) {
				// Simulate friction and rolling on the floor
				this.vel.x *= 0.9;
				this.rotation += this.vel.x * 0.5;
				this.opacity -= 0.004; // Fade out
			} else {
				// In mid-air, apply a subtler rotation effect
				this.rotation += this.vel.x * 0.2;
			}

			// Update the DOM element’s styles
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

			this.opacity = 1;
			this.size = 10;
			this.pos = { x: x - this.size / 2, y: y - this.size / 2 };
			this.vel = {
				x: dir[0] * randomFloat(0.3, 2),
				y: dir[1] * randomFloat(0.3, 3),
			};

			// Reuse cookie image by randomly offseting it to display different parts
			const offsetX = randomFloat(-this.size / 2, this.size / 2);
			const offsetY = randomFloat(-this.size / 2, this.size / 2);
			this.elem.style.backgroundPosition = `${offsetX}px ${offsetY}px`;

			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
			this.elem.style.width = `${this.size}px`;
		}
		update() {
			if (this.opacity < 0) return;
			this.opacity -= 0.04;
			this.pos.x += this.vel.x;
			this.pos.y += this.vel.y;
			this.vel.y += 0.2; // Apply gravity

			this.elem.style.opacity = this.opacity;
			this.elem.style.left = `${this.pos.x}px`;
			this.elem.style.top = `${this.pos.y}px`;
		}
	}

	function loop() {
		const hitboxes = collidables.map((el) => el.getBoundingClientRect());

		for (let i = 0; i < cookieBits.length; i++) {
			const bit = cookieBits[i];
			bit.update(hitboxes);

			if (bit.opacity < 0) {
				// Destroy bit
				bit.elem.remove();

				const last = cookieBits.length - 1;
				[cookieBits[i--], cookieBits[last]] = [cookieBits[last], bit];
				if (cookieBits.pop() === draggedBit) draggedBit = undefined;
			}
		}

		if (draggedBit) draggedBit.trackTarget(mousePos.x, mousePos.y);

		requestAnimationFrame(loop);
	}
	loop();
}
