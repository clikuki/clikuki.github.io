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

export const content: ContentStructure = {
	socials: {
		github: "https://github.com/clikuki/",
		reddit: "https://www.reddit.com/user/Clikuki/",
	},
	projects: [
		{
			title: "Maze Generator",
			projectSrc: "https://clikuki.github.io/mazeGenerator/",
			thumbnailSrc: "thumbnails/mazeGenerator.png",
			isHighlight: true,
		},
		{
			title: "Crossword Generator",
			projectSrc: "https://clikuki.github.io/crossword/",
			thumbnailSrc: "thumbnails/crossword.png",
			isHighlight: true,
		},
		{
			title: "Connect 4",
			projectSrc: "https://clikuki.github.io/connect-four/",
			thumbnailSrc: "thumbnails/connect-4.png",
		},
		{
			title: "Minesweeper",
			projectSrc: "https://clikuki.github.io/minesweeper",
			thumbnailSrc: "thumbnails/minesweeper.png",
		},
		{
			title: "Slide puzzle",
			projectSrc: "https://clikuki.github.io/slidingPuzzle/",
			thumbnailSrc: "thumbnails/slidePuzzle.png",
		},
		{
			title: "Concentration",
			projectSrc: "https://clikuki.github.io/memoryCards/",
			thumbnailSrc: "thumbnails/concentration.png",
		},
		{
			title: "Tetris",
			projectSrc: "https://clikuki.github.io/tetris-in-js/",
			thumbnailSrc: "thumbnails/tetris.png",
		},
		{
			title: "Game of Life",
			projectSrc: "https://clikuki.github.io/gameOfLife/",
			thumbnailSrc: "thumbnails/gameOfLife.png",
			isHighlight: true,
		},
		{
			title: "Plane Boarding Sim",
			projectSrc: "https://clikuki.github.io/planeBoardingSimulation/",
			thumbnailSrc: "thumbnails/planeBoarding.png",
		},
		{
			title: "Glitch Text",
			projectSrc: "https://clikuki.github.io/glitchText/",
			thumbnailSrc: "thumbnails/glitchText.png",
		},
	]
}