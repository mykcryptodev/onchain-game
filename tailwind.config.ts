import daisyui from "daisyui";
import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {},
  daisyui: {
    themes: ["lofi"],
  },
  plugins: [daisyui],
} satisfies Config;
