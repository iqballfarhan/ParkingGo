export const formatAmountInput = (amount) => {
  if (!amount) return "";
  return new Intl.NumberFormat("id-ID").format(amount);
};
