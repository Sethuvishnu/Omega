import { Box, Container, Flex, Divider } from "@chakra-ui/react";
import FeedPosts from "../../components/FeedPosts/FeedPosts";
import SuggestedUsers from "../../components/SuggestedUsers/SuggestedUsers";

const HomePage = () => {
	return (
		<Box minH="100vh" bg="gray.50">
			<Container maxW="container.lg" px={{ base: 4, md: 8 }}>
				<Flex gap={10} align="flex-start">

					{/* Feed */}
					<Box
						flex={2}
						py={8}
						maxW={{ base: "100%", lg: "600px" }}
					>
						<FeedPosts />
					</Box>

					{/* Divider — visible on large screens only */}
					<Divider
						orientation="vertical"
						minH="100vh"
						display={{ base: "none", lg: "block" }}
						borderColor="gray.200"
					/>

					{/* Sidebar */}
					<Box
						flex={1}
						display={{ base: "none", lg: "block" }}
						py={8}
						position="sticky"
						top="20px"
						alignSelf="flex-start"
						maxW="280px"
					>
						<SuggestedUsers />
					</Box>

				</Flex>
			</Container>
		</Box>
	);
};

export default HomePage;