import { Avatar, Flex, Skeleton, SkeletonCircle, Text } from "@chakra-ui/react";
import useGetUserProfileById from "../../hooks/useGetUserProfileById";
import { Link } from "react-router-dom";
import { timeAgo } from "../../utils/timeAgo";

const Comment = ({ comment }) => {
	const { userProfile, isLoading } = useGetUserProfileById(comment.createdBy);

	if (isLoading) return <CommentSkeleton />;
	return (
		<Flex gap={4}>
			<Link to={`/${userProfile.username}`}>
				<Avatar src={userProfile.profilePicURL} size={"sm"} />
			</Link>
			<Flex direction={"column"}>
				<Flex gap={2} alignItems={"center"}>
					<Link to={`/${userProfile.username}`}>
						<Text fontWeight={"bold"} fontSize={12} color={"white"}>
							{userProfile.username}
						</Text>
					</Link>
					<Text fontSize={14} color={"whiteAlpha.900"}>
						{comment.comment}
					</Text>
				</Flex>
				<Text fontSize={12} color={"gray.400"}>
					{timeAgo(comment.createdAt)}
				</Text>
			</Flex>
		</Flex>
	);
};

export default Comment;

const CommentSkeleton = () => {
	return (
		<Flex gap={4} w={"full"} alignItems={"center"}>
			<SkeletonCircle h={10} w='10' startColor="gray.700" endColor="gray.600" />
			<Flex gap={1} flexDir={"column"}>
				<Skeleton height={2} width={100} startColor="gray.700" endColor="gray.600" />
				<Skeleton height={2} width={50} startColor="gray.700" endColor="gray.600" />
			</Flex>
		</Flex>
	);
};