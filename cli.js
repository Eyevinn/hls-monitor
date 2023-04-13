#!/usr/bin/env node

const { HLSMonitor } = require("./dist/index.js");

const opt = require("node-getopt").create([
  ["h", "help", "display this help"]
])
.setHelp(
  "Usage: node cli.js [OPTIONS] URL\n\n" +
  "Monitor live HLS stream for inconsistencies:\n" +
  "\n" + 
  "  URL to HLS to monitor\n" +
  "[[OPTIONS]]\n"
)
.bindHelp()
.parseSystem();

if (opt.argv.length < 1) {
  opt.showHelp();
  process.exit(1);
}
console.log("Monitoring " + opt.argv[0]);

const url = new URL(opt.argv[0]);
const monitor = new HLSMonitor([ url.toString() ], 8000, true);
monitor.start();
