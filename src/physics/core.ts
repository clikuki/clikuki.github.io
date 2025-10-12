import { Renderer } from "./renderer.js";
import { Physics, PhysicsObject, Vector } from "./physics.js";
import type { Collider, ColliderInfo } from "./physics.js";

class HTMLCollider implements Collider {
	constructor(public element: HTMLElement) {}

	getInfo(): ColliderInfo {
		const ElemRect = this.element.getBoundingClientRect();
		ElemRect.y += document.documentElement.scrollTop;
		return {
			x: ElemRect.x,
			y: ElemRect.y,

			w: ElemRect.width,
			h: ElemRect.height,
			hw: ElemRect.width / 2,
			hh: ElemRect.height / 2,

			get center() {
				return {
					x: ElemRect.x + ElemRect.width / 2,
					y: ElemRect.y + ElemRect.height / 2,
				}
			},
		}
	}
}

function getObjectAtPosition(point: Vector, physics: Physics): PhysicsObject | null {
	const objects = physics.objects;
	const maxEdgeDist = 50;
	const minAge = 10;

	let closestObject: PhysicsObject | null = null;
	let closestDistSqr = Infinity;
	for(const [, obj] of objects) {
		if(obj.age < minAge) continue;

		const distSqr = Vector.magSqr(Vector.sub(obj.prevPosition, point));
		const maxDistance = maxEdgeDist + obj.radius;
		if(distSqr < maxDistance*maxDistance && distSqr < closestDistSqr) {
			closestObject = obj;
			closestDistSqr = distSqr;
		}
	}

	return closestObject;
}

function main(): void {
	const clickerEl = document.querySelector("img.cookie") as HTMLImageElement;
	clickerEl.classList.add("js-enabled")

	const bitContainerEl = document.querySelector(".cookie-bits") as HTMLElement;
	const collidableElems = Array.from(document.querySelectorAll("[data-collidable]")) as HTMLElement[];
	const canvasEl = document.querySelector("canvas") as HTMLCanvasElement || undefined;
	
	let draggedObject: PhysicsObject | null = null;
	const scrollBy = new Vector(0,0);
	const mousePos = new Vector(0,0);

	const physics = new Physics(
		collidableElems.map(elem => new HTMLCollider(elem)),
		() => Vector.add(mousePos, scrollBy)
	);
	physics.doHealthUpdates = false;

	const renderer = new Renderer(
		physics.objects,
		bitContainerEl,
		canvasEl,
	);

	document.addEventListener("scroll", () => {
		scrollBy.x = document.documentElement.scrollLeft;
		scrollBy.y = document.documentElement.scrollTop;
	})
	window.addEventListener("mousemove", (ev) => {
		mousePos.x = ev.x;
		mousePos.y = ev.y;
	})
	window.addEventListener("mousedown", (ev) => {
		if(ev.target === clickerEl) {
			clickerEl.setAttribute("data-mousedown", "");
		}
		else {
			const position = Vector.add(mousePos, scrollBy);
			draggedObject = getObjectAtPosition(position, physics);
			if(draggedObject) {
				draggedObject.isBeingDragged = true;
				document.body.style.userSelect = "none";
			}
		}
	})
	window.addEventListener("mouseup", (ev) => {
		document.body.style.removeProperty("user-select");
		if(draggedObject) {
			draggedObject.isBeingDragged = false;
			draggedObject = null;
		}
		else if(ev.target === clickerEl && clickerEl.hasAttribute("data-mousedown")) {
			const position = Vector.add(mousePos, scrollBy);
			renderer.add(physics.spawn(position.x, position.y));

			// Apply shake animation
			clickerEl.classList.toggle("shake");
			clickerEl.offsetHeight;
			requestAnimationFrame(() => {
				clickerEl.classList.add("shake");
			})
		}
		
		clickerEl.removeAttribute("data-mousedown");
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
