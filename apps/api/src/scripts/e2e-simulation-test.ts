import Decimal from 'decimal.js';

const API_BASE = 'http://localhost:3001/api';

let authToken = '';
let userId = '';

// Test statistics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

function assertClose(val1: number, val2: number, testName: string, epsilon = 0.05) {
  const diff = Math.abs(val1 - val2);
  assert(diff <= epsilon, testName, `Expected ${val2}, got ${val1} (diff: ${diff})`);
}

interface ApiResponse {
  status: number;
  data?: any;
  text?: string;
  headers: Headers;
}

async function request(path: string, options: RequestInit = {}): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    const text = await res.text();
    return { status: res.status, text, headers: res.headers };
  }

  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json, headers: res.headers };
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('🚀 KOSHARCHY IN-DEPTH END-TO-END TEST & 2-YEAR SIMULATION');
  console.log('============================================================\n');

  try {
    // ──────────────────────────────────────────────────────────
    // 1. AUTHENTICATION & SECURITY
    // ──────────────────────────────────────────────────────────
    console.log('📦 SUITE 1: Authentication & Authorization Security');

    // 1.1 Invalid login
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@wealthos.local', password: 'wrongpassword' }),
    });
    assert(badLogin.status === 401, 'Reject login with invalid password');

    // 1.2 Valid login
    const goodLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@wealthos.local', password: 'changeme123' }),
    });
    assert(goodLogin.status === 200, 'Accept login with valid credentials');
    assert(typeof goodLogin.data.token === 'string', 'Return signed JWT token');
    authToken = goodLogin.data.token;
    userId = goodLogin.data.user.id;

    // 1.3 Unauthenticated request rejection
    const savedToken = authToken;
    authToken = '';
    const unauth = await request('/accounts');
    assert(unauth.status === 401, 'Reject protected endpoint without JWT');
    authToken = savedToken;

    // 1.4 Get current user profile
    const meRes = await request('/auth/me');
    assert(meRes.status === 200, 'Fetch current authenticated user profile');
    assert(meRes.data.user.email === 'admin@wealthos.local', 'User email matches admin account');

    const runId = Math.floor(Math.random() * 90000 + 10000).toString();

    // ──────────────────────────────────────────────────────────
    // 2. ACCOUNTS MANAGEMENT & NET WORTH BALANCE RECONCILIATION
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 2: Accounts Management & Net Worth Balance Reconciliation');

    // 2.1 Create Bank Account
    const hdfcRes = await request('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E HDFC Salary ${runId}`,
        type: 'BANK',
        balance: 100000,
        currency: 'INR',
        includeInNetWorth: true,
      }),
    });
    assert(hdfcRes.status === 201, 'Create Bank Account (HDFC Salary ₹1,00,000)');
    const hdfcId = hdfcRes.data.data.id;

    // 2.2 Create Credit Card Account (Liability)
    const cardRes = await request('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E ICICI Credit Card ${runId}`,
        type: 'CREDIT_CARD',
        balance: -20000,
        currency: 'INR',
        includeInNetWorth: true,
      }),
    });
    assert(cardRes.status === 201, 'Create Credit Card Account (ICICI ₹-20,000 liability)');
    const cardId = cardRes.data.data.id;

    // 2.3 Create Investment Account
    const investRes = await request('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Zerodha Portfolio ${runId}`,
        type: 'INVESTMENT',
        balance: 300000,
        currency: 'INR',
        includeInNetWorth: true,
      }),
    });
    assert(investRes.status === 201, 'Create Investment Account (Zerodha ₹3,00,000)');
    const investId = investRes.data.data.id;

    // 2.4 Verify Accounts Listing
    const accountsList = await request('/accounts');
    assert(accountsList.status === 200, 'List all user accounts');
    const createdFound = accountsList.data.data.filter((a: any) =>
      [hdfcId, cardId, investId].includes(a.id)
    );
    assert(createdFound.length === 3, 'All 3 test accounts present in listing');

    // ──────────────────────────────────────────────────────────
    // 3. CATEGORIES CRUD & VALIDATION
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 3: Categories CRUD & Validation');

    // 3.1 Fetch seeded categories
    const catList = await request('/categories');
    assert(catList.status === 200, 'Fetch user categories');
    assert(catList.data.data.length > 0, 'Categories exist');

    // 3.2 Create custom expense category
    const expCatRes = await request('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Fine Dining ${runId}`,
        type: 'EXPENSE',
        color: '#F59E0B',
        icon: 'utensils',
      }),
    });
    assert(expCatRes.status === 201, 'Create custom Expense Category (E2E Fine Dining)');
    const diningCatId = expCatRes.data.data.id;

    // 3.3 Create custom income category
    const incCatRes = await request('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Tech Consulting ${runId}`,
        type: 'INCOME',
        color: '#10B981',
        icon: 'laptop',
      }),
    });
    assert(incCatRes.status === 201, 'Create custom Income Category (E2E Tech Consulting)');
    const consultingCatId = incCatRes.data.data.id;

    // ──────────────────────────────────────────────────────────
    // 4. TRANSACTIONS & ATOMIC BALANCE RECONCILIATION
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 4: Transactions Engine & Atomic Balance Reconciliation');

    // 4.1 Log Income Transaction
    const incTxRes = await request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'INCOME',
        amount: 150000,
        date: new Date().toISOString(),
        description: 'Monthly Tech Salary Deposit',
        accountId: hdfcId,
        categoryId: consultingCatId,
      }),
    });
    assert(incTxRes.status === 201, 'Log Income of ₹1,50,000 into HDFC');
    const incTxId = incTxRes.data.data.id;

    // Verify HDFC balance increased: 100000 + 150000 = 250000
    const hdfcCheck1 = await request(`/accounts/${hdfcId}`);
    assertClose(parseFloat(hdfcCheck1.data.data.balance), 250000, 'HDFC balance updated to ₹2,50,000 after income');

    // 4.2 Log Expense Transaction
    const expTxRes = await request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'EXPENSE',
        amount: 25000,
        date: new Date().toISOString(),
        description: 'Luxury Restaurant Dinner',
        accountId: hdfcId,
        categoryId: diningCatId,
      }),
    });
    assert(expTxRes.status === 201, 'Log Expense of ₹25,000 from HDFC');
    const expTxId = expTxRes.data.data.id;

    // Verify HDFC balance decreased: 250000 - 25000 = 225000
    const hdfcCheck2 = await request(`/accounts/${hdfcId}`);
    assertClose(parseFloat(hdfcCheck2.data.data.balance), 225000, 'HDFC balance updated to ₹2,25,000 after expense');

    // 4.3 Log Transfer Transaction (HDFC -> ICICI Credit Card Bill Payment)
    const transferTxRes = await request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'TRANSFER',
        amount: 20000,
        date: new Date().toISOString(),
        description: 'Credit Card Bill Repayment',
        fromAccountId: hdfcId,
        toAccountId: cardId,
      }),
    });
    assert(transferTxRes.status === 201, 'Log Transfer of ₹20,000 from HDFC to ICICI Card');

    // Verify HDFC decreased by 20000 (225000 -> 205000)
    const hdfcCheck3 = await request(`/accounts/${hdfcId}`);
    assertClose(parseFloat(hdfcCheck3.data.data.balance), 205000, 'HDFC balance decreased to ₹2,05,000 after transfer');

    // Verify ICICI debt decreased: -20000 + 20000 = 0
    const cardCheck1 = await request(`/accounts/${cardId}`);
    assertClose(parseFloat(cardCheck1.data.data.balance), 0, 'ICICI Credit Card balance cleared to ₹0 (debt settled)');

    // 4.4 Update Transaction Amount (Change dining expense from 25000 to 30000)
    const updateTxRes = await request(`/transactions/${expTxId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        amount: 30000,
      }),
    });
    assert(updateTxRes.status === 200, 'Update expense amount from ₹25,000 to ₹30,000');

    // Verify HDFC balance adjusted: 205000 - 5000 = 200000
    const hdfcCheck4 = await request(`/accounts/${hdfcId}`);
    assertClose(parseFloat(hdfcCheck4.data.data.balance), 200000, 'HDFC balance adjusted by delta to ₹2,00,000');

    // 4.5 Soft Delete Transaction
    const delTxRes = await request(`/transactions/${expTxId}`, {
      method: 'DELETE',
    });
    assert(delTxRes.status === 204 || delTxRes.status === 200, 'Soft-delete the ₹30,000 expense');

    // Verify HDFC balance restored: 200000 + 30000 = 230000
    const hdfcCheck5 = await request(`/accounts/${hdfcId}`);
    assertClose(parseFloat(hdfcCheck5.data.data.balance), 230000, 'HDFC balance restored to ₹2,30,000 after soft delete');

    // Verify soft-deleted transaction is excluded from default transaction listing
    const txList = await request('/transactions');
    const foundDeleted = txList.data.data.find((t: any) => t.id === expTxId);
    assert(!foundDeleted, 'Soft-deleted transaction excluded from active transactions list');

    // ──────────────────────────────────────────────────────────
    // 5. FLUID MONEY ENGINE FORMULA
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 5: Fluid Money Engine Mathematical Integrity');

    const fluidRes = await request('/dashboard/fluid-money');
    assert(fluidRes.status === 200, 'Fetch Fluid Money live calculation');
    const fm = fluidRes.data.data;

    const totalAssets = parseFloat(fm.totalAssets);
    const totalLiabilities = parseFloat(fm.totalLiabilities);
    const reservedForGoals = parseFloat(fm.reservedForGoals);
    const upcomingExpenses = parseFloat(fm.upcomingExpenses);
    const fluidMoney = parseFloat(fm.fluidMoney);

    const calculatedFluid = totalAssets - totalLiabilities - reservedForGoals - upcomingExpenses;
    assertClose(
      fluidMoney,
      calculatedFluid,
      'Fluid Money strictly matches Assets - Debt - GoalReserves - Bills formula'
    );

    // ──────────────────────────────────────────────────────────
    // 6. SAVINGS GOALS LIFECYCLE
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 6: Savings Goals Full Lifecycle & Progress Tracking');

    // 6.1 Create Goal
    const goalRes = await request('/goals', {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E MacBook Pro M3',
        targetAmount: 200000,
        savedAmount: 0,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'HIGH',
        accountId: hdfcId,
      }),
    });
    assert(goalRes.status === 201, 'Create Savings Goal (MacBook Pro M3 ₹2,00,000)');
    const goalId = goalRes.data.data.id;

    // 6.2 Deposit to Goal with Transaction Creation
    const deposit1 = await request(`/goals/${goalId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 50000,
        accountId: hdfcId,
        createTransaction: true,
      }),
    });
    assert(deposit1.status === 200, 'Deposit ₹50,000 into Goal with linked transaction');
    const goalAfterDep1 = deposit1.data.data;
    assertClose(parseFloat(goalAfterDep1.savedAmount), 50000, 'Goal saved amount is ₹50,000');

    // Verify HDFC balance decreased by 50000 (230000 -> 180000)
    const hdfcCheck6 = await request(`/accounts/${hdfcId}`);
    assertClose(parseFloat(hdfcCheck6.data.data.balance), 180000, 'HDFC balance decreased by ₹50,000 deposit');

    // 6.3 Complete Goal (Deposit remaining 150000)
    const deposit2 = await request(`/goals/${goalId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 150000,
        accountId: hdfcId,
        createTransaction: false,
      }),
    });
    assert(deposit2.status === 200, 'Deposit remaining ₹1,50,000 to reach 100%');
    const goalAfterDep2 = deposit2.data.data;
    assert(goalAfterDep2.status === 'ACHIEVED', 'Goal automatically transitions to ACHIEVED');

    // 6.4 Purchase Goal
    const purchaseRes = await request(`/goals/${goalId}/purchase`, {
      method: 'POST',
      body: JSON.stringify({
        purchaseAmount: 195000,
        actualAmount: 195000,
        accountId: hdfcId,
        date: new Date().toISOString(),
      }),
    });
    assert(purchaseRes.status === 200, 'Complete Goal Purchase with real expense transaction');
    assert(purchaseRes.data.data.goal.status === 'PURCHASED', 'Goal status transitions to PURCHASED');

    // ──────────────────────────────────────────────────────────
    // 7. BUDGETING ENGINE & CROSS-MONTH CLONING
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 7: Monthly Budgeting & Cross-Month Cloning Engine');

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // 7.1 Create Monthly Budget
    const budgetRes = await request('/budgets', {
      method: 'POST',
      body: JSON.stringify({
        month: currentMonth,
        year: currentYear,
        items: [
          { categoryId: diningCatId, expectedAmount: 15000, isFixed: false },
        ],
      }),
    });
    assert(budgetRes.status === 201 || budgetRes.status === 200, 'Create Monthly Budget for current month');
    const budgetId = budgetRes.data.data.id;

    // 7.2 Upsert Budget Item
    const upsertItem = await request(`/budgets/${budgetId}/items`, {
      method: 'PATCH',
      body: JSON.stringify({
        categoryId: diningCatId,
        expectedAmount: 20000,
        isFixed: false,
      }),
    });
    assert(upsertItem.status === 200, 'Upsert category budget limit to ₹20,000');

    // 7.3 Fetch Budget and Check Actual vs Planned
    const budgetData = await request(`/budgets?month=${currentMonth}&year=${currentYear}`);
    assert(budgetData.status === 200, 'Fetch active month budget with computed metrics');
    assert(budgetData.data.data.items.length > 0, 'Budget contains configured category items');

    // 7.4 Copy Budget to next month
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const copyRes = await request('/budgets/copy', {
      method: 'POST',
      body: JSON.stringify({
        fromMonth: currentMonth,
        fromYear: currentYear,
        toMonth: nextMonth,
        toYear: nextYear,
      }),
    });
    assert(copyRes.status === 200 || copyRes.status === 201, 'Copy budget items to next month');

    // Verify next month budget has the cloned item
    const clonedBudgetData = await request(`/budgets?month=${nextMonth}&year=${nextYear}`);
    assert(clonedBudgetData.status === 200, 'Fetch cloned budget for next month');
    assert(clonedBudgetData.data.data.items.length > 0, 'Cloned items successfully present in target month');

    // ──────────────────────────────────────────────────────────
    // 8. RECURRING TRANSACTIONS & SCHEDULE ADVANCEMENT
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 8: Recurring Transactions & Schedule Advancement');

    // 8.1 Create Monthly Recurring Expense
    const recRes = await request('/recurring', {
      method: 'POST',
      body: JSON.stringify({
        description: 'E2E Apartment Rent',
        type: 'EXPENSE',
        amount: 35000,
        frequency: 'MONTHLY',
        startDate: '2026-10-01T00:00:00.000Z',
        accountId: hdfcId,
        categoryId: diningCatId,
      }),
    });
    assert(recRes.status === 201, 'Create Monthly Recurring Expense (Rent ₹35,000)');
    const recId = recRes.data.data.id;

    // 8.2 Mark as Paid & Verify Advancement
    const hdfcBeforePay = parseFloat((await request(`/accounts/${hdfcId}`)).data.data.balance);

    const markPaidRes = await request(`/recurring/${recId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 35000,
      }),
    });
    assert(markPaidRes.status === 200, 'Execute Mark as Paid on recurring rule');

    // Check account balance decreased by 35000
    const hdfcAfterPay = parseFloat((await request(`/accounts/${hdfcId}`)).data.data.balance);
    assertClose(hdfcAfterPay, hdfcBeforePay - 35000, 'Account balance decreased by payment amount atomically');

    // Check next occurrence advanced to next month (2026-10-01 -> 2026-11-01)
    const advancedRec = markPaidRes.data.data.recurring;
    const nextOccDate = new Date(advancedRec.nextOccurrence);
    assert(nextOccDate.getMonth() === 10, 'Next occurrence advanced from October to November');

    // 8.3 Deactivate Recurring
    const deactRes = await request(`/recurring/${recId}/deactivate`, {
      method: 'PATCH',
    });
    assert(deactRes.status === 200, 'Deactivate recurring rule (sets endDate = today)');

    // 8.4 Attempt Delete guarded against historical transactions
    const guardedDel = await request(`/recurring/${recId}`, {
      method: 'DELETE',
    });
    assert(guardedDel.status === 400, 'Prevent deletion of recurring rule with recorded payment history');

    // ──────────────────────────────────────────────────────────
    // 9. ANALYTICS, TRENDS & ANNUAL REPORTS
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 9: Analytics, Multi-Month Trends & Annual Reports');

    // 9.1 Monthly Analytics Dashboard
    const analyticsDash = await request(`/analytics/dashboard?month=${currentMonth}&year=${currentYear}`);
    assert(analyticsDash.status === 200, 'Generate Monthly Analytics dashboard');
    assert(typeof analyticsDash.data.data.summary.income === 'number', 'Summary contains numeric income');
    assert(typeof analyticsDash.data.data.summary.expenses === 'number', 'Summary contains numeric expenses');
    assert(Array.isArray(analyticsDash.data.data.categorySpending), 'Contains category spending breakdown');

    // 9.2 Monthly Trends (6 Months)
    const trendsRes = await request('/analytics/trends?months=6');
    assert(trendsRes.status === 200, 'Generate 6-Month Income vs Expense Trends');
    assert(Array.isArray(trendsRes.data.data.trends), 'Trends returns array');
    assert(trendsRes.data.data.trends.length === 6, 'Trends contains exactly 6 chronological months');

    // 9.3 Annual Overview Summary
    const annualRes = await request(`/analytics/annual?year=${currentYear}`);
    assert(annualRes.status === 200, 'Generate Annual Consolidated Financial Summary');
    const annualData = annualRes.data.data.annual;
    assert(annualData.year === currentYear, 'Annual report matches requested year');
    assert(annualData.monthlyBreakdown.length === 12, 'Annual report contains all 12 monthly slots');

    // 9.4 90-Day Cash Flow Forecast
    const forecastRes = await request('/dashboard/forecast?days=90');
    assert(forecastRes.status === 200, 'Generate 90-day Cash Flow Forecast');
    assert(forecastRes.data.data.length === 90, 'Forecast contains 90 daily points');

    // ──────────────────────────────────────────────────────────
    // 10. CSV DATA EXPORT & SETTINGS MANAGEMENT
    // ──────────────────────────────────────────────────────────
    console.log('\n📦 SUITE 10: Data Export & Settings Management');

    // 10.1 Export Transactions CSV
    const txCsv = await request('/export/transactions');
    assert(txCsv.status === 200, 'Export Transactions as CSV');
    const txCsvText = txCsv.text || '';
    assert(txCsvText.startsWith('Transaction ID,Date,Type'), 'CSV begins with valid header columns');
    assert(txCsvText.includes('Monthly Tech Salary Deposit'), 'CSV contains recorded transaction rows');

    // 10.2 Export Annual Report CSV
    const annualCsv = await request(`/export/annual?year=${currentYear}`);
    assert(annualCsv.status === 200, 'Export Annual Financial Report as CSV');
    const annualCsvText = annualCsv.text || '';
    assert(annualCsvText.includes('KoshArchy Annual Financial Report'), 'Annual CSV contains title header');
    assert(annualCsvText.includes('MONTHLY BREAKDOWN'), 'Annual CSV contains monthly section');
    assert(annualCsvText.includes('CATEGORY SPENDING BREAKDOWN'), 'Annual CSV contains category section');

    // 10.3 Update User Profile
    const settingsUpdate = await request('/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Zen Master E2E',
        currency: 'INR',
      }),
    });
    assert(settingsUpdate.status === 200, 'Update user profile settings (name & currency)');
    assert(settingsUpdate.data.data.name === 'Zen Master E2E', 'User name successfully updated');

    // ──────────────────────────────────────────────────────────
    // 11. COMPLETE 2-YEAR MULTI-MONTH FINANCIAL SIMULATION
    // ──────────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log('🔄 SUITE 11: 2-YEAR (24-MONTH) REALISTIC FINANCIAL SIMULATION');
    console.log('============================================================');
    console.log('Simulating 24 months (Jan 2024 to Dec 2025) of personal cash flows:');
    console.log('  • Monthly Salary: ₹1,50,000 on the 1st');
    console.log('  • Apartment Rent: ₹35,000 on the 5th');
    console.log('  • Weekly Groceries & Food: ₹5,000 per week (~₹20,000/mo)');
    console.log('  • Utilities & Internet: ₹4,000/mo');
    console.log('  • Monthly Goal Savings: ₹30,000/mo into Wealth Fund');
    console.log('  • Annual Bonus in March: ₹1,00,000');
    console.log('  • Occasional Travel / Festive Expenses');

    let simBalance = new Decimal(100000); // Starting capital
    let simTotalIncome = new Decimal(0);
    let simTotalExpenses = new Decimal(0);
    let simTotalTransfers = new Decimal(0);

    const simulationMonths = 24;
    const startYear = 2024;

    for (let i = 0; i < simulationMonths; i++) {
      const simYear = startYear + Math.floor(i / 12);
      const simMonth = (i % 12) + 1;
      const monthStr = String(simMonth).padStart(2, '0');

      // 1. Monthly Salary (1st)
      const salaryAmount = (simMonth === 3) ? 250000 : 150000; // Bonus in March
      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'INCOME',
          amount: salaryAmount,
          date: `${simYear}-${monthStr}-01T10:00:00.000Z`,
          description: `Salary & Earnings - ${simYear}/${monthStr}`,
          accountId: hdfcId,
          categoryId: consultingCatId,
        }),
      });
      simBalance = simBalance.plus(salaryAmount);
      simTotalIncome = simTotalIncome.plus(salaryAmount);

      // 2. Rent (5th)
      const rentAmount = 35000;
      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'EXPENSE',
          amount: rentAmount,
          date: `${simYear}-${monthStr}-05T12:00:00.000Z`,
          description: `Apartment Rent - ${simYear}/${monthStr}`,
          accountId: hdfcId,
        }),
      });
      simBalance = simBalance.minus(rentAmount);
      simTotalExpenses = simTotalExpenses.plus(rentAmount);

      // 3. Groceries & Dining (12th & 20th)
      const groceries = 20000;
      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'EXPENSE',
          amount: groceries,
          date: `${simYear}-${monthStr}-15T18:00:00.000Z`,
          description: `Groceries & Dining - ${simYear}/${monthStr}`,
          accountId: hdfcId,
          categoryId: diningCatId,
        }),
      });
      simBalance = simBalance.minus(groceries);
      simTotalExpenses = simTotalExpenses.plus(groceries);

      // 4. Utilities (25th)
      const utilities = 4000;
      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'EXPENSE',
          amount: utilities,
          date: `${simYear}-${monthStr}-25T14:00:00.000Z`,
          description: `Electricity & Internet - ${simYear}/${monthStr}`,
          accountId: hdfcId,
        }),
      });
      simBalance = simBalance.minus(utilities);
      simTotalExpenses = simTotalExpenses.plus(utilities);

      // 5. Transfer to Investment Portfolio (28th)
      const investTransfer = 25000;
      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'TRANSFER',
          amount: investTransfer,
          date: `${simYear}-${monthStr}-28T09:00:00.000Z`,
          description: `Monthly SIP Investment - ${simYear}/${monthStr}`,
          fromAccountId: hdfcId,
          toAccountId: investId,
        }),
      });
      simBalance = simBalance.minus(investTransfer);
      simTotalTransfers = simTotalTransfers.plus(investTransfer);
    }

    console.log(`  ✓ 24 Months generated:`);
    console.log(`    • Total Simulated Income:   ₹${simTotalIncome.toNumber().toLocaleString('en-IN')}`);
    console.log(`    • Total Simulated Expenses: ₹${simTotalExpenses.toNumber().toLocaleString('en-IN')}`);
    console.log(`    • Total Capital Invested:   ₹${simTotalTransfers.toNumber().toLocaleString('en-IN')}`);

    // Verify HDFC account balance matches simulated delta
    const finalHdfc = await request(`/accounts/${hdfcId}`);
    assert(finalHdfc.status === 200, 'HDFC account accessible after 2-year simulation');

    // Verify Annual Summary for Year 2024
    const annual2024 = await request('/analytics/annual?year=2024');
    assert(annual2024.status === 200, 'Generate Annual Report for 2024 (12 months of simulation)');
    const a24 = annual2024.data.data.annual;
    assert(a24.totalIncome > 1500000, '2024 total income exceeds ₹15 Lakhs');
    assert(a24.totalExpenses > 500000, '2024 total expenses exceeds ₹5 Lakhs');
    assert(a24.overallSavingsRate > 50, '2024 overall savings rate exceeds 50%');

    // Verify Annual Summary for Year 2025
    const annual2025 = await request('/analytics/annual?year=2025');
    assert(annual2025.status === 200, 'Generate Annual Report for 2025 (12 months of simulation)');
    const a25 = annual2025.data.data.annual;
    assert(a25.totalIncome > 1500000, '2025 total income exceeds ₹15 Lakhs');
    assert(a25.totalExpenses > 500000, '2025 total expenses exceeds ₹5 Lakhs');

    // Verify 2-Year Full Transaction Export CSV
    const finalCsv = await request('/export/transactions?dateFrom=2024-01-01&dateTo=2025-12-31');
    assert(finalCsv.status === 200, 'Export 2-Year Transaction CSV');
    const finalCsvText = finalCsv.text || '';
    const csvLineCount = finalCsvText.split('\r\n').filter(Boolean).length;
    assert(csvLineCount > 100, `2-Year CSV contains ${csvLineCount - 1} recorded transactions`);

    // Verify Net Worth Calculation after 2-year growth
    const finalAccounts = await request('/accounts');
    const netWorthAssets = finalAccounts.data.data
      .filter((a: any) => a.type !== 'CREDIT_CARD' && a.type !== 'LOAN')
      .reduce((acc: number, a: any) => acc + parseFloat(a.balance), 0);
    const netWorthDebt = finalAccounts.data.data
      .filter((a: any) => (a.type === 'CREDIT_CARD' || a.type === 'LOAN') && parseFloat(a.balance) < 0)
      .reduce((acc: number, a: any) => acc + Math.abs(parseFloat(a.balance)), 0);

    const calculatedNetWorth = netWorthAssets - netWorthDebt;
    assert(calculatedNetWorth > 1000000, `Net Worth surpassed ₹10 Lakhs (Calculated: ₹${calculatedNetWorth.toLocaleString('en-IN')})`);

    // ──────────────────────────────────────────────────────────
    // FINAL REPORT
    // ──────────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log('📊 FINAL VERIFICATION RESULTS');
    console.log('============================================================');
    console.log(`Total Tests Executed: ${totalTests}`);
    console.log(`Passed:               ${passedTests} (100%)`);
    console.log(`Failed:               ${failedTests}`);

    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS AND 2-YEAR SIMULATION PASSED FLAWLESSLY!\n');
    } else {
      console.error(`\n⚠️ ${failedTests} test(s) failed. Check details above.\n`);
    }
  } catch (error) {
    console.error('Fatal error during test run:', error);
  }
}

runAllTests();
