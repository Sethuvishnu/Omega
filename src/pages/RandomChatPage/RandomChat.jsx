// src/pages/RandomChatPage/RandomChat.jsx

import {
    Flex, VStack, Box, Button, Input, Text, Avatar,
    HStack, useColorModeValue, Spinner, Center,
    Badge, Icon, Tooltip, useToast,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from 'react';
import { BsSend, BsLightningChargeFill } from "react-icons/bs";
import { MdFiberManualRecord } from "react-icons/md";
import { io } from 'socket.io-client';
import useAuthStore from "../../store/authStore";

/* ─── Config ─────────────────────────────────────────────────── */
const SOCKET_URL = import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:4000';

/* ─── Palette ────────────────────────────────────────────────── */
const ACCENT  = "#E8420A";
const ACCENT2 = "#9B1FBD";
const SENT_BG = "linear-gradient(135deg, #E8420A, #FF6B35)";
const RECV_BG = "linear-gradient(135deg, #9B1FBD22, #9B1FBD11)";

/* ─── Singleton socket ───────────────────────────────────────── */
let socket = null;
const getSocket = () => {
    if (!socket) socket = io(SOCKET_URL, { transports: ['websocket'] });
    return socket;
};

/* ─── Root ───────────────────────────────────────────────────── */
const RandomChat = () => {
    const authUser = useAuthStore((state) => state.user);
    const pageBg   = useColorModeValue("#F7F7F8", "#0D0D0F");

    if (!authUser) {
        return (
            <Center h="100vh" bg={pageBg}>
                <VStack spacing={4}>
                    <Icon as={BsLightningChargeFill} boxSize={10} color={ACCENT} />
                    <Text fontSize="lg" fontWeight="semibold" color="gray.500">
                        Please login to use Random Chat
                    </Text>
                </VStack>
            </Center>
        );
    }

    return (
        <Box h="100vh" bg={pageBg} display="flex" flexDirection="column">
            <Header />
            <Box flex={1} overflow="hidden">
                <ChatRoom />
            </Box>
        </Box>
    );
};

/* ─── Header ─────────────────────────────────────────────────── */
const Header = () => {
    const authUser = useAuthStore((state) => state.user);
    const [online, setOnline] = useState(false);
    const headerBg = useColorModeValue("rgba(255,255,255,0.8)", "rgba(13,13,15,0.85)");

    useEffect(() => {
        const s = getSocket();
        s.on('connect',    () => setOnline(true));
        s.on('disconnect', () => setOnline(false));
        setOnline(s.connected);
        return () => { s.off('connect'); s.off('disconnect'); };
    }, []);

    return (
        <Flex
            px={6} py={4}
            bg={headerBg}
            backdropFilter="blur(12px)"
            borderBottom="1px solid"
            borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}
            justifyContent="space-between"
            alignItems="center"
            position="sticky" top={0} zIndex={10}
        >
            <HStack spacing={3}>
                <Box w={9} h={9} borderRadius="10px" bg={SENT_BG}
                    display="flex" alignItems="center" justifyContent="center">
                    <Icon as={BsLightningChargeFill} color="white" boxSize={4} />
                </Box>
                <VStack spacing={0} align="flex-start">
                    <Text fontWeight="bold" fontSize="md" lineHeight={1.2}>Random Chat</Text>
                    <HStack spacing={1}>
                        <Icon as={MdFiberManualRecord} color={online ? "green.400" : "red.400"} boxSize={2} />
                        <Text fontSize="xs" color="gray.400">{online ? "Live • Global" : "Connecting…"}</Text>
                    </HStack>
                </VStack>
            </HStack>

            <HStack spacing={2} px={3} py={2} borderRadius="full"
                border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.200")}
                bg={useColorModeValue("white", "whiteAlpha.50")}>
                <Avatar size="xs" src={authUser?.profilePicURL || ""} name={authUser?.username} />
                <Text fontSize="sm" fontWeight="medium" display={{ base: "none", md: "block" }}>
                    {authUser?.username}
                </Text>
                <Badge colorScheme="orange" variant="subtle" borderRadius="full" fontSize="9px" px={2}>YOU</Badge>
            </HStack>
        </Flex>
    );
};

/* ─── ChatRoom ───────────────────────────────────────────────── */
const ChatRoom = () => {
    const messagesEndRef = useRef();
    const authUser       = useAuthStore((state) => state.user);
    const toast          = useToast();

    const [formValue,  setFormValue]  = useState('');
    const [messages,   setMessages]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [sending,    setSending]    = useState(false); // blocks input while AI moderates

    /* ── Load history + socket listeners ── */
    useEffect(() => {
        fetch(`${SOCKET_URL}/api/random-chat/messages`)
            .then(r => r.json())
            .then(data => { setMessages(data); setLoading(false); })
            .catch(() => setLoading(false));

        const s = getSocket();

        s.on('new_message', (msg) => {
            setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        });

        // ── Moderation rejection ──
        s.on('message_blocked', ({ reason }) => {
            setSending(false);
            toast({
                title: "Message not sent",
                description: reason || "Your message was flagged by our AI moderation.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top",
            });
        });

        return () => {
            s.off('new_message');
            s.off('message_blocked');
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ── Send ── */
    const sendMessage = (e) => {
        e?.preventDefault();
        if (!formValue.trim() || sending) return;

        setSending(true); // show "checking…" state while AI moderates
        getSocket().emit('send_message', {
            text:     formValue.trim(),
            uid:      authUser.uid,
            username: authUser.username,
            photoURL: authUser.profilePicURL || '',
        });
        setFormValue('');

        // Reset sending state after 5s as fallback (in case socket event never returns)
        setTimeout(() => setSending(false), 5000);
    };

    // Also reset sending when our own message arrives successfully
    useEffect(() => {
        const s = getSocket();
        const onNew = (msg) => {
            if (msg.uid === authUser?.uid) setSending(false);
        };
        s.on('new_message', onNew);
        return () => s.off('new_message', onNew);
    }, [authUser]);

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) sendMessage(e);
    };

    const inputBg    = useColorModeValue("white", "whiteAlpha.100");
    const inputBorder = useColorModeValue("gray.200", "whiteAlpha.200");
    const footerBg   = useColorModeValue("rgba(255,255,255,0.85)", "rgba(13,13,15,0.9)");

    if (loading) {
        return (
            <Center h="full">
                <VStack spacing={3}>
                    <Spinner size="xl" color={ACCENT} thickness="3px" />
                    <Text fontSize="sm" color="gray.400">Loading messages…</Text>
                </VStack>
            </Center>
        );
    }

    return (
        <Flex direction="column" h="full">
            {/* ── Message list ── */}
            <Box flex={1} overflowY="auto" px={{ base: 4, md: 8 }} py={6}
                css={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '4px' },
                }}>
                {messages.length === 0 ? (
                    <Center h="full">
                        <VStack spacing={3}>
                            <Text fontSize="3xl">👋</Text>
                            <Text color="gray.400" fontSize="sm">No messages yet — say hello!</Text>
                        </VStack>
                    </Center>
                ) : (
                    <VStack spacing={4} align="stretch">
                        {messages.map((msg, i) => (
                            <ChatMessage
                                key={msg._id}
                                message={msg}
                                showAvatar={i === 0 || messages[i - 1].uid !== msg.uid}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </VStack>
                )}
            </Box>

            {/* ── Input bar ── */}
            <Box px={{ base: 4, md: 8 }} py={4} bg={footerBg}
                backdropFilter="blur(12px)" borderTop="1px solid"
                borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                <HStack spacing={3} bg={inputBg} border="1px solid"
                    borderColor={inputBorder} borderRadius="16px" px={4} py={2}
                    boxShadow="0 2px 12px rgba(0,0,0,0.06)"
                    _focusWithin={{ borderColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT}22` }}
                    transition="all 0.2s">
                    <Avatar size="xs" src={authUser?.profilePicURL || ""} name={authUser?.username} />
                    <Input
                        value={formValue}
                        onChange={(e) => setFormValue(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder={sending ? "Checking message…" : "Say something nice…"}
                        border="none"
                        _focus={{ boxShadow: "none" }}
                        fontSize="sm"
                        flex={1}
                        bg="transparent"
                        isDisabled={sending}
                        opacity={sending ? 0.6 : 1}
                    />
                    <Tooltip label={sending ? "Moderating…" : "Send (Enter)"} fontSize="xs">
                        <Button
                            onClick={sendMessage}
                            isDisabled={!formValue.trim() || sending}
                            isLoading={sending}
                            loadingText=""
                            size="sm"
                            borderRadius="12px"
                            px={4}
                            bg={formValue.trim() && !sending ? SENT_BG : "gray.100"}
                            color={formValue.trim() && !sending ? "white" : "gray.400"}
                            _hover={{ opacity: 0.88, transform: "scale(1.04)" }}
                            _active={{ transform: "scale(0.97)" }}
                            transition="all 0.18s"
                            leftIcon={<BsSend />}
                        >
                            Send
                        </Button>
                    </Tooltip>
                </HStack>
                <Text fontSize="10px" color="gray.400" textAlign="center" mt={2}>
                    {sending
                        ? "🤖 AI is reviewing your message…"
                        : "Press Enter to send · visible to everyone · AI moderated"}
                </Text>
            </Box>
        </Flex>
    );
};

/* ─── ChatMessage ────────────────────────────────────────────── */
const ChatMessage = ({ message, showAvatar }) => {
    const { text, uid, photoURL, username } = message;
    const authUser = useAuthStore((state) => state.user);
    const isSent   = uid === authUser?.uid;
    const recvText  = useColorModeValue("gray.800", "whiteAlpha.900");
    const timeColor = useColorModeValue("gray.400", "gray.500");

    return (
        <Flex justify={isSent ? "flex-end" : "flex-start"} w="full" px={1}>
            <HStack spacing={2} maxW={{ base: "85%", md: "65%" }}
                flexDirection={isSent ? "row-reverse" : "row"} align="flex-end">
                {showAvatar ? (
                    <Avatar size="sm" src={photoURL} name={username}
                        border="2px solid" borderColor={isSent ? ACCENT : ACCENT2} flexShrink={0} />
                ) : (
                    <Box w="32px" flexShrink={0} />
                )}
                <VStack align={isSent ? "flex-end" : "flex-start"} spacing={1}>
                    {showAvatar && (
                        <Text fontSize="11px" color={timeColor} fontWeight="semibold" px={1} letterSpacing="0.02em">
                            {isSent ? "You" : username}
                        </Text>
                    )}
                    <Box
                        px={4} py={2.5}
                        borderRadius={isSent ? "18px 18px 4px 18px" : "18px 18px 18px 4px"}
                        bg={isSent ? SENT_BG : RECV_BG}
                        color={isSent ? "white" : recvText}
                        border={isSent ? "none" : "1px solid"}
                        borderColor={`${ACCENT2}33`}
                        boxShadow={isSent ? "0 4px 14px rgba(232,66,10,0.3)" : "0 2px 8px rgba(0,0,0,0.06)"}
                        _hover={{ transform: "translateY(-1px)", transition: "0.15s" }}
                        transition="transform 0.15s"
                    >
                        <Text fontSize="sm" lineHeight={1.6}>{text}</Text>
                    </Box>
                </VStack>
            </HStack>
        </Flex>
    );
};

export default RandomChat;