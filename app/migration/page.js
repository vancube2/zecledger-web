import Shell from "../components/Shell";
import MigrationFlow from "../components/MigrationFlow";
import Migration from "../components/Migration";

export const metadata = { title: "Migration, ZecLedger" };

export default function MigrationPage() {
  return (
    <Shell
      wide
      kicker="Live \u00b7 Orchard to Ironwood"
      title="The migration, as it happens."
      dateline="Value leaving the Orchard pool and settling in Ironwood, live. Public data, refreshed each minute."
    >
      <MigrationFlow />
      <div style={{ marginTop: 34 }}>
        <Migration />
      </div>
    </Shell>
  );
}
