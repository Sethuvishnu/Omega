import {
	Box,
	Button,
	CloseButton,
	Flex,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Textarea,
	Tooltip,
	useDisclosure,
} from "@chakra-ui/react";
import { CreatePostLogo } from "../../assets/constants";
import { BsFillImageFill } from "react-icons/bs";
import { useRef, useState } from "react";
import usePreviewImg from "../../hooks/usePreviewImg";
import useShowToast from "../../hooks/useShowToast";
import useAuthStore from "../../store/authStore";
import usePostStore from "../../store/postStore";
import useUserProfileStore from "../../store/userProfileStore";
import { useLocation } from "react-router-dom";
import { addDoc, arrayUnion, collection, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabaseUrl = "https://tmgntqxinsfygfijwkor.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ250cXhpbnNmeWdmaWp3a29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTc2NzgsImV4cCI6MjA5NDIzMzY3OH0.kBnRcq3GEkHX4Uy639JZxNDUkzwZ6CBQnl7TitLzf-M";
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const CreatePost = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [caption, setCaption] = useState("");
	const imageRef = useRef(null);
	const { handleImageChange, selectedFile, setSelectedFile } = usePreviewImg();
	const showToast = useShowToast();
	const { isLoading, handleCreatePost } = useCreatePost();

	const handlePostCreation = async () => {
		try {
			await handleCreatePost(selectedFile, caption);
			onClose();
			setCaption("");
			setSelectedFile(null);
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	return (
		<>
			<Tooltip
				hasArrow
				label={"Create"}
				placement='right'
				ml={1}
				openDelay={500}
				display={{ base: "block", md: "none" }}
			>
				<Flex
					alignItems={"center"}
					gap={4}
					_hover={{ bg: "whiteAlpha.400" }}
					borderRadius={6}
					p={2}
					w={{ base: 10, md: "full" }}
					justifyContent={{ base: "center", md: "flex-start" }}
					onClick={onOpen}
				>
					<CreatePostLogo />
					<Box display={{ base: "none", md: "block" }}>Create</Box>
				</Flex>
			</Tooltip>

			<Modal isOpen={isOpen} onClose={onClose} size='xl'>
				<ModalOverlay />
				<ModalContent bg={"gray.900"} border={"1px solid gray"} color={"white"}>
					<ModalHeader borderBottom={"1px solid gray"}>Create Post</ModalHeader>
					<ModalCloseButton />
					<ModalBody pb={6}>
						<Textarea
							placeholder='Post caption...'
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							color={"white"}
							_placeholder={{ color: "gray.400" }}
							border={"1px solid gray"}
							_focus={{ border: "1px solid gray", boxShadow: "none" }}
						/>
						<Input type='file' hidden ref={imageRef} onChange={handleImageChange} />
						<BsFillImageFill
							onClick={() => imageRef.current.click()}
							style={{ marginTop: "15px", marginLeft: "5px", cursor: "pointer", color: "white" }}
							size={20}
						/>
						{selectedFile && (
							<Flex mt={5} w={"full"} position={"relative"} justifyContent={"center"}>
								<Image src={selectedFile} alt='Selected img' borderRadius={4} />
								<CloseButton
									position={"absolute"}
									top={2}
									right={2}
									color={"white"}
									bg={"blackAlpha.600"}
									onClick={() => setSelectedFile(null)}
								/>
							</Flex>
						)}
					</ModalBody>
					<ModalFooter borderTop={"1px solid gray"}>
						<Button
							mr={3}
							onClick={handlePostCreation}
							isLoading={isLoading}
							colorScheme="blue"
							size={"sm"}
						>
							Post
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreatePost;

function useCreatePost() {
	const showToast = useShowToast();
	const [isLoading, setIsLoading] = useState(false);
	const authUser = useAuthStore((state) => state.user);
	const createPost = usePostStore((state) => state.createPost);
	const addPost = useUserProfileStore((state) => state.addPost);
	const userProfile = useUserProfileStore((state) => state.userProfile);
	const { pathname } = useLocation();

	const handleCreatePost = async (selectedFile, caption) => {
		if (isLoading) return;
		if (!selectedFile) throw new Error("Please select an image");
		if (!authUser) throw new Error("You must be logged in to create a post");
		setIsLoading(true);

		try {
			const base64Response = await fetch(selectedFile);
			const blob = await base64Response.blob();
			const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
			const filePath = `posts/${fileName}`;

			console.log("Starting Supabase upload...");

			const { data: uploadData, error: uploadError } = await supabaseClient.storage
				.from("device_images")
				.upload(filePath, blob, {
					cacheControl: "3600",
					upsert: false,
				});

			console.log("Upload data:", uploadData);
			console.log("Upload error:", uploadError);

			if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

			const { data: urlData } = supabaseClient.storage
				.from("device_images")
				.getPublicUrl(filePath);

			console.log("URL data:", urlData);

			const publicUrl = urlData?.publicUrl;

			console.log("Public URL:", publicUrl);

			if (!publicUrl) throw new Error("Failed to get public URL from Supabase");

			const newPost = {
				caption: caption,
				likes: [],
				comments: [],
				createdAt: Date.now(),
				createdBy: authUser.uid,
				imageURL: publicUrl,
			};

			console.log("Saving post to Firestore:", newPost);

			const postDocRef = await addDoc(collection(firestore, "posts"), newPost);
			const userDocRef = doc(firestore, "users", authUser.uid);
			await updateDoc(userDocRef, { posts: arrayUnion(postDocRef.id) });

			if (userProfile.uid === authUser.uid) createPost({ ...newPost, id: postDocRef.id });
			if (pathname !== "/" && userProfile.uid === authUser.uid) addPost({ ...newPost, id: postDocRef.id });

			showToast("Success", "Post created successfully", "success");
		} catch (error) {
			console.error("Post creation error:", error);
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	return { isLoading, handleCreatePost };
}