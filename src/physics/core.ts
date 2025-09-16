import { Renderer } from "./renderer.js";
import { Physics, PhysicsObject, Vector } from "./physics.js";

function main() {
	const clickerEl = document.querySelector("img.cookie") as HTMLImageElement;
	const bitContainerEl = document.querySelector(".cookie-bits") as HTMLElement;
	const collidableElems = Array.from(document.querySelectorAll("[data-collidable]")) as HTMLElement[];
	
	let draggedObject: PhysicsObject | null = null;
	const msWaitBeforeDrag = 400;
	const mousePos = new Vector(0,0);

	clickerEl.classList.add("js-enabled")

	const physics = new Physics(
		collidableElems,
		[[
			(obj) => obj.isBeingDragged,
			() => ({...mousePos}),
		]]
	);
	const renderer = new Renderer(
		physics.objects,
		bitContainerEl,
	);

	clickerEl.addEventListener("click", (ev) => {
		const elem = renderer.add(physics.spawn(
			ev.x,
			ev.y + document.documentElement.scrollTop,
		))
		
		elem.style.pointerEvents = "none";
		setTimeout(
			() => elem.style.pointerEvents = "",
			msWaitBeforeDrag,
		);
	})

	window.addEventListener("mousemove", (ev) => {
		mousePos.x = ev.x;
		mousePos.y = ev.y + document.documentElement.scrollTop;
	})
	window.addEventListener("mousedown", (ev) => {
		if(ev.target instanceof HTMLElement) {
			draggedObject = physics.objects.get(ev.target.id) ?? null;
			if(draggedObject) draggedObject.isBeingDragged = true;
		}
	})
	window.addEventListener("mouseup", () => {
		if(draggedObject) {
			draggedObject.isBeingDragged = false;
			draggedObject = null;
		}
	})

	try {
		// let last = performance.now();
		// const birth = new Map<typeof physics.objects[0], number>();
		requestAnimationFrame(function updateLoop(t) {
			// if(t - last < (1000 / 60)) {
			// 	requestAnimationFrame(updateLoop);
			// 	return;
			// }
			// last = t;

			// for(const obj of physics.objects) {
			// 	if(obj.isDead) {
			// 		console.log(t - birth.get(obj)!);
			// 		birth.delete(obj);
			// 	}
			// 	else if(!birth.has(obj)) {
			// 		birth.set(obj, t);
			// 	}
			// }

			physics.update(t);
			renderer.update();
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
