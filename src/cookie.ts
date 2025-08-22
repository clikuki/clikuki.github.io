interface Vector {
	x: number,
	y: number,
};
class PhysicsObject {
	public isDead = false;
	constructor(
		public x: number,
		public y: number,
		public prevX: number,
		public prevY: number,
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
		const mass = Math.PI * radius * radius;
		// const mass = 1;

		const initVelLength = Math.random() + .1;
		const initVelAngle = Math.random() * -Math.PI;
		const initVelocity = {
			x: initVelLength * Math.cos(initVelAngle),
			y: initVelLength * Math.sin(initVelAngle),
		}

		const obj = new PhysicsObject(
			x,
			y,
			x-initVelocity.x,
			y-initVelocity.y,
			radius,
			mass,
		);

		this.objects.push(obj);

		return obj;
	}
	public applyForce(obj: PhysicsObject, force: Vector): void {
    const accel = {
			x: force.x / obj.mass,
			y: force.y / obj.mass,
		};
    const prevPos = {
			x: obj.x,
			y: obj.y,
		};

    obj.x = 2 * obj.x - obj.prevX + accel.x * this.dtSqr;
    obj.y = 2 * obj.y - obj.prevY + accel.y * this.dtSqr;
    
    obj.prevX = prevPos.x;
    obj.prevY = prevPos.y;
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
		// TODO: Need to flip velocity
		for(const obj of this.objects) {
			if(obj.x + obj.radius > innerWidth) {
				obj.isDead = true;
				// obj.x = innerWidth - obj.x;
			}
			else if(obj.x - obj.radius < 0) {
				obj.isDead = true;
				// obj.x = obj.x;
			}
			
			if(obj.y + obj.radius > innerHeight) {
				obj.isDead = true;
				// obj.y = innerHeight - obj.y;
			}
			else if(obj.y - obj.radius < 0) {
				obj.isDead = true;
				// obj.y = obj.y;
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
}

class Renderer {
	private static imgSrc = "pixel_cookie.png";
	private elements = new Map<PhysicsObject, HTMLImageElement>()
	constructor(private physObjects: PhysicsObject[], private containerEl: HTMLElement) {}

	public add(obj: PhysicsObject): HTMLImageElement {
		const elem = document.createElement("img");
		elem.src = Renderer.imgSrc;
		elem.style.left = `${obj.x - obj.radius}px`;
		elem.style.top = `${obj.y - obj.radius}px`;
		elem.style.width = `${obj.radius + obj.radius}px`;

		this.containerEl.appendChild(elem);
		this.elements.set(obj, elem);
		return elem;
	}
	public update(alpha: number) {
		const oneMinusAlpha = 1 - alpha;
		for(const obj of this.physObjects) {
			const elem = this.elements.get(obj) ?? this.add(obj);

			if(obj.isDead) {
				elem.remove();
				this.elements.delete(obj);
			}
			else {
				elem.style.left = `${obj.x * alpha + obj.prevX * oneMinusAlpha - obj.radius}px`;
				elem.style.top = `${obj.y * alpha + obj.prevY * oneMinusAlpha - obj.radius}px`;
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
