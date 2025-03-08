const formatWithCommas = (numStr) => {
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default formatWithCommas;
