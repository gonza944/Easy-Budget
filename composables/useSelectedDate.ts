export const useSelectedDate = () => {
 const selectedDate = useState('selectedDate', () => new Date());

 const setSelectedDate = (date: Date) => {
  selectedDate.value = date;
 }

 return {
  selectedDate,
  setSelectedDate,
 }
}
