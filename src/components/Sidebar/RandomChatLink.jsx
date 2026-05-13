// import {
//     Box,
//     Button,
//     Flex,
//     Input,
//     Modal,
//     ModalBody,
//     ModalCloseButton,
//     ModalContent,
//     ModalHeader,
//     ModalOverlay,
//     Text,
//     Avatar,
//     Spinner,
//     Tooltip,
//     useDisclosure,
// } from "@chakra-ui/react";
// import { SearchLogo } from "../../assets/constants";
// import { useRef, useState, useEffect } from "react";
// import { useAuthState } from "react-firebase-hooks/auth";
// import { useCollectionData } from "react-firebase-hooks/firestore";
// import firebase from "firebase/app";
// import "firebase/auth";
// import "firebase/firestore";

// const auth = firebase.auth();
// const firestore = firebase.firestore();

// // ─── Random Chat Entry Point ───────────────────────────────────────────────────
// const RandomChat = () => {
//     const { isOpen, onOpen, onClose } = useDisclosure();
//     const [user] = useAuthState(auth);
//     const [roomId, setRoomId] = useState(null);
//     const [isMatching, setIsMatching] = useState(false);

//     const handleOpen = () => {
//         onOpen();
//         if (user) startMatching();
//     };

//     const handleClose = () => {
//         onClose();
//         setRoomId(null);
//         setIsMatching(false);
//     };

//     const startMatching = async () => {
//         setIsMatching(true);
//         setRoomId(null);

//         const waitingRef = firestore.collection("waiting");
//         const snapshot = await waitingRef.where("uid", "!=", user.uid).limit(1).get();

//         if (!snapshot.empty) {
//             // Found a waiting user — create a room with them
//             const waitingDoc = snapshot.docs[0];
//             const partnerId = waitingDoc.data().uid;

//             const roomRef = await firestore.collection("chatRooms").add({
//                 participants: [user.uid, partnerId],
//                 createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//             });

//             // Remove the waiting entry and set room
//             await waitingDoc.ref.delete();
//             setRoomId(roomRef.id);
//         } else {
//             // No one waiting — add ourselves to the waiting pool
//             const myWaitRef = await waitingRef.add({
//                 uid: user.uid,
//                 createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//             });

//             // Listen for a room to be created that includes us
//             const unsub = firestore
//                 .collection("chatRooms")
//                 .where("participants", "array-contains", user.uid)
//                 .orderBy("createdAt", "desc")
//                 .limit(1)
//                 .onSnapshot((snap) => {
//                     if (!snap.empty) {
//                         setRoomId(snap.docs[0].id);
//                         myWaitRef.delete();
//                         unsub();
//                     }
//                 });
//         }

//         setIsMatching(false);
//     };

//     const skipStranger = async () => {
//         if (roomId) {
//             // Mark room as ended
//             await firestore.collection("chatRooms").doc(roomId).update({ ended: true });
//         }
//         startMatching();
//     };

//     return (
//         <>
//             <Tooltip
//                 hasArrow
//                 label={"Random Chat"}
//                 placement="right"
//                 ml={1}
//                 openDelay={500}
//                 display={{ base: "block", md: "none" }}
//             >
//                 <Flex
//                     alignItems={"center"}
//                     gap={4}
//                     _hover={{ bg: "whiteAlpha.400" }}
//                     borderRadius={6}
//                     p={2}
//                     w={{ base: 10, md: "full" }}
//                     justifyContent={{ base: "center", md: "flex-start" }}
//                     onClick={handleOpen}
//                     cursor="pointer"
//                 >
//                     <SearchLogo />
//                     <Box display={{ base: "none", md: "block" }}>Random Chat</Box>
//                 </Flex>
//             </Tooltip>

//             <Modal isOpen={isOpen} onClose={handleClose} motionPreset="slideInLeft" size="md">
//                 <ModalOverlay />
//                 <ModalContent bg={"black"} border={"1px solid gray"} maxW={"420px"} h={"600px"} display="flex" flexDirection="column">
//                     <ModalHeader borderBottom="1px solid gray" pb={3}>
//                         <Flex align="center" justify="space-between" pr={8}>
//                             <Text>Random Chat</Text>
//                             {roomId && (
//                                 <Button size="xs" variant="outline" colorScheme="gray" onClick={skipStranger}>
//                                     Skip →
//                                 </Button>
//                             )}
//                         </Flex>
//                     </ModalHeader>
//                     <ModalCloseButton />

//                     <ModalBody p={0} display="flex" flexDirection="column" flex={1} overflow="hidden">
//                         {!user ? (
//                             <SignIn />
//                         ) : isMatching ? (
//                             <MatchingScreen />
//                         ) : !roomId ? (
//                             <StartScreen onStart={startMatching} />
//                         ) : (
//                             <ChatRoom roomId={roomId} currentUser={user} />
//                         )}
//                     </ModalBody>
//                 </ModalContent>
//             </Modal>
//         </>
//     );
// };

// // ─── Sign In ───────────────────────────────────────────────────────────────────
// const SignIn = () => {
//     const signInWithGoogle = () => {
//         const provider = new firebase.auth.GoogleAuthProvider();
//         auth.signInWithPopup(provider);
//     };

//     return (
//         <Flex direction="column" align="center" justify="center" flex={1} gap={4} p={8}>
//             <Text fontSize="2xl">💬</Text>
//             <Text color="gray.300" textAlign="center">
//                 Sign in to start chatting with strangers
//             </Text>
//             <Button onClick={signInWithGoogle} colorScheme="blue" size="md">
//                 Sign in with Google
//             </Button>
//             <Text fontSize="xs" color="gray.500" textAlign="center">
//                 Do not violate the community guidelines or you will be banned for life!
//             </Text>
//         </Flex>
//     );
// };

// // ─── Start Screen ─────────────────────────────────────────────────────────────
// const StartScreen = ({ onStart }) => (
//     <Flex direction="column" align="center" justify="center" flex={1} gap={4} p={8}>
//         <Text fontSize="3xl">💬</Text>
//         <Text color="gray.200" fontWeight="500">
//             Start a random chat
//         </Text>
//         <Text color="gray.500" fontSize="sm" textAlign="center">
//             You'll be connected with a random stranger
//         </Text>
//         <Button onClick={onStart} colorScheme="blue" size="md" mt={2}>
//             Start Chatting
//         </Button>
//     </Flex>
// );

// // ─── Matching Screen ──────────────────────────────────────────────────────────
// const MatchingScreen = () => (
//     <Flex direction="column" align="center" justify="center" flex={1} gap={4} p={8}>
//         <Spinner size="lg" color="blue.400" />
//         <Text color="gray.300">Looking for a stranger...</Text>
//         <Text color="gray.600" fontSize="sm">
//             This won't take long
//         </Text>
//     </Flex>
// );

// // ─── Chat Room ────────────────────────────────────────────────────────────────
// const ChatRoom = ({ roomId, currentUser }) => {
//     const dummy = useRef();
//     const [formValue, setFormValue] = useState("");

//     const messagesRef = firestore
//         .collection("chatRooms")
//         .doc(roomId)
//         .collection("messages");

//     const query = messagesRef.orderBy("createdAt").limitToLast(50);
//     const [messages] = useCollectionData(query, { idField: "id" });

//     useEffect(() => {
//         if (dummy.current) {
//             dummy.current.scrollIntoView({ behavior: "smooth" });
//         }
//     }, [messages]);

//     const sendMessage = async (e) => {
//         e.preventDefault();
//         if (!formValue.trim()) return;

//         const { uid, photoURL, displayName } = currentUser;

//         await messagesRef.add({
//             text: formValue.trim(),
//             createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//             uid,
//             photoURL,
//             displayName,
//         });

//         setFormValue("");
//         dummy.current?.scrollIntoView({ behavior: "smooth" });
//     };

//     return (
//         <>
//             {/* System notice */}
//             <Box textAlign="center" py={2} borderBottom="1px solid" borderColor="gray.800">
//                 <Text fontSize="xs" color="gray.500">
//                     You are now connected with a stranger
//                 </Text>
//             </Box>

//             {/* Messages */}
//             <Box flex={1} overflowY="auto" p={4} display="flex" flexDirection="column" gap={3}
//                 sx={{
//                     "&::-webkit-scrollbar": { width: "4px" },
//                     "&::-webkit-scrollbar-thumb": { bg: "gray.700", borderRadius: "2px" },
//                 }}
//             >
//                 {messages &&
//                     messages.map((msg) => (
//                         <ChatMessage key={msg.id} message={msg} currentUid={currentUser.uid} />
//                     ))}
//                 <span ref={dummy} />
//             </Box>

//             {/* Input */}
//             <Box borderTop="1px solid" borderColor="gray.800" p={3}>
//                 <form onSubmit={sendMessage}>
//                     <Flex gap={2} align="center">
//                         <Input
//                             value={formValue}
//                             onChange={(e) => setFormValue(e.target.value)}
//                             placeholder="Say something nice..."
//                             bg="gray.900"
//                             border="1px solid"
//                             borderColor="gray.700"
//                             borderRadius="full"
//                             px={4}
//                             _focus={{ borderColor: "blue.500", boxShadow: "none" }}
//                             _placeholder={{ color: "gray.600" }}
//                             size="sm"
//                         />
//                         <Button
//                             type="submit"
//                             isDisabled={!formValue.trim()}
//                             colorScheme="blue"
//                             borderRadius="full"
//                             size="sm"
//                             px={4}
//                         >
//                             🕊️
//                         </Button>
//                     </Flex>
//                 </form>
//             </Box>
//         </>
//     );
// };

// // ─── Chat Message ─────────────────────────────────────────────────────────────
// const ChatMessage = ({ message, currentUid }) => {
//     const { text, uid, photoURL, displayName } = message;
//     const isSent = uid === currentUid;

//     return (
//         <Flex
//             direction={isSent ? "row-reverse" : "row"}
//             align="flex-end"
//             gap={2}
//         >
//             <Avatar
//                 size="xs"
//                 src={photoURL || ""}
//                 name={displayName || "Stranger"}
//             />
//             <Box maxW="68%">
//                 <Box
//                     bg={isSent ? "blue.600" : "gray.800"}
//                     color="white"
//                     px={3}
//                     py={2}
//                     borderRadius="xl"
//                     borderBottomRightRadius={isSent ? "2px" : "xl"}
//                     borderBottomLeftRadius={isSent ? "xl" : "2px"}
//                     fontSize="sm"
//                     lineHeight="1.5"
//                 >
//                     {text}
//                 </Box>
//             </Box>
//         </Flex>
//     );
// };

// export default RandomChat;


import { Avatar, Box, Link, Tooltip } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const RandomChatLink = () => {
    const authUser = useAuthStore((state) => state.user);

    return (
        <Tooltip
            hasArrow
            label={"Random Chat"}
            placement='right'
            ml={1}
            openDelay={500}
            display={{ base: "block", md: "none" }}
        >
            <Link
                display={"flex"}
                to={"/randomchat"}  // Changed to point to your RandomChat page
                as={RouterLink}
                alignItems={"center"}
                gap={4}
                _hover={{ bg: "whiteAlpha.400" }}
                borderRadius={6}
                p={2}
                w={{ base: 10, md: "full" }}
                justifyContent={{ base: "center", md: "flex-start" }}
            >
                <Avatar size={"sm"} src={authUser?.profilePicURL || ""} />
                <Box display={{ base: "none", md: "block" }}>Random Chat</Box>
            </Link>
        </Tooltip>
    );
};

export default RandomChatLink;
