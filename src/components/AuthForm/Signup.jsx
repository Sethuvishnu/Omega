import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
	Alert,
	AlertIcon,
	Button,
	Input,
	InputGroup,
	InputRightElement,
	Text,
	Box,
	Progress,
	VStack,
	FormControl,
	FormHelperText,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import useSignUpWithEmailAndPassword from "../../hooks/useSignUpWithEmailAndPassword";

// ── helpers ────────────────────────────────────────────────────────────────

const isValidEmail = (email) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getPasswordStrength = (password) => {
	if (!password) return { score: 0, label: "", color: "gray" };

	let score = 0;
	if (password.length >= 8) score++;
	if (password.length >= 12) score++;
	if (/[A-Z]/.test(password)) score++;
	if (/[0-9]/.test(password)) score++;
	if (/[^A-Za-z0-9]/.test(password)) score++;

	if (score <= 1) return { score: 20, label: "Very weak", color: "red" };
	if (score === 2) return { score: 40, label: "Weak", color: "orange" };
	if (score === 3) return { score: 60, label: "Fair", color: "yellow" };
	if (score === 4) return { score: 80, label: "Strong", color: "green" };
	return { score: 100, label: "Very strong", color: "green" };
};

const passwordHints = (password) => {
	const hints = [];
	if (password.length < 8) hints.push("At least 8 characters");
	if (!/[A-Z]/.test(password)) hints.push("One uppercase letter");
	if (!/[0-9]/.test(password)) hints.push("One number");
	if (!/[^A-Za-z0-9]/.test(password)) hints.push("One special character");
	return hints;
};

// ── component ──────────────────────────────────────────────────────────────

const Signup = () => {
	const [inputs, setInputs] = useState({
		fullName: "",
		username: "",
		email: "",
		password: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [touched, setTouched] = useState({});
	const { loading, error, signup } = useSignUpWithEmailAndPassword();

	const handleBlur = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

	const emailError = useMemo(() => {
		if (!inputs.email) return "";
		if (!isValidEmail(inputs.email)) return "Enter a valid email (e.g. you@gmail.com)";
		return "";
	}, [inputs.email]);

	const strength = useMemo(() => getPasswordStrength(inputs.password), [inputs.password]);
	const hints = useMemo(() => passwordHints(inputs.password), [inputs.password]);

	const isFormValid =
		inputs.fullName &&
		inputs.username &&
		inputs.email &&
		!emailError &&
		inputs.password &&
		strength.score >= 40;

	return (
		<VStack spacing={3} align="stretch">
			{/* Full Name */}
			<Input
				placeholder="Full Name"
				fontSize={14}
				type="text"
				size="sm"
				variant="outline"
				color="gray.800"
				borderColor="gray.300"
				borderWidth="1px"
				_placeholder={{ color: "gray.500" }}
				_focus={{ borderColor: "orange.400" }}
				value={inputs.fullName}
				onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
				onBlur={() => handleBlur("fullName")}
			/>

			{/* Username */}
			<Input
				placeholder="Username"
				fontSize={14}
				type="text"
				size="sm"
				variant="outline"
				color="gray.800"
				borderColor="gray.300"
				borderWidth="1px"
				_placeholder={{ color: "gray.500" }}
				_focus={{ borderColor: "orange.400" }}
				value={inputs.username}
				onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
				onBlur={() => handleBlur("username")}
			/>

			{/* Email */}
			<FormControl isInvalid={touched.email && !!emailError}>
				<Input
					placeholder="Email (e.g. you@gmail.com)"
					fontSize={14}
					type="email"
					size="sm"
					variant="outline"
					color="gray.800"
					borderWidth="1px"
					_placeholder={{ color: "gray.500" }}
					value={inputs.email}
					onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
					onBlur={() => handleBlur("email")}
					borderColor={touched.email && emailError ? "red.400" : "gray.300"}
					_focus={{
						borderColor: touched.email && emailError ? "red.400" : "orange.400",
					}}
				/>
				{touched.email && emailError && (
					<FormHelperText color="red.400" fontSize={12} mt={1}>
						{emailError}
					</FormHelperText>
				)}
				{touched.email && !emailError && inputs.email && (
					<FormHelperText color="green.400" fontSize={12} mt={1}>
						✓ Valid email
					</FormHelperText>
				)}
			</FormControl>

			{/* Password */}
			<FormControl>
				<InputGroup>
					<Input
						placeholder="Password"
						fontSize={14}
						type={showPassword ? "text" : "password"}
						value={inputs.password}
						size="sm"
						variant="outline"
						color="gray.800"
						borderColor="gray.300"
						borderWidth="1px"
						_placeholder={{ color: "gray.500" }}
						_focus={{ borderColor: "orange.400" }}
						onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
						onBlur={() => handleBlur("password")}
					/>
					<InputRightElement h="full">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? <ViewIcon /> : <ViewOffIcon />}
						</Button>
					</InputRightElement>
				</InputGroup>

				{inputs.password && (
					<Box mt={2}>
						<Progress
							value={strength.score}
							size="xs"
							colorScheme={strength.color}
							borderRadius="full"
							transition="all 0.3s"
						/>
						<Text
							fontSize={11}
							color={`${strength.color}.400`}
							mt={1}
							fontWeight={500}
						>
							{strength.label}
						</Text>

						{hints.length > 0 && touched.password && (
							<VStack align="start" spacing={0} mt={1}>
								{hints.map((hint) => (
									<Text key={hint} fontSize={11} color="gray.400">
										• {hint}
									</Text>
								))}
							</VStack>
						)}
					</Box>
				)}
			</FormControl>

			{error && (
				<Alert status="error" fontSize={13} p={2} borderRadius={4}>
					<AlertIcon fontSize={12} />
					{error.message}
				</Alert>
			)}

			<Button
				w="full"
				colorScheme="orange"
				size="sm"
				fontSize={14}
				isLoading={loading}
				isDisabled={!isFormValid}
				onClick={() => signup(inputs)}
			>
				Sign Up
			</Button>
		</VStack>
	);
};

export default Signup;