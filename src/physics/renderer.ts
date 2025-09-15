import { PhysicsObject } from "./physics.js";

export class Renderer {
	private static imgSrc = "pixel_cookie.png";
	private elements = new Map<PhysicsObject, HTMLImageElement>()
	constructor(private physObjects: PhysicsObject[], private containerEl: HTMLElement) {}

	public add(obj: PhysicsObject): HTMLImageElement {
		const elem = document.createElement("img");
		elem.src = Renderer.imgSrc;
		elem.style.left = `${obj.position.x - obj.radius}px`;
		elem.style.top = `${obj.position.y - obj.radius}px`;
		elem.style.width = `${obj.radius + obj.radius}px`;

		this.containerEl.appendChild(elem);
		this.elements.set(obj, elem);
		return elem;
	}
	public update() {
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
				elem.style.left = `${obj.position.x - obj.radius}px`;
				elem.style.top = `${obj.position.y - obj.radius}px`;
				elem.style.rotate = `${Math.PI / 2 - obj.rotation}rad`;
				elem.style.opacity = String(obj.health / obj.maxHealth);
			}
		}
	}
}