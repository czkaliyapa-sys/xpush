import styles from "../style";

const EbayTrust = () => (
  <section className={`${styles.flexCenter} ${styles.marginY} ${styles.padding} flex-col sm:flex-row bg-discount-gradient rounded-[20px] box-shadow`}>
    <div className="flex items-center justify-center mb-4 sm:mb-0 sm:mr-6">
      {/* eBay Logo SVG */}
      <svg 
        viewBox="0 0 120 48" 
        className="w-24 h-12 sm:w-32 sm:h-16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text x="5" y="35" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold">
          <tspan fill="#E53238">e</tspan>
          <tspan fill="#0064D2">b</tspan>
          <tspan fill="#F5AF02">a</tspan>
          <tspan fill="#86B817">y</tspan>
        </text>
      </svg>
    </div>
    
    <div className="flex-1 flex flex-col text-center sm:text-left">
      <h2 className={`${styles.heading2} text-white`}>
        Trusted eBay UK seller
      </h2>
      
      <p className={`${styles.paragraph} max-w-full sm:max-w-[500px] mt-3 text-white`}>
        We're also present on eBay selling gadgets with great reviews! Check out our store for verified listings and trusted transactions.
      </p>
    </div>

    <div className={`${styles.flexCenter} sm:ml-10 ml-0 sm:mt-0 mt-6`}>
      <a
        href="https://ebay.us/m/87H7XC"
        target="_blank"
        rel="noopener noreferrer"
        className="py-4 px-6 font-poppins font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none transition-transform hover:scale-105 flex items-center gap-2"
      >
        Visit eBay Store
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </a>
    </div>
  </section>
);

export default EbayTrust;
