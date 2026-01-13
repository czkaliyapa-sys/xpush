import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../style'
import {arrowUp} from '../assets'


const GetStarted = ({texta, textb}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/gadgets');
    window.scrollTo(0, 0);
  };
  
  return (
    <div 
      className={`${styles.flexCenter} w-[140px] h-[140px] rounded-full bg-blue-gradient p-[2px] cursor-pointer`}
      onClick={handleClick}
    >
      <div className={`${styles.flexCenter} flex-col bg-primary w-[100%] h-[100%] rounded-full`}>
        <div className={`${styles.flexStart} flex-row`}>
          <p className="font-poppins font-medium text-[15px] leading-[23px] mr-2">
            <span className=" deep-text">{texta}</span>
          </p>

        </div>
        <p className="font-poppins font-medium text-[15px] leading-[23px]">
            <span className="deep-text">{textb}</span>
          </p>
      </div>
    </div>
  )
}


export default GetStarted