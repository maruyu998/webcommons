// import os from "os";
import fs from "fs";

type MemoryInfo = {
  MemTotal?: number;
  MemFree?: number;
  Buffers?: number;
  Cached?: number;
  MemAvailable?: number;
}

export function getMemoryInfo():MemoryInfo{
  try {
    const memInfo = fs.readFileSync("/proc/meminfo", "utf8");
    const lines = memInfo.split("\n");

    const memoryInfo:Partial<MemoryInfo> = {};
    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        const key = parts[0].trim() as keyof MemoryInfo;
        const value = parseInt(parts[1].trim().split(' ')[0], 10) * 1024; // Convert to bytes
        memoryInfo[key] = value;
      }
    });

    return memoryInfo;
  } catch (error) {
    console.error("Error reading /proc/meminfo:", error);
    return {};
  }
}
