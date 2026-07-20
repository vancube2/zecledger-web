import Home from "./components/Home";
import { getAllEntries } from "../lib/archive";

// Server component: reads the latest archive entry at build time for the teaser,
// then hands off to the interactive client shell. Everything that needs the
// filesystem stays here; everything interactive lives in Home.
export default function Page() {
  const entries = getAllEntries();
  const latest = entries[0] || null;
  return <Home latest={latest} />;
}
