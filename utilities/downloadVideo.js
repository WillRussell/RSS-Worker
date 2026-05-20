const { spawn } = require("child_process");
const chalk = require("chalk");
const { log, logBright } = require("../logging");

const DOWNLOAD_PROGRESS_RE =
  /\[download\]\s+([\d.]+)%(?:\s+of\s+[^\s]+\s+at\s+([\S]+)\s+ETA\s+(\S+))?/;
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠣", "⠏"];

function buildProgressBar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  return (
    chalk.bold.blueBright("█".repeat(filled)) +
    chalk.blackBright("░".repeat(width - filled))
  );
}

module.exports.downloadVideo = async (url) => {
  logBright("\nStarting download & audio extraction...");

  const ytDlpArgs = [
    "-f",
    "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio",
    "-o",
    "./downloads/%(title)s.%(ext)s",
    "-x",
    "--audio-format",
    "m4a",
    url,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn("yt-dlp", ytDlpArgs);

    let inDownloadPhase = false;
    let conversionMessageShown = false;
    let spinnerInterval = null;
    let spinnerFrame = 0;

    function startSpinner() {
      spinnerFrame = 0;
      spinnerInterval = setInterval(() => {
        process.stdout.write(
          `\r${chalk.bold.blueBright("Extracting audio...")}  ${chalk.white(SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length])}   `,
        );
        spinnerFrame++;
      }, 80);
    }

    function stopSpinner() {
      if (spinnerInterval !== null) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
        process.stdout.write(
          `\r${chalk.bold.blueBright("Extracting audio...")}  ${chalk.white("Complete ✓")}   \n\n`,
        );
      }
    }

    child.stdout.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(DOWNLOAD_PROGRESS_RE);
        if (match) {
          inDownloadPhase = true;
          const pct = parseFloat(match[1]);
          const bar = buildProgressBar(pct);
          const speed = match[2] ? chalk.blackBright(`  ${match[2]}`) : "";
          const eta = match[3] ? chalk.blackBright(`  ETA ${match[3]}`) : "";
          process.stdout.write(
            `\r${chalk.bold.blueBright("Downloading")}  ${chalk.white("[" + bar + "]")}  ${chalk.bold.white(match[1] + "%")}${speed}${eta}   `,
          );
        } else {
          if (inDownloadPhase) {
            process.stdout.write("\n\n");
            inDownloadPhase = false;
          }
          stopSpinner();
          if (trimmed.startsWith("[ExtractAudio] Destination:")) {
            startSpinner();
          } else {
            log(trimmed);
            if (
              trimmed.startsWith("[download] Destination:") ||
              trimmed.startsWith("Deleting original file")
            ) {
              process.stdout.write("\n");
            }
          }
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      const message = chunk.toString();
      if (!conversionMessageShown) {
        if (inDownloadPhase) {
          process.stdout.write("\n");
          inDownloadPhase = false;
        }
        conversionMessageShown = true;
        logBright("\nChecking format(s)...");
      }
      process.stderr.write(message);
    });

    child.on("close", (code) => {
      stopSpinner();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });

    child.on("error", (err) => reject(err));
  });
};
