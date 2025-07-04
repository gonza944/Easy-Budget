export interface MenuItem {
  label: string;
  onClick: () => void;
}

export const useUpdateMenuElements = (items: MenuItem[], title: string = 'Menu') => {
  const menuElements = useState<MenuItem[]>('menuElements', () => []);
const menuTitle = useState<string>('menuTitle', () => 'Menu');

  
  // Update menu elements only on client-side to avoid serialization issues
  onMounted(() => {
    menuElements.value = items;
    menuTitle.value = title;
  });
  
  return menuElements;
};
