import Recipe from '../models/Recipe.js';
import FamilyMember from '../models/FamilyMember.js';

const PRESET_RECIPES = [
  {
    title: 'Spaghetti Bolognese',
    description: 'Classic Italian meat sauce over spaghetti, a family favourite.',
    cuisine: 'Italian',
    ingredients: [
      '400g spaghetti', '500g beef mince', '1 onion, diced', '3 garlic cloves, minced',
      '400g crushed tomatoes', '2 tbsp tomato paste', '1 tsp dried oregano',
      '1 tsp dried basil', 'Salt and pepper', 'Parmesan to serve',
    ],
    instructions: 'Brown mince in a large pan. Add onion and garlic, cook 3 mins. Stir in tomato paste, crushed tomatoes, oregano, basil, salt and pepper. Simmer 20 mins. Cook spaghetti per packet. Serve sauce over pasta with parmesan.',
  },
  {
    title: 'Chicken Fried Rice',
    description: 'Quick and easy fried rice with chicken and vegetables.',
    cuisine: 'Asian',
    ingredients: [
      '2 cups cooked rice (day-old)', '300g chicken breast, diced', '2 eggs',
      '1 cup frozen peas and corn', '3 tbsp soy sauce', '2 tbsp oyster sauce',
      '3 spring onions, sliced', '2 garlic cloves, minced', '2 tbsp vegetable oil',
    ],
    instructions: 'Heat oil in wok over high heat. Cook chicken until golden, set aside. Scramble eggs, set aside. Stir-fry garlic 30 sec. Add rice, stir-fry 3 mins. Add peas and corn, soy sauce, oyster sauce. Return chicken and egg. Toss, top with spring onions.',
  },
  {
    title: 'Grilled Salmon with Vegetables',
    description: 'Healthy grilled salmon fillet with seasonal roasted vegetables.',
    cuisine: 'Western',
    ingredients: [
      '4 salmon fillets', '2 zucchini, sliced', '1 capsicum, sliced', '200g cherry tomatoes',
      '3 tbsp olive oil', '2 garlic cloves, minced', 'Juice of 1 lemon',
      'Salt, pepper, and dried herbs',
    ],
    instructions: 'Toss vegetables in olive oil, garlic, salt and pepper. Roast at 200°C for 20 mins. Season salmon with lemon juice, salt and pepper. Grill salmon 4 mins each side. Serve over roasted vegetables.',
  },
  {
    title: 'Chicken Soup',
    description: 'Comforting homemade chicken soup with vegetables and noodles.',
    cuisine: 'Western',
    ingredients: [
      '1 whole chicken or 4 thighs', '2 carrots, sliced', '3 celery stalks, sliced',
      '1 onion, diced', '3 garlic cloves', '200g egg noodles',
      '1.5L chicken stock', 'Salt, pepper, parsley',
    ],
    instructions: 'Simmer chicken in stock with onion and garlic for 30 mins. Remove chicken, shred meat. Add carrots, celery, cook 10 mins. Add noodles, cook 8 mins. Return chicken. Season with salt, pepper, and parsley.',
  },
  {
    title: 'Beef Tacos',
    description: 'Seasoned beef in crispy taco shells with fresh toppings.',
    cuisine: 'Mexican',
    ingredients: [
      '500g beef mince', '1 packet taco seasoning', '8 taco shells',
      '1 cup shredded lettuce', '1 tomato, diced', '1 cup grated cheddar',
      'Sour cream and salsa to serve', '1 onion, diced',
    ],
    instructions: 'Brown mince with onion. Add taco seasoning and water as per packet. Simmer 5 mins. Warm taco shells per packet. Fill shells with beef and top with lettuce, tomato, cheese, sour cream and salsa.',
  },
  {
    title: 'Vegetable Stir Fry',
    description: 'Colourful mixed vegetable stir fry in a savoury sauce, served with rice.',
    cuisine: 'Asian',
    ingredients: [
      '2 cups broccoli florets', '1 capsicum, sliced', '1 carrot, julienned',
      '200g snap peas', '3 tbsp soy sauce', '1 tbsp sesame oil',
      '2 tsp cornflour', '1 tbsp honey', '3 garlic cloves', '1 tsp ginger',
    ],
    instructions: 'Mix soy sauce, sesame oil, cornflour and honey for sauce. Heat wok over high heat. Stir-fry garlic and ginger 30 sec. Add harder vegetables first, then softer ones. Pour over sauce, toss until thickened. Serve with steamed rice.',
  },
  {
    title: 'Pancakes',
    description: 'Fluffy homemade pancakes, perfect for a weekend breakfast.',
    cuisine: 'Western',
    ingredients: [
      '1.5 cups plain flour', '2 tsp baking powder', '1 tbsp sugar', '1/2 tsp salt',
      '1 egg', '1.25 cups milk', '2 tbsp melted butter',
      'Maple syrup and berries to serve',
    ],
    instructions: 'Whisk dry ingredients. Whisk wet ingredients separately. Combine wet into dry, mix until just combined (lumps OK). Heat buttered pan over medium. Pour 1/4 cup batter per pancake. Cook until bubbles form, flip, cook 1 min more. Serve with maple syrup and berries.',
  },
  {
    title: 'Creamy Tomato Pasta',
    description: 'Rich and creamy tomato pasta sauce ready in under 20 minutes.',
    cuisine: 'Italian',
    ingredients: [
      '400g penne pasta', '400g crushed tomatoes', '200ml cooking cream',
      '1 onion, diced', '4 garlic cloves', '2 tbsp olive oil',
      '1 tsp dried basil', 'Salt and pepper', 'Parmesan to serve',
    ],
    instructions: 'Cook pasta per packet. Sauté onion and garlic in olive oil until soft. Add crushed tomatoes and basil, simmer 5 mins. Stir in cream, season well. Toss with drained pasta and serve with parmesan.',
  },
];

export async function seedRecipes() {
  const count = await Recipe.countDocuments();
  if (count === 0) {
    await Recipe.insertMany(PRESET_RECIPES);
    console.log(`Seeded ${PRESET_RECIPES.length} preset recipes.`);
  }
}

export async function seedFamily() {
  const count = await FamilyMember.countDocuments();
  if (count === 0) {
    await FamilyMember.create({
      name: 'Yvette',
      avatar_color: '#f97316',
      likes: [],
      dislikes: [],
      cuisines: [],
      dietary_restrictions: [],
    });
    console.log('Seeded default family member: Yvette.');
  }
}
