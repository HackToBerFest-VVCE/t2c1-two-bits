// scripts/rotate-solana-wallet.cjs
//
// Rotates the SOLANA_PRIVATE_KEY stored in .env.local.
// • Generates a fresh Solana wallet locally.
// • Verifies there is exactly ONE SOLANA_PRIVATE_KEY line before making any change.
// • Guarantees safe replacement on Windows (backup, tmp files, atomic rename).
// • Fails early if a previous backup ('.env.local.bak') or temp ('.env.local.tmp') already exists.
// • Prints ONLY the new public address and a concise success/failure message.
// • No private‑key material, full .env contents, or network traffic ever appears in logs.
//
// Usage (after approval):
//   node scripts/rotate-solana-wallet.cjs
//
// IMPORTANT: The script does NOT modify source code, does NOT commit to git,
// and does NOT transmit any data.

const fs = require("fs");
const path = require("path");
const { Keypair } = require("@solana/web3.js");

// -----------------------------------------------------------------------------
// 1️⃣ Paths and safety pre‑checks
// -----------------------------------------------------------------------------
const envPath = path.resolve(__dirname, "..", ".env.local");
const tmpPath = `${envPath}.tmp`;
const backupPath = `${envPath}.bak`;

function abort(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}



// -----------------------------------------------------------------------------
// 2️⃣ Generate a new wallet (only after the safety checks have passed)
// -----------------------------------------------------------------------------
const newKeypair = Keypair.generate();
const publicKey = newKeypair.publicKey.toBase58();
const secretKeyArray = Array.from(newKeypair.secretKey);

// -----------------------------------------------------------------------------
// 3️⃣ Load the current .env.local (fail fast if missing)
// -----------------------------------------------------------------------------
let envContent;
try {
  envContent = fs.readFileSync(envPath, { encoding: "utf8" });
} catch (err) {
  console.error("❌ Could not read .env.local:", err.message);
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 4️⃣ Verify exactly one SOLANA_PRIVATE_KEY entry
// -----------------------------------------------------------------------------
const keyLines = envContent.match(/^SOLANA_PRIVATE_KEY=.*$/gm) || [];
if (keyLines.length !== 1) {
  console.error(
    `❌ Expected exactly one SOLANA_PRIVATE_KEY entry, found ${keyLines.length}.`,
  );
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 5️⃣ Prepare the replacement line
// -----------------------------------------------------------------------------
const newLine = `SOLANA_PRIVATE_KEY=${JSON.stringify(secretKeyArray)}`;
const newEnvContent = envContent.replace(/^SOLANA_PRIVATE_KEY=.*$/m, newLine);

// -----------------------------------------------------------------------------
// 6️⃣ Write safely (Windows‑compatible atomic replace)
// -----------------------------------------------------------------------------
try {
  // a) Write new content to a temporary file first
  fs.writeFileSync(tmpPath, newEnvContent, { encoding: "utf8", mode: 0o600 });

  // b) Verify the temporary file:
  //    - Exactly one SOLANA_PRIVATE_KEY line.
  //    - Its value matches the freshly generated secretKeyArray.
  //    - All other content is unchanged.
  const tempContent = fs.readFileSync(tmpPath, { encoding: "utf8" });
  const tempLines = tempContent.split(/\r?\n/);
  const tempKeyLines = tempLines.filter((l) => l.startsWith("SOLANA_PRIVATE_KEY="));
  if (tempKeyLines.length !== 1) {
    fs.unlinkSync(tmpPath);
    abort("Verification of temporary .env file failed (unexpected SOLANA_PRIVATE_KEY count).");
  }
  const tempKeyLine = tempKeyLines[0];
  const extractedValue = tempKeyLine.split("=")[1];
  let extractedArray;
  try { extractedArray = JSON.parse(extractedValue); } catch { extractedArray = null; }
  const keysMatch = Array.isArray(extractedArray) && extractedArray.length === secretKeyArray.length && extractedArray.every((v,i) => v === secretKeyArray[i]);
  if (!keysMatch) {
    fs.unlinkSync(tmpPath);
    abort("Verification of temporary .env file failed (private key mismatch).");
  }
  // Ensure the rest of the file matches what we expect (no accidental changes).
  if (tempContent !== newEnvContent) {
    fs.unlinkSync(tmpPath);
    abort("Verification of temporary .env file failed (content mismatch).");
  }

  // c) Keep a backup of the original file before touching it
  fs.copyFileSync(envPath, backupPath, fs.constants.COPYFILE_EXCL);

  // d) Remove the original (required on Windows before renaming)
  fs.unlinkSync(envPath);

  // e) Rename the verified temp file to the original name
  fs.renameSync(tmpPath, envPath);

  // f) Verify the newly written .env.local matches expectations:
  const finalContent = fs.readFileSync(envPath, { encoding: "utf8" });
  const finalLines = finalContent.split(/\r?\n/);
  const finalKeyLines = finalLines.filter((l) => l.startsWith("SOLANA_PRIVATE_KEY="));
  if (finalKeyLines.length !== 1) {
    throw new Error("Post‑replace verification failed (unexpected SOLANA_PRIVATE_KEY count).");
  }
  const finalKeyLine = finalKeyLines[0];
  const finalExtracted = finalKeyLine.split("=")[1];
  let finalArray;
  try { finalArray = JSON.parse(finalExtracted); } catch { finalArray = null; }
  const finalMatch = Array.isArray(finalArray) && finalArray.length === secretKeyArray.length && finalArray.every((v,i)=>v===secretKeyArray[i]);
  if (!finalMatch || finalContent !== newEnvContent) {
    throw new Error("Post‑replace verification failed (content mismatch or key mismatch).");
  }

  // g) All verifications passed – safe to delete the backup.
  try {
    fs.unlinkSync(backupPath);
  } catch (cleanupErr) {
    console.error("⚠️ Could not delete backup file; it has been retained for safety.");
  }
} catch (err) {
  // Safe recovery only if a backup exists.
  if (fs.existsSync(backupPath)) {
    // Attempt to move any existing (possibly corrupted) .env.local aside and restore the backup.
    try {
      // Determine a unique recovery filename.
      let recoveryPath = `${envPath}.failed`;
      let suffix = 0;
      while (fs.existsSync(recoveryPath)) {
        suffix += 1;
        recoveryPath = `${envPath}.failed.${suffix}`;
      }

      // Move the current .env.local (if it exists) to the recovery location.
      if (fs.existsSync(envPath)) {
        fs.renameSync(envPath, recoveryPath);
      }

      // Clean up the temporary file if it still exists.
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }

      // Restore the backup as the working .env.local.
      fs.renameSync(backupPath, envPath);
    } catch (restoreErr) {
      // Preserve any files that were created and emit a concise warning.
      console.error("⚠️ Recovery failed:", restoreErr.message);
    }
  } else {
    // No backup available – just clean up the temporary file if possible.
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch (_) {
        // Swallow cleanup errors; we will still report the original failure.
      }
    }
  }
  console.error("❌ Failed to rotate SOLANA_PRIVATE_KEY:", err.message);
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 7️⃣ Success output (only public address)
// -----------------------------------------------------------------------------
console.log("✅ New Solana wallet generated.");
console.log(`Public address: ${publicKey}`);
