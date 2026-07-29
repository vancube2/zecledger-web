import Shell from "./components/Shell";
import Terminal from "./components/Terminal";

export const metadata = { title: "ZecLedger, the portfolio of Zcash" };

export default function PreviewHome() {
  return (
    <Shell wide>
      <Terminal />
    </Shell>
  );
}
