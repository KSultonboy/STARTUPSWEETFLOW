import { useColorScheme } from "react-native";
import { darkTheme, lightTheme } from "./theme";

export function useAppTheme() {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    return { isDark, colors: isDark ? darkTheme : lightTheme };
}
