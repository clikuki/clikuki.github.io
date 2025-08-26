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
		requestAnimationFrame(function updateLoop(t) {
			const alpha = physics.update(t);
			renderer.update(alpha);
			// renderer.update(t*0);
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
