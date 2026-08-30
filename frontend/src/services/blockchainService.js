let simulatedTransactionNumber = 1;

const createTransactionId = () => {
  const transactionNumber = String(simulatedTransactionNumber).padStart(6, "0");
  simulatedTransactionNumber += 1;
  return `SIM_TX_2026_${transactionNumber}`;
};

const createResult = (message) => ({
  success: true,
  simulated: true,
  transactionId: createTransactionId(),
  message,
});

export const submitEwaste = () =>
  createResult("Simulated e-waste submission completed");

export const verifySubmission = () =>
  createResult("Simulated submission verification completed");

export const issueReward = () =>
  createResult("Simulated reward credit completed");
