import  { useState } from 'react';
import { close, logo, menu } from '../assets';
import SVGComponent from "./Logo.jsx";
import { navLinks } from '../constants';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NavBar = () => {
  const [activeTitle, setActiveTitle] = useState('Home');
  const [toggle, setToggle] = useState(false);
  const handleClick = (title) => {
    setActiveTitle(title);
  };

  return (
    <nav className='w-full flex py-6 justify-between items-center navbar'>
      <SVGComponent />
      <ul className='list-none sm:flex hidden justify-end items-center flxe-1'>
        {navLinks.map((el, index) => {
          const isActive = activeTitle === el.title; // Check if the link is active

          return (
            <motion.div
              key={el.id}
              whileHover={{ scale: 1.15 }} // Scale on hover
              animate={{ scale: isActive ? 1.25 : 1 }} // Scale if active
            >
              <li
                className={`current-page font-poppins font-normal cursor-pointer text-[16px] 
                  ${index === navLinks.length - 1 ? 'mr-0' : 'mr-10'} 
                  text-white ${isActive ? 'text-blue' : ''}`} // Optional: Add a style when active
                onClick={() => handleClick(el.title)} // Set active title on click
              >
                <Link to={el.id}>{el.title}</Link>
              </li>
            </motion.div>
          );
        })}
      </ul>

      <div className='sm:hidden flex flex-1 justify-end items-center'>
        <img
          src={toggle ? close : menu}
          alt="menu"
          className="w-[28px] h-[28px] object-contain"
          onClick={() => setToggle((prev) => !prev)}
        />

        <div className={`${toggle ? 'flex' : 'hidden'} p-6 bg-black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] rounded-xl sidebar`}>
          <ul className='list-none flex flex-col justify-end items-center flex-1'>
            {navLinks.map((el, index) => {
              return (
                <li key={el.id} className={`font-poppins font-normal cursor-pointer text-[16px] ${index === navLinks.length - 1 ? 'mr-0' : 'mb-4'} text-white`}>
                  <Link to={el.id}>{el.title}</Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
