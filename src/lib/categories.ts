import type { Category, SubCategory, Tag } from './types';

export const CATEGORIES: Record<Category, string> = {
  Give: 'Give Away',
  Sell: 'For Sale',
  Share: 'Share Resources'
};

export const SUBCATEGORIES: Record<SubCategory, { 
  label: string; 
  icon: string; 
  description: string;
  categories: Category[];
}> = {
  Curriculum: {
    label: 'Curriculum & Teaching Materials',
    icon: '📚',
    description: 'Sunday school, VBS, and educational materials',
    categories: ['Give', 'Sell', 'Share']
  },
  'Creative Assets': {
    label: 'Creative Assets',
    icon: '🎨',
    description: 'Graphics, videos, presentations, and design resources',
    categories: ['Give', 'Sell', 'Share']
  },
  Gear: {
    label: 'Equipment & Gear',
    icon: '🔧',
    description: 'Audio, lighting, and technical equipment',
    categories: ['Give', 'Sell', 'Share']
  },
  Furniture: {
    label: 'Furniture',
    icon: '🪑',
    description: 'Chairs, tables, storage, and office furniture',
    categories: ['Give', 'Sell', 'Share']
  },
  Technology: {
    label: 'Technology',
    icon: '💻',
    description: 'Computers, projectors, cameras, and tech gear',
    categories: ['Give', 'Sell', 'Share']
  },
  Instruments: {
    label: 'Musical Instruments',
    icon: '🎵',
    description: 'Instruments, sound equipment, and music gear',
    categories: ['Give', 'Sell', 'Share']
  },
  Books: {
    label: 'Books & Resources',
    icon: '📖',
    description: 'Bibles, study guides, and reference materials',
    categories: ['Give', 'Sell', 'Share']
  },
  Supplies: {
    label: 'Office & Event Supplies',
    icon: '📎',
    description: 'Paper, decorations, and general supplies',
    categories: ['Give', 'Sell', 'Share']
  },
  Other: {
    label: 'Other Items',
    icon: '📦',
    description: 'Miscellaneous items not fitting other categories',
    categories: ['Give', 'Sell', 'Share']
  }
};

export const PREDEFINED_TAGS: Tag[] = [
  // Ministry-specific tags
  { id: 'children-ministry', name: 'Children\'s Ministry', color: '#FEF3C7', category: 'Give' },
  { id: 'youth-ministry', name: 'Youth Ministry', color: '#DBEAFE', category: 'Give' },
  { id: 'worship', name: 'Worship', color: '#F3E8FF', category: 'Give' },
  { id: 'small-groups', name: 'Small Groups', color: '#D1FAE5', category: 'Share' },
  { id: 'outreach', name: 'Outreach', color: '#FCE7F3', category: 'Give' },
  
  // Condition/Quality tags
  { id: 'excellent', name: 'Excellent Condition', color: '#D1FAE5' },
  { id: 'needs-repair', name: 'Needs Repair', color: '#FED7D7' },
  { id: 'vintage', name: 'Vintage', color: '#F7FAFC' },
  
  // Urgency tags
  { id: 'urgent', name: 'Urgent', color: '#FED7D7' },
  { id: 'flexible-timing', name: 'Flexible Timing', color: '#E6FFFA' },
  
  // Size/Quantity tags
  { id: 'bulk-items', name: 'Bulk Items', color: '#EDF2F7' },
  { id: 'single-item', name: 'Single Item', color: '#F0FFF4' },
  { id: 'set-collection', name: 'Set/Collection', color: '#FFF5F5' },
  
  // Special features
  { id: 'delivery-available', name: 'Delivery Available', color: '#E0E7FF' },
  { id: 'pickup-only', name: 'Pickup Only', color: '#FFFBEB' },
  { id: 'assembly-required', name: 'Assembly Required', color: '#F0F9FF' },
];

export const CONDITIONS: Record<string, { 
  label: string; 
  description: string; 
  color: string;
}> = {
  'New': {
    label: 'New',
    description: 'Brand new, unused item',
    color: '#D1FAE5'
  },
  'Like New': {
    label: 'Like New',
    description: 'Excellent condition, minimal use',
    color: '#DBEAFE'
  },
  'Used': {
    label: 'Used',
    description: 'Good condition with normal wear',
    color: '#FEF3C7'
  },
  'For Parts': {
    label: 'For Parts',
    description: 'Not working, useful for parts/repair',
    color: '#FED7D7'
  }
};

export const AGE_GROUPS = [
  { value: 'Kids', label: 'Kids (0-12)', icon: '👶' },
  { value: 'Youth', label: 'Youth (13-18)', icon: '🧑‍🎓' },
  { value: 'Adults', label: 'Adults (18+)', icon: '👥' },
  { value: 'All Ages', label: 'All Ages', icon: '🌟' }
];

export const DELIVERY_OPTIONS = [
  { value: 'Pickup', label: 'Local Pickup', icon: '🚗', description: 'Buyer picks up from location' },
  { value: 'Local Delivery', label: 'Local Delivery', icon: '🚚', description: 'Delivery within local area' },
  { value: 'Shipping', label: 'Shipping', icon: '📦', description: 'Can ship to other locations' }
];

// Helper functions
export function getSubcategoriesForCategory(category: Category): SubCategory[] {
  return Object.entries(SUBCATEGORIES)
    .filter(([_, config]) => config.categories.includes(category))
    .map(([key]) => key as SubCategory);
}

export function getTagsForCategory(category?: Category): Tag[] {
  if (!category) return PREDEFINED_TAGS;
  return PREDEFINED_TAGS.filter(tag => !tag.category || tag.category === category);
}

export function searchTags(query: string): Tag[] {
  const lowercaseQuery = query.toLowerCase();
  return PREDEFINED_TAGS.filter(tag => 
    tag.name.toLowerCase().includes(lowercaseQuery)
  );
}
