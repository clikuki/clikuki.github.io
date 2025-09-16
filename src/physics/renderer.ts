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
	public update(a = 1) {
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
				
				const x = obj.position.x * a + obj.prevPosition.x * (1-a);
				const y = obj.position.y * a + obj.prevPosition.y * (1-a);
				const rot = obj.rotation * a + obj.prevRotation * (1-a);
				const opacity = obj.health / obj.maxHealth;

				elem.style.left = `${x - obj.radius}px`;
				elem.style.top = `${y - obj.radius}px`;
				elem.style.rotate = `${Math.PI / 2 - rot}rad`;
				elem.style.opacity = String(opacity);
			}
		}
	}
}