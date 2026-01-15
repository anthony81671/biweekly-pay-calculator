
const SERVICE_RATE = 0.50; // 50% commission
const UPSELL_RATE = 0.10;  // 10% bonus

/**
 * Calculates bi-weekly sales and commission.
 * @param {Array} days - Array of objects { date: string, services: number, upsells: number }
 * @returns {Object} 
 */
const calculateBiWeeklyPay = (days) => {
    let totalServiceSales = 0;
    let totalUpsellSales = 0;
    let upsellCount = 0;

    days.forEach(day => {
        totalServiceSales += day.services;
        totalUpsellSales += day.upsells;
        if (day.upsells > 0) upsellCount++;
    });

    const serviceCommission = totalServiceSales * SERVICE_RATE;
    const upsellCommission = totalUpsellSales * UPSELL_RATE;
    const totalCommission = serviceCommission + upsellCommission;

    return {
        totalServiceSales: parseFloat(totalServiceSales.toFixed(2)),
        totalUpsellSales: parseFloat(totalUpsellSales.toFixed(2)),
        upsellCount,
        totalSales: parseFloat((totalServiceSales + totalUpsellSales).toFixed(2)),
        workerCommission: parseFloat(totalCommission.toFixed(2)),
        serviceCommission: parseFloat(serviceCommission.toFixed(2)),
        upsellCommission: parseFloat(upsellCommission.toFixed(2))
    };
};

/**
 * Checks if the current date is 14 days or more past the start date.
 */
const checkBiWeeklyReset = (startDateStr) => {
    const start = new Date(startDateStr);
    const today = new Date(); // Use actual today
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return {
        isResetDue: diffDays >= 14,
        daysPassed: diffDays,
        daysRemaining: Math.max(0, 14 - diffDays)
    };
};

// --- SIMULATION / TEST ---

const runSimulation = () => {
    console.log("Running Bi-Weekly Sales Tracking Simulation...");

    // 10 rows of dummy data (covering 10 days of a 14-day period)
    const dummyData = [
        { date: '2026-01-01', services: 150.00, upsells: 20.00 }, // Gel
        { date: '2026-01-02', services: 200.00, upsells: 0.00 },
        { date: '2026-01-03', services: 180.00, upsells: 15.00 }, // Design
        { date: '2026-01-04', services: 120.00, upsells: 10.00 }, // Paraffin
        { date: '2026-01-05', services: 250.00, upsells: 30.00 },
        { date: '2026-01-06', services: 190.00, upsells: 5.00 },
        { date: '2026-01-07', services: 0.00,   upsells: 0.00 }, // Day off
        { date: '2026-01-08', services: 210.00, upsells: 25.00 },
        { date: '2026-01-09', services: 175.00, upsells: 12.00 },
        { date: '2026-01-10', services: 230.00, upsells: 40.00 }
    ];

    const result = calculateBiWeeklyPay(dummyData);

    // Manual expected calculation
    const expectedServiceSales = 150 + 200 + 180 + 120 + 250 + 190 + 0 + 210 + 175 + 230; // 1705.00
    const expectedUpsellSales = 20 + 0 + 15 + 10 + 30 + 5 + 0 + 25 + 12 + 40; // 157.00
    const expectedServiceComm = expectedServiceSales * 0.50; // 852.50
    const expectedUpsellComm = expectedUpsellSales * 0.10;  // 15.70
    const expectedTotalComm = expectedServiceComm + expectedUpsellComm; // 868.20

    console.log("--- Results ---");
    console.log(`Total Service Sales: ${result.totalServiceSales} (Expected: ${expectedServiceSales})`);
    console.log(`Total Upsell Sales:  ${result.totalUpsellSales} (Expected: ${expectedUpsellSales})`);
    console.log(`Worker Commission:   ${result.workerCommission} (Expected: ${expectedTotalComm})`);
    
    const resetCheck = checkBiWeeklyReset('2026-01-01');
    console.log(`Reset Check (Start Jan 1): ${resetCheck.isResetDue ? 'RESET DUE' : 'NOT DUE'} (${resetCheck.daysPassed} days passed)`);

    // Verification Logic
    const isSuccess = 
        result.totalServiceSales === expectedServiceSales &&
        result.totalUpsellSales === expectedUpsellSales &&
        result.workerCommission === expectedTotalComm;

    if (isSuccess) {
        console.log("\n<RESULT>SUCCESS: ALL CALCULATIONS VERIFIED</RESULT>");
    } else {
        console.error("\n<RESULT>FAILURE: CALCULATION MISMATCH</RESULT>");
        process.exit(1);
    }
};

runSimulation();
