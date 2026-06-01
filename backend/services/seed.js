import Recipe from '../models/Recipe.js';
import FamilyMember from '../models/FamilyMember.js';

const PRESET_RECIPES = [
  {
    title: 'Hainanese Chicken Rice',
    description: 'Singapore's iconic dish — silky poached chicken over fragrant rice with chilli and ginger sauces.',
    cuisine: 'Singaporean',
    ingredients: [
      '1 whole chicken', '4 cups jasmine rice', '4 garlic cloves', '3 slices ginger',
      '2 stalks spring onion', '1 tbsp sesame oil', '1 tbsp light soy sauce',
      'Chicken stock from poaching', 'Cucumber and tomato to serve',
      'Chilli sauce and ginger paste to serve',
    ],
    instructions: 'Rub chicken with salt, stuff with spring onion and ginger. Poach in water 35–40 mins. Rest in ice water 10 mins. Fry garlic in oil, add rice, stir 2 mins. Cook rice in chicken stock. Shred chicken, drizzle with sesame oil and soy. Serve with rice, cucumber, chilli sauce and ginger paste.',
  },
  {
    title: 'Wanton Mee',
    description: 'Springy egg noodles with char siu, wantons, and a light savoury sauce — a hawker classic.',
    cuisine: 'Singaporean',
    ingredients: [
      '200g fresh egg noodles', '6 pork or prawn wantons', '100g char siu (BBQ pork), sliced',
      '2 tbsp oyster sauce', '1 tbsp light soy sauce', '1 tsp sesame oil',
      '1 tsp dark soy sauce', 'Chye sim (leafy greens)', 'Chilli sauce to serve',
    ],
    instructions: 'Blanch noodles in boiling water 1–2 mins, drain. Boil wantons separately until they float. Mix oyster sauce, light soy, dark soy and sesame oil in bowl. Toss noodles in sauce. Top with char siu, wantons and blanched greens. Serve with chilli sauce.',
  },
  {
    title: 'Nasi Lemak',
    description: 'Fragrant coconut rice served with crispy ikan bilis, peanuts, egg, and sambal.',
    cuisine: 'Singaporean',
    ingredients: [
      '2 cups jasmine rice', '1 can (400ml) coconut milk', '2 pandan leaves',
      '2 slices ginger', '1/2 tsp salt', '100g ikan bilis (dried anchovies)',
      '100g roasted peanuts', '2 hard-boiled eggs', 'Cucumber slices',
      'Sambal chilli to serve (mild for kids)',
    ],
    instructions: 'Wash rice, add coconut milk, water to level, pandan leaves, ginger and salt. Cook in rice cooker. Fry ikan bilis in oil until golden and crispy. Drain on paper towel. Serve rice with ikan bilis, peanuts, halved egg, cucumber and a small spoon of sambal.',
  },
  {
    title: 'Fish Ball Noodle Soup',
    description: 'Comforting clear soup noodles with bouncy fish balls — a hawker favourite for kids.',
    cuisine: 'Singaporean',
    ingredients: [
      '200g flat rice noodles (kway teow) or mee pok', '12 fish balls', '100g minced pork',
      '800ml chicken or pork stock', '2 tbsp light soy sauce', '1 tsp fish sauce',
      'White pepper', 'Spring onions and fried shallots to garnish', 'Chye sim',
    ],
    instructions: 'Bring stock to boil, season with soy sauce, fish sauce and white pepper. Add fish balls and minced pork, simmer 5 mins. Blanch noodles and greens separately. Place in bowls, ladle over soup and fish balls. Top with spring onions and fried shallots.',
  },
  {
    title: 'Mee Goreng',
    description: 'Spiced stir-fried yellow noodles with egg, tofu, and vegetables — a Malay hawker classic.',
    cuisine: 'Singaporean',
    ingredients: [
      '300g fresh yellow noodles', '2 eggs', '100g firm tofu, cubed',
      '1 tomato, quartered', '2 tbsp ketchup', '1 tbsp sweet soy sauce (kecap manis)',
      '1 tbsp chilli sauce (reduce for kids)', '2 garlic cloves', 'Bean sprouts', 'Spring onions',
    ],
    instructions: 'Fry tofu until golden, set aside. Stir-fry garlic 30 sec. Add noodles, ketchup, kecap manis and chilli sauce, toss well. Push aside, scramble eggs in pan. Add tomato, bean sprouts, tofu. Toss everything together. Top with spring onions.',
  },
  {
    title: 'Roti Prata with Egg',
    description: 'Crispy pan-fried flatbread with a fluffy egg inside — a beloved Singapore breakfast.',
    cuisine: 'Singaporean',
    ingredients: [
      '2 cups plain flour', '1/2 tsp salt', '1 tbsp sugar', '2 tbsp ghee or butter',
      '150ml water (approx)', '2 eggs', 'Extra ghee for frying',
      'Curry dipping sauce or sugar to serve',
    ],
    instructions: 'Mix flour, salt, sugar, ghee and water into a soft dough. Rest 1 hour. Stretch dough thin on oiled surface, fold into layers. Pan-fry in ghee over medium heat. Crack egg on top, fold prata over egg. Cook until crispy on both sides. Serve with curry sauce.',
  },
  {
    title: 'Chicken Congee',
    description: 'Smooth, comforting rice porridge with tender chicken and ginger — great for any meal.',
    cuisine: 'Singaporean',
    ingredients: [
      '1/2 cup jasmine rice', '1.5L chicken stock', '200g chicken breast or thigh',
      '4 slices ginger', '2 tsp light soy sauce', '1 tsp sesame oil',
      'White pepper', 'Spring onions, fried shallots and you tiao (optional) to serve',
    ],
    instructions: 'Bring stock and rice to boil. Add ginger and chicken. Simmer on low 30–40 mins, stirring occasionally, until porridge is thick and creamy. Remove chicken, shred. Return to pot, season with soy sauce, sesame oil and white pepper. Serve with spring onions and fried shallots.',
  },
  {
    title: 'Char Kway Teow',
    description: 'Smoky stir-fried flat rice noodles with egg, bean sprouts, and lap cheong.',
    cuisine: 'Singaporean',
    ingredients: [
      '300g flat rice noodles (kway teow)', '2 eggs', '1 lap cheong (Chinese sausage), sliced',
      '100g bean sprouts', '3 tbsp light soy sauce', '2 tbsp dark soy sauce',
      '1 tbsp oyster sauce', '3 garlic cloves', '2 tbsp lard or vegetable oil',
      'Chye sim or beansprouts',
    ],
    instructions: 'Heat wok on very high heat until smoking. Add lard/oil, fry garlic 15 sec. Add lap cheong, stir-fry 1 min. Add noodles, sauces — toss quickly for 1 min. Push to side, scramble eggs. Mix everything together. Add bean sprouts, toss 30 sec. Serve immediately.',
  },
  {
    title: 'Bak Chor Mee',
    description: 'Minced pork noodles tossed in a tangy vinegar-soy sauce with mushrooms and fried lard.',
    cuisine: 'Singaporean',
    ingredients: [
      '200g mee pok or mee kia noodles', '150g minced pork', '4 shiitake mushrooms, sliced',
      '2 tbsp black vinegar', '2 tbsp light soy sauce', '1 tbsp oyster sauce',
      '1 tsp sesame oil', 'Fried lard bits (optional)', 'Bean sprouts', 'Spring onions',
    ],
    instructions: 'Cook minced pork with mushrooms in a little oil, season with soy sauce. Mix vinegar, soy, oyster sauce and sesame oil in a bowl. Cook noodles per packet, drain. Toss noodles in sauce. Top with pork mixture, bean sprouts and spring onions.',
  },
  {
    title: 'Pancakes',
    description: 'Fluffy homemade pancakes — a favourite weekend breakfast treat.',
    cuisine: 'Western',
    ingredients: [
      '1.5 cups plain flour', '2 tsp baking powder', '1 tbsp sugar', '1/2 tsp salt',
      '1 egg', '1.25 cups milk', '2 tbsp melted butter',
      'Maple syrup and berries to serve',
    ],
    instructions: 'Whisk dry ingredients. Whisk wet ingredients separately. Combine wet into dry, mix until just combined (lumps OK). Heat buttered pan over medium. Pour 1/4 cup batter per pancake. Cook until bubbles form, flip, cook 1 min more. Serve with maple syrup and berries.',
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
      likes: ['chicken rice', 'noodles', 'fish balls'],
      dislikes: [],
      cuisines: ['Singaporean', 'Asian'],
      dietary_restrictions: [],
    });
    console.log('Seeded default family member: Yvette.');
  }
}
