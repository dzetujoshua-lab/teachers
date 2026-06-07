export type WeeklyMenuItem = {
  id?: string;
  meal: string;
  preference: string;
  estimated: number;
  prepared?: number;
  served?: number;
  name?: string;
};

export type WeeklyMenu = {
  id: string;
  weekLabel: string;
  items: WeeklyMenuItem[];
  status?: 'draft' | 'published';
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
};

