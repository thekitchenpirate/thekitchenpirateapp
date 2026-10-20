import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChefHat, 
  Package, 
  Utensils, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  FileText, 
  Check, 
  X, 
  Search, 
  Filter, 
  RefreshCw, 
  DollarSign, 
  Percent, 
  Scale, 
  Copy,
  Download,
  Sparkles,
  CheckCircle2,
  HardDrive,
  RotateCcw,
  Save
} from 'lucide-react';

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
  INGREDIENTS: 'miseenplace_ingredients_v1',
  RECIPES: 'miseenplace_recipes_v1'
};

// ==========================================
// UNIT CONVERSION ENGINE
// ==========================================
// Converts kitchen units into base ounces (weight/volume bridge) or count ('each')
const UNIT_TO_OZ = {
  'oz': 1,
  'lb': 16,
  'g': 0.03527396,
  'kg': 35.27396,
  'fl oz': 1,
  'cup': 8,
  'pt': 16,
  'qt': 32,
  'gal': 128,
  'tbsp': 0.5,
  'tsp': 0.166667,
  'each': 1,
  'ct': 1
};

const AVAILABLE_UNITS = ['lb', 'oz', 'g', 'kg', 'gal', 'qt', 'pt', 'cup', 'fl oz', 'tbsp', 'tsp', 'each', 'ct'];
const CATEGORIES = ['Meat & Poultry', 'Produce', 'Dairy', 'Bakery', 'Dry Goods', 'Beverage/Other'];
const VENDORS = ['Sysco North', 'US Foods', 'Local Harvest Farms', 'Artisan Bakery Co.', 'Specialty Meats Inc.'];

// Helper to parse pack strings like "4x5 lb", "10 lb case", "48 ct", "6/1 gal"
function parsePackString(packStr) {
  if (!packStr) return { totalBaseQty: 1, baseUnit: 'lb' };
  const s = packStr.toLowerCase().trim();
  
  // Pattern 1: "4x5 lb" or "6/10 oz" or "4 x 5 lb"
  const multMatch = s.match(/(\d+(?:\.\d+)?)\s*[x\/\*]\s*(\d+(?:\.\d+)?)\s*(lb|oz|g|kg|gal|qt|pt|cup|fl oz|ct|each|ea|pc)/i);
  if (multMatch) {
    const qty = parseFloat(multMatch[1]) * parseFloat(multMatch[2]);
    let unit = multMatch[3];
    if (['ct', 'ea', 'pc'].includes(unit)) unit = 'each';
    return { totalBaseQty: qty, baseUnit: unit };
  }

  // Pattern 2: "10 lb" or "48 ct"
  const singleMatch = s.match(/(\d+(?:\.\d+)?)\s*(lb|oz|g|kg|gal|qt|pt|cup|fl oz|ct|each|ea|pc)/i);
  if (singleMatch) {
    const qty = parseFloat(singleMatch[1]);
    let unit = singleMatch[2];
    if (['ct', 'ea', 'pc'].includes(unit)) unit = 'each';
    return { totalBaseQty: qty, baseUnit: unit };
  }

  return { totalBaseQty: 1, baseUnit: 'lb' };
}

// Calculate effective unit cost and convert between ingredient base unit and recipe usage unit
function calculateIngredientLineCost(ingredient, usageQty, usageUnit) {
  if (!ingredient || !usageQty || usageQty <= 0) return 0;
  
  const casePrice = parseFloat(ingredient.casePrice) || 0;
  const packQty = parseFloat(ingredient.totalBaseQty) || 1;
  const yieldPct = Math.max(1, Math.min(100, parseFloat(ingredient.yieldPct) || 100)) / 100;
  const baseUnit = ingredient.baseUnit === 'ct' ? 'each' : (ingredient.baseUnit || 'lb');
  const normUsageUnit = usageUnit === 'ct' ? 'each' : (usageUnit || 'oz');

  // Cost per 1 baseUnit after factoring in trim/yield loss (AP to EP cost)
  const epCostPerBaseUnit = (casePrice / packQty) / yieldPct;

  if (baseUnit === normUsageUnit) {
    return epCostPerBaseUnit * usageQty;
  }

  // If one is 'each' and the other isn't, fallback to 1:1 best-effort
  if (baseUnit === 'each' || normUsageUnit === 'each') {
    return epCostPerBaseUnit * usageQty;
  }

  // Convert both via Oz bridge
  const baseInOz = UNIT_TO_OZ[baseUnit] || 1;
  const usageInOz = UNIT_TO_OZ[normUsageUnit] || 1;
  
  const epCostPerOz = epCostPerBaseUnit / baseInOz;
  return epCostPerOz * usageInOz * usageQty;
}

// ==========================================
// PRE-LOADED SAMPLE DATA
// ==========================================
const SAMPLE_INGREDIENTS = [
  {
    id: 'ing-brisket',
    name: 'Smoked Beef Brisket (Whole Packer)',
    vendor: 'Specialty Meats Inc.',
    category: 'Meat & Poultry',
    casePrice: 185.00,
    packSizeStr: '2x12 lb',
    totalBaseQty: 24,
    baseUnit: 'lb',
    yieldPct: 68, // Trim + smoking shrinkage
    parLevel: 3,
    onHand: 1.5
  },
  {
    id: 'ing-porkbelly',
    name: 'Heritage Pork Belly (Skinless)',
    vendor: 'Specialty Meats Inc.',
    category: 'Meat & Poultry',
    casePrice: 92.50,
    packSizeStr: '2x10 lb',
    totalBaseQty: 20,
    baseUnit: 'lb',
    yieldPct: 82,
    parLevel: 2,
    onHand: 0.5
  },
  {
    id: 'ing-brioche',
    name: 'Artisan Brioche Hamburger Buns',
    vendor: 'Artisan Bakery Co.',
    category: 'Bakery',
    casePrice: 28.80,
    packSizeStr: '48 ct',
    totalBaseQty: 48,
    baseUnit: 'each',
    yieldPct: 100,
    parLevel: 4,
    onHand: 2
  },
  {
    id: 'ing-ciabatta',
    name: 'Rustic Ciabatta Hoagie Rolls',
    vendor: 'Artisan Bakery Co.',
    category: 'Bakery',
    casePrice: 31.20,
    packSizeStr: '36 ct',
    totalBaseQty: 36,
    baseUnit: 'each',
    yieldPct: 100,
    parLevel: 3,
    onHand: 1
  },
  {
    id: 'ing-provolone',
    name: 'Aged Smoked Provolone (Sliced)',
    vendor: 'Sysco North',
    category: 'Dairy',
    casePrice: 54.00,
    packSizeStr: '4x3 lb',
    totalBaseQty: 12,
    baseUnit: 'lb',
    yieldPct: 100,
    parLevel: 2,
    onHand: 1.5
  },
  {
    id: 'ing-cheddar',
    name: 'Sharp White Cheddar Block',
    vendor: 'US Foods',
    category: 'Dairy',
    casePrice: 48.00,
    packSizeStr: '2x5 lb',
    totalBaseQty: 10,
    baseUnit: 'lb',
    yieldPct: 98,
    parLevel: 2,
    onHand: 1
  },
  {
    id: 'ing-cream',
    name: 'Heavy Whipping Cream 40%',
    vendor: 'Sysco North',
    category: 'Dairy',
    casePrice: 64.50,
    packSizeStr: '4x1 gal',
    totalBaseQty: 4,
    baseUnit: 'gal',
    yieldPct: 100,
    parLevel: 2,
    onHand: 0.5
  },
  {
    id: 'ing-butter',
    name: 'Unsalted AA Grade Butter Solids',
    vendor: 'Sysco North',
    category: 'Dairy',
    casePrice: 126.00,
    packSizeStr: '36x1 lb',
    totalBaseQty: 36,
    baseUnit: 'lb',
    yieldPct: 100,
    parLevel: 1,
    onHand: 0.5
  },
  {
    id: 'ing-maple',
    name: 'Pure Northwoods Maple Syrup',
    vendor: 'Local Harvest Farms',
    category: 'Dry Goods',
    casePrice: 88.00,
    packSizeStr: '4x1 gal',
    totalBaseQty: 4,
    baseUnit: 'gal',
    yieldPct: 100,
    parLevel: 1,
    onHand: 0.75
  },
  {
    id: 'ing-apples',
    name: 'Honeycrisp Apples (Fresh)',
    vendor: 'Local Harvest Farms',
    category: 'Produce',
    casePrice: 46.00,
    packSizeStr: '40 lb case',
    totalBaseQty: 40,
    baseUnit: 'lb',
    yieldPct: 85, // Cored & prepped
    parLevel: 2,
    onHand: 1
  },
  {
    id: 'ing-wildrice',
    name: 'Minnesota Cultivated Wild Rice',
    vendor: 'Local Harvest Farms',
    category: 'Dry Goods',
    casePrice: 75.00,
    packSizeStr: '25 lb bag',
    totalBaseQty: 25,
    baseUnit: 'lb',
    yieldPct: 100,
    parLevel: 1,
    onHand: 1
  },
  {
    id: 'ing-mayo',
    name: 'Extra Heavy Restaurant Mayonnaise',
    vendor: 'US Foods',
    category: 'Dry Goods',
    casePrice: 52.00,
    packSizeStr: '4x1 gal',
    totalBaseQty: 4,
    baseUnit: 'gal',
    yieldPct: 98,
    parLevel: 2,
    onHand: 1.5
  }
];

const SAMPLE_RECIPES = [
  {
    id: 'rec-aioli',
    name: 'House Roasted Garlic & Maple Aioli',
    category: 'Prep / Sub-Recipe',
    portions: 64,
    portionUnit: 'fl oz',
    targetFoodCostPct: 20,
    sellingPrice: 0, // Prep batch
    notes: 'Yields 2 Quarts (64 fl oz). Label & date with 7-day shelf life.',
    items: [
      { id: 'item-1', type: 'ingredient', refId: 'ing-mayo', qty: 48, unit: 'fl oz' },
      { id: 'item-2', type: 'ingredient', refId: 'ing-maple', qty: 12, unit: 'fl oz' },
      { id: 'item-3', type: 'ingredient', refId: 'ing-butter', qty: 4, unit: 'oz' }
    ]
  },
  {
    id: 'rec-pork-blt',
    name: 'Maple-Bourbon Pork Belly BLT',
    category: 'Menu Plate',
    portions: 1,
    portionUnit: 'plate',
    targetFoodCostPct: 28,
    sellingPrice: 17.50,
    notes: 'Crisp pork belly glazed in maple, topped with shaved Honeycrisp apple slaw and house aioli on toasted brioche.',
    items: [
      { id: 'item-10', type: 'ingredient', refId: 'ing-porkbelly', qty: 6, unit: 'oz' },
      { id: 'item-11', type: 'ingredient', refId: 'ing-brioche', qty: 1, unit: 'each' },
      { id: 'item-12', type: 'ingredient', refId: 'ing-cheddar', qty: 1.5, unit: 'oz' },
      { id: 'item-13', type: 'ingredient', refId: 'ing-apples', qty: 2.5, unit: 'oz' },
      { id: 'item-14', type: 'ingredient', refId: 'ing-maple', qty: 1, unit: 'tbsp' },
      { id: 'item-15', type: 'subrecipe', refId: 'rec-aioli', qty: 1.5, unit: 'fl oz' }
    ]
  },
  {
    id: 'rec-brisket-dip',
    name: 'Autumn Smokehouse Brisket Dip',
    category: 'Menu Plate',
    portions: 1,
    portionUnit: 'plate',
    targetFoodCostPct: 30,
    sellingPrice: 19.50,
    notes: '14-hour smoked beef brisket, melted smoked provolone, caramelized butter onions on rustic ciabatta with au jus.',
    items: [
      { id: 'item-20', type: 'ingredient', refId: 'ing-brisket', qty: 6.5, unit: 'oz' },
      { id: 'item-21', type: 'ingredient', refId: 'ing-ciabatta', qty: 1, unit: 'each' },
      { id: 'item-22', type: 'ingredient', refId: 'ing-provolone', qty: 2, unit: 'oz' },
      { id: 'item-23', type: 'ingredient', refId: 'ing-butter', qty: 1, unit: 'oz' },
      { id: 'item-24', type: 'subrecipe', refId: 'rec-aioli', qty: 1.5, unit: 'fl oz' }
    ]
  },
  {
    id: 'rec-wildrice-soup',
    name: 'Northwoods Smoked Brisket & Wild Rice Chowder',
    category: 'Menu Plate',
    portions: 12,
    portionUnit: 'bowl',
    targetFoodCostPct: 24,
    sellingPrice: 11.00,
    notes: 'Batch recipe yielding 12 hearty 10-oz bowls. Garnish with diced Honeycrisp apples.',
    items: [
      { id: 'item-30', type: 'ingredient', refId: 'ing-wildrice', qty: 2, unit: 'lb' },
      { id: 'item-31', type: 'ingredient', refId: 'ing-brisket', qty: 1.5, unit: 'lb' },
      { id: 'item-32', type: 'ingredient', refId: 'ing-cream', qty: 2, unit: 'qt' },
      { id: 'item-33', type: 'ingredient', refId: 'ing-butter', qty: 0.75, unit: 'lb' },
      { id: 'item-34', type: 'ingredient', refId: 'ing-apples', qty: 1, unit: 'lb' }
    ]
  }
];

const SAMPLE_CSV_TEXT = `Item Name,Vendor,Category,Case Price,Pack Size,Yield %,Par Level,On Hand
Smoked Beef Brisket (Whole Packer),Specialty Meats Inc.,Meat & Poultry,185.00,2x12 lb,68,3,1.5
Heritage Pork Belly (Skinless),Specialty Meats Inc.,Meat & Poultry,92.50,2x10 lb,82,2,0.5
Artisan Brioche Hamburger Buns,Artisan Bakery Co.,Bakery,28.80,48 ct,100,4,2
Rustic Ciabatta Hoagie Rolls,Artisan Bakery Co.,Bakery,31.20,36 ct,100,3,1
Aged Smoked Provolone (Sliced),Sysco North,Dairy,54.00,4x3 lb,100,2,1.5
Sharp White Cheddar Block,US Foods,Dairy,48.00,2x5 lb,98,2,1
Heavy Whipping Cream 40%,Sysco North,Dairy,64.50,4x1 gal,100,2,0.5
Unsalted AA Grade Butter Solids,Sysco North,Dairy,126.00,36x1 lb,100,1,0.5
Pure Northwoods Maple Syrup,Local Harvest Farms,Dry Goods,88.00,4x1 gal,100,1,0.75
Honeycrisp Apples (Fresh),Local Harvest Farms,Produce,46.00,40 lb case,85,2,1
Minnesota Cultivated Wild Rice,Local Harvest Farms,Dry Goods,75.00,25 lb bag,100,1,1
Extra Heavy Restaurant Mayonnaise,US Foods,Dry Goods,52.00,4x1 gal,98,2,1.5`;

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('recipes'); // 'order-guide' | 'recipes' | 'smart-order'

  // Core Data State - Lazy initialized directly from phone's LocalStorage
  const [ingredients, setIngredients] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to read ingredients from localStorage:', e);
    }
    return SAMPLE_INGREDIENTS;
  });

  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to read recipes from localStorage:', e);
    }
    return SAMPLE_RECIPES;
  });

  // Temporary Simulated Case Prices (keyed by ingredientId) for the Live Invoice Simulator
  const [simulatedPrices, setSimulatedPrices] = useState({});

  // UI & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [selectedRecipeId, setSelectedRecipeId] = useState('rec-pork-blt');

  // Modals & Notification State
  const [toast, setToast] = useState(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState(SAMPLE_CSV_TEXT);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showNewRecipeModal, setShowNewRecipeModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Quick helper to show toast notifications
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ------------------------------------------
  // 1. AUTOMATIC LOCALSTORAGE PERSISTENCE
  // ------------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    } catch (e) {
      console.error('Error saving ingredients to localStorage:', e);
    }
  }, [ingredients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    } catch (e) {
      console.error('Error saving recipes to localStorage:', e);
    }
  }, [recipes]);

  // Reset to default sample kitchen data
  const resetToSampleData = () => {
    setIngredients(SAMPLE_INGREDIENTS);
    setRecipes(SAMPLE_RECIPES);
    setSimulatedPrices({});
    setSelectedRecipeId('rec-pork-blt');
    triggerToast('Sample Kitchen Order Guide & Recipes restored on device!');
  };

  // ------------------------------------------
  // 2. DATA MUTATION HANDLERS (100% LOCAL)
  // ------------------------------------------
  const saveIngredient = (ingData) => {
    const id = ingData.id || `ing-${Date.now()}`;
    const payload = { ...ingData, id };
    setIngredients(prev => {
      const exists = prev.some(item => item.id === id);
      if (exists) {
        return prev.map(item => (item.id === id ? payload : item));
      }
      return [...prev, payload];
    });
  };

  const deleteIngredient = (id) => {
    setIngredients(prev => prev.filter(item => item.id !== id));
    triggerToast('Ingredient removed from Order Guide');
  };

  const saveRecipe = (recData) => {
    const id = recData.id || `rec-${Date.now()}`;
    const payload = { ...recData, id };
    setRecipes(prev => {
      const exists = prev.some(r => r.id === id);
      if (exists) {
        return prev.map(r => (r.id === id ? payload : r));
      }
      return [...prev, payload];
    });
  };

  const duplicateRecipe = (recipeToCopy) => {
    const newId = `rec-${Date.now()}`;
    const cloned = {
      ...recipeToCopy,
      id: newId,
      name: `${recipeToCopy.name} (Copy)`,
      items: (recipeToCopy.items || []).map((it, idx) => ({
        ...it,
        id: `line-${Date.now()}-${idx}`
      }))
    };
    // Strip computed properties before saving
    delete cloned.computedItems;
    delete cloned.totalCost;
    delete cloned.costPerPortion;
    delete cloned.suggestedPrice;
    delete cloned.actualFoodCostPct;
    delete cloned.grossProfitPerPortion;
    delete cloned.healthStatus;

    setRecipes(prev => [...prev, cloned]);
    setSelectedRecipeId(newId);
    triggerToast(`Duplicated "${recipeToCopy.name}"`);
  };

  const deleteRecipe = (id) => {
    setRecipes(prev => {
      const remaining = prev.filter(r => r.id !== id);
      if (remaining.length > 0 && selectedRecipeId === id) {
        setSelectedRecipeId(remaining[0].id);
      }
      return remaining;
    });
    triggerToast('Recipe deleted');
  };

  // Inline Case Price / Yield / Par / On-Hand updates
  const handleQuickIngredientUpdate = (ing, field, rawValue) => {
    const numValue = rawValue === '' ? 0 : parseFloat(rawValue);
    if (isNaN(numValue) || numValue < 0) return;
    saveIngredient({ ...ing, [field]: numValue });
  };

  // Apply simulated invoice prices permanently to the Master Order Guide
  const applySimulatedPricesToMaster = () => {
    const simIds = Object.keys(simulatedPrices);
    if (simIds.length === 0) return;
    setIngredients(prev =>
      prev.map(ing => {
        if (simulatedPrices[ing.id] !== undefined) {
          return { ...ing, casePrice: parseFloat(simulatedPrices[ing.id]) || 0 };
        }
        return ing;
      })
    );
    setSimulatedPrices({});
    triggerToast(`Applied ${simIds.length} simulated invoice price(s) to Master Order Guide!`);
  };

  // ------------------------------------------
  // 3. REAL-TIME RECIPE & SUB-RECIPE COST ENGINE
  // ------------------------------------------
  // Map of ingredient ID -> ingredient object (incorporating any active simulated prices)
  const ingredientMap = useMemo(() => {
    const map = {};
    ingredients.forEach(ing => {
      const effectiveCasePrice =
        simulatedPrices[ing.id] !== undefined
          ? parseFloat(simulatedPrices[ing.id]) || 0
          : parseFloat(ing.casePrice) || 0;
      const packQty = parseFloat(ing.totalBaseQty) || 1;
      const yieldPct = Math.max(1, Math.min(100, parseFloat(ing.yieldPct) || 100));
      const apUnitCost = effectiveCasePrice / packQty;
      const epUnitCost = apUnitCost / (yieldPct / 100);
      map[ing.id] = {
        ...ing,
        casePrice: effectiveCasePrice,
        masterCasePrice: parseFloat(ing.casePrice) || 0,
        isSimulated: simulatedPrices[ing.id] !== undefined,
        apUnitCost,
        epUnitCost
      };
    });
    return map;
  }, [ingredients, simulatedPrices]);

  // Calculate all recipes (resolving sub-recipes first, then menu plates)
  const calculatedRecipes = useMemo(() => {
    const results = {};

    // First pass: calculate direct ingredient lines for all recipes
    recipes.forEach(rec => {
      let totalCost = 0;
      const computedItems = (rec.items || []).map(item => {
        if (item.type === 'ingredient') {
          const ing = ingredientMap[item.refId];
          const lineCost = calculateIngredientLineCost(ing, parseFloat(item.qty) || 0, item.unit);
          totalCost += lineCost;
          return {
            ...item,
            name: ing ? ing.name : 'Unknown Ingredient',
            vendor: ing ? ing.vendor : '-',
            epUnitCost: ing ? ing.epUnitCost : 0,
            baseUnit: ing ? ing.baseUnit : 'lb',
            yieldPct: ing ? ing.yieldPct : 100,
            isSimulated: ing ? ing.isSimulated : false,
            lineCost
          };
        }
        return { ...item, lineCost: 0 };
      });

      const portions = Math.max(1, parseFloat(rec.portions) || 1);
      results[rec.id] = {
        ...rec,
        computedItems,
        totalCost,
        costPerPortion: totalCost / portions
      };
    });

    // Second pass: resolve sub-recipe references inside plate recipes
    recipes.forEach(rec => {
      let totalCost = 0;
      const computedItems = results[rec.id].computedItems.map(item => {
        if (item.type === 'subrecipe') {
          const subRec = results[item.refId];
          if (subRec) {
            const subUnit = subRec.portionUnit || 'fl oz';
            const useUnit = item.unit || subUnit;
            let unitMultiplier = 1;
            if (subUnit !== useUnit && UNIT_TO_OZ[subUnit] && UNIT_TO_OZ[useUnit]) {
              unitMultiplier = UNIT_TO_OZ[useUnit] / UNIT_TO_OZ[subUnit];
            }
            const lineCost = subRec.costPerPortion * unitMultiplier * (parseFloat(item.qty) || 0);
            totalCost += lineCost;
            return {
              ...item,
              name: `[PREP] ${subRec.name}`,
              vendor: 'In-House Prep',
              epUnitCost: subRec.costPerPortion,
              baseUnit: subRec.portionUnit || 'portion',
              yieldPct: 100,
              lineCost
            };
          }
          return { ...item, name: 'Missing Sub-Recipe', lineCost: 0 };
        } else {
          totalCost += item.lineCost;
          return item;
        }
      });

      const portions = Math.max(1, parseFloat(rec.portions) || 1);
      const costPerPortion = totalCost / portions;
      const targetPct = Math.max(1, parseFloat(rec.targetFoodCostPct) || 28);
      const suggestedPrice = costPerPortion / (targetPct / 100);
      const sellingPrice = parseFloat(rec.sellingPrice) || 0;
      const actualFoodCostPct = sellingPrice > 0 ? (costPerPortion / sellingPrice) * 100 : 0;
      const grossProfitPerPortion = sellingPrice > 0 ? sellingPrice - costPerPortion : 0;

      // Health status indicator
      let healthStatus = 'optimal'; // green
      if (sellingPrice > 0) {
        if (actualFoodCostPct > targetPct + 4) {
          healthStatus = 'critical'; // red
        } else if (actualFoodCostPct > targetPct + 0.5) {
          healthStatus = 'warning'; // amber
        }
      }

      results[rec.id] = {
        ...rec,
        computedItems,
        totalCost,
        costPerPortion,
        suggestedPrice,
        actualFoodCostPct,
        grossProfitPerPortion,
        healthStatus
      };
    });

    return results;
  }, [recipes, ingredientMap]);

  const activeRecipe = calculatedRecipes[selectedRecipeId] || Object.values(calculatedRecipes)[0] || null;

  // ------------------------------------------
  // 4. CSV IMPORT PARSER
  // ------------------------------------------
  const parseAndImportCSV = (rawText) => {
    if (!rawText || !rawText.trim()) return;
    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      triggerToast('CSV must contain a header row and at least one item row', 'error');
      return;
    }

    const updatedList = [...ingredients];
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(',').map(c => c.trim());
      
      const name = cols[0] || `Imported Item ${i}`;
      const vendor = cols[1] || 'General Supplier';
      const category = cols[2] || 'Dry Goods';
      const casePrice = parseFloat(cols[3]?.replace(/[^0-9.]/g, '')) || 0;
      const packSizeStr = cols[4] || '1 lb';
      const yieldPct = parseFloat(cols[5]?.replace(/[^0-9.]/g, '')) || 100;
      const parLevel = parseFloat(cols[6]) || 2;
      const onHand = parseFloat(cols[7]) || 1;

      const parsedPack = parsePackString(packSizeStr);

      // Match existing ingredient by name so linked recipes immediately update!
      const existingIndex = updatedList.findIndex(
        ing => ing.name.toLowerCase() === name.toLowerCase()
      );

      const itemObj = {
        id: existingIndex >= 0 ? updatedList[existingIndex].id : `ing-imp-${Date.now()}-${i}`,
        name,
        vendor,
        category,
        casePrice,
        packSizeStr,
        totalBaseQty: parsedPack.totalBaseQty,
        baseUnit: parsedPack.baseUnit,
        yieldPct: Math.min(100, Math.max(1, yieldPct)),
        parLevel,
        onHand
      };

      if (existingIndex >= 0) {
        updatedList[existingIndex] = itemObj;
      } else {
        updatedList.push(itemObj);
      }
      importedCount++;
    }

    if (importedCount > 0) {
      setIngredients(updatedList);
      setShowCsvModal(false);
      triggerToast(`Imported & updated ${importedCount} Order Guide items on device!`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setCsvTextInput(content);
        parseAndImportCSV(content);
      }
    };
    reader.readAsText(file);
  };

  // ------------------------------------------
  // 5. GLOBAL KPI METRICS
  // ------------------------------------------
  const kpiStats = useMemo(() => {
    const menuRecipes = Object.values(calculatedRecipes).filter(r => r.category === 'Menu Plate');
    const avgFoodCost = menuRecipes.length > 0
      ? menuRecipes.reduce((acc, r) => acc + r.actualFoodCostPct, 0) / menuRecipes.length
      : 0;
    const highCostAlerts = menuRecipes.filter(r => r.healthStatus === 'critical' || r.healthStatus === 'warning').length;

    let estimatedOrderTotal = 0;
    let itemsToOrderCount = 0;
    ingredients.forEach(ing => {
      const orderQty = Math.max(0, Math.ceil((parseFloat(ing.parLevel) || 0) - (parseFloat(ing.onHand) || 0)));
      if (orderQty > 0) {
        itemsToOrderCount += orderQty;
        estimatedOrderTotal += orderQty * (parseFloat(ing.casePrice) || 0);
      }
    });

    return {
      totalIngredients: ingredients.length,
      menuPlateCount: menuRecipes.length,
      avgFoodCost,
      highCostAlerts,
      estimatedOrderTotal,
      itemsToOrderCount
    };
  }, [ingredients, calculatedRecipes]);

  // Filtered Ingredients for Order Guide & Smart Order
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ing.vendor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'All' || ing.category === categoryFilter;
      const matchesVendor = vendorFilter === 'All' || ing.vendor === vendorFilter;
      return matchesSearch && matchesCat && matchesVendor;
    });
  }, [ingredients, searchQuery, categoryFilter, vendorFilter]);

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* ==========================================
          TOP NAVIGATION & EXECUTIVE HEADER
      ========================================== */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand Logo & Offline Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <ChefHat className="w-6 h-6 text-slate-950 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    MiseEnPlace <span className="text-amber-500">PRO</span>
                  </h1>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Saved on Device (Offline Ready)
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  LocalStorage Culinary Order Guide, Yield & Recipe Plate Costing
                </p>
              </div>
            </div>

            {/* Mobile Quick Backup Button */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => setShowCsvModal(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                title="Import CSV"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowBackupModal(true)}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-2 rounded-lg border border-slate-700"
                title="Device Backup & Restore"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Backup</span>
              </button>
            </div>
          </div>

          {/* Primary Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('order-guide')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'order-guide'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Order Guide & Costing</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeTab === 'order-guide' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {ingredients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'recipes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Recipes & Plate Costing</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeTab === 'recipes' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {recipes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('smart-order')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'smart-order'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Smart Order Builder</span>
              {kpiStats.itemsToOrderCount > 0 && (
                <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                  activeTab === 'smart-order' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {kpiStats.itemsToOrderCount}
                </span>
              )}
            </button>
          </nav>

          {/* Desktop Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowCsvModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setShowBackupModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition"
              title="Export or Restore Phone Backup JSON"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Device Backup</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
          MOBILE BOTTOM NAVIGATION BAR (Android Friendly)
      ========================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-3 px-2 py-1.5 shadow-2xl">
        <button
          onClick={() => setActiveTab('order-guide')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'order-guide' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Order Guide ({ingredients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'recipes' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span>Recipes ({recipes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('smart-order')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'smart-order' ? 'text-amber-400 bg-amber-500/10 font-semibold' : 'text-slate-400'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span>Order ({kpiStats.itemsToOrderCount})</span>
        </button>
      </nav>

      {/* ==========================================
          EXECUTIVE KPI RIBBON
      ========================================== */}
      <section className="bg-slate-900/50 border-b border-slate-800/80 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div 
            onClick={() => setActiveTab('order-guide')}
            className="bg-slate-900/90 hover:bg-slate-800/60 cursor-pointer transition border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Master Order Guide</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">{kpiStats.totalIngredients} <span className="text-xs sm:text-sm font-normal text-slate-400">SKUs</span></p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('recipes')}
            className="bg-slate-900/90 hover:bg-slate-800/60 cursor-pointer transition border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Avg Menu Food Cost</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <p className={`text-xl sm:text-2xl font-bold ${
                  kpiStats.avgFoodCost <= 29 ? 'text-emerald-400' : kpiStats.avgFoodCost <= 33 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {kpiStats.avgFoodCost.toFixed(1)}%
                </p>
                <span className="text-[11px] text-slate-400 hidden sm:inline">Target: 28%</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('recipes')}
            className="bg-slate-900/90 hover:bg-slate-800/60 cursor-pointer transition border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Margin Alerts</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className={`text-xl sm:text-2xl font-bold ${kpiStats.highCostAlerts > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {kpiStats.highCostAlerts}
                </p>
                <span className="text-[11px] text-slate-400">Over Target</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('smart-order')}
            className="bg-slate-900/90 hover:bg-slate-800/70 cursor-pointer transition border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Next Order Est.</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl sm:text-2xl font-bold text-amber-400">
                  ${kpiStats.estimatedOrderTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-slate-400 hidden sm:inline">({kpiStats.itemsToOrderCount} cs)</span>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          MAIN WORKSPACE CONTENT
      ========================================== */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {/* VIEW 1: ORDER GUIDE & INGREDIENT COSTING */}
        {activeTab === 'order-guide' && (
          <OrderGuideView
            ingredients={filteredIngredients}
            allIngredients={ingredients}
            ingredientMap={ingredientMap}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            vendorFilter={vendorFilter}
            setVendorFilter={setVendorFilter}
            onQuickUpdate={handleQuickIngredientUpdate}
            onEditIngredient={(ing) => {
              setEditingIngredient(ing);
              setShowIngredientModal(true);
            }}
            onAddIngredient={() => {
              setEditingIngredient(null);
              setShowIngredientModal(true);
            }}
            onDeleteIngredient={deleteIngredient}
            onOpenCsvModal={() => setShowCsvModal(true)}
            onLoadSampleGuide={resetToSampleData}
          />
        )}

        {/* VIEW 2: SUB-RECIPES & PLATE COSTING STUDIO */}
        {activeTab === 'recipes' && (
          <RecipesStudioView
            recipes={Object.values(calculatedRecipes)}
            activeRecipe={activeRecipe}
            setSelectedRecipeId={setSelectedRecipeId}
            ingredients={ingredients}
            ingredientMap={ingredientMap}
            simulatedPrices={simulatedPrices}
            setSimulatedPrices={setSimulatedPrices}
            onApplySimulatedPrices={applySimulatedPricesToMaster}
            onSaveRecipe={saveRecipe}
            onDuplicateRecipe={duplicateRecipe}
            onDeleteRecipe={deleteRecipe}
            onOpenNewRecipeModal={() => setShowNewRecipeModal(true)}
            triggerToast={triggerToast}
          />
        )}

        {/* VIEW 3: SMART ORDER BUILDER */}
        {activeTab === 'smart-order' && (
          <SmartOrderView
            ingredients={filteredIngredients}
            allIngredients={ingredients}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            vendorFilter={vendorFilter}
            setVendorFilter={setVendorFilter}
            onQuickUpdate={handleQuickIngredientUpdate}
            triggerToast={triggerToast}
          />
        )}
      </main>

      {/* ==========================================
          MODALS (CSV IMPORT, ADD/EDIT INGREDIENT, NEW RECIPE, BACKUP)
      ========================================== */}
      {showCsvModal && (
        <CsvImportModal
          csvTextInput={csvTextInput}
          setCsvTextInput={setCsvTextInput}
          onClose={() => setShowCsvModal(false)}
          onImport={() => parseAndImportCSV(csvTextInput)}
          onFileUpload={handleFileUpload}
          onLoadSampleText={() => setCsvTextInput(SAMPLE_CSV_TEXT)}
        />
      )}

      {showIngredientModal && (
        <IngredientFormModal
          initialData={editingIngredient}
          onClose={() => setShowIngredientModal(false)}
          onSave={(data) => {
            saveIngredient(data);
            setShowIngredientModal(false);
            triggerToast(editingIngredient ? 'Ingredient updated on device!' : 'New ingredient added to Order Guide!');
          }}
        />
      )}

      {showNewRecipeModal && (
        <NewRecipeModal
          onClose={() => setShowNewRecipeModal(false)}
          onCreate={(newRec) => {
            const id = `rec-${Date.now()}`;
            saveRecipe({ ...newRec, id });
            setSelectedRecipeId(id);
            setShowNewRecipeModal(false);
            triggerToast(`Created "${newRec.name}"!`);
          }}
        />
      )}

      {showBackupModal && (
        <DeviceBackupModal
          ingredients={ingredients}
          recipes={recipes}
          onClose={() => setShowBackupModal(false)}
          onRestore={(backupData) => {
            if (Array.isArray(backupData.ingredients) && Array.isArray(backupData.recipes)) {
              setIngredients(backupData.ingredients);
              setRecipes(backupData.recipes);
              setSimulatedPrices({});
              if (backupData.recipes.length > 0) {
                setSelectedRecipeId(backupData.recipes[0].id);
              }
              setShowBackupModal(false);
              triggerToast('Device backup restored successfully!');
            } else {
              triggerToast('Invalid backup file format', 'error');
            }
          }}
          onResetSample={() => {
            resetToSampleData();
            setShowBackupModal(false);
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* ==========================================
          TOAST NOTIFICATION BANNER
      ========================================== */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border bg-slate-900 border-amber-500/40 text-slate-100">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUB-VIEW 1: ORDER GUIDE & INGREDIENT COSTING
// ==========================================
function OrderGuideView({
  ingredients,
  allIngredients,
  ingredientMap,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  vendorFilter,
  setVendorFilter,
  onQuickUpdate,
  onEditIngredient,
  onAddIngredient,
  onDeleteIngredient,
  onOpenCsvModal,
  onLoadSampleGuide
}) {
  const uniqueVendors = useMemo(() => {
    const set = new Set(allIngredients.map(i => i.vendor).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [allIngredients]);

  return (
    <div className="space-y-5">
      {/* Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Master Order Guide & Yield Costing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Edit any <span className="text-amber-400 font-medium">Case Price ($)</span>, <span className="text-amber-400 font-medium">Yield %</span>, <span className="text-amber-400 font-medium">Par</span>, or <span className="text-amber-400 font-medium">On-Hand</span> directly below—changes save automatically to your phone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onLoadSampleGuide}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Reset Sample Guide</span>
          </button>

          <button
            onClick={onOpenCsvModal}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import / Paste CSV</span>
          </button>

          <button
            onClick={onAddIngredient}
            className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredient or supplier..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
          >
            {uniqueVendors.map(v => (
              <option key={v} value={v}>{v === 'All' ? 'All Vendors / Suppliers' : v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Master Order Guide Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Ingredient & Supplier</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Pack Size</th>
                <th className="py-3.5 px-3 w-32">Case Price ($)</th>
                <th className="py-3.5 px-3 w-24">Yield %</th>
                <th className="py-3.5 px-3 w-24">Par / On-Hand</th>
                <th className="py-3.5 px-4 bg-amber-500/5 border-x border-slate-800/80 text-amber-400">
                  Effective Unit Cost (EP)
                </th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {ingredients.map((ing) => {
                const computed = ingredientMap[ing.id] || { apUnitCost: 0, epUnitCost: 0 };
                const epPerOz = ing.baseUnit !== 'each' && UNIT_TO_OZ[ing.baseUnit]
                  ? computed.epUnitCost / UNIT_TO_OZ[ing.baseUnit]
                  : null;

                return (
                  <tr key={ing.id} className="hover:bg-slate-800/40 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{ing.name}</div>
                      <div className="text-xs text-slate-400">{ing.vendor}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                        {ing.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-mono text-xs whitespace-nowrap">
                      <div>{ing.packSizeStr}</div>
                      <div className="text-[11px] text-slate-500">({ing.totalBaseQty} {ing.baseUnit})</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="relative flex items-center">
                        <span className="text-slate-400 text-xs absolute left-2.5">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={ing.casePrice}
                          onChange={(e) => onQuickUpdate(ing, 'casePrice', e.target.value)}
                          className="w-28 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg pl-6 pr-2 py-1.5 text-sm font-mono font-semibold text-amber-400 outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={ing.yieldPct}
                          onChange={(e) => onQuickUpdate(ing, 'yieldPct', e.target.value)}
                          className={`w-16 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1.5 text-sm font-mono outline-none ${
                            ing.yieldPct < 100 ? 'text-amber-300' : 'text-slate-200'
                          }`}
                        />
                        <span className="text-slate-400 text-xs ml-1">%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          title="Par Level (Cases)"
                          value={ing.parLevel ?? 2}
                          onChange={(e) => onQuickUpdate(ing, 'parLevel', e.target.value)}
                          className="w-12 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded px-1.5 py-1 text-white outline-none text-center"
                        />
                        <span className="text-slate-500">/</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          title="On-Hand Count (Cases)"
                          value={ing.onHand ?? 0}
                          onChange={(e) => onQuickUpdate(ing, 'onHand', e.target.value)}
                          className="w-12 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded px-1.5 py-1 text-amber-400 outline-none text-center"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 bg-amber-500/5 border-x border-slate-800/80 whitespace-nowrap">
                      <div className="font-mono font-bold text-emerald-400">
                        ${computed.epUnitCost.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ {ing.baseUnit}</span>
                      </div>
                      {epPerOz !== null && (
                        <div className="text-[11px] font-mono text-slate-400">
                          (${epPerOz.toFixed(3)} / oz)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditIngredient(ing)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteIngredient(ing.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete Ingredient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ingredients.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No ingredients match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-VIEW 2: RECIPES & PLATE COSTING STUDIO
// ==========================================
function RecipesStudioView({
  recipes,
  activeRecipe,
  setSelectedRecipeId,
  ingredients,
  ingredientMap,
  simulatedPrices,
  setSimulatedPrices,
  onApplySimulatedPrices,
  onSaveRecipe,
  onDuplicateRecipe,
  onDeleteRecipe,
  onOpenNewRecipeModal,
  triggerToast
}) {
  // New ingredient line state
  const [addType, setAddType] = useState('ingredient'); // 'ingredient' | 'subrecipe'
  const [selectedRefId, setSelectedRefId] = useState(ingredients[0]?.id || '');
  const [addQty, setAddQty] = useState(4);
  const [addUnit, setAddUnit] = useState('oz');

  const subRecipesList = useMemo(() => {
    return recipes.filter(r => r.category === 'Prep / Sub-Recipe' && r.id !== activeRecipe?.id);
  }, [recipes, activeRecipe]);

  useEffect(() => {
    if (addType === 'ingredient' && ingredients.length > 0) {
      setSelectedRefId(ingredients[0].id);
      setAddUnit(ingredients[0].baseUnit === 'each' ? 'each' : 'oz');
    } else if (addType === 'subrecipe' && subRecipesList.length > 0) {
      setSelectedRefId(subRecipesList[0].id);
      setAddUnit(subRecipesList[0].portionUnit || 'fl oz');
    }
  }, [addType, ingredients, subRecipesList]);

  if (!activeRecipe) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <Utensils className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Recipes Found</h3>
        <p className="text-sm text-slate-400 mt-1 mb-5">Create your first prep batch or menu plate recipe to begin costing.</p>
        <button
          onClick={onOpenNewRecipeModal}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm"
        >
          + Create Recipe
        </button>
      </div>
    );
  }

  const handleRecipeFieldChange = (field, value) => {
    const cleanRecipe = {
      id: activeRecipe.id,
      name: activeRecipe.name,
      category: activeRecipe.category,
      portions: activeRecipe.portions,
      portionUnit: activeRecipe.portionUnit || 'plate',
      targetFoodCostPct: activeRecipe.targetFoodCostPct,
      sellingPrice: activeRecipe.sellingPrice,
      notes: activeRecipe.notes || '',
      items: activeRecipe.items || [],
      [field]: value
    };
    onSaveRecipe(cleanRecipe);
  };

  const handleLineItemUpdate = (itemId, field, value) => {
    const updatedItems = (activeRecipe.items || []).map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    handleRecipeFieldChange('items', updatedItems);
  };

  const handleRemoveLineItem = (itemId) => {
    const updatedItems = (activeRecipe.items || []).filter(item => item.id !== itemId);
    handleRecipeFieldChange('items', updatedItems);
  };

  const handleAddLineItem = (e) => {
    e.preventDefault();
    if (!selectedRefId || !addQty || addQty <= 0) return;
    const newItem = {
      id: `line-${Date.now()}`,
      type: addType,
      refId: selectedRefId,
      qty: parseFloat(addQty) || 1,
      unit: addUnit
    };
    const updatedItems = [...(activeRecipe.items || []), newItem];
    handleRecipeFieldChange('items', updatedItems);
    triggerToast('Ingredient added to recipe');
  };

  // Determine badge color for food cost %
  const getCostBadgeStyle = (status) => {
    if (status === 'optimal') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (status === 'warning') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const hasActiveSimulations = Object.keys(simulatedPrices).length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT SIDEBAR: RECIPE DIRECTORY & LIVE SIMULATOR */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              <span>Recipe Book</span>
            </h2>
            <button
              onClick={onOpenNewRecipeModal}
              className="flex items-center gap-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg transition shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Recipe</span>
            </button>
          </div>

          {/* Menu Plates Section */}
          <div className="space-y-2 mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
              Menu Plates ({recipes.filter(r => r.category === 'Menu Plate').length})
            </p>
            {recipes.filter(r => r.category === 'Menu Plate').map(rec => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecipeId(rec.id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  activeRecipe.id === rec.id
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-white leading-snug">{rec.name}</h3>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${getCostBadgeStyle(rec.healthStatus)}`}>
                    {rec.actualFoodCostPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
                  <span>Cost: <strong className="text-slate-200">${rec.costPerPortion.toFixed(2)}</strong></span>
                  <span>Menu: <strong className="text-amber-400">${parseFloat(rec.sellingPrice).toFixed(2)}</strong></span>
                  <span>Margin: <strong className="text-emerald-400">+${rec.grossProfitPerPortion.toFixed(2)}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Sub-Recipes / Prep Batches Section */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
              Sub-Recipes / Prep Batches ({recipes.filter(r => r.category !== 'Menu Plate').length})
            </p>
            {recipes.filter(r => r.category !== 'Menu Plate').map(rec => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecipeId(rec.id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  activeRecipe.id === rec.id
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{rec.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    Prep Batch
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
                  <span>Batch: <strong className="text-slate-200">${rec.totalCost.toFixed(2)}</strong></span>
                  <span>Yield: {rec.portions} {rec.portionUnit}</span>
                  <span className="text-emerald-400">${rec.costPerPortion.toFixed(2)}/{rec.portionUnit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Invoice Price Simulator Widget */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Live Invoice Price Simulator</span>
            </div>
            {hasActiveSimulations && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Sandbox Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Test "what-if" supplier invoice spikes on <strong className="text-white">{activeRecipe.name}</strong> before committing them to your Master Order Guide:
          </p>

          <div className="space-y-2.5">
            {activeRecipe.computedItems
              .filter(item => item.type === 'ingredient' && ingredientMap[item.refId])
              .map(item => {
                const ing = ingredientMap[item.refId];
                return (
                  <div key={item.id} className={`rounded-xl p-2.5 flex items-center justify-between gap-2 border ${
                    ing.isSimulated ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950/80 border-slate-800'
                  }`}>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{ing.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Master: ${ing.masterCasePrice.toFixed(2)} / {ing.packSizeStr}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.50"
                        value={ing.casePrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSimulatedPrices(prev => ({ ...prev, [ing.id]: val }));
                        }}
                        className="w-20 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-400 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          {hasActiveSimulations && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={onApplySimulatedPrices}
                className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs py-2 px-3 rounded-xl shadow transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Apply Simulated Prices to Master Order Guide</span>
              </button>
              <button
                onClick={() => setSimulatedPrices({})}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-3 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Simulation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT MAIN PANEL: ACTIVE RECIPE WORKSHEET & FINANCIAL BREAKDOWN */}
      <div className="lg:col-span-8 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xl">
          {/* Top Recipe Header & Metadata Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <select
                  value={activeRecipe.category}
                  onChange={(e) => handleRecipeFieldChange('category', e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 outline-none"
                >
                  <option value="Menu Plate" className="bg-slate-900 text-white">Menu Plate</option>
                  <option value="Prep / Sub-Recipe" className="bg-slate-900 text-white">Prep / Sub-Recipe</option>
                </select>
                <span className="text-xs text-slate-500 font-mono">ID: {activeRecipe.id}</span>
              </div>
              <input
                type="text"
                value={activeRecipe.name}
                onChange={(e) => handleRecipeFieldChange('name', e.target.value)}
                className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white focus:bg-slate-950 focus:px-2 py-0.5 rounded-lg outline-none border border-transparent focus:border-slate-700 transition"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => onDuplicateRecipe(activeRecipe)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 transition"
                title="Duplicate Recipe"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => onDeleteRecipe(activeRecipe.id)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-950/30 px-3 py-2 rounded-xl border border-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Recipe Yield, Target Cost %, and Menu Price Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-800">
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3">
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Batch Yield / Portions
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={activeRecipe.portions}
                  onChange={(e) => handleRecipeFieldChange('portions', parseFloat(e.target.value) || 1)}
                  className="w-14 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-sm font-mono font-bold text-white outline-none"
                />
                <input
                  type="text"
                  value={activeRecipe.portionUnit || 'plate'}
                  onChange={(e) => handleRecipeFieldChange('portionUnit', e.target.value)}
                  placeholder="unit"
                  className="w-20 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3">
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Target Food Cost %
              </label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  min="5"
                  max="80"
                  step="0.5"
                  value={activeRecipe.targetFoodCostPct}
                  onChange={(e) => handleRecipeFieldChange('targetFoodCostPct', parseFloat(e.target.value) || 28)}
                  className="w-20 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-amber-400 outline-none"
                />
                <span className="text-sm text-slate-400 font-mono">%</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3">
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Menu Selling Price ($)
              </label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={activeRecipe.sellingPrice}
                  onChange={(e) => handleRecipeFieldChange('sellingPrice', parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-emerald-400 outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Suggested Menu Price
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-base font-mono font-bold text-slate-200">
                  ${activeRecipe.suggestedPrice.toFixed(2)}
                </span>
                <button
                  onClick={() => handleRecipeFieldChange('sellingPrice', Number(activeRecipe.suggestedPrice.toFixed(2)))}
                  className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 transition"
                  title="Apply Suggested Price"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* ==========================================
              REAL-TIME FINANCIAL BREAKDOWN CARDS
          ========================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-5">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <p className="text-[11px] text-slate-400 uppercase font-medium">Total Batch Cost</p>
              <p className="text-xl font-mono font-bold text-white mt-1">
                ${activeRecipe.totalCost.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">All ingredients</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <p className="text-[11px] text-slate-400 uppercase font-medium">Cost Per Portion</p>
              <p className="text-xl font-mono font-bold text-amber-400 mt-1">
                ${activeRecipe.costPerPortion.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Per {activeRecipe.portionUnit || 'plate'}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <p className="text-[11px] text-slate-400 uppercase font-medium">Suggested Price</p>
              <p className="text-xl font-mono font-bold text-slate-200 mt-1">
                ${activeRecipe.suggestedPrice.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">@ {activeRecipe.targetFoodCostPct}% target</p>
            </div>

            <div className={`rounded-xl p-3.5 border ${getCostBadgeStyle(activeRecipe.healthStatus)}`}>
              <p className="text-[11px] uppercase font-semibold opacity-80">Actual Food Cost %</p>
              <p className="text-xl font-mono font-bold mt-1">
                {activeRecipe.sellingPrice > 0 ? `${activeRecipe.actualFoodCostPct.toFixed(1)}%` : 'N/A'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {activeRecipe.healthStatus === 'optimal'
                  ? 'On Target'
                  : activeRecipe.healthStatus === 'warning'
                  ? 'Slightly High'
                  : 'High Cost Alert'}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
              <p className="text-[11px] text-emerald-300 uppercase font-semibold">Gross Profit Margin</p>
              <p className="text-xl font-mono font-bold text-emerald-400 mt-1">
                ${activeRecipe.grossProfitPerPortion.toFixed(2)}
              </p>
              <p className="text-[11px] text-emerald-300/70 mt-0.5">Per {activeRecipe.portionUnit || 'plate'} sold</p>
            </div>
          </div>

          {/* ==========================================
              INGREDIENT LINE ITEMS TABLE
          ========================================== */}
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Formula & Yield-Adjusted Ingredient Breakdown</span>
            </h3>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60">
                      <th className="py-3 px-4">Ingredient / Sub-Recipe</th>
                      <th className="py-3 px-3 w-28">Quantity</th>
                      <th className="py-3 px-3 w-28">Unit</th>
                      <th className="py-3 px-3">EP Unit Cost (Yield %)</th>
                      <th className="py-3 px-4 text-right">Line Cost ($)</th>
                      <th className="py-3 px-3 text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-sm">
                    {activeRecipe.computedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white flex items-center gap-2">
                            {item.type === 'subrecipe' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                SUB
                              </span>
                            )}
                            {item.isSimulated && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                                SIM
                              </span>
                            )}
                            <span>{item.name}</span>
                          </div>
                          <div className="text-xs text-slate-500">{item.vendor}</div>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={item.qty}
                            onChange={(e) => handleLineItemUpdate(item.id, 'qty', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-sm font-mono font-semibold text-amber-400 outline-none"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={item.unit}
                            onChange={(e) => handleLineItemUpdate(item.id, 'unit', e.target.value)}
                            className="bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-xs font-mono text-white outline-none"
                          >
                            {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-400">
                          <div>${item.epUnitCost.toFixed(2)} / {item.baseUnit}</div>
                          {item.yieldPct < 100 && (
                            <span className="text-[11px] text-amber-400/90">({item.yieldPct}% yield applied)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ${item.lineCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRemoveLineItem(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition"
                            title="Remove Line"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Ingredient Builder Bar */}
              <form onSubmit={handleAddLineItem} className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center gap-2.5">
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-medium text-amber-400 outline-none"
                >
                  <option value="ingredient">+ Master Ingredient</option>
                  {subRecipesList.length > 0 && <option value="subrecipe">+ Prep Sub-Recipe</option>}
                </select>

                <select
                  value={selectedRefId}
                  onChange={(e) => {
                    setSelectedRefId(e.target.value);
                    if (addType === 'ingredient') {
                      const found = ingredientMap[e.target.value];
                      if (found && found.baseUnit === 'each') setAddUnit('each');
                    }
                  }}
                  className="flex-1 min-w-[180px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                >
                  {addType === 'ingredient'
                    ? ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} (${(ingredientMap[ing.id]?.epUnitCost || 0).toFixed(2)}/{ing.baseUnit})
                        </option>
                      ))
                    : subRecipesList.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          [PREP] {sub.name} (${sub.costPerPortion.toFixed(2)}/{sub.portionUnit})
                        </option>
                      ))}
                </select>

                <input
                  type="number"
                  step="0.25"
                  min="0.01"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  placeholder="Qty"
                  className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-mono text-white outline-none"
                />

                <select
                  value={addUnit}
                  onChange={(e) => setAddUnit(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-mono text-white outline-none"
                >
                  {AVAILABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg transition shadow"
                >
                  Add Line
                </button>
              </form>
            </div>
          </div>

          {/* Chef Plating & Prep Notes */}
          <div className="mt-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Chef Prep & Plating Notes
            </label>
            <textarea
              rows={2}
              value={activeRecipe.notes || ''}
              onChange={(e) => handleRecipeFieldChange('notes', e.target.value)}
              placeholder="Add prep instructions, portioning tools (#16 scoop, 6 oz ladle), or shelf life notes..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-VIEW 3: SMART ORDER BUILDER
// ==========================================
function SmartOrderView({
  ingredients,
  allIngredients,
  searchQuery,
  setSearchQuery,
  vendorFilter,
  setVendorFilter,
  onQuickUpdate,
  triggerToast
}) {
  const [onlyShowNeeded, setOnlyShowNeeded] = useState(false);

  const uniqueVendors = useMemo(() => {
    const set = new Set(allIngredients.map(i => i.vendor).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [allIngredients]);

  const orderRows = useMemo(() => {
    return ingredients
      .map(ing => {
        const par = parseFloat(ing.parLevel) || 0;
        const onHand = parseFloat(ing.onHand) || 0;
        const rawGap = Math.max(0, par - onHand);
        const orderCases = Math.ceil(rawGap);
        const lineTotal = orderCases * (parseFloat(ing.casePrice) || 0);
        return {
          ...ing,
          orderCases,
          lineTotal
        };
      })
      .filter(row => !onlyShowNeeded || row.orderCases > 0);
  }, [ingredients, onlyShowNeeded]);

  const grandTotal = orderRows.reduce((sum, r) => sum + r.lineTotal, 0);
  const totalCases = orderRows.reduce((sum, r) => sum + r.orderCases, 0);

  const copyPurchaseOrderToClipboard = () => {
    const needed = orderRows.filter(r => r.orderCases > 0);
    if (needed.length === 0) {
      triggerToast('No items currently below par level!', 'error');
      return;
    }
    const lines = [
      `PURCHASE ORDER WORKSHEET - ${new Date().toLocaleDateString()}`,
      vendorFilter !== 'All' ? `VENDOR: ${vendorFilter}` : `ALL SUPPLIERS`,
      `------------------------------------------------------------`,
      ...needed.map(r => `${r.orderCases}x Case | ${r.name} (${r.packSizeStr}) | ${r.vendor} | Est: $${r.lineTotal.toFixed(2)}`),
      `------------------------------------------------------------`,
      `TOTAL CASES: ${totalCases} | ESTIMATED ORDER TOTAL: $${grandTotal.toFixed(2)}`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    triggerToast('Purchase Order copied to clipboard for texting/emailing!');
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <span>Smart Par-Level Order Builder</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your walk-in <span className="text-amber-400 font-medium">On-Hand Case Count</span> and <span className="text-amber-400 font-medium">Par Level</span>. Filter by vendor and copy a formatted PO to text or email your sales rep.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          >
            {uniqueVendors.map(v => (
              <option key={v} value={v}>{v === 'All' ? 'All Vendors / Suppliers' : v}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={onlyShowNeeded}
              onChange={(e) => setOnlyShowNeeded(e.target.checked)}
              className="rounded accent-amber-500"
            />
            <span>Show Only Items to Order</span>
          </label>

          <button
            onClick={copyPurchaseOrderToClipboard}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Purchase Order ({totalCases} Cases)</span>
          </button>
        </div>
      </div>

      {/* Order Worksheet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Item & Pack Size</th>
                <th className="py-3.5 px-3">Vendor</th>
                <th className="py-3.5 px-3">Case Price</th>
                <th className="py-3.5 px-3 w-32">Par Level (Cases)</th>
                <th className="py-3.5 px-3 w-32">On-Hand (Cases)</th>
                <th className="py-3.5 px-4 bg-amber-500/5 border-x border-slate-800 text-amber-400">
                  Suggested Order Qty
                </th>
                <th className="py-3.5 px-4 text-right">Est. Line Cost ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {orderRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{row.packSizeStr}</div>
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-300">{row.vendor}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-200">${parseFloat(row.casePrice).toFixed(2)}</td>
                  <td className="py-3.5 px-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={row.parLevel ?? 2}
                      onChange={(e) => onQuickUpdate(row, 'parLevel', e.target.value)}
                      className="w-20 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white outline-none"
                    />
                  </td>
                  <td className="py-3.5 px-3">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={row.onHand ?? 0}
                      onChange={(e) => onQuickUpdate(row, 'onHand', e.target.value)}
                      className="w-20 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-sm font-mono text-amber-400 outline-none"
                    />
                  </td>
                  <td className="py-3.5 px-4 bg-amber-500/5 border-x border-slate-800">
                    {row.orderCases > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                        {row.orderCases} {row.orderCases === 1 ? 'case' : 'cases'}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">Stocked at Par</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    ${row.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 border-t border-slate-800 font-mono">
                <td colSpan={5} className="py-4 px-4 text-right text-xs uppercase text-slate-400 font-sans font-semibold">
                  Estimated Purchase Order Total:
                </td>
                <td className="py-4 px-4 font-bold text-amber-400 border-x border-slate-800">
                  {totalCases} Cases
                </td>
                <td className="py-4 px-4 text-right text-lg font-bold text-emerald-400">
                  ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL 1: CSV ORDER GUIDE IMPORT
// ==========================================
function CsvImportModal({ csvTextInput, setCsvTextInput, onClose, onImport, onFileUpload, onLoadSampleText }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Import Vendor Order Guide (CSV)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Upload a CSV file from your supplier (Sysco, US Foods, etc.) or paste CSV lines below. Existing ingredients with matching names will automatically update their case prices on your phone and recalculate all recipes!
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <label className="flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-400 px-3.5 py-2 rounded-lg cursor-pointer border border-slate-700 transition">
            <Upload className="w-4 h-4" />
            <span>Choose .CSV File</span>
            <input type="file" accept=".csv,.txt" onChange={onFileUpload} className="hidden" />
          </label>

          <button
            onClick={onLoadSampleText}
            className="text-xs text-slate-300 hover:text-amber-400 underline"
          >
            Reset to Sample CSV Format
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
            Format: Item Name, Vendor, Category, Case Price, Pack Size, Yield %, Par Level, On Hand
          </label>
          <textarea
            rows={8}
            value={csvTextInput}
            onChange={(e) => setCsvTextInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 font-mono text-xs text-slate-200 outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Import & Recalculate Recipes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL 2: ADD / EDIT INGREDIENT
// ==========================================
function IngredientFormModal({ initialData, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || '');
  const [vendor, setVendor] = useState(initialData?.vendor || VENDORS[0]);
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [casePrice, setCasePrice] = useState(initialData?.casePrice || 45.00);
  const [packSizeStr, setPackSizeStr] = useState(initialData?.packSizeStr || '2x5 lb');
  const [totalBaseQty, setTotalBaseQty] = useState(initialData?.totalBaseQty || 10);
  const [baseUnit, setBaseUnit] = useState(initialData?.baseUnit || 'lb');
  const [yieldPct, setYieldPct] = useState(initialData?.yieldPct || 100);
  const [parLevel, setParLevel] = useState(initialData?.parLevel || 2);
  const [onHand, setOnHand] = useState(initialData?.onHand || 1);

  const handlePackStrChange = (val) => {
    setPackSizeStr(val);
    const parsed = parsePackString(val);
    setTotalBaseQty(parsed.totalBaseQty);
    setBaseUnit(parsed.baseUnit);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...(initialData || {}),
      name: name.trim(),
      vendor,
      category,
      casePrice: parseFloat(casePrice) || 0,
      packSizeStr,
      totalBaseQty: parseFloat(totalBaseQty) || 1,
      baseUnit,
      yieldPct: Math.min(100, Math.max(1, parseFloat(yieldPct) || 100)),
      parLevel: parseFloat(parLevel) || 0,
      onHand: parseFloat(onHand) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">
            {initialData ? 'Edit Order Guide Item' : 'Add New Order Guide Ingredient'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Ingredient Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Smoked Beef Brisket"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Vendor / Supplier</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Case Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={casePrice}
                onChange={(e) => setCasePrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-amber-400 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Pack Description (e.g. 4x5 lb)</label>
              <input
                type="text"
                value={packSizeStr}
                onChange={(e) => handlePackStrChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Net Case Units</label>
              <input
                type="number"
                step="0.1"
                value={totalBaseQty}
                onChange={(e) => setTotalBaseQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Base Unit</label>
              <select
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-white"
              >
                {['lb', 'oz', 'gal', 'qt', 'each', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-amber-400 mb-1 font-medium">Yield %</label>
              <input
                type="number"
                min="1"
                max="100"
                value={yieldPct}
                onChange={(e) => setYieldPct(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            Save Ingredient
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// MODAL 3: CREATE NEW RECIPE
// ==========================================
function NewRecipeModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Menu Plate');
  const [portions, setPortions] = useState(1);
  const [portionUnit, setPortionUnit] = useState('plate');
  const [targetFoodCostPct, setTargetFoodCostPct] = useState(28);
  const [sellingPrice, setSellingPrice] = useState(16.00);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      category,
      portions: parseFloat(portions) || 1,
      portionUnit,
      targetFoodCostPct: parseFloat(targetFoodCostPct) || 28,
      sellingPrice: category === 'Menu Plate' ? (parseFloat(sellingPrice) || 0) : 0,
      notes: '',
      items: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">Create New Recipe</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Recipe Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Smoked Gouda Mac & Cheese"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Recipe Type</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value === 'Prep / Sub-Recipe') {
                  setPortions(32);
                  setPortionUnit('fl oz');
                } else {
                  setPortions(1);
                  setPortionUnit('plate');
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              <option value="Menu Plate">Menu Plate (Sold to Guests)</option>
              <option value="Prep / Sub-Recipe">Prep / Sub-Recipe (Used in Plates)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Batch Yield Qty</label>
              <input
                type="number"
                min="1"
                value={portions}
                onChange={(e) => setPortions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Yield Unit</label>
              <input
                type="text"
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value)}
                placeholder="plate, bowl, fl oz"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          {category === 'Menu Plate' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Food Cost %</label>
                <input
                  type="number"
                  value={targetFoodCostPct}
                  onChange={(e) => setTargetFoodCostPct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Menu Selling Price ($)</label>
                <input
                  type="number"
                  step="0.25"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-emerald-400"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            Create & Add Ingredients
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// MODAL 4: DEVICE BACKUP & RESTORE (JSON)
// ==========================================
function DeviceBackupModal({ ingredients, recipes, onClose, onRestore, onResetSample, triggerToast }) {
  const handleDownloadBackup = () => {
    const payload = {
      app: 'MiseEnPlace PRO',
      exportedAt: new Date().toISOString(),
      ingredients,
      recipes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `miseenplace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Backup JSON downloaded to your phone!');
  };

  const handleUploadBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result);
        onRestore(parsed);
      } catch (err) {
        triggerToast('Could not parse JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Phone Storage & Backup</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200 leading-relaxed">
          All <strong>{ingredients.length} Order Guide items</strong> and <strong>{recipes.length} Recipes</strong> are automatically saved directly on your phone using browser LocalStorage. Works 100% offline inside walk-in coolers!
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="w-full flex items-center justify-between bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl text-left transition"
          >
            <div>
              <div className="text-sm font-semibold text-white">Export Backup File (.JSON)</div>
              <div className="text-xs text-slate-400">Save a copy of all recipes & prices to your phone</div>
            </div>
            <Download className="w-5 h-5 text-amber-400 shrink-0" />
          </button>

          <label className="w-full flex items-center justify-between bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-xl text-left cursor-pointer transition">
            <div>
              <div className="text-sm font-semibold text-white">Restore from Backup (.JSON)</div>
              <div className="text-xs text-slate-400">Load a previously exported MiseEnPlace file</div>
            </div>
            <Upload className="w-5 h-5 text-emerald-400 shrink-0" />
            <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
          </label>

          <button
            onClick={onResetSample}
            className="w-full flex items-center justify-between bg-slate-950 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/40 p-3.5 rounded-xl text-left transition"
          >
            <div>
              <div className="text-sm font-semibold text-rose-400">Reset to Default Sample Data</div>
              <div className="text-xs text-slate-400">Restore original 12 ingredients & 4 sample recipes</div>
            </div>
            <RefreshCw className="w-5 h-5 text-rose-400 shrink-0" />
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
  )
}

export default App
