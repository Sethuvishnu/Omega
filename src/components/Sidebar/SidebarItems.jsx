import CreatePost from "./CreatePost";
import Home from "./Home";
import Notifications from "./Notifications";
import ProfileLink from "./ProfileLink";
import RandomChatLink from "./RandomChatLink";
import Search from "./Search";

const SidebarItems = () => {
	return (
		<>
			<Home />
			<Search />
			<Notifications />
			<RandomChatLink />
			<CreatePost />
			<ProfileLink />
		</>
	);
};

export default SidebarItems;
