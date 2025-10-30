import TopNav from "../TopNav";
import { ThemeProvider } from "@/components/theme-provider";

export default function TopNavExample() {
  return (
    <ThemeProvider>
      <TopNav
        onMenuClick={() => console.log("Menu clicked")}
        onSearchClick={() => console.log("Search clicked")}
        onNotificationsClick={() => console.log("Notifications clicked")}
        onProfileClick={() => console.log("Profile clicked")}
        notificationCount={3}
      />
    </ThemeProvider>
  );
}
