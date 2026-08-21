export default {
  type: 'date',
  formatter: {
    date(date) {
      if (!date) return '';

      return moment(date).format('MMM D, YYYY');
    },
  },
};
