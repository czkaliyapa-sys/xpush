import styles from "./style";

 
import { close, logo, menu } from './assets';
import SVGComponent from "./components/Logo.jsx";
import { navLinks, mobileNavLinks } from './constants';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@mui/material/Button';

import SearchBar from "./external_components/SearchBar.jsx";
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { useCart } from './contexts/CartContext.jsx';
import { Menu, MenuItem, Box, Badge, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CartModal from './components/CartModal.jsx';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useWishlist } from './contexts/WishlistContext.jsx';



const MainNav = ({title, toggle, setToggle, mobileOnTablet = true}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getCartItemsCount, toggleCart } = useCart();
  const { items: wishlistItems } = useWishlist();
  
  const handleMoreClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMoreClose = () => {
    setAnchorEl(null);
  };
  
  const handleSearch = (query) => {
    console.log('Searching for:', query);
    if (query.trim() !== '') {
      navigate('/gadgets', { state: { searchQuery: query } });
      setShowSearch(false);
    }
  };

  const handleHubClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/signin');
    }
  };

  const handleCartClick = () => {
    setCartOpen(!cartOpen);
  };

  const handleWishlistClick = () => {
    navigate('/wishlist');
  };

    return (
        <>
        {/* TEMPORARY CONSTRUCTION BANNER - REMOVE LATER */}
        <div className="w-screen -ml-[calc(50vw-50%)] bg-black text-white text-center py-2">
          <p className="text-sm sm:text-base font-semibold">
            ⚠️ Sorry, please don't attempt purchases — the website is under construction
          </p>
        </div>
        {/* END CONSTRUCTION BANNER */}
        <nav className="w-full flex py-4 px-2 sm:py-6 sm:px-4 justify-between items-center navbar relative z-50">
      {/* Logo */}
      <Link to="/" className="flex-shrink-0">
        <div className="w-24 h-auto sm:w-auto">
          <SVGComponent className="w-full h-auto max-w-[96px] sm:max-w-none" />
        </div>
      </Link>

      {/* Mobile Icons - cart and hamburger menu */}
      <div className={`${mobileOnTablet ? 'lg:hidden' : 'sm:hidden'} flex items-center space-x-3`}>
        <IconButton 
          onClick={handleWishlistClick}
          sx={{ 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(72, 206, 219, 0.1)' }
          }}
        >
          <Badge badgeContent={wishlistItems.length} color="error">
            <FavoriteIcon fontSize="small" />
          </Badge>
        </IconButton>
        <IconButton 
          onClick={handleCartClick}
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(72, 206, 219, 0.1)'
            }
          }}
        >
          <Badge badgeContent={getCartItemsCount()} color="error">
            <ShoppingCartIcon fontSize="small" />
          </Badge>
        </IconButton>
        
        <img
          src={toggle ? close : menu}
          alt="menu"
          className="w-[24px] h-[24px] object-contain cursor-pointer"
          onClick={() => setToggle((prev) => !prev)}
        />
      </div>

      {/* Desktop Menu */}
      <ul className={`list-none ${mobileOnTablet ? 'lg:flex hidden' : 'sm:flex hidden'} justify-end items-center flex-1`}>
        {navLinks.map((el, index) => {
          const isActive = title === el.title || (el.submenu && el.submenu.some(sub => sub.title === title));
          
          if (el.submenu) {
            return (
              <motion.div
                key={el.id}
                whileHover={{ scale: 1.15 }}
                animate={{ scale: isActive ? 1.25 : 1 }}
              >
                <li
                  className={`font-poppins font-normal cursor-pointer text-[16px] hover:text-teal-400 transition-colors ${
                    index === navLinks.length - 1 ? 'mr-0' : 'mr-10'
                  } ${isActive ? 'text-teal-400' : 'text-white'} flex items-center`}
                  onClick={handleMoreClick}
                >
                  {el.title}
                  <ExpandMoreIcon sx={{ ml: 0.5, fontSize: 16 }} />
                </li>
              </motion.div>
            );
          }
          
          return (
            <motion.div
              key={el.id}
              whileHover={{ scale: 1.15 }}
              animate={{ scale: isActive ? 1.25 : 1 }}
            >
              <li
                className={`font-poppins font-normal cursor-pointer text-[16px] ${
                  index === navLinks.length - 1 ? 'mr-0' : 'mr-10'
                } ${isActive ? 'text-teal-400' : 'text-white'}`}
              >
                <Link to={el.url} className="hover:text-teal-400 transition-colors">{el.title}</Link>
              </li>
            </motion.div>
          );
        })}
        
        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMoreClose}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mt: 1
            }
          }}
        >
          {navLinks.find(el => el.submenu)?.submenu.map((subItem) => (
            <MenuItem 
              key={subItem.id} 
              onClick={() => {
                navigate(subItem.url);
                handleMoreClose();
              }}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(72, 206, 219, 0.1)'
                }
              }}
            >
              {subItem.title}
            </MenuItem>
          ))}
        </Menu>
        
        {/* Desktop Cart Icon - hidden on mobile */}
        <IconButton 
          onClick={handleCartClick}
          className={`hidden ${mobileOnTablet ? 'lg:block' : 'sm:block'}`}
          sx={{ 
            marginLeft: '20px',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(72, 206, 219, 0.1)'
            }
          }}
        >
          <Badge badgeContent={getCartItemsCount()} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        <IconButton 
          onClick={handleWishlistClick}
          className={`hidden ${mobileOnTablet ? 'lg:block' : 'sm:block'}`}
          sx={{ 
            marginLeft: '12px',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(72, 206, 219, 0.1)'
            }
          }}
        >
          <Badge badgeContent={wishlistItems.length} color="error">
            <FavoriteIcon />
          </Badge>
        </IconButton>
        
        <Button 
          style={{ marginLeft: '20px' }} 
          variant="contained"
          onClick={handleHubClick}
          sx={{
            backgroundColor: '#2da6b3',
            '&:hover': {
              backgroundColor: '#248996'
            }
          }}
        >
          HUB
        </Button>
      </ul>

      {/* Mobile Menu Icon - now integrated above with cart */}
        
        {/* Mobile Sidebar Menu */}
        <div
          className={`${
            toggle ? 'flex' : 'hidden'
          } p-4 bg-black absolute top-16 right-2 w-[180px] rounded-xl z-50 flex-col shadow-xl border border-gray-700`}
        >
          <ul className="list-none flex flex-col justify-start items-start space-y-3">
            {mobileNavLinks.map((el) => (
              <li
                key={el.id}
                className="font-poppins font-normal cursor-pointer text-[14px] text-white w-full py-1"
                onClick={() => setToggle(false)}
              >
                <Link to={el.url} className="block w-full hover:text-teal-400 transition-colors">
                  {el.title}
                </Link>
              </li>
            ))}
            
            {/* Cart now available in main nav bar */}
            
            <li className="w-full pt-2">
              <Button 
                variant="contained" 
                className="w-full"
                size="small"
                onClick={() => {
                  handleHubClick();
                  setToggle(false);
                }}
                sx={{
                  fontSize: '12px',
                  py: 1,
                  backgroundColor: '#2da6b3',
                  '&:hover': {
                    backgroundColor: '#248996'
                  }
                }}
              >
                HUB
              </Button>
            </li>
          </ul>
        </div>
      
      {/* Cart Modal */}
      <CartModal 
        open={cartOpen} 
        onClose={() => setCartOpen(false)} 
      />
    
    </nav>
        </>
    )
}
export default MainNav;