import { card, xpusers } from "../assets";
import styles, { layout } from "../style";
import Button from "./Button";
import MagneticElements from '../components/MagneticElements';

const CardDeal = () => (
  <section className={layout.section}>
    <div className={layout.sectionInfo}>
      <h2 className={styles.heading2}>
        Technology should not be a barrier  <br className="sm:block hidden" /> for you
          let the world know your name.
      </h2>

      <Button styles={`mt-10`} />
    </div>

    <div className={layout.sectionImg}>
      <MagneticElements />
    </div>
  </section>
);

export default CardDeal;