export interface MenuItem {
  label: string;
  onClick: () => void;
}

export const useMenuElements = () => {
  const menuElements = useState<MenuItem[]>('menuElements', () => []);
  const menuTitle = useState<string>('menuTitle', () => 'Menu');

  const updateMenuElements = (items: MenuItem[]) => {
    menuElements.value = items;
  }

  const updateMenuTitle = (title: string) => {
    menuTitle.value = title;
  }

  return {
    menuElements,
    menuTitle,
    updateMenuElements,
    updateMenuTitle,
  };
};
