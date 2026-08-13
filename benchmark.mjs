import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { promisify, styleText } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { Queue as CurrentQueue } from "./index.js";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const filename = join(import.meta.dirname, "benchmark.mjs");
const taskCount = Number(process.env.TASKS || 1000);
const taskBytes = Number(process.env.TASK_BYTES || 1024);
const taskWorkMs = Number(process.env.TASK_WORK_MS || 2);
const taskTimeoutMs = Number(process.env.TASK_TIMEOUT_MS || 1);
const mode = process.argv[2];
const useColors = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);

function colorize(value, color) {
	if (!useColors) {
		return value;
	}

	return styleText(color, value);
}

function formatChange(metric, before, after) {
	const delta = after - before;
	const percent = before === 0 ? 0 : (delta / before) * 100;
	const sign = percent >= 0 ? "+" : "";
	const value = `${sign}${percent.toFixed(2)}%`;

	if (delta === 0) {
		return value;
	}

	if (Math.abs(percent) < 1) {
		return colorize(value, "yellow");
	}

	const lowerIsBetter = ["timeouts", "pushMs", "drainMs", "totalMs", "peakRssMb"].includes(metric);
	const improved = lowerIsBetter ? delta < 0 : delta > 0;
	return colorize(value, improved ? "green" : "red");
}

function visibleLength(value) {
	let length = 0;

	for (let index = 0; index < value.length; index++) {
		if (value.charCodeAt(index) === 27 && value[index + 1] === "[") {
			const end = value.indexOf("m", index + 2);
			if (end !== -1) {
				index = end;
				continue;
			}
		}

		length++;
	}

	return length;
}

function printTable(rows) {
	const headers = ["metric", "before", "after", "delta", "change"];
	const values = rows.map(row => headers.map(header => String(row[header])));
	const widths = headers.map((header, index) => Math.max(
		header.length,
		...values.map(row => visibleLength(row[index]))
	));
	const border = `+${widths.map(width => "-".repeat(width + 2)).join("+")}+`;
	const renderRow = row => `| ${row.map((value, index) => {
		return `${value}${" ".repeat(widths[index] - visibleLength(value))}`;
	}).join(" | ")} |`;

	console.log(border);
	console.log(renderRow(headers));
	console.log(border);
	for (const row of values) {
		console.log(renderRow(row));
	}
	console.log(border);
}

async function loadQueue(variant) {
	if (variant === "after") {
		return CurrentQueue;
	}

	const directory = await mkdtemp(join(tmpdir(), "tiny-queue-benchmark-"));
	const sourceFile = join(directory, "index.js");
	const { stdout: source } = await execFileAsync("git", ["show", "HEAD:index.js"], {
		encoding: "utf8"
	});
	await writeFile(sourceFile, source);

	try {
		return require(sourceFile).Queue;
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

async function run(Queue) {
	let completedWorkers = 0;
	let doneCount = 0;
	let timeoutCount = 0;
	let resolveWorkers;
	const workersFinished = new Promise(resolve => {
		resolveWorkers = resolve;
	});
	const tasks = Array.from({ length: taskCount }, (_, index) => {
		const payload = Buffer.alloc(taskBytes, index % 251);
		return {
			payload,
			run: async() => {
				let checksum = 0;
				for (let offset = 0; offset < payload.length; offset += 64) {
					checksum ^= payload[offset];
				}
				await delay(taskWorkMs);
				completedWorkers++;
				if (completedWorkers === taskCount) {
					resolveWorkers();
				}

				return checksum;
			}
		};
	});
	const queue = new Queue(async task => task.run(), {
		timeout: taskTimeoutMs
	});
	queue.on("done", () => doneCount++);
	queue.on("timeout", () => timeoutCount++);
	let peakRss = process.memoryUsage().rss;
	const monitor = setInterval(() => {
		peakRss = Math.max(peakRss, process.memoryUsage().rss);
	}, 10);
	const started = performance.now();
	const drained = new Promise((resolve, reject) => {
		queue.once("drain", resolve);
		queue.once("error", reject);
	});

	queue.push(...tasks);
	const pushFinished = performance.now();
	await drained;
	const drainFinished = performance.now();
	await workersFinished;
	await new Promise(resolve => setImmediate(resolve));
	clearInterval(monitor);

	return {
		tasks: taskCount,
		taskBytes,
		taskWorkMs,
		taskTimeoutMs,
		done: doneCount,
		timeouts: timeoutCount,
		pushMs: Number((pushFinished - started).toFixed(2)),
		drainMs: Number((drainFinished - started).toFixed(2)),
		totalMs: Number((performance.now() - started).toFixed(2)),
		peakRssMb: Number((peakRss / 1024 / 1024).toFixed(2))
	};
}

async function main() {
	if (mode) {
		const Queue = await loadQueue(mode);
		const result = await run(Queue);
		console.log(JSON.stringify(result));
		return;
	}

	const results = {};

	for (const variant of ["before", "after"]) {
		const { stdout } = await execFileAsync(process.execPath, [filename, variant], {
			encoding: "utf8"
		});

		results[variant] = JSON.parse(stdout);
	}

	if (results.before && results.after) {
		const metrics = ["done", "timeouts", "pushMs", "drainMs", "totalMs", "peakRssMb"];
		const rows = metrics.map(metric => {
			const before = results.before[metric];
			const after = results.after[metric];
			const delta = after - before;

			return {
				metric,
				before,
				after,
				delta: Number(delta.toFixed(2)),
				change: formatChange(metric, before, after)
			};
		});

		console.log(`tasks: ${results.after.tasks}, payload: ${results.after.taskBytes} bytes, work: ${results.after.taskWorkMs} ms, timeout: ${results.after.taskTimeoutMs} ms`);
		printTable(rows);
	}
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
