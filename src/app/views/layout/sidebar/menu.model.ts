export interface MenuItem {
  id?: number;
  label?: string;
  icon?: string;
  link?: string;
  expanded?: boolean;
  subItems?: any;
  isTitle?: boolean;
  badge?: any;
  parentId?: number;
  profiles?: string[];
  roles?: string[];
  isLogout?: boolean; 
  action?: string;
  isSettings?: boolean;
  isHelpCenter?: boolean; 
}