import { useLocalStorage } from "@/hooks/useLocalStorage";

const FONT_STACKS: Record<string, string> = {
  noto: `"Noto Sans JP", "Hiragino Sans", sans-serif`,
  bizud: `"BIZ UDGothic", "Hiragino Sans", sans-serif`,
  zenmaru: `"Zen Maru Gothic", "Hiragino Sans", sans-serif`,
  mplusrounded: `"M PLUS Rounded 1c", "Hiragino Sans", sans-serif`,
  klee: `"Klee One", "Hiragino Mincho ProN", serif`,
  mincho: `"Shippori Mincho", "Hiragino Mincho ProN", serif`,
};

const FONT_KEY = "tebakAksara_font_v1";

export default function FontSelector() {
  const [font, setFont] = useLocalStorage<string>(FONT_KEY, "noto");

  const handleChange = (key: string) => {
    setFont(key);
    const stack = FONT_STACKS[key] || FONT_STACKS.noto;
    document.documentElement.style.setProperty("--kana-font", stack);
  };

  // apply on mount
  if (typeof document !== "undefined") {
    const stack = FONT_STACKS[font] || FONT_STACKS.noto;
    document.documentElement.style.setProperty("--kana-font", stack);
  }

  return (
    <div className="settings-group">
      <label className="settings-label" htmlFor="font-select">
        Change Font
      </label>
      <select
        id="font-select"
        className="settings-select"
        value={font}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="noto">Noto Sans JP</option>
        <option value="bizud">BIZ UDGothic</option>
        <option value="zenmaru">Zen Maru Gothic</option>
        <option value="mplusrounded">M PLUS Rounded 1c</option>
        <option value="klee">Klee One</option>
        <option value="mincho">Shippori Mincho</option>
      </select>
      <div className="font-preview" style={{ fontFamily: FONT_STACKS[font] }}>
        あ ア 日
      </div>
    </div>
  );
}
