import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider } from './context/FamilyContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Suggest from './pages/Suggest';
import Recipes from './pages/Recipes';
import RecipeForm from './pages/RecipeForm';
import WeeklyPlanner from './pages/WeeklyPlanner';
import ShoppingList from './pages/ShoppingList';
import Dislikes from './pages/Dislikes';

export default function App() {
  return (
    <FamilyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="profile/:id" element={<Profile />} />
            <Route path="suggest" element={<Suggest />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="recipes/new" element={<RecipeForm />} />
            <Route path="recipes/:id/edit" element={<RecipeForm />} />
            <Route path="planner" element={<WeeklyPlanner />} />
            <Route path="shopping" element={<ShoppingList />} />
            <Route path="dislikes" element={<Dislikes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FamilyProvider>
  );
}
