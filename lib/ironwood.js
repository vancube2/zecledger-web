// lib/ironwood.js
//
// Ironwood (NU6.3) readiness, checked rather than reported.
//
// Every fact here comes from asking a lightwalletd server directly. Two separate
// signals are collected for each one:
//
//   what it SAYS  - GetLightdInfo returns its protocol version, the next upgrade
//                   it knows about, and its current consensus branch.
//   what it DOES  - GetSubtreeRoots is called with the Ironwood shielded protocol.
//                   A server that does not know Ironwood rejects it outright.
//
// A server can claim readiness and still fail the probe, so both are reported and
// neither is hidden behind the other.

import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

// NU6.3 consensus parameters. Sources:
//   activation heights + branch id: Zebra 6.0.0 release, ZIP 258
//   https://zfnd.org/zebra-6-0-0-release/
export const IRONWOOD = {
  name: "NU6.3 Ironwood",
  branchId: "37a5165b",
  mainnetHeight: 3428143,
  testnetHeight: 4134000,
  // Expected mainnet activation, roughly 13:00 UTC on 28 July 2026.
  mainnetActivationUtc: "2026-07-28T13:00:00Z",
};

// What node operators have to do, and by when.
//   zcashd will not implement NU6.3 at all, so Zebra becomes the only full
//   validator able to follow the chain from activation. zcashd also reaches end
//   of life on 18 July 2026, ten days before Ironwood.
//   Sources: ZIP 258, Zebra 6.0.0 release notes, ZecHub Shielded News vol.27
export const NODES = {
  zcashdEolUtc: "2026-07-18T00:00:00Z",
  zebraMinVersion: "6.0.0",
  // Zebra 6.0.0 uses state database format 28.0.0, introduced for Ironwood. A
  // snapshot at this major version or above is already in the Ironwood format.
  ironwoodDbMajor: 28,
  snapshotsUrl: "https://zebra.valargroup.dev/mainnet/snapshots.json",
  snapshotsSite: "https://zebra.valargroup.dev/",
};

// A third-party service publishes daily Zebra chain-state snapshots, which is the
// fast way onto Zebra before the deadline. We report what it publishes and let the
// reader judge it. A checksum proves the file is what ValarGroup published; it
// does not prove the chain state inside it is honest. That distinction is the
// reader's to make, so it is stated rather than buried.
export async function getZebraSnapshot() {
  try {
    const res = await fetch(NODES.snapshotsUrl, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return { available: false, error: `HTTP ${res.status}` };
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      return { available: false, error: "no snapshots listed" };
    }
    const latest = list.find((x) => (x.roles || []).includes("latest")) || list[0];
    const dbMajor = Number(latest.db_major || 0);
    return {
      available: true,
      height: Number(latest.height || 0),
      date: latest.date || null,
      size: latest.size || null,
      zebraVersion: latest.zebra_version || null,
      dbFormat: latest.db_format_version || null,
      dbMajor,
      sha256: latest.sha256 || null,
      url: latest.url || null,
      // Verifiable from the snapshot's own metadata, not from any claim.
      ironwoodFormat: dbMajor >= NODES.ironwoodDbMajor,
    };
  } catch (e) {
    return { available: false, error: String(e.message || e) };
  }
}

// The enum value from lightwallet-protocol. Sending this to a server that
// predates Ironwood is what produces "unrecognized shielded protocol".
const SHIELDED_PROTOCOL_IRONWOOD = 2;

const DEADLINE_MS = 8000;

// The public lightwalletd servers worth tracking. Vendor is what the operator
// calls itself; we display what the server actually reports, not this.
export const SERVERS = [
  { host: "zec.rocks", port: 443, chain: "main", label: "zec.rocks" },
  { host: "testnet.zec.rocks", port: 443, chain: "test", label: "testnet.zec.rocks" },
  { host: "mainnet.lightwalletd.com", port: 9067, chain: "main", label: "mainnet.lightwalletd.com", tls: false },
  { host: "na.zec.rocks", port: 443, chain: "main", label: "na.zec.rocks" },
  { host: "eu.zec.rocks", port: 443, chain: "main", label: "eu.zec.rocks" },
  { host: "ai.zec.rocks", port: 443, chain: "main", label: "ai.zec.rocks" },
];

let cachedClientCtor = null;

function clientCtor() {
  if (cachedClientCtor) return cachedClientCtor;
  const protoPath = path.join(process.cwd(), "proto", "ironwood.proto");
  const def = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: Number,
    defaults: true,
    oneofs: true,
  });
  const pkg = grpc.loadPackageDefinition(def);
  cachedClientCtor = pkg.cash.z.wallet.sdk.rpc.CompactTxStreamer;
  return cachedClientCtor;
}

function connect(server) {
  const creds =
    server.tls === false
      ? grpc.credentials.createInsecure()
      : grpc.credentials.createSsl();
  const Ctor = clientCtor();
  return new Ctor(`${server.host}:${server.port}`, creds);
}

function deadline() {
  return new Date(Date.now() + DEADLINE_MS);
}

// What the server says about itself.
function getLightdInfo(client) {
  return new Promise((resolve, reject) => {
    client.GetLightdInfo({}, { deadline: deadline() }, (err, res) =>
      err ? reject(err) : resolve(res)
    );
  });
}

// What the server does when asked for Ironwood data. Resolves to a verdict
// rather than throwing, because a rejection here is a meaningful answer.
function probeIronwood(client) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };

    let call;
    try {
      call = client.GetSubtreeRoots(
        { startIndex: 0, shieldedProtocol: SHIELDED_PROTOCOL_IRONWOOD, maxEntries: 1 },
        { deadline: deadline() }
      );
    } catch (e) {
      return done({ accepts: false, detail: String(e.message || e) });
    }

    // Any data at all means the call was understood.
    call.on("data", () => {
      done({ accepts: true, detail: "returned Ironwood subtree roots" });
      call.cancel();
    });

    // A clean end with no rows still means the protocol was accepted: the server
    // understood the request and simply has no Ironwood subtrees yet, which is
    // exactly what a ready server looks like before activation.
    call.on("end", () =>
      done({ accepts: true, detail: "accepted the Ironwood protocol, no subtrees yet" })
    );

    call.on("error", (err) => {
      const msg = String(err.message || err);
      const unknown = /unrecognized shielded protocol|unknown|invalid/i.test(msg);
      done({
        accepts: false,
        detail: unknown ? "rejected the Ironwood protocol" : msg,
      });
    });
  });
}

function closeQuietly(client) {
  try {
    client.close();
  } catch {
    // nothing useful to do here
  }
}

export async function checkServer(server) {
  const client = connect(server);
  try {
    const info = await getLightdInfo(client);
    const probe = await probeIronwood(client);

    const height = Number(info.blockHeight || 0);
    const activationHeight =
      info.chainName === "test" ? IRONWOOD.testnetHeight : IRONWOOD.mainnetHeight;
    const activated = height >= activationHeight;
    const onIronwoodBranch =
      (info.consensusBranchId || "").toLowerCase() === IRONWOOD.branchId;

    return {
      label: server.label,
      reachable: true,
      // what it says
      vendor: info.vendor || "",
      version: info.version || "",
      protocolVersion: info.lightwalletProtocolVersion || "",
      chainName: info.chainName || "",
      blockHeight: height,
      consensusBranchId: info.consensusBranchId || "",
      upgradeName: info.upgradeName || "",
      upgradeHeight: Number(info.upgradeHeight || 0),
      // what it does
      acceptsIronwood: probe.accepts,
      probeDetail: probe.detail,
      // derived
      activationHeight,
      activated,
      onIronwoodBranch,
      blocksToGo: activated ? 0 : activationHeight - height,
      ready: probe.accepts,
    };
  } catch (e) {
    return {
      label: server.label,
      reachable: false,
      error: String(e.message || e),
      ready: false,
    };
  } finally {
    closeQuietly(client);
  }
}

// Zcash aims for a block every 75 seconds, so remaining blocks convert to a
// rough ETA. It is an estimate and is labelled as one.
const TARGET_BLOCK_SECONDS = 75;

export async function checkAll() {
  const [results, snapshot] = await Promise.all([
    Promise.all(SERVERS.map((s) => checkServer(s))),
    getZebraSnapshot(),
  ]);

  // Take the chain tip from the furthest-along reachable mainnet server, and say
  // which one it came from rather than presenting it as a fact from nowhere.
  const mainnet = results
    .filter((r) => r.reachable && r.chainName === "main" && r.blockHeight > 0)
    .sort((a, b) => b.blockHeight - a.blockHeight);
  const tip = mainnet[0] || null;

  const currentHeight = tip ? tip.blockHeight : null;
  const activationHeight = IRONWOOD.mainnetHeight;
  const activated = currentHeight != null && currentHeight >= activationHeight;
  const blocksRemaining =
    currentHeight == null ? null : Math.max(0, activationHeight - currentHeight);

  return {
    checkedAt: new Date().toISOString(),
    upgrade: IRONWOOD,
    nodes: NODES,
    snapshot,
    servers: results,

    // Chain countdown, derived from a named source.
    source: tip ? tip.label : null,
    currentHeight,
    activationHeight,
    testnetActivationHeight: IRONWOOD.testnetHeight,
    activated,
    blocksRemaining,
    targetBlockSeconds: TARGET_BLOCK_SECONDS,
    estimatedSecondsRemaining:
      blocksRemaining == null ? null : blocksRemaining * TARGET_BLOCK_SECONDS,
  };
}
