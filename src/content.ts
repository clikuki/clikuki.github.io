interface ContentStructure {
	projects: ProjectDefinition[];
	socials: Record<string, string >;
}
interface ProjectDefinition {
	title: string;
	thumbnailSrc: string;
	projectSrc: string;
	isHighlight?: boolean;
}

/**
 * Periodic Table Quiz
 * Maze Generator
 * Conway's Game Of Life
 * Lambda Calculus Visualizer
 * Memory Cards
 * Minesweeper
 * Crossword Generator
 * Airplane Boarding Simulation
 */

export const content: ContentStructure = {
	socials: {
		blog: "https://clikuki.github.io/blog/"
	},
	projects: [
		{
			title: "Periodic Table Quiz",
			projectSrc: "https://clikuki.github.io/periodic_table_quiz/",
			thumbnailSrc: "thumbnails/periodicTable.webp",
			isHighlight: true,
		},
		{
			title: "Maze Generator",
			projectSrc: "https://clikuki.github.io/mazeGenerator/",
			thumbnailSrc: "thumbnails/mazeGenerator.webp",
			isHighlight: true,
		},
		{
			title: "Conway's Game Of Life",
			projectSrc: "https://clikuki.github.io/gameOfLife/",
			thumbnailSrc: "thumbnails/gameOfLife.webp",
		},
		{
			title: "Lambda Calculus Visualizer",
			projectSrc: "https://clikuki.github.io/lambda/",
			thumbnailSrc: "thumbnails/lambda.webp",
			isHighlight: true,
		},
		{
			title: "Concentration",
			projectSrc: "https://clikuki.github.io/memoryCards/",
			thumbnailSrc: "thumbnails/concentration.webp",
		},
		{
			title: "Minesweeper",
			projectSrc: "https://clikuki.github.io/minesweeper/",
			thumbnailSrc: "thumbnails/minesweeper.webp",
		},
		{
			title: "Crossword Generator",
			projectSrc: "https://clikuki.github.io/crossword/",
			thumbnailSrc: "thumbnails/crossword.webp",
		},
		{
			title: "Airplane Boarding Simulation",
			projectSrc: "https://clikuki.github.io/planeBoardingSimulation/",
			thumbnailSrc: "thumbnails/planeBoarding.webp",
		},
	]
}