import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import Cart from './pages/Cart';
import Pay from './pages/Pay';
import OrderedList from './pages/OrderedList';

const Router = () => {
  return (
    <main>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="products/:productId" element={<ProductDetail />} />
            <Route path="/carts" element={<Cart />} />
            <Route path="pay" element={<Pay />} />
            <Route path="ordered" element={<OrderedList />} />
          </Route>
          <Route path="signup" element={<Signup />} />
          <Route path="signin" element={<Signin />} />
        </Routes>
      </BrowserRouter>
    </main>
  );
};

export default Router;
