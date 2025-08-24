interface Vector {
	x: number,
	y: number,
};
class Vector {
	private constructor() {}
	static copy(one: Vector) { return { x: one.x, y: one.y } }
	static add(one: Vector, two: Vector) { return { x: one.x + two.x, y: one.y + two.y } }
	static sub(one: Vector, two: Vector) { return { x: one.x - two.x, y: one.y - two.y } }
	static mult(one: Vector, scalar: number) { return { x: one.x * scalar, y: one.y * scalar } }
	static div(one: Vector, scalar: number) { return { x: one.x / scalar, y: one.y / scalar } }
}

class PhysicsObject {
	public isDead = false;
	constructor(
		public pos: Vector,
		public prevPos: Vector,
		public radius: number,
		public mass: number,
	) {}
}

class Physics {
	public objects: PhysicsObject[] = []
	private dt = 0.01;
	private dtSqr = this.dt * this.dt;
	private currentTime = performance.now();
	private accumulator = 0;

	public spawn(x: number, y: number): PhysicsObject {
		const minRadius = 10;
		const maxRadius = 30;
		const radius = Math.random() * (maxRadius - minRadius) + minRadius;
		// const radius = 20;
		const mass = Math.PI * radius * radius;
		// const mass = 1;

		const initVelLength = Math.random() + .1;
		const initVelAngle = Math.random() * -Math.PI;
		const initVelocity = {
			x: initVelLength * Math.cos(initVelAngle),
			y: initVelLength * Math.sin(initVelAngle),
			// x: 0,
			// y: 0,
		}

		const position = { x, y };
		const obj = new PhysicsObject(
			position,
			Vector.add(position, initVelocity),
			radius,
			mass,
		);

		this.objects.push(obj);

		return obj;
	}
	public applyForce(obj: PhysicsObject, force: Vector): void {
    const accel = Vector.div(force, obj.mass);
    const prevPos = Vector.copy(obj.pos);

		// p_t = 2 * p_{t-1} - p_{t-2} + a_t * dt^2
		obj.pos = Vector.add(Vector.sub(Vector.mult(obj.pos, 2), obj.prevPos), Vector.mult(accel, this.dtSqr));
    obj.prevPos = prevPos;
	}
	private gravity(): void {
		const gravity = { x: 0, y: 10 };
		for(const obj of this.objects) {
			this.applyForce(obj, {
				x: gravity.x * obj.mass,
				y: gravity.y * obj.mass,
			});
		}
	}
	private checkBounds(): void {
		for(const obj of this.objects) {
			const rightSide = obj.pos.x + obj.radius > innerWidth;
			const leftSide = obj.pos.x - obj.radius < 0;
			const bottomSide = obj.pos.y + obj.radius > innerHeight;
			const topSide = obj.pos.y - obj.radius < 0;

			// Get velocity first BEFORE moving to non-colliding position
			const velX = obj.pos.x - obj.prevPos.x;
			const velY = obj.pos.y - obj.prevPos.y;

			if(rightSide) {
				obj.pos.x = innerWidth - obj.radius;
			}
			else if(leftSide) {
				obj.pos.x = obj.pos.x;
			}
			
			if(bottomSide) {
				obj.pos.y = innerHeight - obj.radius;
			}
			else if(topSide) {
				obj.pos.y = obj.pos.y;
			}

			if(leftSide || rightSide) {
				obj.prevPos.x = obj.pos.x + velX;
			}
			else if (topSide || bottomSide) {
				obj.prevPos.y = obj.pos.y + velY;
			}
		}
	}
	private removeDead(): void {
		let i = 0;
		let cnt = this.objects.length;
		let curr: PhysicsObject;
		let tmp: PhysicsObject;
		while(i < cnt) {
			curr = this.objects[i];
			if(!curr.isDead) ++i;
			else {
				tmp = this.objects[cnt - 1];
				this.objects[cnt - 1] = curr;
				this.objects[i] = tmp;
				this.objects.length = --cnt;
			}
		}
	}
	public update(newTime: number): number {
		let frameTime = newTime - this.currentTime;
		if(frameTime > .25) frameTime = .25; // Why?
		this.currentTime = newTime;

		this.accumulator += frameTime;

		this.removeDead();
		while(this.accumulator >= this.dt) {
			this.gravity();
			this.checkBounds();

			this.accumulator -= this.dt;
		}

		const alpha = this.accumulator / this.dt;
		return alpha;
	}

	/** FOR DEBUG ONLY; FOR STEPPING THRU PHYSICS ONE BY ONE */
	public debug_update(iterCnt: number) {
		this.removeDead();
		for(let i = 0; i < iterCnt; ++i) {
			this.gravity();
			this.checkBounds();
		}
	}
}

class Renderer {
	private static imgSrc = "pixel_cookie.png";
	private elements = new Map<PhysicsObject, HTMLImageElement>()
	constructor(private physObjects: PhysicsObject[], private containerEl: HTMLElement) {}

	public add(obj: PhysicsObject): HTMLImageElement {
		const elem = document.createElement("img");
		elem.src = Renderer.imgSrc;
		elem.style.left = `${obj.pos.x - obj.radius}px`;
		elem.style.top = `${obj.pos.y - obj.radius}px`;
		elem.style.width = `${obj.radius + obj.radius}px`;

		this.containerEl.appendChild(elem);
		this.elements.set(obj, elem);
		return elem;
	}
	public update(alpha: number) {
		const oneMinusAlpha = 1 - alpha;
		for(const obj of this.physObjects) {
			let elem = this.elements.get(obj);
			if(obj.isDead) {
				if(elem) {
					elem.remove();
					this.elements.delete(obj);
				}
			}
			else {
				elem ??= this.add(obj);
				elem.style.left = `${obj.pos.x * alpha + obj.prevPos.x * oneMinusAlpha - obj.radius}px`;
				elem.style.top = `${obj.pos.y * alpha + obj.prevPos.y * oneMinusAlpha - obj.radius}px`;
			}
		}
	}
}

function main() {
	const msWaitBeforeDrag = 400;

	const clickerEl = document.querySelector("img.cookie") as HTMLImageElement;
	const bitContainerEl = document.querySelector(".cookie-bits") as HTMLElement;

	clickerEl.classList.add("js-enabled")

	const physics = new Physics();
	const renderer = new Renderer(
		physics.objects,
		bitContainerEl,
	);

	clickerEl.addEventListener("click", (e) => {
		const elem = renderer.add(physics.spawn(
			e.x,
			e.y + document.documentElement.scrollTop,
		))
		
		elem.style.pointerEvents = "none";
		setTimeout(
			() => elem.style.pointerEvents = "",
			msWaitBeforeDrag,
		);
	})

	try {
		requestAnimationFrame(function updateLoop(t) {
			const alpha = physics.update(t);
			renderer.update(alpha);
			// renderer.update(0);
			requestAnimationFrame(updateLoop);
		})
	}
	catch(err) {
		// Stop further errors, but still throw to console
		throw err;
	}

	// @ts-expect-error
	window.physics = physics;
	// @ts-expect-error
	window.renderer = renderer;
}

main();
