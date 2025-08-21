export const useLoadingScreen = () => {
  const isLoading = useState('isLoading', () => false);

  const setIsLoading = (value: boolean) => {
    isLoading.value = value;
  }

  return {
    isLoading,
    setIsLoading,
  }
}
