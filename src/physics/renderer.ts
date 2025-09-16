import { PhysicsObject } from "./physics.js";

export class Renderer {
	public elementClass = "cookiebit";
	private imgSrc = "pixel_cookie.png";
	private elements = new Map<string, HTMLImageElement>()
	constructor(
		private physObjects: Map<string, PhysicsObject>,
		private containerEl: HTMLElement,
	) {}

	public add(obj: PhysicsObject): HTMLImageElement {
		const elem = document.createElement("img");
		elem.src = this.imgSrc;
		elem.draggable = false;
		elem.id = obj.id;
		elem.style.left = `${obj.position.x - obj.radius}px`;
		elem.style.top = `${obj.position.y - obj.radius}px`;
		elem.style.width = `${obj.radius + obj.radius}px`;

		this.containerEl.appendChild(elem);
		this.elements.set(obj.id, elem);
		return elem;
	}
	public update() {
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
				elem.style.left = `${obj.position.x - obj.radius}px`;
				elem.style.top = `${obj.position.y - obj.radius}px`;
				elem.style.rotate = `${Math.PI / 2 - obj.rotation}rad`;
				elem.style.opacity = String(obj.health / obj.maxHealth);
			}
		}
	}
}