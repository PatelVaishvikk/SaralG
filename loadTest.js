const { chromium } = require('playwright');
const fs = require('fs');

// ========================= CONFIG =========================
const APP_URL = 'https://www.sc.suhradsportsclub.ca/';
const TOTAL_USERS = 150;
const CONCURRENCY = 20;          // max parallel browsers at once
const SESSION_DURATION = 300000; // 5 min per user
const REFRESH_INTERVAL = 30000;

const results = [];

const testUsers = Array.from({ length: TOTAL_USERS }, (_, i) => ({
    username: `testuser${i + 1}`,
    password: 'Test@123'
}));

// ========================= CONCURRENCY LIMITER =========================
async function runWithConcurrency(tasks, limit) {
    const queue = [...tasks];
    const running = new Set();
    const results = [];

    return new Promise((resolve) => {
        function runNext() {
            while (running.size < limit && queue.length > 0) {
                const task = queue.shift();
                const promise = task().then(r => {
                    running.delete(promise);
                    results.push(r);
                    if (queue.length === 0 && running.size === 0) resolve(results);
                    else runNext();
                }).catch(err => {
                    running.delete(promise);
                    results.push({ error: err.message });
                    if (queue.length === 0 && running.size === 0) resolve(results);
                    else runNext();
                });
                running.add(promise);
            }
        }
        runNext();
    });
}

// ========================= PERCENTILE HELPER =========================
function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

// ========================= SESSION ACTIVITY =========================
async function simulateDashboardActivity(page, username, metrics) {
    const end = Date.now() + SESSION_DURATION;

    while (Date.now() < end) {
        const cycleStart = Date.now();
        try {
            await page.click('text=Scores', { timeout: 5000 });
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1000);

            await page.click('text=Dashboard', { timeout: 5000 });
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1000);

            const matchCard = page.locator('.match-card').first();
            if (await matchCard.count() > 0) {
                await matchCard.click({ timeout: 5000 });
                await page.waitForLoadState('domcontentloaded');
                await page.waitForTimeout(2000);
                await page.goBack({ waitUntil: 'domcontentloaded' });
            }

            await page.reload({ waitUntil: 'domcontentloaded' }); // networkidle can hang forever
            metrics.refreshTimes.push(Date.now() - cycleStart);

        } catch (error) {
            metrics.failures += 1;
            metrics.errors.push({
                time: new Date().toISOString(),
                message: error.message.split('\n')[0] // first line only
            });
        }

        // Wait for remainder of interval (don't drift if cycle was slow)
        const elapsed = Date.now() - cycleStart;
        const wait = Math.max(0, REFRESH_INTERVAL - elapsed);
        if (wait > 0) await page.waitForTimeout(wait);
    }
}

// ========================= USER TEST =========================
async function loginAndTest(user) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const metrics = {
        username: user.username,
        loginTime: 0,
        dashboardLoadTime: 0,
        refreshTimes: [],
        failures: 0,
        errors: [],
        status: 'PASS'
    };

    try {
        // GO TO SITE DIRECTLY (No Login Needed)
        const loginStart = Date.now();
        await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        metrics.loginTime = Date.now() - loginStart;

        // PAGE READY WAIT
        const dashStart = Date.now();
        await page.waitForTimeout(2000); // Give it a moment to boot up before activity
        metrics.dashboardLoadTime = Date.now() - dashStart;

        await simulateDashboardActivity(page, user.username, metrics);

    } catch (error) {
        metrics.status = 'FAIL';
        metrics.failures += 1;
        metrics.errors.push({ time: new Date().toISOString(), message: error.message.split('\n')[0] });
    } finally {
        await browser.close();
    }

    return metrics;
}

// ========================= REPORT =========================
function printSummary(data) {
    const passed = data.filter(r => r.status === 'PASS').length;
    const allRefresh = data.flatMap(r => r.refreshTimes || []);
    const allLogin = data.map(r => r.loginTime).filter(Boolean);

    console.log('\n========== PERFORMANCE SUMMARY ==========');
    console.log(`Total users:       ${TOTAL_USERS}`);
    console.log(`Passed:            ${passed} / ${TOTAL_USERS}`);
    console.log(`Failed:            ${TOTAL_USERS - passed}`);
    console.log(`Total failures:    ${data.reduce((s, r) => s + (r.failures || 0), 0)}`);
    console.log('');
    console.log('Login time (ms)');
    console.log(`  avg: ${Math.round(allLogin.reduce((a, b) => a + b, 0) / allLogin.length)}`);
    console.log(`  p95: ${percentile(allLogin, 95)}`);
    console.log(`  p99: ${percentile(allLogin, 99)}`);
    console.log('');
    console.log('Cycle refresh time (ms)');
    console.log(`  avg: ${Math.round(allRefresh.reduce((a, b) => a + b, 0) / (allRefresh.length || 1))}`);
    console.log(`  p95: ${percentile(allRefresh, 95)}`);
    console.log(`  p99: ${percentile(allRefresh, 99)}`);
    console.log('=========================================\n');
}

function exportCSV(data) {
    const rows = data.map(r => [
        r.username,
        r.loginTime,
        r.dashboardLoadTime,
        Math.round(r.refreshTimes?.reduce((a, b) => a + b, 0) / (r.refreshTimes?.length || 1)),
        percentile(r.refreshTimes || [], 95),
        r.failures,
        r.status,
        (r.errors || []).map(e => e.message).join(' | ')
    ]);

    const csv = [
        'Username,LoginTime(ms),DashboardLoad(ms),AvgRefresh(ms),P95Refresh(ms),Failures,Status,Errors',
        ...rows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');

    fs.writeFileSync('performance-report.csv', csv);
    console.log('CSV written: performance-report.csv');
}

// ========================= MAIN =========================
(async () => {
    console.log(`Starting load test: ${TOTAL_USERS} users, ${CONCURRENCY} concurrent`);
    const start = Date.now();

    const tasks = testUsers.map(user => () => loginAndTest(user).then(m => {
        results.push(m);
        const done = results.length;
        if (done % 10 === 0) console.log(`Progress: ${done}/${TOTAL_USERS}`);
        return m;
    }));

    await runWithConcurrency(tasks, CONCURRENCY);

    printSummary(results);
    exportCSV(results);
    console.log(`Completed in ${Math.round((Date.now() - start) / 1000)}s`);
})(); 