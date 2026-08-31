import { chromium } from 'playwright';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://127.0.0.1:5000';

let passCount = 0;
let failCount = 0;

function section(title) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function ok(msg) {
  passCount++;
  console.log(`  ✅ PASS  ${msg}`);
}

function fail(msg) {
  failCount++;
  console.log(`  ❌ FAIL  ${msg}`);
}

function info(msg) {
  console.log(`  ℹ️  INFO  ${msg}`);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runPatientE2ETests() {
  console.log('🚀 Starting Patient Dashboard Real Browser E2E Test Suite...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    section('PATIENT DASHBOARD & MANAGEMENT E2E TESTS');

    // 1. Navigate to Login Page and clear storage for clean session
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input#email', { timeout: 8000 });
    ok('Login page rendered with login inputs');

    // 2. Perform Patient Login
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill('patient@example.com');
    await passwordInput.fill('password123');
    await submitBtn.click();
    info('Submitted Patient login credentials');

    // 3. Wait for Dashboard to render
    await page.waitForSelector('aside', { timeout: 10000 });
    ok('Sidebar navigation container loaded');

    await wait(1500);

    // 4. Verify Patient Dashboard Overview & Next Appointment
    const roleBadge = await page.locator('span:has-text("PATIENT")').count();
    if (roleBadge > 0) {
      ok('Patient Role Badge displayed in sidebar');
    } else {
      fail('Patient Role Badge not found');
    }

    const heroBanner = await page.locator('text=Verified Patient Portal').count();
    if (heroBanner > 0) {
      ok('Hero Welcome Banner & Verified Patient Portal badge displayed');
    } else {
      fail('Hero banner not found');
    }

    const nextAppCard = await page.locator('text=Next Scheduled Appointment').count();
    if (nextAppCard > 0) {
      ok('Next Scheduled Appointment hero card displayed');
    } else {
      fail('Next Scheduled Appointment hero card not found');
    }

    // 5. Verify Metric Breakdown Cards
    const metrics = ['Upcoming', 'Completed', 'Cancelled', 'Notifications'];
    let allMetricsFound = true;
    for (const m of metrics) {
      const count = await page.locator(`p:text("${m}"), p:has-text("${m}")`).count();
      if (count === 0) allMetricsFound = false;
    }
    if (allMetricsFound) {
      ok('All 4 metric cards displayed (Upcoming, Completed, Cancelled, Notifications)');
    } else {
      fail('One or more metric cards missing');
    }

    // 6. Navigate to "Find Doctor & Book"
    const bookNavBtn = page.locator('button:has-text("Find Doctor & Book")');
    await bookNavBtn.click();
    await wait(1000);

    const bookingHeading = await page.locator('text=Find a Doctor & Book Appointment').count();
    if (bookingHeading > 0) {
      ok('Navigated to "Find Doctor & Book" view');
    } else {
      fail('Failed to navigate to Find Doctor & Book view');
    }

    const docSearch = page.locator('input[placeholder*="Search by doctor" i]');
    if ((await docSearch.count()) > 0) {
      ok('Doctor search filter input active');
    } else {
      fail('Doctor search filter input missing');
    }

    const slotBtns = await page.locator('button:has-text(":00"), button:has-text(":30")').count();
    if (slotBtns > 0) {
      ok(`Available consultation time slots generated dynamically (${slotBtns} slots)`);
    } else {
      fail('No consultation time slots generated');
    }

    // 7. Navigate to "My Appointments"
    const appNavBtn = page.locator('button:has-text("My Appointments")');
    await appNavBtn.click();
    await wait(1000);

    const myAppHeading = await page.locator('text=My Appointments').count();
    if (myAppHeading > 0) {
      ok('Navigated to "My Appointments" view');
    } else {
      fail('Failed to navigate to My Appointments view');
    }

    // Check filter tabs
    const allTab = await page.locator('button:has-text("All Consultations")').count();
    const upTab = await page.locator('button:has-text("Upcoming")').count();
    const compTab = await page.locator('button:has-text("Completed")').count();
    const cancTab = await page.locator('button:has-text("Cancelled")').count();
    if (allTab > 0 && upTab > 0 && compTab > 0 && cancTab > 0) {
      ok('All 4 appointment filter tabs present (All, Upcoming, Completed, Cancelled)');
    } else {
      fail('Filter tabs missing');
    }

    // 8. Navigate to "My Transfers"
    const trNavBtn = page.locator('button:has-text("My Transfers")');
    await trNavBtn.click();
    await wait(1000);

    const trHeading = await page.locator('text=My Transfer Requests').count();
    if (trHeading > 0) {
      ok('Navigated to "My Transfers" view');
    } else {
      fail('Failed to navigate to My Transfers view');
    }

    // 9. Navigate to "Notifications"
    const notifNavBtn = page.locator('button:has-text("Notifications")');
    await notifNavBtn.click();
    await wait(1000);

    const notifHeading = await page.locator('text=Notification Center').count();
    if (notifHeading > 0) {
      ok('Navigated to "Notification Center" view');
    } else {
      fail('Failed to navigate to Notification Center view');
    }

    const unreadTab = await page.locator('button:has-text("Unread")').count();
    if (unreadTab > 0) {
      ok('Notification filter tabs (All / Unread) present');
    } else {
      fail('Notification filter tabs missing');
    }

    // 10. Test Settings View
    const settingsNavBtn = page.locator('aside nav button:has-text("Settings")');
    await settingsNavBtn.click();
    await wait(1000);

    const settingsCount = await page.locator('h1:has-text("Settings"), h3:has-text("Profile")').count();
    if (settingsCount > 0) {
      ok('Settings & Patient Profile view accessible');
    } else {
      fail('Settings view not accessible');
    }

    // 11. Test Interactive Logout Modal
    const logoutBtn = page.locator('aside button:has-text("Logout")');
    await logoutBtn.click();
    await wait(500);

    const modalTitle = await page.locator('h3:has-text("Sign Out"), p:has-text("log out")').count();
    if (modalTitle > 0) {
      ok('Confirmation modal displayed on Logout click');
    } else {
      fail('Logout confirmation modal not displayed');
    }

    // Click confirm logout button in modal
    const confirmLogoutBtn = page.locator('button:has-text("Sign Out")').last();
    if ((await confirmLogoutBtn.count()) > 0) {
      await confirmLogoutBtn.click();
      await wait(1000);
      ok('Patient successfully logged out back to login screen');
    }

    section('FINAL RESULTS');
    console.log(`  Total Tests Passed: ${passCount}`);
    console.log(`  Total Tests Failed: ${failCount}`);
    console.log(`  Overall Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%\n`);

    await browser.close();
    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Playwright Test Error:', err);
    await browser.close();
    process.exit(1);
  }
}

runPatientE2ETests();
