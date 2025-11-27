import { PhysicsObject } from "./physics.js";

export class Renderer {
	public elementClass = "cookiebit";
	private imgSrc = "pixel_cookie.webp";
	private elements = new Map<string, HTMLImageElement>()
	private ctx: CanvasRenderingContext2D;
	private vecMult = 2;
	constructor(
		private physObjects: Map<string, PhysicsObject>,
		private containerEl: HTMLElement,
		private debugCanvas?: HTMLCanvasElement,
	) {
		if(debugCanvas) {
			this.ctx = debugCanvas.getContext("2d")!;
		}
	}

	public add(obj: PhysicsObject): HTMLImageElement {
		const elem = document.createElement("img");
		elem.src = this.imgSrc;
		elem.draggable = false;
		elem.id = obj.id;
		elem.style.cssText = `
			width: ${obj.radius + obj.radius}px;
			left: ${obj.position.x - obj.radius}px;
			top: ${obj.position.y - obj.radius}px;
			rotate: ${Math.PI / 2 - obj.rotation}rad;
			opacity: 1;
		`;

		this.containerEl.appendChild(elem);
		this.elements.set(obj.id, elem);
		return elem;
	}
	public update(a = 1) {
		if(this.debugCanvas) {
			this.debugCanvas.width = innerWidth;
			this.debugCanvas.height = innerHeight;
		}

		if(this.debugCanvas) {
			this.ctx.beginPath();
		}

		for(const [id, obj] of this.physObjects) {
			let elem = this.elements.get(id);
			if(obj.isDead) {
				if(elem) {
					elem.remove();
					this.elements.delete(id);
				}
			}
			else {
				elem ??= this.add(obj);
				
				const x = (obj.prevPosition.x - obj.position.x) * a + obj.position.x;
				const y = (obj.prevPosition.y - obj.position.y) * a + obj.position.y;
				const rot = (obj.prevRotation - obj.rotation) * a + obj.rotation;
				const opacity = obj.health / obj.maxHealth;

				elem.style.left = `${x - obj.radius}px`;
				elem.style.top = `${y - obj.radius}px`;
				elem.style.rotate = `${Math.PI / 2 - rot}rad`; // Adapt to dom rotation model
				elem.style.opacity = String(opacity);

				if(this.debugCanvas) {
					this.ctx.moveTo(obj.position.x, obj.position.y);
					this.ctx.lineTo(
						obj.position.x + obj.netForces.x * this.vecMult,
						obj.position.y + obj.netForces.y * this.vecMult
					);
					this.ctx.moveTo(obj.position.x, obj.position.y);
					this.ctx.lineTo(
						obj.position.x + obj.velocity.x * this.vecMult,
						obj.position.y + obj.velocity.y * this.vecMult
					);
				}
			}
		}

		if(this.debugCanvas) {
			this.ctx.lineWidth = 2;
			this.ctx.strokeStyle = "black";
			this.ctx.stroke();
		}
	}
}