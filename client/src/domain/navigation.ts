import { ReactNode } from "react";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  RotateCcw, 
  Clock, 
  BarChart3, 
  Settings,
  User,
  Inbox,
  ListChecks,
  FileText
} from "lucide-react";

// Tab configuration interface
export interface TabConfig {
  id: string;
  labelKey: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  roles?: string[];
  hidden?: boolean;
}

// Modal configuration interface
export interface ModalConfig {
  id: string;
  component: React.ComponentType<any>;
  persistent?: boolean;
}

// Navigation state interface
export interface NavigationState {
  activeTab: string;
  openModals: string[];
  sidebarCollapsed: boolean;
}

// Pure functions for navigation

/**
 * Get filtered tabs based on user role and visibility
 */
export const getVisibleTabs = (
  tabs: TabConfig[], 
  userRole?: string
): TabConfig[] => {
  return tabs.filter(tab => {
    if (tab.hidden) return false;
    if (!tab.roles || tab.roles.length === 0) return true;
    return userRole && tab.roles.includes(userRole);
  });
};

/**
 * Find tab by ID
 */
export const findTab = (tabs: TabConfig[], tabId: string): TabConfig | undefined => {
  return tabs.find(tab => tab.id === tabId);
};

/**
 * Get next/previous tab in sequence
 */
export const getAdjacentTab = (
  tabs: TabConfig[], 
  currentTabId: string, 
  direction: 'next' | 'prev'
): TabConfig | null => {
  const visibleTabs = getVisibleTabs(tabs);
  const currentIndex = visibleTabs.findIndex(tab => tab.id === currentTabId);
  
  if (currentIndex === -1) return null;
  
  const nextIndex = direction === 'next' 
    ? (currentIndex + 1) % visibleTabs.length
    : (currentIndex - 1 + visibleTabs.length) % visibleTabs.length;
  
  return visibleTabs[nextIndex] || null;
};

/**
 * Check if tab is active
 */
export const isTabActive = (tabId: string, activeTab: string): boolean => {
  return tabId === activeTab;
};

/**
 * Add modal to open modals list
 */
export const openModal = (openModals: string[], modalId: string): string[] => {
  return openModals.includes(modalId) ? openModals : [...openModals, modalId];
};

/**
 * Remove modal from open modals list
 */
export const closeModal = (openModals: string[], modalId: string): string[] => {
  return openModals.filter(id => id !== modalId);
};

/**
 * Check if modal is open
 */
export const isModalOpen = (openModals: string[], modalId: string): boolean => {
  return openModals.includes(modalId);
};

/**
 * Close all non-persistent modals
 */
export const closeAllModals = (
  openModals: string[], 
  modalConfigs: ModalConfig[]
): string[] => {
  return openModals.filter(modalId => {
    const config = modalConfigs.find(c => c.id === modalId);
    return config?.persistent === true;
  });
};

/**
 * Toggle sidebar collapsed state
 */
export const toggleSidebar = (collapsed: boolean): boolean => !collapsed;

/**
 * Create initial navigation state
 */
export const createInitialNavigationState = (defaultTab: string = 'sales'): NavigationState => ({
  activeTab: defaultTab,
  openModals: [],
  sidebarCollapsed: false
});

/**
 * Update navigation state immutably
 */
export const updateNavigationState = (
  state: NavigationState,
  updates: Partial<NavigationState>
): NavigationState => ({
  ...state,
  ...updates
});