const os = require('os');

let prevCpuTimes = null;

function getCpuTimes() {
  const cpus = os.cpus();
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
  for (const cpu of cpus) {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  }
  return { user, nice, sys, idle, irq };
}

exports.getStats = (_req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const curr = getCpuTimes();
  let cpuPercent = null;
  if (prevCpuTimes) {
    const prevTotal =
      prevCpuTimes.user + prevCpuTimes.nice + prevCpuTimes.sys +
      prevCpuTimes.idle + prevCpuTimes.irq;
    const currTotal =
      curr.user + curr.nice + curr.sys + curr.idle + curr.irq;
    const totalDiff = currTotal - prevTotal;
    const idleDiff = curr.idle - prevCpuTimes.idle;
    cpuPercent = totalDiff > 0
      ? Math.round(((totalDiff - idleDiff) / totalDiff) * 100)
      : 0;
  }
  prevCpuTimes = curr;

  const mem = process.memoryUsage();

  res.json({
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0].model,
      loadAvg: os.loadavg(),
      usagePercent: cpuPercent,
    },
    ram: {
      totalMB: Math.round(totalMem / 1024 / 1024),
      usedMB: Math.round(usedMem / 1024 / 1024),
      freeMB: Math.round(freeMem / 1024 / 1024),
      usedPercent: Math.round((usedMem / totalMem) * 100),
    },
    process: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    uptime: {
      serverSeconds: Math.round(process.uptime()),
      systemSeconds: Math.round(os.uptime()),
    },
    platform: os.platform(),
    arch: os.arch(),
  });
};
