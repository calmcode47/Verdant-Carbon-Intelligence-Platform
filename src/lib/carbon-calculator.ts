/**
 * @file carbon-calculator.ts
 * @description Carbon calculation engine using factors from IPCC, EPA, and IEA data.
 * Computes emissions for different activities and maps them to eco labels and XP rewards.
 */

import { ActivityCategory, EmissionFactor } from '@/types';

// Based on real-world emission factors from IPCC, EPA, and IEA data
export const EMISSION_FACTORS: EmissionFactor[] = [
  // TRANSPORT
  { category: 'transport', subCategory: 'car_petrol', label: 'Car (Petrol)', kgCO2PerUnit: 0.192, unit: 'km', icon: '🚗' },
  { category: 'transport', subCategory: 'car_diesel', label: 'Car (Diesel)', kgCO2PerUnit: 0.171, unit: 'km', icon: '🚗' },
  { category: 'transport', subCategory: 'car_electric', label: 'Electric Car', kgCO2PerUnit: 0.053, unit: 'km', icon: '⚡' },
  { category: 'transport', subCategory: 'flight_short', label: 'Short Flight (<3h)', kgCO2PerUnit: 0.255, unit: 'km', icon: '✈️' },
  { category: 'transport', subCategory: 'flight_long', label: 'Long Flight (>3h)', kgCO2PerUnit: 0.195, unit: 'km', icon: '✈️' },
  { category: 'transport', subCategory: 'train', label: 'Train', kgCO2PerUnit: 0.041, unit: 'km', icon: '🚆' },
  { category: 'transport', subCategory: 'bus', label: 'Bus', kgCO2PerUnit: 0.089, unit: 'km', icon: '🚌' },
  { category: 'transport', subCategory: 'motorcycle', label: 'Motorcycle', kgCO2PerUnit: 0.114, unit: 'km', icon: '🏍️' },
  
  // FOOD
  { category: 'food', subCategory: 'beef', label: 'Beef', kgCO2PerUnit: 27.0, unit: 'kg', icon: '🥩' },
  { category: 'food', subCategory: 'lamb', label: 'Lamb', kgCO2PerUnit: 39.2, unit: 'kg', icon: '🍖' },
  { category: 'food', subCategory: 'pork', label: 'Pork', kgCO2PerUnit: 12.1, unit: 'kg', icon: '🥓' },
  { category: 'food', subCategory: 'chicken', label: 'Chicken', kgCO2PerUnit: 6.9, unit: 'kg', icon: '🍗' },
  { category: 'food', subCategory: 'fish', label: 'Fish', kgCO2PerUnit: 6.1, unit: 'kg', icon: '🐟' },
  { category: 'food', subCategory: 'dairy', label: 'Dairy (Milk)', kgCO2PerUnit: 3.2, unit: 'liter', icon: '🥛' },
  { category: 'food', subCategory: 'eggs', label: 'Eggs', kgCO2PerUnit: 4.8, unit: 'kg', icon: '🥚' },
  { category: 'food', subCategory: 'vegetables', label: 'Vegetables', kgCO2PerUnit: 2.0, unit: 'kg', icon: '🥦' },
  { category: 'food', subCategory: 'fruits', label: 'Fruits', kgCO2PerUnit: 1.1, unit: 'kg', icon: '🍎' },
  { category: 'food', subCategory: 'grains', label: 'Grains & Legumes', kgCO2PerUnit: 2.7, unit: 'kg', icon: '🌾' },
  
  // ENERGY
  { category: 'energy', subCategory: 'electricity', label: 'Electricity', kgCO2PerUnit: 0.233, unit: 'kWh', icon: '⚡' },
  { category: 'energy', subCategory: 'natural_gas', label: 'Natural Gas', kgCO2PerUnit: 2.04, unit: 'cubic_meter', icon: '🔥' },
  { category: 'energy', subCategory: 'heating_oil', label: 'Heating Oil', kgCO2PerUnit: 2.68, unit: 'liter', icon: '🛢️' },
  { category: 'energy', subCategory: 'lpg', label: 'LPG', kgCO2PerUnit: 1.56, unit: 'liter', icon: '🔴' },
  
  // LIFESTYLE
  { category: 'lifestyle', subCategory: 'clothing', label: 'New Clothing', kgCO2PerUnit: 20.0, unit: 'item', icon: '👕' },
  { category: 'lifestyle', subCategory: 'electronics', label: 'Electronics', kgCO2PerUnit: 70.0, unit: 'item', icon: '💻' },
  { category: 'lifestyle', subCategory: 'streaming', label: 'Streaming (hours)', kgCO2PerUnit: 0.036, unit: 'hour', icon: '📺' },
  { category: 'lifestyle', subCategory: 'waste', label: 'General Waste', kgCO2PerUnit: 0.467, unit: 'kg', icon: '🗑️' },
];

export function calculateCarbon(subCategory: string, value: number): number {
  const factor = EMISSION_FACTORS.find(f => f.subCategory === subCategory);
  if (!factor) return 0;
  return parseFloat((factor.kgCO2PerUnit * value).toFixed(3));
}

export function getCategoryTotal(activities: { subCategory: string; value: number }[], category: ActivityCategory): number {
  const categoryFactors = EMISSION_FACTORS
    .filter(f => f.category === category)
    .map(f => f.subCategory);
  
  return activities
    .filter(a => categoryFactors.includes(a.subCategory))
    .reduce((sum, a) => sum + calculateCarbon(a.subCategory, a.value), 0);
}

export function getGlobalAverageDaily(): number {
  return 13.0; // kg CO2 per day (world average ~4.7 tons/year)
}

export function getCarbonLabel(kgPerDay: number): { label: string; color: string } {
  if (kgPerDay < 5) return { label: 'Climate Hero', color: '#00E676' };
  if (kgPerDay < 10) return { label: 'Eco Conscious', color: '#69F0AE' };
  if (kgPerDay < 15) return { label: 'Average', color: '#FFEB3B' };
  if (kgPerDay < 20) return { label: 'High Impact', color: '#FF9800' };
  return { label: 'Critical', color: '#F44336' };
}

export function getXPForActivity(carbonKg: number, isReduction: boolean): number {
  if (isReduction) return Math.floor(carbonKg * 10);
  return Math.max(5, Math.floor(100 - carbonKg * 5));
}
