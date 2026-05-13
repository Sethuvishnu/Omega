// import { Container, Flex, VStack, Box, Image } from "@chakra-ui/react";
// import AuthForm from "../../components/AuthForm/AuthForm";

// const AuthPage = () => {
// 	return (
// 		<Flex minH={"100vh"} justifyContent={"center"} alignItems={"center"} px={4}>
// 			<Container maxW={"container.md"} padding={0}>
// 				<Flex justifyContent={"center"} alignItems={"center"} gap={10}>
// 					{/* Left hand-side */}
// 					<Box display={{ base: "none", md: "block" }}>
// 						<Image src='/showfull.png' h={550} w={452} alt='Phone img' />
// 					</Box>

// 					{/* Right hand-side */}
// 					<VStack spacing={4} align={"stretch"}>
// 						<AuthForm />
// 						<Box textAlign={"center"}>Get the app.</Box>
// 						<Flex gap={5} justifyContent={"center"}>
// 							{/* <Image src='/playstore.png' h={"10"} alt='Playstore logo' />
// 							<Image src='/microsoft.png' h={"10"} alt='Microsoft logo' /> */}
// 						</Flex>
// 					</VStack>
// 				</Flex>
// 			</Container>
// 		</Flex>
// 	);
// };

// export default AuthPage;
import { useEffect, useRef } from "react";
import { Container, Flex, VStack, Box, Image } from "@chakra-ui/react";
import AuthForm from "../../components/AuthForm/AuthForm";

const AuthPage = () => {
	const tilesRef = useRef(null);
	const toggledRef = useRef(false);

	useEffect(() => {
		const wrapper = tilesRef.current;
		if (!wrapper) return;

		let columns = 0;
		let rows = 0;

		const toggle = () => {
			toggledRef.current = !toggledRef.current;
			document.body.classList.toggle("toggled");
		};

		const handleOnClick = (index) => {
			toggle();

			const tiles = wrapper.querySelectorAll(".tile");
			tiles.forEach((tile, i) => {
				const gridX = i % columns;
				const gridY = Math.floor(i / columns);
				const clickedX = index % columns;
				const clickedY = Math.floor(index / columns);

				const distance = Math.abs(gridX - clickedX) + Math.abs(gridY - clickedY);
				const delay = distance * 50;

				setTimeout(() => {
					tile.style.opacity = toggledRef.current ? "0" : "1";
				}, delay);
			});
		};

		const createTile = (index) => {
			const tile = document.createElement("div");
			tile.classList.add("tile");
			tile.style.opacity = toggledRef.current ? "0" : "1";
			tile.onclick = () => handleOnClick(index);
			return tile;
		};

		const createTiles = (quantity) => {
			Array.from(Array(quantity)).forEach((_, index) => {
				wrapper.appendChild(createTile(index));
			});
		};

		const createGrid = () => {
			wrapper.innerHTML = "";
			const size = document.body.clientWidth > 800 ? 100 : 50;
			columns = Math.floor(document.body.clientWidth / size);
			rows = Math.floor(document.body.clientHeight / size);
			wrapper.style.setProperty("--columns", columns);
			wrapper.style.setProperty("--rows", rows);
			createTiles(columns * rows);
		};

		createGrid();

		const handleResize = () => createGrid();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			document.body.classList.remove("toggled");
		};
	}, []);

	return (
		<>
			<style>
				{`
:root {
// --g1: #E8420A;   /* orange */
// --g2: #1A1AFF;   /* electric blue */
// --g3: #FFD700;   /* gold */

--g1: #E8420A;   /* orange */
--g2: #9B1FBD;   /* purple */
--g3: #FFB300;   /* amber */
}

					@keyframes background-pan {
						from { background-position: 0% center; }
						to   { background-position: -200% center; }
					}

					body {
						animation: background-pan 10s linear infinite;
						background: linear-gradient(
							to right,
							var(--g1),
							var(--g2),
							var(--g1)
						);
						background-size: 200%;
						height: 100vh;
						overflow: hidden;
						margin: 0px;
					}

					body.toggled {
						animation: none;
					}

					body.toggled > #tiles > .tile:hover {
						opacity: 0.1 !important;
					}

					.centered {
						left: 50%;
						position: absolute;
						top: 50%;
						transform: translate(-50%, -50%);
						width: 100%;
					}

					#tiles {
						height: calc(100vh - 1px);
						width: calc(100vw - 1px);
						position: relative;
						z-index: 2;
						display: grid;
						grid-template-columns: repeat(var(--columns), 1fr);
						grid-template-rows: repeat(var(--rows), 1fr);
					}

					.tile {
						cursor: pointer;
						position: relative;
					}

					.tile:hover:before {
						background-color: rgb(30, 30, 30);
					}

					.tile:before {
						background-color: rgb(15, 15, 15);
						content: "";
						inset: 0.5px;
						position: absolute;
					}

					/* Outer wrapper: no pointer events, so tiles behind are fully clickable */
					#auth-container {
						z-index: 3;
						pointer-events: none;
					}

					/* Only the white card itself captures pointer events */
					#auth-card {
						pointer-events: all;
						background: white;
						border-radius: 16px;
						padding: 32px 28px;
						box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
					}
				`}
			</style>

			<div id="tiles" ref={tilesRef}></div>

			<div id="auth-container" className="centered">
				<Container maxW={"container.md"} padding={0}>
					<Flex justifyContent={"center"} alignItems={"center"} gap={10}>

						{/* Left — phone image, hidden on mobile */}
						<Box display={{ base: "none", md: "block" }} style={{ pointerEvents: "none" }}>
							<Image src="/dd.png" h={550} w={452} alt="Phone img" />
						</Box>

						{/* Right — solid white auth card */}
						<VStack spacing={4} align={"stretch"}>
							<div id="auth-card">
								<AuthForm />
								<Box textAlign={"center"} color="gray.500" fontSize="sm" mt={3}>
									Get the app.
								</Box>
								<Flex gap={5} justifyContent={"center"} mt={2}>
									{/* <Image src='/playstore.png' h={"10"} alt='Playstore logo' /> */}
									{/* <Image src='/microsoft.png' h={"10"} alt='Microsoft logo' /> */}
								</Flex>
							</div>
						</VStack>

					</Flex>
				</Container>
			</div>
		</>
	);
};

export default AuthPage;