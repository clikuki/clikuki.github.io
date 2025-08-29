import { Renderer } from "./renderer.js";
import { Physics } from "./physics.js";

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
