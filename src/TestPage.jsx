import React from 'react';
// import APITestComponent from './components/APITestComponent.jsx';
import styles from './style';
import { Link } from 'react-router-dom';

const TestPage = () => {
  

  return (
    <div className="deep bg-primary w-full overflow-hidden">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          
          
          <div style={{ minHeight: '80vh', padding: '20px 0' }}>
            <div style={{ textAlign: 'center', color: 'white', padding: '50px' }}>
              <h2>Test Page Temporarily Disabled</h2>
              <p>Please test the gadgets directly at:</p>
              <Link to="/gadgets" style={{ color: '#48CEDB', fontSize: '18px' }}>
                Go to Gadgets
              </Link>
            </div>
          </div>
          
          
        </div>
      </div>
    </div>
  );
};

export default TestPage;