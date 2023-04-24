import express from "express";
import * as fs from "fs/promises";
import * as path from "path";
import * as mime from "mime-types";
import * as midiManager from "midi-file";

const app = express();

const MIDI_DIR = process.argv[2];

app.get("/midi/:file", async (req, res) => {
  try {
    const file = await fs.readFile(path.join(MIDI_DIR, req.params.file));
    res.end(file);
  } catch {
    res.status(404).end("404 not found.");
  }
});

app.get("/", async (req, res) => {
  res.redirect("/client/index.html");
});

app.get("/client/*", async (req, res) => {
  const type = mime.lookup(req.url) ?? "application/octet-stream";
  const filepath = path.join(
    "client/dist",
    req.url.split("/").slice(2).join("/")
  );
  console.log(filepath);
  res.contentType(type);
  res.end(await fs.readFile(filepath));
});

app.get("/metadata", async (req, res) => {
  const data = await fs.readdir(MIDI_DIR);
  res.contentType("application/json");
  res.end(JSON.stringify(data));
});

function midiLength(midi) {
  return (
    Math.max(
      midi.tracks.map((t) => t.reduce((prev, curr) => prev + curr.deltaTime, 0))
    ) / midi.header.ticksPerBeat
  );
}

app.get("/midi-meta/:midifile", async (req, res) => {
  const filepath = path.join(MIDI_DIR, req.params.midifile);
  const stat = await fs.stat(filepath);
  const data = midiManager.parseMidi(await fs.readFile(filepath));
  res.contentType("application/json");
  res.end(
    JSON.stringify({
      size: stat.size,
      time: stat.ctimeMs,
      length: midiLength(data),
    })
  );
});

app.listen(80);
