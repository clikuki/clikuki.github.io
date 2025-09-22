interface ContentStructure {
	projects: ProjectDefinition[];
	socials: Socials;
}
interface ProjectDefinition {
	title: string;
	thumbnailSrc: string;
	projectSrc: string;
	isHighlight?: boolean;
}
interface Socials {
	github: string;
	reddit: string;
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
		github: "https://github.com/clikuki/",
		reddit: "https://www.reddit.com/user/Clikuki/",
	},
	projects: [
		{
			title: "Periodic Table Quiz",
			projectSrc: "https://clikuki.github.io/periodic_table_quiz/",
			thumbnailSrc: "thumbnails/periodicTable.png",
			isHighlight: true,
		},
		{
			title: "Maze Generator",
			projectSrc: "https://clikuki.github.io/mazeGenerator/",
			thumbnailSrc: "thumbnails/mazeGenerator.png",
			isHighlight: true,
		},
		{
			title: "Conway's Game Of Life",
			projectSrc: "https://clikuki.github.io/gameOfLife/",
			thumbnailSrc: "thumbnails/gameOfLife.png",
		},
		{
			title: "Lambda Calculus Visualizer",
			projectSrc: "https://clikuki.github.io/lambda/",
			thumbnailSrc: "thumbnails/lambda.png",
			isHighlight: true,
		},
		{
			title: "Concentration",
			projectSrc: "https://clikuki.github.io/memoryCards/",
			thumbnailSrc: "thumbnails/concentration.png",
		},
		{
			title: "Minesweeper",
			projectSrc: "https://clikuki.github.io/minesweeper/",
			thumbnailSrc: "thumbnails/minesweeper.png",
		},
		{
			title: "Crossword Generator",
			projectSrc: "https://clikuki.github.io/crossword/",
			thumbnailSrc: "thumbnails/crossword.png",
		},
		{
			title: "Airplane Boarding Simulation",
			projectSrc: "https://clikuki.github.io/planeBoardingSimulation/",
			thumbnailSrc: "thumbnails/planeBoarding.png",
		},
	]
}