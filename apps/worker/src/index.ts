import { processNextPendingJobRun } from './jobRuns'

const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? '5000')

async function pollOnce() {
  const result = await processNextPendingJobRun()

  console.log('agent-cron worker iteration complete', result)
}

async function startWorker() {
  console.log('agent-cron worker starting', {
    pollIntervalMs
  })

  await pollOnce()

  setInterval(() => {
    void pollOnce()
  }, pollIntervalMs)
}

if (import.meta.main) {
  await startWorker()
}

export { pollOnce, startWorker }
