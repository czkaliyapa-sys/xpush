import { feedback } from "../constants";
import styles from "../style";
import FeedbackCard from "./FeedBackCard";

const Testimonials = () => (
  <section id="clients" className={`${styles.paddingY} ${styles.flexCenter} flex-col relative `}>
    <div className="absolute z-[0] w-[60%] h-[60%] -right-[50%] rounded-full blue__gradient bottom-40" />

    <div className="w-full flex justify-between items-center md:flex-row flex-col md:gap-8 sm:mb-16 mb-6 relative z-[1]">
      <h2 className={`${styles.heading2} text-left md:w-1/2 mb-2 md:mb-0`}>
        What is our drive? <br className="sm:block hidden" />
      </h2>
      <div className="w-full md:w-1/2 md:ml-auto md:mt-0 mt-4">
        <p style={{ color: 'white'}} className={`${styles.paragraph} text-left md:text-right max-w-full sm:max-w-[450px] mt-2`}>
            We believe the future is bright — and we're committed to making it more accessible, affordable, and empowering for all. 
        </p>
      </div>
    </div>

    <div className="grid w-full sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 feedback-container relative z-[1]">
      {feedback.map((card) => <FeedbackCard key={card.id} {...card} />)}
    </div>
  </section>
);

export default Testimonials;