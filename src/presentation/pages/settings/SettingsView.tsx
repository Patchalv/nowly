'use client';

import { AccountDetailsSection } from './subcomponents/AccountSection';
import { CategoriesSection } from './subcomponents/categories/CategoriesSection';

export function SettingsView() {
  return (
    <main className="flex flex-col w-full h-full p-4 gap-8">
      <h1 className="text-2xl font-bold text-center">Settings</h1>
      <AccountDetailsSection />
      <CategoriesSection />
    </main>
  );
}
