const getCurrentDate = () => {
  const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const today = new Date;

  return `${month[today.getMonth()]} ${today.getDay()}, ${today.getFullYear()}`;
};

export default getCurrentDate;