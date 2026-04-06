import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Category } from '@/pages/Category';
import { Favorites } from '@/pages/Favorites';
import { SimulationPlayer } from '@/components/simulation/SimulationPlayer';
import { NotFound } from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <NotFound />,
  },
  {
    path: 'category/:category',
    element: <Category />,
  },
  {
    path: 'favorites',
    element: <Favorites />,
  },
  {
    path: ':category/:id',
    element: <SimulationPlayer />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
