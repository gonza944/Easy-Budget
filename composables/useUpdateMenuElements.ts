export interface MenuItem {
  label: string;
  onClick: () => void;
}

export const useUpdateMenuElements = (items: MenuItem[]) => {
  const menuElements = useState<MenuItem[]>('menuElements', () => []);
  
  // Update menu elements only on client-side to avoid serialization issues
  onMounted(() => {
    menuElements.value = items;
  });
  
  return menuElements;
};
